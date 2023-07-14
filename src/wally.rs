use bdk_bitcoind_rpc::bitcoincore_rpc::jsonrpc::serde_json;
use bdk_chain::bitcoin::hashes::sha256;
use bdk_chain::bitcoin::hashes::Hash;
use bdk_chain::bitcoin::secp256k1::Secp256k1;
use bdk_chain::bitcoin::secp256k1::SecretKey;
use bdk_chain::bitcoin::Address;
use bdk_chain::bitcoin::Network;
use bdk_chain::bitcoin::OutPoint;
use bdk_chain::bitcoin::PrivateKey;
use bdk_chain::bitcoin::Txid;
use bdk_chain::local_chain::LocalChain;
use bdk_chain::miniscript::descriptor::DescriptorSecretKey;
use bdk_chain::miniscript::Descriptor;
use bdk_chain::miniscript::DescriptorPublicKey;
use bdk_chain::ChainPosition;
use bdk_chain::ConfirmationHeightAnchor;
use bdk_chain::IndexedTxGraph;
use bdk_chain::SpkTxOutIndex;
use std::collections::HashMap;
use tide::prelude::*;

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct Coin {
    pub outpoint: OutPoint,
    pub amount: u64,
    pub confirmations: u32,
    pub spent_by: Option<CoinSpentBy>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct CoinSpentBy {
    pub txid: Txid,
    confirmations: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Scenario {
    pub candidates: Vec<ScenarioCandidate>,
    pub recipients: Vec<ScenarioRecipient>,
    pub max_extra_target: u64,
    pub fee_rate: f32,                   // sats per wu
    pub long_term_fee_rate: Option<f32>, // sats per wu
}

impl Scenario {
    pub fn id(&self) -> sha256::Hash {
        let json_bytes = serde_json::ser::to_vec(self).expect("must serialize");
        sha256::Hash::hash(&json_bytes)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScenarioCandidate {
    pub outpoint: OutPoint,
    pub must_select: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScenarioRecipient {
    pub address: Address,
    pub amount: u64,
}

pub struct Wally {
    descriptor: Descriptor<DescriptorPublicKey>,
    keymap: HashMap<DescriptorPublicKey, DescriptorSecretKey>,
    pub indexed_tx_graph: IndexedTxGraph<ConfirmationHeightAnchor, SpkTxOutIndex<()>>,
    scenarios: HashMap<sha256::Hash, Scenario>,
}

impl Wally {
    pub fn new(phrase: &str) -> tide::Result<Self> {
        let phrase_hash = sha256::Hash::hash(phrase.as_bytes());
        let sk = PrivateKey {
            compressed: true,
            network: Network::Regtest,
            inner: SecretKey::from_slice(&phrase_hash).expect("32 bytes, within curve order"),
        };
        println!("sk: {}", sk.to_string());

        let secp = Secp256k1::default();
        let (descriptor, keymap) = Descriptor::<DescriptorPublicKey>::parse_descriptor(
            &secp,
            &format!("tr({})", sk.to_string()),
        )?;
        let spk = descriptor.at_derivation_index(0).script_pubkey();

        let mut indexed_tx_graph =
            IndexedTxGraph::<ConfirmationHeightAnchor, _>::new(SpkTxOutIndex::<()>::default());
        indexed_tx_graph.index.insert_spk((), spk);

        Ok(Self {
            descriptor,
            keymap,
            indexed_tx_graph,
            scenarios: Default::default(),
        })
    }

    pub fn address(&self) -> Address {
        let script = self
            .indexed_tx_graph
            .index
            .spk_at_index(&())
            .expect("must exist!");
        Address::from_script(script, Network::Regtest).expect("must derive address")
    }

    pub fn coins(&self, chain: &LocalChain) -> Vec<Coin> {
        let chain_tip = match chain.tip() {
            Some(tip) => tip.block_id(),
            None => return Vec::new(),
        };
        let outpoints = self.indexed_tx_graph.index.outpoints().iter().cloned();
        self.indexed_tx_graph
            .graph()
            .filter_chain_txouts(chain, chain_tip, outpoints)
            .map(|(_, txo)| Coin {
                outpoint: txo.outpoint,
                amount: txo.txout.value,
                confirmations: position_to_confirmations(chain_tip.height, &txo.chain_position),
                spent_by: txo.spent_by.map(|(pos, txid)| CoinSpentBy {
                    txid,
                    confirmations: position_to_confirmations(chain_tip.height, &pos),
                }),
            })
            .collect()
    }

    pub fn new_spend_scenario(&mut self, scenario: Scenario) -> tide::Result<sha256::Hash> {
        // [todo] check scenario!

        let id = scenario.id();
        self.scenarios.insert(id, scenario);
        Ok(id)
    }
}

fn position_to_confirmations(
    tip_height: u32,
    pos: &ChainPosition<ConfirmationHeightAnchor>,
) -> u32 {
    match pos {
        ChainPosition::Confirmed(a) => (tip_height + 1).saturating_sub(a.confirmation_height),
        ChainPosition::Unconfirmed(_) => 0,
    }
}
