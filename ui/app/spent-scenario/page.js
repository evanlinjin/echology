"use client";
import { useCallback, useEffect, useState } from "react";
import RecipientsTable from "@app/spent-scenario/components/RecipientsTable";
import { RiAddFill } from "react-icons/ri";
import Cookies from "js-cookie";
import CheckboxField from "@app/spent-scenario/components/CheckboxField";
import SolutionTable from "@app/spent-scenario/components/SolutionTable";
import NewSolutionForm from "@app/spent-scenario/components/NewSolutionForm";
import { API_ROOT, POST } from "@utils/request";
import { setCookie } from "@app/page";

const Page = () => {
  const [recipients, setRecipients] = useState([
    {
      address:
        "bcrt1p53e6xngdkjkshns8ukz03mc6fkymdcdkl82d8mug4ltujsmkz0zsq7l2sh",
      amount: 1200,
    },
  ]);
  const [coinSelectionParameters, setCoinSelectionParameters] = useState({
    maxExtraTarget: 0,
    freeRate: 1.5,
    longTermFreeRate: 5.0,
  });

  const [selectionAlgorithm, setSelectionAlgorithm] = useState("bnb");
  const [bnbParameters, setBnbParameters] = useState({
    bnb_rounds: 420,
    fallback: true,
  });
  const [excessStrategy, setExcessStrategy] = useState("best_strategy");
  const [candidateOrder, setCandidateOrder] = useState("largest_first");
  let selectedCoins;
  if (typeof Cookies.get("selectedCoins") !== 'undefined') {
    selectedCoins = JSON.parse(Cookies.get("selectedCoins"));
  } else {
    selectedCoins = JSON.parse("[]");
  }
  let totalAmount = Cookies.get("totalAmount");
  let alias = Cookies.get("alias");

  const addRecipientsClick = useCallback(() => {
    setRecipients((prev) => [...prev, { address: "", amount: 0 }]);
  }, []);

  const handlePostNewSpent = useCallback(() => {
    const body = {
      candidates: [...selectedCoins],
      candidates: [],
      recipients: [...recipients],
      max_extra_target: coinSelectionParameters.maxExtraTarget,
      fee_rate: coinSelectionParameters.freeRate,
      long_term_fee_rate: coinSelectionParameters.longTermFreeRate,
    };
    POST(
      `${API_ROOT}/wallet/${alias}/new_spend_scenario`,
      body,
    ).then((r) => setCookie("spentScenarioId", r.spend_scenario_id));
  }, []);

  const handleChangeFreeRateParameters = useCallback((e) => {
    setCoinSelectionParameters({
      ...coinSelectionParameters,
      freeRate: Number(e.target.value),
    });
  }, []);

  const handleChangeMaxExtraParameters = useCallback((e) => {
    setCoinSelectionParameters({
      ...coinSelectionParameters,
      maxExtraTarget: Number(e.target.value),
    });
  }, []);

  const handleChangeLongTermFreeRateParameters = useCallback((e) => {
    setCoinSelectionParameters({
      ...coinSelectionParameters,
      longTermFreeRate: Number(e.target.value),
    });
  }, []);

  const handleRunSolution = useCallback(() => {
    let parameters = { ...bnbParameters };
    console.log("bnbParameters", bnbParameters);
    if (selectionAlgorithm === "select_until_finished") {
      parameters = { candidate_order: candidateOrder };
    }
    const body = {
      spend_scenario_id: Cookies.get("spentScenarioId"),
      algorithm: selectionAlgorithm,
      parameters: parameters,
      excess_strategy: excessStrategy,
    };
    POST(`${API_ROOT}/wallet/${alias}/new_solution`, body).then(
      (result) => console.log("result", result),
    );
  }, []);

  const handleAddSolutionClick = useCallback(() => {
    window.my_modal_5.showModal();
  }, []);

  return (
    <div className="w-full flex gap-6 flex-col frame_padding">
      <div className="page_title">Create Spent Scenarios:</div>
      <div className="section items-center">
        <div className="section_title">Candidates:</div>
        <div className="section_desc">
          <span className="input_field">{selectedCoins.length}</span> txos
          selected, total <span className="input_field">{totalAmount}</span>{" "}
          sats
        </div>
      </div>
      <div className="section items-start">
        <div className="section_title">Parameters:</div>

        <div className="flex-col main_frame frame_padding flex w-full items-start gap-6">
          <div className="flex gap-4 items-start ">
            <span>Recipient:</span>
            <button className="icon_button" onClick={addRecipientsClick}>
              <RiAddFill className="hover:text-h5" />
            </button>
          </div>

          <div className="flex flex-col w-full">
            <div className="flex gap-6">
              <RecipientsTable
                recipients={recipients}
                onSetRecipients={setRecipients}
              />
              <div className="flex flex-col gap-4 w-1/3">
                <CheckboxField
                  label="Max Extra Target:"
                  unit="sats"
                  checked
                  disabled
                  onChange={handleChangeMaxExtraParameters}
                  value={coinSelectionParameters.maxExtraTarget}
                />
                <CheckboxField
                  label="Free Rate:"
                  unit="sats / vbytes"
                  checked
                  disabled
                  onChange={handleChangeFreeRateParameters}
                  value={coinSelectionParameters.freeRate}
                />
                <CheckboxField
                  label="Long Term Free Rate:"
                  unit="sats / vbytes"
                  onChange={handleChangeLongTermFreeRateParameters}
                  value={coinSelectionParameters.longTermFreeRate}
                />
              </div>
            </div>
          </div>
          <div className="w-full flex justify-end">
            <button
              className="btn btn-active main_button"
              onClick={handlePostNewSpent}
            >
              Done
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
        <SolutionTable />
      </div>
    </div>
  );
};
export default Page;
