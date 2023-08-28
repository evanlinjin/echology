use bdk_bitcoind_rpc::bitcoincore_rpc::jsonrpc::serde_json;
use bdk_chain::bitcoin::hashes::sha256;
use bdk_chain::bitcoin::hashes::Hash;
use bdk_chain::bitcoin::psbt::Prevouts;
use bdk_chain::bitcoin::secp256k1::Secp256k1;
use bdk_chain::bitcoin::secp256k1::SecretKey;
use bdk_chain::bitcoin::Address;
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
use bdk_coin_select::Candidate;
use bdk_coin_select::CoinSelector;
use bitcoind::anyhow::anyhow;
use miniscript::bitcoin::absolute;
use miniscript::bitcoin::address::NetworkUnchecked;
use miniscript::bitcoin::sighash::SighashCache;
use std::cmp::Reverse;
use std::collections::HashMap;
use tide::prelude::*;
use tide::StatusCode;

type ChangePolicy = dyn Fn(&CoinSelector<'_>, bdk_coin_select::Target) -> bdk_coin_select::Drain;

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
    #[serde(default)]
    pub candidates: Vec<ScenarioCandidate>,
    #[serde(default)]
    pub recipients: Vec<ScenarioRecipient>,
    pub fee_rate: f32, // sats per vb
    #[serde(default)]
    pub long_term_fee_rate: Option<f32>, // sats per vb
    pub min_absolute_fee: u64, // sats
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
    pub address: Address<NetworkUnchecked>,
    pub amount: u64,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum CsCandidateOrder {
    #[serde(rename = "largest_first")]
    Largest,
    #[serde(rename = "smallest_first")]
    Smallest,
    #[serde(rename = "oldest_first")]
    Oldest,
    #[serde(rename = "newest_first")]
    Newest,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum CsBnbMetric {
    #[serde(rename = "waste")]
    Waste,
    #[serde(rename = "lowest_fee")]
    LowestFee,
}

impl Default for CsBnbMetric {
    fn default() -> Self {
        Self::Waste
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "algorithm", content = "parameters")]
pub enum CsAlgorithm {
    #[serde(rename = "bnb")]
    Bnb {
        #[serde(default = "CsBnbMetric::default")]
        metric: CsBnbMetric,
        bnb_rounds: usize,
        fallback: bool,
    },
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
    pub fn from_drain(drain: &bdk_coin_select::Drain) -> Self {
        if drain.is_some() {
            Self::ExcessToChangeOutput
        } else {
            Self::ExcessToFee
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CsMetrics {
    pub waste: f32,
    pub fee: u64,               //sats
    pub feerate: f32,           // in sats/vb
    pub feerate_deviation: f32, // in sats/vb
    pub tx_size: u32,           // in vb
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
            inner: SecretKey::from_slice(phrase_hash.as_ref())
                .expect("32 bytes, within curve order"),
        };

        let secp = Secp256k1::default();
        let (descriptor, keymap) =
            Descriptor::<DescriptorPublicKey>::parse_descriptor(&secp, &format!("tr({})", sk))?;
        let spk = descriptor.at_derivation_index(0).unwrap().script_pubkey();

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
                        recipient
                            .address
                            .clone()
                            .require_network(Network::Regtest)?,
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

    let plan =
        bdk_tmp_plan::plan_satisfaction(&descriptor.at_derivation_index(0).unwrap(), &assets)
            .expect("must have plan");

    let raw_candidates = graph
        .filter_chain_txouts(
            chain,
            chain_tip,
            scenario
                .candidates
                .iter()
                .map(|sc| (sc.must_select, sc.outpoint)),
        )
        .collect::<Vec<_>>();

    let candidates = raw_candidates
        .iter()
        .map(|(_, txo)| {
            Candidate::new(
                txo.txout.value,
                plan.expected_weight() as _,
                plan.witness_version().is_some(),
            )
        })
        .collect::<Vec<_>>();

    let mut transaction = Transaction {
        version: 0x02,
        // because the temporary planning module does not support timelocks, we can use the chain
        // tip as the `lock_time` for anti-fee-sniping purposes
        lock_time: absolute::LockTime::from_height(chain_tip.height)
            .unwrap_or(absolute::LockTime::ZERO),
        input: vec![],
        output: scenario
            .recipients
            .iter()
            .map(|sr| TxOut {
                value: sr.amount,
                script_pubkey: sr.address.clone().assume_checked().script_pubkey(),
            })
            .collect(),
    };

    let target = bdk_coin_select::Target {
        feerate: bdk_coin_select::FeeRate::from_sat_per_vb(scenario.fee_rate),
        min_fee: scenario.min_absolute_fee,
        value: transaction.output.iter().map(|txo| txo.value).sum(),
    };

    let long_term_feerate = bdk_coin_select::FeeRate::from_sat_per_vb(
        scenario.long_term_fee_rate.unwrap_or(scenario.fee_rate),
    );

    let drain_weights = bdk_coin_select::DrainWeights {
        output_weight: {
            // we calculate the weight difference of including the drain output in the base tx
            // this method will detect varint size changes of txout count
            let tx_weight = transaction.weight();
            let tx_weight_with_drain = {
                let mut tx = transaction.clone();
                tx.output.push(TxOut {
                    script_pubkey: descriptor.at_derivation_index(0).unwrap().script_pubkey(),
                    ..Default::default()
                });
                tx.weight()
            };
            (tx_weight_with_drain - tx_weight).to_wu() as u32 - 1
        },
        spend_weight: plan.expected_weight() as u32,
    };
    let drain_policy: Box<ChangePolicy> = match excess_strategy {
        CsExcessStrategy::BestStrategy => {
            Box::new(bdk_coin_select::change_policy::min_value_and_waste(
                drain_weights,
                descriptor.dust_value(),
                long_term_feerate,
            ))
        }
        CsExcessStrategy::ExcessToFee | CsExcessStrategy::ExcessToRecipient => {
            Box::new(|_, _| bdk_coin_select::Drain::none())
        }
        CsExcessStrategy::ExcessToChangeOutput => Box::new(
            bdk_coin_select::change_policy::min_value(drain_weights, descriptor.dust_value()),
        ),
    };

    let lowest_fee_metric = bdk_coin_select::metrics::LowestFee {
        target,
        long_term_feerate,
        change_policy: &drain_policy,
    };
    let waste_metric = bdk_coin_select::metrics::WasteChangeless::new(target, long_term_feerate);

    let mut selection = CoinSelector::new(&candidates, transaction.weight().to_wu() as u32);

    // pre-selection
    for (index, (must_select, _)) in raw_candidates.iter().enumerate() {
        if *must_select {
            selection.select(index);
        }
    }

    match &algorithm {
        CsAlgorithm::Bnb {
            metric,
            bnb_rounds,
            fallback,
        } => {
            let bnb_result = match metric {
                CsBnbMetric::Waste => selection.run_bnb(waste_metric, *bnb_rounds),
                CsBnbMetric::LowestFee => selection.run_bnb(lowest_fee_metric, *bnb_rounds),
            };
            if let Err(bnb_err) = bnb_result {
                if !*fallback {
                    return Err(CsSolutionError::NoBnbSolution(bnb_err));
                }
                selection.sort_candidates_by_descending_value_pwu();
                println!(
                    "Error: {} Falling back to select until target met.",
                    bnb_err
                );
            };
        }
        CsAlgorithm::SelectUntilFinished { candidate_order } => match candidate_order {
            CsCandidateOrder::Largest => {
                selection.sort_candidates_by_key(|(_, c)| Reverse(c.value))
            }
            CsCandidateOrder::Smallest => selection.sort_candidates_by_key(|(_, c)| c.value),
            CsCandidateOrder::Oldest => {
                selection.sort_candidates_by_key(|(i, _)| raw_candidates[i].1.chain_position)
            }
            CsCandidateOrder::Newest => selection
                .sort_candidates_by_key(|(i, _)| Reverse(raw_candidates[i].1.chain_position)),
        },
    };

    // ensure target is met
    selection
        .select_until_target_met(target, drain_policy(&selection, target))
        .map_err(CsSolutionError::SelectionError)?;

    // get the selected utxos
    let selected_txos = selection
        .apply_selection(&raw_candidates)
        .collect::<Vec<_>>();

    let drain = drain_policy(&selection, target);
    if drain.is_some() {
        transaction.output.push(TxOut {
            value: drain.value,
            script_pubkey: descriptor.at_derivation_index(0).unwrap().script_pubkey(),
        });
    }

    // fill transaction inputs
    transaction.input = selected_txos
        .iter()
        .map(|(_, utxo)| TxIn {
            previous_output: utxo.outpoint,
            sequence: plan
                .required_sequence()
                .unwrap_or(Sequence::ENABLE_RBF_NO_LOCKTIME),
            ..Default::default()
        })
        .collect();

    let prevouts = selected_txos
        .iter()
        .map(|(_, utxo)| utxo.txout.clone())
        .collect::<Vec<_>>();
    let sighash_prevouts = Prevouts::All(&prevouts);

    // create a short lived transaction
    let _sighash_tx = transaction.clone();
    let mut sighash_cache = SighashCache::new(&_sighash_tx);

    let requirements = plan.requirements();
    for (i, txin) in transaction.input.iter_mut().enumerate() {
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
                    txin.witness = witness;
                }

                if let Some(script_sig) = final_script_sig {
                    txin.script_sig = script_sig;
                }
            }
            bdk_tmp_plan::PlanState::Incomplete(_) => {
                panic!("plan should be complete");
            }
        }
    }

    // get metrics
    let waste = selection.waste(target, long_term_feerate, drain, 1.0);
    let actual_fee =
        selection.selected_value() - transaction.output.iter().map(|o| o.value).sum::<u64>();
    let actual_feerate = actual_fee as f32 / transaction.vsize() as f32;

    let metrics = CsMetrics {
        waste,
        fee: actual_fee,
        feerate: actual_feerate,
        feerate_deviation: actual_feerate - scenario.fee_rate,
        used_excess_strategy: CsExcessStrategy::from_drain(&drain),
        tx_size: transaction.vsize() as _,
    };

    Ok((transaction, metrics))
}

#[derive(Debug, Clone)]
pub enum CsSolutionError {
    NoChainTip,
    NoBnbSolution(bdk_coin_select::NoBnbSolution),
    SelectionError(bdk_coin_select::InsufficientFunds),
    SigningError(bdk_tmp_plan::SigningError),
}

impl std::fmt::Display for CsSolutionError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{:?}", self)
    }
}

impl std::error::Error for CsSolutionError {}
