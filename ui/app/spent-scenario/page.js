"use client";
import { memo, useCallback, useState } from "react";
import Link from "next/link";
import { RiAddFill } from "react-icons/ri";
import { IoChevronBackOutline } from "react-icons/io5";
import RecipientsTable from "@components/RecipientsTable";
import CheckboxField from "@components/CheckboxField";
import SolutionTable from "@components/SolutionTable";
import NewSolutionForm from "@components/NewSolutionForm";
import { POST } from "@utils/request";
import { useCoinContext } from "@app/context/coins";
import Copy from "@components/Copy";
import { setCookie } from "@utils/setCookie";
import Cookies from "js-cookie";

const SpentScenario = () => {
  const { selectedCoins, address, selectedAmount, setErrorMessage } =
    useCoinContext();
  const [solutions, setSolution] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [coinSelectionParameters, setCoinSelectionParameters] = useState({
    minAbsoluteFee: 0,
    feeRate: 5.0,
    longTermFeeRate: 1.0,
  });
  const [selectionAlgorithm, setSelectionAlgorithm] = useState("bnb");
  const [bnbParameters, setBnbParameters] = useState({
    bnb_rounds: 42000,
    fallback: true,
    metric: "waste",
  });
  const [excessStrategy, setExcessStrategy] = useState("best_strategy");
  const [candidateOrder, setCandidateOrder] = useState("largest_first");
  const [isDone, setIsDone] = useState(undefined);
  const [useLongTerm, setUseLongTerm] = useState(false);

  const newRecipient = { address: "", amount: "" };
  const handleAddRecipientsClick = useCallback(() => {
    setRecipients((prev) => [...prev, newRecipient]);
  }, []);
  const handlePostNewSpent = useCallback(() => {
    const body = {
      candidates: [...selectedCoins],
      recipients:
        recipients.length === 1 && recipients[0].address === ""
          ? undefined
          : [...recipients],
      min_absolute_fee: coinSelectionParameters.minAbsoluteFee,
      fee_rate: coinSelectionParameters.feeRate,
      long_term_fee_rate: useLongTerm
        ? coinSelectionParameters.longTermFeeRate
        : undefined,
    };

    POST(
      `http://localhost:8080/api/wallet/${Cookies.get(
        "alias",
      )}/new_spend_scenario`,
      body,
    ).then((result) => {
      if (result.error) {
        setErrorMessage(result.error);
      }
      if (result.spend_scenario_id) {
        setCookie("spentScenarioId", result.spend_scenario_id);
        setIsDone(true);
      }
    });
  }, [
    setCookie,
    setIsDone,
    selectedCoins,
    recipients,
    coinSelectionParameters,
    useLongTerm,
  ]);

  const handleChangeFeeRateParameters = useCallback(
    (e) => {
      coinSelectionParameters.feeRate = Number(e.target.value);
      setCoinSelectionParameters({ ...coinSelectionParameters });
    },
    [coinSelectionParameters],
  );

  const handleChangeMinAbsoluteParameters = useCallback(
    (e) => {
      coinSelectionParameters.minAbsoluteFee = Number(e.target.value);
      setCoinSelectionParameters({ ...coinSelectionParameters });
    },
    [coinSelectionParameters],
  );

  const handleChangeLongTermFeeRateParameters = useCallback(
    (e) => {
      coinSelectionParameters.longTermFeeRate = Number(e.target.value);
      setCoinSelectionParameters({ ...coinSelectionParameters });
    },
    [coinSelectionParameters],
  );

  const handleRunSolution = useCallback(() => {
    const spentScenarioId = Cookies.get("spentScenarioId");
    const bodyBnb = {
      spend_scenario_id: spentScenarioId,
      algorithm: "bnb",
      parameters: { ...bnbParameters },
      excess_strategy: excessStrategy,
      metric: "waste",
    };
    const bodySuf = {
      spend_scenario_id: spentScenarioId,
      algorithm: "select_until_finished",
      parameters: { candidate_order: candidateOrder },
      excess_strategy: excessStrategy,
    };
    let body;
    if (selectionAlgorithm === "bnb") {
      body = bodyBnb;
    }
    if (selectionAlgorithm === "select_until_finished") {
      body = bodySuf;
    }
    POST(
      `http://localhost:8080/api/wallet/${Cookies.get("alias")}/new_solution`,
      body,
    )
      .then((result) => {
        if (result.error) {
          setErrorMessage(result.error);
        } else {
          const updatedSolutions = [...solutions];
          updatedSolutions.push(result);
          setSolution(updatedSolutions);
        }
      })
      .catch((error) => setErrorMessage(error));
  }, [
    solutions,
    selectionAlgorithm,
    bnbParameters,
    excessStrategy,
    candidateOrder,
    setSolution,
  ]);

  const handleAddSolutionClick = useCallback(() => {
    window["create_new_solution_modal"].showModal();
  }, []);

  const handleDeleteRecipient = useCallback(
    (e) => {
      recipients.splice(e.target.id, 1);
      setRecipients([...recipients]);
    },
    [recipients],
  );

  const handleChangeRecipientAddress = useCallback(
    (e) => {
      const copy = recipients;
      copy.splice(e.target.id, 1, {
        ...copy[e.target.id],
        address: e.target.value,
      });
      setRecipients([...copy]);
    },
    [recipients, setRecipients],
  );

  const handleChangeRecipientAmount = useCallback(
    (e) => {
      const index = e.target.id;
      const value = e.target.value;
      recipients[index].amount = Number(value);
      setRecipients([...recipients]);
    },
    [recipients, setRecipients],
  );

  const handleSwitchEditMode = useCallback(() => {
    setIsDone(false);
  }, [setIsDone]);
  return (
    <div className="w-full flex gap-6 flex-col frame_padding">
      <div className="w-full flex justify-between flex-wrap gap-4">
        <Link href={"/coin-control"} className="main_button">
          <IoChevronBackOutline />
          Back To Coin Control
        </Link>
        <div className="flex flex-wrap gap-3 self-start items-center">
          <span className="capitalize">Address:</span>
          <Copy content={address} />
        </div>
      </div>
      <div className="flex justify-between">
        <div className="page_title">Create Spent Scenarios:</div>
      </div>
      <div className="flex items-center">
        <div className="section_title">Candidates:</div>
        <div className="section_desc">
          <span className="input_field">
            {selectedCoins && selectedCoins.length}
          </span>{" "}
          txos selected, total{" "}
          <span className="input_field">{selectedAmount}</span> sats
        </div>
      </div>
      <div>
        <div className="section_title_cap">Parameters:</div>
        <div className="gap-4 flex-col border border-gray-700 w-full frame_padding flex items-start">
          <div className="flex gap-4 items-start">
            <span>Recipient:</span>
            <button
              className="icon_button"
              onClick={handleAddRecipientsClick}
              disabled={isDone === true}
            >
              <RiAddFill className="text-body1 hover:text-h5 disabled:text-body1" />
            </button>
          </div>
          <div className="flex flex-col w-full">
            <div className="flex gap-6">
              <RecipientsTable
                recipients={recipients}
                isDone={isDone}
                onChangeRecipientAddress={handleChangeRecipientAddress}
                onChangeRecipientAmount={handleChangeRecipientAmount}
                onDeleteRecipient={handleDeleteRecipient}
              />
              <div className="flex flex-col gap-4 w-1/3">
                <CheckboxField
                  label="Min Absolute Fee:"
                  unit="sats"
                  checked
                  disableCheckbox
                  disableInput={isDone}
                  onChange={handleChangeMinAbsoluteParameters}
                  value={coinSelectionParameters.minAbsoluteFee}
                />
                <CheckboxField
                  label="Feerate:"
                  unit="sats / vbytes"
                  checkedh
                  disableCheckbox
                  disableInput={isDone}
                  onChange={handleChangeFeeRateParameters}
                  value={coinSelectionParameters.feeRate}
                />
                <CheckboxField
                  label="Long Term Feerate:"
                  unit="sats / vbytes"
                  onChange={handleChangeLongTermFeeRateParameters}
                  value={coinSelectionParameters.longTermFeeRate}
                  checked={useLongTerm}
                  onToggleCheck={setUseLongTerm}
                  disableCheckbox={isDone}
                  disableInput={isDone}
                />
              </div>
            </div>
          </div>
          <div className="w-full flex justify-end">
            <button
              disabled={
                recipients.length === 0 ||
                recipients[0]?.address === "" ||
                recipients[0]?.amount === 0
              }
              className="main_button"
              onClick={
                isDone === true ? handleSwitchEditMode : handlePostNewSpent
              }
            >
              {isDone === true ? "Edit" : "Done"}
            </button>
          </div>
        </div>
      </div>
      <div>
        <div className="section_title_cap flex justify-between">
          Solution:
          <button
            className="icon_button"
            onClick={handleAddSolutionClick}
            disabled={recipients.length === 0}
          >
            <RiAddFill className="hover:text-h5" />
          </button>
        </div>
        <div className="gap-4 flex-col border border-gray-700 w-full frame_padding flex items-start">
          <div className="flex flex-col gap-10 w-full items-center">
            {solutions.length > 0 ? (
              <SolutionTable solutions={solutions} />
            ) : (
              <div className="flex gap-5">
                <span>No solutions yet..</span>
                <button
                  className="icon_button"
                  onClick={handleAddSolutionClick}
                  disabled={recipients.length === 0}
                >
                  <RiAddFill className="hover:text-h5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <dialog id="create_new_solution_modal" className="modal">
        <form
          method="dialog"
          className="modal-box rounded-none frame_padding border border-gray-700"
        >
          <NewSolutionForm
            onRunSolution={handleRunSolution}
            selectionAlgorithm={selectionAlgorithm}
            excessStrategy={excessStrategy}
            setSelectionAlgorithm={setSelectionAlgorithm}
            setExcessStrategy={setExcessStrategy}
            candidateOrder={candidateOrder}
            setCandidateOrder={setCandidateOrder}
            bnbParameters={bnbParameters}
            setBnbParameters={setBnbParameters}
          />
        </form>
      </dialog>
    </div>
  );
};
export default memo(SpentScenario);
