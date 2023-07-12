use std::sync::Arc;

use bitcoind::bitcoincore_rpc::RpcApi;
use tide::prelude::*;
use tide::Request;

#[derive(Debug, Clone)]
struct Echology {
    pub bitcoind: Arc<bitcoind::BitcoinD>,
}

#[async_std::main]
async fn main() -> tide::Result<()> {
    println!("Hello, world!");

    let state = Echology {
        bitcoind: Arc::new(bitcoind::BitcoinD::from_downloaded()?),
    };

    let mut app = tide::with_state(state);
    app.at("/tip").get(get_tip);
    app.listen("127.0.0.1:8080").await?;
    Ok(())
}

async fn get_tip(req: Request<Echology>) -> tide::Result {
    let client = &req.state().bitcoind.client;
    let hash = client.get_best_block_hash()?;
    let height = client.get_block_info(&hash)?.height;

    Ok(json!({ "height": height, "hash": hash }).into())
}
