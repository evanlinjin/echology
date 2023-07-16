"use client";
import { memo, useCallback, useEffect, useState } from "react";
import RecipientsTable from "@components/RecipientsTable";
import { RiAddFill } from "react-icons/ri";
import Cookies from "js-cookie";
import CheckboxField from "@components/CheckboxField";
import SolutionTable from "@components/SolutionTable";
import NewSolutionForm from "@components/NewSolutionForm";
import { POST } from "@utils/request";
import { setCookie } from "@app/page";
import Link from "next/link";
import { IoChevronBackOutline } from "@node_modules/react-icons/io5";

const SpentScenario = () => {
  const [solutions, setSolution] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [coinSelectionParameters, setCoinSelectionParameters] = useState({
    minAbsoluteFee: 0,
    freeRate: 1.5,
    longTermFreeRate: 5.0,
  });
  const [selectionAlgorithm, setSelectionAlgorithm] = useState("bnb");
  const [bnbParameters, setBnbParameters] = useState({
    bnb_rounds: 4200,
    fallback: true,
  });
  const [excessStrategy, setExcessStrategy] = useState("best_strategy");
  const [candidateOrder, setCandidateOrder] = useState("largest_first");
  const [isDone, setIsDone] = useState(undefined);
  const [spentScenarioId, setSpentScenarioId] = useState(
    Cookies.get("spentScenarioId") || "",
  );
  const [useLongTerm, setUseLongTerm] = useState(false);
  const [selectedCoins, setSelectedCoins] = useState(
    Cookies.get("selectedCoins") || [],
  );
  useEffect(() => {
    setSelectedCoins(JSON.parse(Cookies.get("selectedCoins") || []));
  }, []);
  useEffect(() => {
    console.log(Cookies.get("spentScenarioId"));
    const id =
      Cookies.get("spentScenarioId") !== 'undefined'
        ? Cookies.get("spentScenarioId")
        : undefined;
    setSpentScenarioId(id);
  }, []);

  let totalAmount = JSON.parse(Cookies.get("totalAmount") || 0);
  let alias = Cookies.get("alias");

  const newRecipient = { address: "", amount: 0 };
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
      fee_rate: coinSelectionParameters.freeRate,
      long_term_fee_rate: useLongTerm
        ? coinSelectionParameters.longTermFreeRate
        : undefined,
    };
    POST(
      `http://localhost:8080/api/wallet/${alias}/new_spend_scenario`,
      body,
    ).then((r) => {
      console.log("r", r);
      setCookie("spentScenarioId", r.spend_scenario_id);
      setIsDone(true);
    });
  }, [
    setCookie,
    setIsDone,
    selectedCoins,
    recipients,
    coinSelectionParameters,
    useLongTerm,
  ]);

  const handleChangeFreeRateParameters = useCallback(
    (e) => {
      coinSelectionParameters.freeRate = Number(e.target.value);
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

  const handleChangeLongTermFreeRateParameters = useCallback(
    (e) => {
      coinSelectionParameters.longTermFreeRate = Number(e.target.value);
      setCoinSelectionParameters({ ...coinSelectionParameters });
    },
    [coinSelectionParameters],
  );

  const handleRunSolution = useCallback(() => {
    const bodyBnb = {
      spend_scenario_id: spentScenarioId,
      algorithm: "bnb",
      parameters: { ...bnbParameters },
      excess_strategy: excessStrategy,
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
    POST(`http://localhost:8080/api/wallet/${alias}/new_solution`, body).then(
      (result) => {
        setSolution([{ ...result }]);
      },
    );
  }, [
    selectionAlgorithm,
    bnbParameters,
    excessStrategy,
    candidateOrder,
    setSolution,
  ]);

  const handleAddSolutionClick = useCallback(() => {
    window.my_modal_5.showModal();
  }, []);

  // TODO: DELETE RECIPIENTS BY IDxXD
  const handleDeleteRecipient = useCallback(
    (e) => {
      recipients.splice(e.target.id, 1);
      setRecipients([...recipients]);
    },
    [recipients],
  );

  const handleChangeRecipientAddress = useCallback(
    (e) => {
      const index = e.target.id;
      recipients[index].address = e.target.value;
      setRecipients([...recipients]);
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
    setSolution([]);
  }, [setIsDone, setSolution]);
  console.log("selectedCoins", selectedCoins);
  return (
    <div className="w-full flex gap-6 flex-col frame_padding">
      <Link
        href="/coin-control"
        className="rounded-none flex items-center w-1/5 cursor-pointer gap-2 font-medium hover:bg-gray-300"
      >
        <IoChevronBackOutline />
        Back To Coin Control
      </Link>

      <div className="flex justify-between">
        <div className="page_title">Create Spent Scenarios:</div>
      </div>
      <div className="section items-center">
        <div className="section_title">Candidates:</div>
        <div className="section_desc">
          <span className="input_field">
            {selectedCoins && selectedCoins.length}
          </span>{" "}
          txos selected, total{" "}
          <span className="input_field">{totalAmount}</span> sats
        </div>
      </div>
      <div>
        <div className="section_title_cap">Parameters:</div>
        <div className="gap-4 flex-col border border-gray-700 w-full frame_padding flex items-start">
          <div className="flex gap-4 items-start">
            <span>Recipient:</span>
            <button
              className="icon_button disabled:text-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed disabled:border-gray-500"
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
                  label="Free Rate:"
                  unit="sats / vbytes"
                  checked
                  disableCheckbox
                  disableInput={isDone}
                  onChange={handleChangeFreeRateParameters}
                  value={coinSelectionParameters.freeRate}
                />
                <CheckboxField
                  label="Long Term Free Rate:"
                  unit="sats / vbytes"
                  onChange={handleChangeLongTermFreeRateParameters}
                  value={coinSelectionParameters.longTermFreeRate}
                  disableInput={isDone}
                  checked={useLongTerm}
                  onToggleCheck={setUseLongTerm}
                />
              </div>
            </div>
          </div>
          <div className="w-full flex justify-end">
            <button
              className="btn btn-active main_button"
              onClick={
                isDone === true ? handleSwitchEditMode : handlePostNewSpent
              }
            >
              {isDone === true ? "Edit" : "Done"}
            </button>
          </div>
        </div>
      </div>
      <div className="section items-center">
        <div className="section_title">Solution:</div>
        <button className="icon_button" onClick={handleAddSolutionClick}>
          <RiAddFill className="hover:text-h5" />
        </button>
        <dialog id="my_modal_5" className="modal">
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
      <div className="section">
        <SolutionTable solutions={solutions} />
      </div>
    </div>
  );
};
export default memo(SpentScenario);
