use std::path::PathBuf;

use bdk_bitcoind_rpc::bitcoincore_rpc::jsonrpc::serde_json::Value;
use bdk_bitcoind_rpc::bitcoincore_rpc::RawTx;
use bdk_chain::bitcoin::Address;
use bdk_chain::bitcoin::Amount;
use bitcoind::anyhow::anyhow;
use bitcoind::bitcoincore_rpc::RpcApi;
use echo::*;
use tide::prelude::*;
use tide::Request;
use tide::Response;
use tide::StatusCode;
use tide_rustls::TlsListener;
use wally::*;

mod echo;
mod wally;

#[async_std::main]
async fn main() -> tide::Result<()> {
    let bitcoind_exe = match std::env::var_os("ECHO_BITCOIND") {
        Some(bitcoid_path) => bitcoind::BitcoinD::new(bitcoid_path)?,
        #[cfg(feature = "internal_bitcoind")]
        None => bitcoind::BitcoinD::from_downloaded()?,
        #[cfg(not(feature = "internal_bitcoind"))]
        None => panic!("please provide ECHO_BITCOIND"),
    };
    let env_blocktime = std::env::var("ECHO_BLOCKTIME")?.parse::<u64>()?;
    let env_bind = std::env::var("ECHO_BIND")?;
    let env_tls_cert = std::env::var_os("ECHO_TLS_CERT");
    let env_tls_key = std::env::var_os("ECHO_TLS_KEY");
    let env_static = std::env::var_os("ECHO_STATIC");

    let (state, join_handles) = Echology::new(bitcoind_exe, env_blocktime)?;

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
        pub count: usize,
    }
    let q: Query = req.query()?;

    let client = &req.state().bitcoind.client;
    let txids = core::iter::repeat_with(|| {
        client.send_to_address(
            &q.address,
            Amount::from_sat(q.amount),
            None,
            None,
            None,
            None,
            None,
            None,
        )
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

    match solution_req.algorithm {
        wally::CsAlgorithm::Bnb { bnb_rounds, .. } => {
            if bnb_rounds > 50_000 {
                return Err(tide::Error::new(
                    StatusCode::BadRequest,
                    anyhow!(
                        "are you trying to screw us over with so many bnb rounds? 50k is the max"
                    ),
                ));
            }
        }
        _ => {}
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
