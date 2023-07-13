use std::collections::BTreeMap;

use async_std::sync::Arc;
use async_std::sync::RwLock;

use async_std::task::JoinHandle;
use bdk_bitcoind_rpc::bitcoincore_rpc::jsonrpc::serde_json::Value;
use bdk_chain::bitcoin::Address;
use bdk_chain::bitcoin::Amount;
use bdk_chain::local_chain::LocalChain;
use bitcoind::bitcoincore_rpc::RpcApi;
use tide::prelude::*;
use tide::Request;
use wally::Wally;

mod wally;

const BLOCK_TIME_SECONDS: u64 = 30;

type EchologyJoinHandles = [JoinHandle<tide::Result<()>>; 3];

#[derive(Clone)]
struct Echology {
    pub bitcoind: Arc<bitcoind::BitcoinD>,
    pub chain: Arc<RwLock<LocalChain>>,
    pub wallets: Arc<RwLock<BTreeMap<String, Arc<RwLock<Wally>>>>>,
}

impl Echology {
    fn new(d: bitcoind::BitcoinD) -> tide::Result<(Self, EchologyJoinHandles)> {
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
        let (tx, rx) = std::sync::mpsc::sync_channel::<bdk_bitcoind_rpc::BitcoindRpcUpdate>(10);

        let echology = Self {
            bitcoind: Arc::new(d),
            chain: Arc::new(RwLock::new(local_chain)),
            wallets: Default::default(),
        };

        let emitter_jh = async_std::task::spawn_blocking(move || -> tide::Result<()> {
            let client = bdk_bitcoind_rpc::bitcoincore_rpc::Client::new(&url, auth)?;
            let mut emitter =
                bdk_bitcoind_rpc::BitcoindRpcEmitter::new(&client, 0, Some(local_chain_tip));
            loop {
                match emitter.next_update() {
                    Ok(update) => {
                        let is_mempool = update.is_mempool();
                        tide::log::info!(
                            "[emitter] found update: {}",
                            match &update {
                                bdk_bitcoind_rpc::BitcoindRpcUpdate::Block { cp, .. } => {
                                    format!("block: height={}, hash={}", cp.height(), cp.hash())
                                }
                                bdk_bitcoind_rpc::BitcoindRpcUpdate::Mempool { cp, txs } => {
                                    format!(
                                        "mempool: height={}, tx_count={}",
                                        cp.height(),
                                        txs.len()
                                    )
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
                    let local_update = update
                        .into_update::<(), _, _>(bdk_bitcoind_rpc::confirmation_height_anchor);

                    echology
                        .chain
                        .write()
                        .await
                        .update(local_update.tip, true)?;

                    let wallets = echology.wallets.read().await;
                    for wallet in wallets.values() {
                        let mut wallet = wallet.write().await;
                        let _ = wallet
                            .indexed_tx_graph
                            .apply_update(local_update.graph.clone());
                    }
                }

                return tide::Result::Ok(());
            })
        };

        let miner_jh = {
            let echology = echology.clone();
            async_std::task::spawn_blocking(move || -> tide::Result<()> {
                let address = echology.bitcoind.client.get_new_address(None, None)?;
                let hashes = echology
                    .bitcoind
                    .client
                    .generate_to_address(420, &address)?;
                tide::log::info!(
                    "[miner] generated to height={}, tip_hash={}",
                    hashes.len(),
                    hashes.last().unwrap()
                );

                loop {
                    std::thread::sleep(std::time::Duration::from_secs(BLOCK_TIME_SECONDS));
                    let hashes = echology.bitcoind.client.generate_to_address(1, &address)?;
                    if let Some(hash) = hashes.last() {
                        tide::log::info!("[miner] found block: {}", hash);
                    }
                }
            })
        };

        Ok((echology, [emitter_jh, absorber_jh, miner_jh]))
    }

    async fn get_or_new_wallet(&self, alias: &str) -> Arc<RwLock<Wally>> {
        let wallet = match self.wallets.write().await.entry(alias.to_string()) {
            std::collections::btree_map::Entry::Vacant(e) => {
                // let wallet = Wally::new(phrase)
                // e.
                todo!()
            },
            std::collections::btree_map::Entry::Occupied(e) => Arc::clone(e.get()),
        };

        // self.wallets.write().await.get(key)
        todo!()
    }
}

#[async_std::main]
async fn main() -> tide::Result<()> {
    let (state, join_handles) = Echology::new(bitcoind::BitcoinD::from_downloaded()?)?;

    let mut app = tide::with_state(state);
    app.at("/network/stats").get(network_stats);
    app.at("/network/broadcast").post(network_broadcast);
    app.at("/decode").get(decode);
    app.at("/faucet").get(faucet);
    app.at("/wallet/:alias/address").get(wallet_address);
    app.listen("127.0.0.1:8080").await?;

    for handle in join_handles {
        handle.await?;
    }

    Ok(())
}

async fn network_stats(req: Request<Echology>) -> tide::Result {
    let chain = req.state().chain.read().await;
    let height = chain.tip().map_or(0, |cp| cp.height());
    Ok(json!({ "height": height }).into())
}

async fn network_broadcast(req: Request<Echology>) -> tide::Result {
    #[derive(Deserialize)]
    struct Query {
        pub tx: String,
    }
    let q: Query = req.query()?;
    let txid = req.state().bitcoind.client.send_raw_transaction(q.tx)?;
    Ok(json!({ "txid": txid }).into())
}

async fn decode(req: Request<Echology>) -> tide::Result {
    #[derive(Deserialize)]
    struct Query {
        pub tx: String,
    }
    let q: Query = req.query()?;
    let v: Value = req
        .state()
        .bitcoind
        .client
        .call("decoderawtransaction", &[q.tx.into()])?;
    Ok(v.into())
}

async fn faucet(req: Request<Echology>) -> tide::Result {
    #[derive(Deserialize)]
    struct Query {
        pub address: Address,
        pub amount: u64,
    }
    let q: Query = req.query()?;
    let txid = req.state().bitcoind.client.send_to_address(
        &q.address,
        Amount::from_sat(q.amount),
        None,
        None,
        None,
        None,
        None,
        None,
    )?;
    Ok(json!({ "txid": txid }).into())
}

async fn wallet_address(req: Request<Echology>) -> tide::Result {
    let alias = req.param("alias")?;

    if let Some(wallet) = req.state().wallets.read().await.get(alias) {
        let address = wallet.read().await.address();
        return Ok(json!({ "address": address }).into());
    }

    let wallet = Wally::new(alias)?;
    let address = wallet.address();
    req.state()
        .wallets
        .write()
        .await
        .insert(alias.to_string(), Arc::new(RwLock::new(wallet)));

    Ok(json!({ "address": address }).into())
}

async fn wallet_coins(req: Request<Echology>) -> tide::Result {
    todo!()
}
