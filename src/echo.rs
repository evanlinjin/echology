use std::collections::BTreeMap;

use async_std::{
    sync::{Arc, RwLock},
    task::JoinHandle,
};
use bdk_bitcoind_rpc::EmittedUpdate;
use bdk_chain::local_chain::LocalChain;
use bitcoind::bitcoincore_rpc::RpcApi;
use serde::{Deserialize, Serialize};

use crate::wally::Wally;

pub type EchologyJoinHandles = [JoinHandle<tide::Result<()>>; 3];

#[derive(Debug, Default, Clone, Deserialize, Serialize)]
pub struct NetworkStats {
    pub height: u32,
    pub next_block: u64,
    pub utxo_count: i64,
}

#[derive(Clone)]
pub struct Echology {
    pub bitcoind: Arc<bitcoind::BitcoinD>,
    pub stats: Arc<RwLock<NetworkStats>>,
    pub chain: Arc<RwLock<LocalChain>>,
    pub wallets: Arc<RwLock<BTreeMap<String, Arc<RwLock<Wally>>>>>,
}

impl Echology {
    pub fn new(d: bitcoind::BitcoinD, blocktime: u64) -> tide::Result<(Self, EchologyJoinHandles)> {
        tide::log::start();
        // local chain
        let genesis_hash = d.client.get_block_hash(0)?;
        let local_chain = LocalChain::from_blocks([(0, genesis_hash)].into());
        let local_chain_tip = local_chain.tip().expect("must have tip");

        let url = format!(
            "{}:{}",
            d.params.rpc_socket.ip(),
            d.params.rpc_socket.port()
        );
        let auth =
            bdk_bitcoind_rpc::bitcoincore_rpc::Auth::CookieFile(d.params.cookie_file.clone());
        let (tx, rx) = std::sync::mpsc::sync_channel::<bdk_bitcoind_rpc::EmittedUpdate>(10);

        let echology = Self {
            bitcoind: Arc::new(d),
            stats: Arc::new(RwLock::new(NetworkStats::default())),
            chain: Arc::new(RwLock::new(local_chain)),
            wallets: Default::default(),
        };

        let emitter_jh = async_std::task::spawn_blocking(move || -> tide::Result<()> {
            let client = bdk_bitcoind_rpc::bitcoincore_rpc::Client::new(&url, auth)?;
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
                                if let Ok(r) = echology.bitcoind.client.get_block_stats_fields(height as _, &[bitcoind::bitcoincore_rpc::json::BlockStatsFields::UtxoIncrease]) {
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
                        // .apply_update(local_update.graph.clone());
                    }

                    if let Some(inc) = utxo_inc_jh {
                        echology.stats.write().await.utxo_count += inc.await as i64;
                    }
                }

                tide::Result::Ok(())
            })
        };

        let miner_jh = {
            let echology = echology.clone();
            async_std::task::spawn_blocking(move || -> tide::Result<()> {
                let address = echology.bitcoind.client.get_new_address(None, None)?;
                let hashes = echology
                    .bitcoind
                    .client
                    .generate_to_address(420, &address.clone().assume_checked())?;
                tide::log::info!(
                    "[miner] generated to height={}, tip_hash={}",
                    hashes.len(),
                    hashes.last().unwrap()
                );

                loop {
                    std::thread::sleep(std::time::Duration::from_secs(blocktime));
                    let hashes = echology
                        .bitcoind
                        .client
                        .generate_to_address(1, &address.clone().assume_checked())?;
                    if let Some(hash) = hashes.last() {
                        tide::log::info!("[miner] found block: {}", hash);
                    }
                }
            })
        };

        Ok((echology, [emitter_jh, absorber_jh, miner_jh]))
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
