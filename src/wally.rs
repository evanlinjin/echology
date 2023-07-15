use bdk_bitcoind_rpc::bitcoincore_rpc::jsonrpc::serde_json;
use bdk_chain::bitcoin::hashes::sha256;
use bdk_chain::bitcoin::hashes::Hash;
use bdk_chain::bitcoin::psbt::Prevouts;
use bdk_chain::bitcoin::secp256k1::Secp256k1;
use bdk_chain::bitcoin::secp256k1::SecretKey;
use bdk_chain::bitcoin::util::sighash::SighashCache;
use bdk_chain::bitcoin::Address;
use bdk_chain::bitcoin::LockTime;
use bdk_chain::bitcoin::Network;
use bdk_chain::bitcoin::OutPoint;
use bdk_chain::bitcoin::PrivateKey;
use bdk_chain::bitcoin::Sequence;
use bdk_chain::bitcoin::Transaction;
use bdk_chain::bitcoin::TxIn;
use bdk_chain::bitcoin::TxOut;
use bdk_chain::bitcoin::Txid;
use bdk_chain::local_chain::LocalChain;
use bdk_chain::miniscript::descriptor::DescriptorSecretKey;
use bdk_chain::miniscript::Descriptor;
use bdk_chain::miniscript::DescriptorPublicKey;
use bdk_chain::ChainPosition;
use bdk_chain::ConfirmationHeightAnchor;
use bdk_chain::DescriptorExt;
use bdk_chain::IndexedTxGraph;
use bdk_chain::SpkTxOutIndex;
use bdk_chain::TxGraph;
use bdk_coin_select::CoinSelector;
use bdk_coin_select::WeightedValue;
use bitcoind::anyhow::anyhow;
use std::collections::HashMap;
use tide::prelude::*;
use tide::StatusCode;

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
    pub fee_rate: f32,                   // sats per wu
    pub long_term_fee_rate: Option<f32>, // sats per wu
    pub min_absolute_fee: u64,           // sats
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

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum CsCandidateOrder {
    #[serde(rename = "largest_first")]
    LargestFirst,
    #[serde(rename = "smallest_first")]
    SmallestFirst,
    #[serde(rename = "oldest_first")]
    OldestFirst,
    #[serde(rename = "newest_first")]
    NewestFirst,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "algorithm", content = "parameters")]
pub enum CsAlgorithm {
    #[serde(rename = "bnb")]
    Bnb { bnb_rounds: usize, fallback: bool },
    #[serde(rename = "select_until_finished")]
    SelectUntilFinished { candidate_order: CsCandidateOrder },
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum CsExcessStrategy {
    #[serde(rename = "best_strategy")]
    BestStrategy,
    #[serde(rename = "to_fee")]
    ExcessToFee,
    #[serde(rename = "to_recipient")]
    ExcessToRecipient,
    #[serde(rename = "to_change_output")]
    ExcessToChangeOutput,
}

impl CsExcessStrategy {
    pub fn from_kind(kind: bdk_coin_select::ExcessStrategyKind) -> Self {
        match kind {
            bdk_coin_select::ExcessStrategyKind::ToFee => Self::ExcessToFee,
            bdk_coin_select::ExcessStrategyKind::ToRecipient => Self::ExcessToRecipient,
            bdk_coin_select::ExcessStrategyKind::ToDrain => Self::ExcessToChangeOutput,
        }
    }

    pub fn kind(self) -> Option<bdk_coin_select::ExcessStrategyKind> {
        match self {
            CsExcessStrategy::BestStrategy => None,
            CsExcessStrategy::ExcessToFee => Some(bdk_coin_select::ExcessStrategyKind::ToFee),
            CsExcessStrategy::ExcessToRecipient => {
                Some(bdk_coin_select::ExcessStrategyKind::ToRecipient)
            }
            CsExcessStrategy::ExcessToChangeOutput => {
                Some(bdk_coin_select::ExcessStrategyKind::ToDrain)
            }
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CsMetrics {
    pub waste: i64,
    pub feerate_deviation: f32,
    pub tx_size: u32,
    pub used_excess_strategy: CsExcessStrategy,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CsSolutionRequest {
    pub spend_scenario_id: sha256::Hash,
    #[serde(flatten)]
    pub algorithm: CsAlgorithm,
    pub excess_strategy: CsExcessStrategy,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CsSolutionResponse {
    pub request: CsSolutionRequest,
    pub timestamp: u64,
    pub txid: Txid,
    pub raw_tx: String,
    pub metrics: CsMetrics,
}

pub struct Wally {
    pub descriptor: Descriptor<DescriptorPublicKey>,
    pub keymap: HashMap<DescriptorPublicKey, DescriptorSecretKey>,
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
        let dust_limit = self.descriptor.dust_value();

        for recipient in &scenario.recipients {
            if !recipient.address.is_valid_for_network(Network::Regtest) {
                return Err(tide::Error::new(
                    StatusCode::BadRequest,
                    anyhow!(
                        "address {} is not valid for network {}",
                        recipient.address,
                        Network::Regtest
                    ),
                ));
            }
            // [todo] not 100% correct, but whatever
            if recipient.amount < dust_limit {
                return Err(tide::Error::new(
                    StatusCode::BadRequest,
                    anyhow!(
                        "value ({} sats) is below the dust limit ({} sats)",
                        recipient.amount,
                        dust_limit
                    ),
                ));
            }
        }

        let id = scenario.id();
        self.scenarios.insert(id, scenario);
        Ok(id)
    }

    pub fn get_spend_scenario(&self, scenario_id: sha256::Hash) -> Option<Scenario> {
        self.scenarios.get(&scenario_id).cloned()
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

pub fn create_spend_solution(
    chain: &LocalChain,
    descriptor: &Descriptor<DescriptorPublicKey>,
    keymap: &HashMap<DescriptorPublicKey, DescriptorSecretKey>,
    graph: &TxGraph<ConfirmationHeightAnchor>,
    scenario: &Scenario,
    algorithm: CsAlgorithm,
    excess_strategy: CsExcessStrategy,
) -> Result<(Transaction, CsMetrics), CsSolutionError> {
    let chain_tip = chain
        .tip()
        .map(|cp| cp.block_id())
        .ok_or(CsSolutionError::NoChainTip)?;
    let assets = bdk_tmp_plan::Assets {
        keys: keymap.iter().map(|(pk, _)| pk.clone()).collect(),
        ..Default::default()
    };
    let plan = bdk_tmp_plan::plan_satisfaction(&descriptor.at_derivation_index(0), &assets)
        .expect("must have plan");

    let mut candidates = graph
        .filter_chain_txouts(
            chain,
            chain_tip,
            scenario
                .candidates
                .iter()
                .map(|sc| (sc.must_select, sc.outpoint)),
        )
        .collect::<Vec<_>>();

    // sort candidates if algorithm requires it
    if let CsAlgorithm::SelectUntilFinished { candidate_order } = &algorithm {
        match candidate_order {
            CsCandidateOrder::LargestFirst => {
                candidates.sort_by_key(|(_, txo)| std::cmp::Reverse(txo.txout.value))
            }
            CsCandidateOrder::SmallestFirst => candidates.sort_by_key(|(_, txo)| txo.txout.value),
            CsCandidateOrder::OldestFirst => {
                candidates.sort_by_key(|(_, txo)| txo.chain_position.clone())
            }
            CsCandidateOrder::NewestFirst => {
                candidates.sort_by_key(|(_, txo)| std::cmp::Reverse(txo.chain_position.clone()))
            }
        }
    }

    let weighted_candidates = candidates
        .iter()
        .map(|(_, utxo)| {
            WeightedValue::new(
                utxo.txout.value,
                plan.expected_weight() as _,
                plan.witness_version().is_some(),
            )
        })
        .collect::<Vec<_>>();

    let mut output = scenario
        .recipients
        .iter()
        .map(|sr| TxOut {
            value: sr.amount,
            script_pubkey: sr.address.script_pubkey(),
        })
        .collect::<Vec<_>>();

    let mut change_output = TxOut {
        value: 0,
        script_pubkey: descriptor.at_derivation_index(0).script_pubkey(),
    };

    let cs_opts = bdk_coin_select::CoinSelectorOpt {
        target_feerate: scenario.fee_rate / 4.0,
        long_term_feerate: scenario.long_term_fee_rate.map(|r| r / 4.0),
        min_absolute_fee: scenario.min_absolute_fee,
        min_drain_value: descriptor.dust_value(),
        ..bdk_coin_select::CoinSelectorOpt::fund_outputs(
            &output,
            &change_output,
            plan.expected_weight() as u32,
        )
    };

    let mut coin_selector = CoinSelector::new(&weighted_candidates, &cs_opts);

    // pre-selection
    for (index, (must_select, _)) in candidates.iter().enumerate() {
        if *must_select {
            coin_selector.select(index);
        }
    }

    let selection = match algorithm {
        CsAlgorithm::Bnb {
            bnb_rounds,
            fallback,
        } => {
            let final_selector = bdk_coin_select::coin_select_bnb(
                bdk_coin_select::BnbLimit::Rounds(bnb_rounds),
                coin_selector.clone(),
            );
            match final_selector {
                Some(coin_selector) => coin_selector.finish(),
                None if !fallback => return Err(CsSolutionError::NoBnbSolution),
                None => coin_selector.select_until_finished(),
            }
        }
        CsAlgorithm::SelectUntilFinished { .. } => coin_selector.select_until_finished(),
    }
    .map_err(CsSolutionError::SelectionError)?;

    let (excess_strategy_kind, excess_strategy) = match excess_strategy.kind() {
        None => selection.best_strategy(),
        Some(kind) => selection
            .excess_strategies
            .get_key_value(&kind)
            .ok_or(CsSolutionError::ExcessStrategyUnavailable(kind))?,
    };
    if let Some(change_value) = excess_strategy.drain_value {
        change_output.value = change_value;
        output.push(change_output);
    }

    let selected_candidates = selection.apply_selection(&candidates).collect::<Vec<_>>();

    let input = selected_candidates
        .iter()
        .map({
            let req_sequence = plan.required_sequence();
            move |(_, txo)| TxIn {
                previous_output: txo.outpoint,
                sequence: req_sequence.unwrap_or(Sequence::ENABLE_RBF_NO_LOCKTIME),
                ..Default::default()
            }
        })
        .collect::<Vec<_>>();

    let version = 0x02;
    let lock_time = LockTime::from_height(chain_tip.height)
        .unwrap_or(LockTime::ZERO)
        .into();

    let mut tx = Transaction {
        version,
        lock_time,
        input,
        output,
    };

    let prevouts = selected_candidates
        .iter()
        .map(|(_, txo)| txo.txout.clone())
        .collect::<Vec<_>>();
    let sighash_prevouts = Prevouts::All(&prevouts);

    let _tmp_tx = tx.clone();
    let mut sighash_cache = SighashCache::new(&_tmp_tx);

    let requirements = plan.requirements();
    for (i, input) in tx.input.iter_mut().enumerate() {
        let mut auth_data = bdk_tmp_plan::SatisfactionMaterial::default();
        assert!(
            !requirements.requires_hash_preimages(),
            "can't have hash pre-images since we didn't provide any."
        );
        assert!(
            requirements
                .signatures
                .sign_with_keymap(
                    i,
                    keymap,
                    &sighash_prevouts,
                    None,
                    None,
                    &mut sighash_cache,
                    &mut auth_data,
                    &Secp256k1::default(),
                )
                .map_err(CsSolutionError::SigningError)?,
            "we should have signed with this input."
        );

        match plan.try_complete(&auth_data) {
            bdk_tmp_plan::PlanState::Complete {
                final_script_sig,
                final_script_witness,
            } => {
                if let Some(witness) = final_script_witness {
                    input.witness = witness;
                }

                if let Some(script_sig) = final_script_sig {
                    input.script_sig = script_sig;
                }
            }
            bdk_tmp_plan::PlanState::Incomplete(_) => panic!("plan data should all be provided"),
        }
    }

    let metrics = CsMetrics {
        waste: excess_strategy.waste,
        feerate_deviation: {
            let req_rate = scenario.fee_rate / 4.0;
            let actual_rate = excess_strategy.feerate() / 4.0;
            actual_rate - req_rate
        },
        used_excess_strategy: CsExcessStrategy::from_kind(*excess_strategy_kind),
        tx_size: tx.vsize() as _,
    };

    Ok((tx, metrics))
}

#[derive(Debug, Clone)]
pub enum CsSolutionError {
    NoChainTip,
    NoBnbSolution,
    ExcessStrategyUnavailable(bdk_coin_select::ExcessStrategyKind),
    SelectionError(bdk_coin_select::SelectionError),
    SigningError(bdk_tmp_plan::SigningError),
}

impl std::fmt::Display for CsSolutionError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{:?}", self)
    }
}

impl std::error::Error for CsSolutionError {}
