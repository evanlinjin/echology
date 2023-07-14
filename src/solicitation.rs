use bdk_chain::bitcoin::{hashes::sha256, Txid};
use tide::prelude::*;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "algorithm", content = "parameters")]
pub enum Algorithm {
    #[serde(alias = "bnb")]
    Bnb { bnb_rounds: usize },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Metrics {
    pub waste: f32,
    pub feerate_deviation: f32,
    pub target_deviation: u64,
    pub tx_size: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SolutionRequest {
    pub spend_scenario_id: sha256::Hash,
    pub algorithm: Algorithm,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SolutionResponse {
    pub request: SolutionRequest,
    pub timestamp: u64,
    pub txid: Txid,
    pub raw_tx: String,
    pub metrics: Metrics,
}
