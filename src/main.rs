use std::path::PathBuf;
use std::sync::atomic;

use bdk_bitcoind_rpc::bitcoincore_rpc::jsonrpc::serde_json::Value;
use bdk_bitcoind_rpc::bitcoincore_rpc::RawTx;
use bdk_bitcoind_rpc::bitcoincore_rpc::RpcApi;
use bdk_chain::bitcoin::Address;
use bdk_chain::bitcoin::Amount;
use bitcoind::anyhow::anyhow;
use echo::*;
use miniscript::bitcoin::address::NetworkUnchecked;
use tide::prelude::*;
use tide::Request;
use tide::Response;
use tide::StatusCode;
use tide_rustls::TlsListener;
use wally::*;

mod echo;
mod wally;

enum ConfigProvider {
    BitcoinD(bitcoind::BitcoinD),
    Raw(String, bdk_bitcoind_rpc::bitcoincore_rpc::Auth),
}

impl ConfigProvider {
    fn config(&self) -> (String, bdk_bitcoind_rpc::bitcoincore_rpc::Auth) {
        match self {
            ConfigProvider::BitcoinD(d) => (
                d.rpc_url(),
                bdk_bitcoind_rpc::bitcoincore_rpc::Auth::CookieFile(d.params.cookie_file.clone()),
            ),
            ConfigProvider::Raw(url, auth) => (url.clone(), auth.clone()),
        }
    }
}

#[async_std::main]
async fn main() -> tide::Result<()> {
    let env_blocktime = std::env::var("ECHO_BLOCKTIME")?.parse::<u64>()?;
    let env_bind = std::env::var("ECHO_BIND")?;

    let env_tls_cert = std::env::var_os("ECHO_TLS_CERT");
    let env_tls_key = std::env::var_os("ECHO_TLS_KEY");
    let env_static = std::env::var_os("ECHO_STATIC");

    let env_bitcoind_rpc = std::env::var_os("ECHO_BITCOIND_RPC");
    let env_bitcoind_cookie = std::env::var_os("ECHO_BITCOIND_COOKIE");

    let provider = match std::env::var_os("ECHO_BITCOIND") {
        Some(bitcoid_path) => ConfigProvider::BitcoinD(bitcoind::BitcoinD::new(bitcoid_path)?),
        #[cfg(feature = "internal_bitcoind")]
        None => ConfigProvider::BitcoinD(bitcoind::BitcoinD::from_downloaded()?),
        #[cfg(not(feature = "internal_bitcoind"))]
        None => {
            let url = env_bitcoind_rpc.expect("missing env: ECHO_BITCOIND_RPC");
            let cookie = env_bitcoind_cookie.expect("missing env: ECHO_BITCOIND_COOKIE");
            ConfigProvider::Raw(
                url.into_string().expect("invalid url"),
                bdk_bitcoind_rpc::bitcoincore_rpc::Auth::CookieFile(cookie.into()),
            )
        }
    };
    let (rpc_url, auth) = provider.config();
    let (state, join_handles) = Echology::new(&rpc_url, &auth, env_blocktime)?;

    let mut app = tide::with_state(state);

    app.with(tide::utils::After(|mut resp: Response| async move {
        resp.append_header("Access-Control-Allow-Origin", "*");
        if let Some(err) = resp.error() {
            resp.set_body(json!({
                "error": err.to_string(),
            }));
        }
        Ok(resp)
    }));

    app.at("/api/network/stats").get(network_stats);
    app.at("/api/network/broadcast").post(network_broadcast);
    app.at("/api/decode").get(decode);
    app.at("/api/faucet").get(faucet);
    app.at("/api/wallet/:alias/address").get(wallet_address);
    app.at("/api/wallet/:alias/coins").get(wallet_coins);
    app.at("/api/wallet/:alias/new_spend_scenario")
        .post(wallet_new_spend_scenario);
    app.at("/api/wallet/:alias/new_solution")
        .post(wallet_new_solution);
    app.at("/api/admin/mine").post(admin_mine);

    if let Some(dir) = env_static {
        app.at("/").serve_file(
            [dir.to_str().unwrap(), "index.html"]
                .into_iter()
                .collect::<PathBuf>(),
        )?;
        app.at("coin-con").serve_file(
            [dir.to_str().unwrap(), "coin-control.html"]
                .into_iter()
                .collect::<PathBuf>(),
        )?;
        app.at("spent-scen").serve_file(
            [dir.to_str().unwrap(), "spent-scenario.html"]
                .into_iter()
                .collect::<PathBuf>(),
        )?;
        app.at("/").serve_dir(dir)?;
    }

    match (env_tls_cert, env_tls_key) {
        (Some(tls_cert), Some(tls_key)) => {
            app.listen(
                TlsListener::build()
                    .addrs(env_bind)
                    .cert(tls_cert)
                    .key(tls_key),
            )
            .await?
        }
        (None, None) => app.listen(env_bind).await?,
        _ => panic!("must provide both tls cert and key"),
    };

    for handle in join_handles {
        handle.await?;
    }

    Ok(())
}

async fn network_stats(req: Request<Echology>) -> tide::Result {
    let stats = req.state().stats.read().await.clone();
    Ok(json!(stats).into())
}

async fn network_broadcast(req: Request<Echology>) -> tide::Result {
    #[derive(Deserialize)]
    struct Query {
        pub tx: String,
    }
    let q: Query = req.query()?;
    let txid = req.state().client.send_raw_transaction(q.tx)?;
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
        .client
        .call("decoderawtransaction", &[q.tx.into()])?;
    Ok(v.into())
}

async fn faucet(req: Request<Echology>) -> tide::Result {
    #[derive(Deserialize)]
    struct Query {
        pub address: Address<NetworkUnchecked>,
        pub amount: u64,
        pub count: usize,
    }
    let q: Query = req.query()?;

    let client = &req.state().client;
    let txids = core::iter::repeat_with(|| {
        let seed = rand::random::<u64>();
        let amount = if (1000..50_000).contains(&q.amount) {
            1000 + seed % 50_000
        } else if (50_000..100_000).contains(&q.amount) {
            50_000 + seed % 100_000
        } else if (100_000..500_000).contains(&q.amount) {
            100_000 + seed % 500_000
        } else {
            return Err(tide::Error::new(
                StatusCode::BadRequest,
                anyhow!("invalid 'amount' range"),
            ));
        };
        client
            .send_to_address(
                &q.address.clone().assume_checked(),
                Amount::from_sat(amount),
                None,
                None,
                None,
                None,
                None,
                None,
            )
            .map_err(|e| {
                tide::Error::new(
                    StatusCode::InternalServerError,
                    anyhow!("failed to send money: {}", e),
                )
            })
    })
    .take(q.count)
    .collect::<Result<Vec<_>, _>>()?;

    Ok(json!({ "txids": txids }).into())
}

async fn wallet_address(req: Request<Echology>) -> tide::Result {
    let alias = req.param("alias")?;
    let wallet = req.state().get_or_create_wallet(alias).await?;
    let address = wallet.read().await.address();
    Ok(json!({ "address": address }).into())
}

async fn wallet_coins(req: Request<Echology>) -> tide::Result {
    let alias = req.param("alias")?;
    let wallet = req.state().get_or_create_wallet(alias).await?;
    let chain = req.state().chain.read().await;
    let coins = wallet.read().await.coins(&chain);
    Ok(json!({ "coins": coins }).into())
}

async fn wallet_new_spend_scenario(mut req: Request<Echology>) -> tide::Result {
    let scenario: Scenario = req.body_json().await?;
    let alias = req.param("alias")?;

    let wallet = req.state().get_or_create_wallet(alias).await?;
    let spend_scenario_id = wallet.write().await.new_spend_scenario(scenario)?;

    Ok(json!({ "spend_scenario_id": spend_scenario_id }).into())
}

async fn wallet_new_solution(mut req: Request<Echology>) -> tide::Result {
    let solution_req: CsSolutionRequest = req.body_json().await?;
    let alias = req.param("alias")?;

    if let wally::CsAlgorithm::Bnb { bnb_rounds, .. } = solution_req.algorithm {
        if bnb_rounds > 50_000 {
            return Err(tide::Error::new(
                StatusCode::BadRequest,
                anyhow!("are you trying to screw us over with so many bnb rounds? 50k is the max"),
            ));
        }
    }

    let wallet = req.state().get_or_create_wallet(alias).await?;
    let (tx, metrics) = {
        let wallet_read_lock = wallet.read().await;
        let scenario = wallet_read_lock
            .get_spend_scenario(solution_req.spend_scenario_id)
            .ok_or(tide::Error::new(
                StatusCode::BadRequest,
                anyhow!("no such spend scenario"),
            ))?;
        let chain = req.state().chain.read().await;
        let descriptor = &wallet_read_lock.descriptor;
        let keymap = &wallet_read_lock.keymap;
        let graph = wallet_read_lock.indexed_tx_graph.graph();
        let algorithm = solution_req.algorithm;
        let excess_strategy = solution_req.excess_strategy;
        wally::create_spend_solution(
            &chain,
            descriptor,
            keymap,
            graph,
            &scenario,
            algorithm,
            excess_strategy,
        )?
    };

    let epoch = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .expect("must get time")
        .as_secs();

    Ok(json!(CsSolutionResponse {
        request: solution_req,
        timestamp: epoch,
        txid: tx.txid(),
        raw_tx: tx.raw_hex(),
        metrics,
    })
    .into())
}

async fn admin_mine(req: Request<Echology>) -> tide::Result {
    #[derive(Debug, Deserialize)]
    #[allow(dead_code)]
    struct Query {
        pub enable: Option<bool>,
    }
    let q: Query = req.query()?;
    let state = req.state();
    match q.enable {
        Some(enable) => state.mine_flag.store(enable, atomic::Ordering::Release),
        None => state.mine_tx.send(())?,
    }
    println!("got query: {:?}", q);
    Ok(json!({ "success": true }).into())
}
