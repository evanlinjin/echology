use std::{
    collections::BTreeMap,
    sync::{
        atomic::{self, AtomicBool},
        mpsc::SyncSender,
    },
};

use async_std::{
    sync::{Arc, RwLock},
    task::JoinHandle,
};
use bdk_bitcoind_rpc::{
    bitcoincore_rpc::{Auth, RpcApi},
    EmittedUpdate,
};
use bdk_chain::local_chain::LocalChain;
use serde::{Deserialize, Serialize};

use crate::wally::Wally;

pub type EchologyJoinHandles = [JoinHandle<tide::Result<()>>; 4];

#[derive(Debug, Default, Clone, Deserialize, Serialize)]
pub struct NetworkStats {
    pub height: u32,
    pub next_block: u64,
    pub utxo_count: i64,
}

#[derive(Clone)]
pub struct Echology {
    pub client: Arc<bdk_bitcoind_rpc::bitcoincore_rpc::Client>,
    pub stats: Arc<RwLock<NetworkStats>>,
    pub chain: Arc<RwLock<LocalChain>>,
    pub wallets: Arc<RwLock<BTreeMap<String, Arc<RwLock<Wally>>>>>,
    pub mine_tx: Arc<SyncSender<()>>,
    pub mine_flag: Arc<AtomicBool>,
}

impl Echology {
    pub fn new(
        rpc_url: &str,
        auth: &Auth,
        blocktime: u64,
    ) -> tide::Result<(Self, EchologyJoinHandles)> {
        tide::log::start();

        let temp_client = bdk_bitcoind_rpc::bitcoincore_rpc::Client::new(rpc_url, auth.clone())?;
        let rpc_url = &format!("{}/wallet/default", rpc_url);

        // create wallet (if not exist)
        let client = {
            if temp_client
                .create_wallet("default", None, None, None, None)
                .is_err()
            {
                if let Err(err) = temp_client.load_wallet("default") {
                    if !matches!(&err, bdk_bitcoind_rpc::bitcoincore_rpc::Error::JsonRpc(bdk_bitcoind_rpc::bitcoincore_rpc::jsonrpc::Error::Rpc(json_rpc_err)) if json_rpc_err.code == -35)
                    {
                        return Err(err.into());
                    }
                };
            }
            bdk_bitcoind_rpc::bitcoincore_rpc::Client::new(rpc_url, auth.clone())?
        };

        // local chain
        let genesis_hash = client.get_block_hash(0)?;
        let local_chain = LocalChain::from_blocks([(0, genesis_hash)].into());
        let local_chain_tip = local_chain.tip().expect("must have tip");

        let (tx, rx) = std::sync::mpsc::sync_channel::<bdk_bitcoind_rpc::EmittedUpdate>(10);

        let (mine_tx, mine_rx) = std::sync::mpsc::sync_channel::<()>(10);

        let echology = Self {
            client: Arc::new(client),
            stats: Arc::new(RwLock::new(NetworkStats::default())),
            chain: Arc::new(RwLock::new(local_chain)),
            wallets: Default::default(),
            mine_tx: Arc::new(mine_tx),
            mine_flag: Arc::new(AtomicBool::new(true)),
        };

        let emitter_jh = async_std::task::spawn_blocking({
            let client = bdk_bitcoind_rpc::bitcoincore_rpc::Client::new(rpc_url, auth.clone())?;
            move || -> tide::Result<()> {
                let mut emitter = bdk_bitcoind_rpc::Emitter::new(&client, 0, Some(local_chain_tip));
                loop {
                    match emitter.emit_update() {
                        Ok(update) => {
                            let is_mempool = update.is_mempool();
                            tide::log::info!(
                                "[emitter] found update: {}",
                                match &update {
                                    bdk_bitcoind_rpc::EmittedUpdate::Block(block) => {
                                        format!(
                                            "block: height={}, hash={}",
                                            block.cp.height(),
                                            block.cp.hash()
                                        )
                                    }
                                    bdk_bitcoind_rpc::EmittedUpdate::Mempool(mempool) => {
                                        format!("mempool: tx_count={}", mempool.txs.len())
                                    }
                                }
                            );
                            tx.send(update)?;
                            if is_mempool {
                                std::thread::sleep(std::time::Duration::from_secs(5));
                            }
                        }
                        Err(err) => {
                            tide::log::error!("[emitter] {}: sleeping for 5 secs", err);
                            std::thread::sleep(std::time::Duration::from_secs(5));
                            continue;
                        }
                    };
                }
            }
        });

        let absorber_jh = {
            let echology = echology.clone();

            async_std::task::spawn(async move {
                for update in rx {
                    let utxo_inc_jh = if let EmittedUpdate::Block(block) = &update {
                        let jh = async_std::task::spawn_blocking({
                            let echology = echology.clone();
                            let height = block.checkpoint().height() as u64;
                            move || {
                                if let Ok(r) = echology.client.get_block_stats_fields(height as _, &[bdk_bitcoind_rpc::bitcoincore_rpc::json::BlockStatsFields::UtxoIncrease]) {
                                    r.utxo_increase.unwrap_or_default()
                                } else {
                                    0
                                }
                            }
                        });
                        let mut stats = echology.stats.write().await;
                        stats.height = block.checkpoint().height();
                        stats.next_block = block.block.header.time as u64 + blocktime;
                        Some(jh)
                    } else {
                        None
                    };

                    if let Some(chain_update) = update.chain_update() {
                        echology.chain.write().await.apply_update(chain_update)?;
                    }

                    let graph_update = update
                        .indexed_tx_graph_update(bdk_bitcoind_rpc::confirmation_height_anchor);

                    let wallets = echology.wallets.read().await;
                    for wallet in wallets.values() {
                        let mut wallet = wallet.write().await;
                        let _ = wallet
                            .indexed_tx_graph
                            .insert_relevant_txs(graph_update.clone());
                    }

                    if let Some(inc) = utxo_inc_jh {
                        echology.stats.write().await.utxo_count += inc.await as i64;
                    }
                }

                tide::Result::Ok(())
            })
        };

        let miner_ctrl_jh = {
            let echology = echology.clone();
            async_std::task::spawn_blocking(move || -> tide::Result<()> {
                loop {
                    std::thread::sleep(std::time::Duration::from_secs(blocktime));
                    let mine_enabled = echology.mine_flag.load(atomic::Ordering::Acquire);
                    if mine_enabled {
                        echology.mine_tx.send(())?;
                    }
                }
            })
        };

        let miner_jh = {
            let echology = echology.clone();
            async_std::task::spawn_blocking(move || -> tide::Result<()> {
                let address = echology.client.get_new_address(None, None)?;
                let hashes = echology
                    .client
                    .generate_to_address(420, &address.clone().assume_checked())?;
                tide::log::info!(
                    "[miner] generated to height={}, tip_hash={}",
                    hashes.len(),
                    hashes.last().unwrap()
                );

                for _ in mine_rx {
                    let hashes = echology
                        .client
                        .generate_to_address(1, &address.clone().assume_checked())?;
                    if let Some(hash) = hashes.last() {
                        tide::log::info!("[miner] found block: {}", hash);
                    }
                }

                Ok(())
            })
        };

        Ok((echology, [emitter_jh, absorber_jh, miner_ctrl_jh, miner_jh]))
    }

    pub async fn get_or_create_wallet(&self, phrase: &str) -> tide::Result<Arc<RwLock<Wally>>> {
        let wallet = match self.wallets.write().await.entry(phrase.to_string()) {
            std::collections::btree_map::Entry::Vacant(e) => {
                let wallet = Arc::new(RwLock::new(Wally::new(phrase)?));
                Arc::clone(&*e.insert(wallet))
            }
            std::collections::btree_map::Entry::Occupied(e) => Arc::clone(e.get()),
        };
        Ok(wallet)
    }
}
