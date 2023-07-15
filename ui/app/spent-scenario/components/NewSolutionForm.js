import React, { useCallback } from "react";

const NewSolutionForm = ({
  onRunSolution,
  selectionAlgorithm,
  setSelectionAlgorithm,
  excessStrategy,
  setExcessStrategy,
  candidateOrder,
  setCandidateOrder,
  bnbParameters,
  setBnbParameters,
}) => {
  const handleChangeAlgorithm = useCallback((e) => {
    setSelectionAlgorithm(e.target.value);
  }, []);
  const handleChangeCandidateOrder = useCallback((e) => {
    setCandidateOrder(e.target.value);
  }, []);

  const handleChangeBnbRounds = useCallback(
    (e) => {
      setBnbParameters({ ...bnbParameters, bnb_rounds: e.target.value });
    },
    [bnbParameters],
  );
  const handleChangeBnbFallback = useCallback(
    (e) => {
      setBnbParameters({
        ...bnbParameters,
        fallback: e.target.value === "on",
      });
    },
    [bnbParameters],
  );
  const handleChangeExcessStrategy = useCallback((e) => {
    setExcessStrategy(e.target.value);
  }, []);

  const bnbParametersFields = (
    <div className="frame_padding main_frame">
      <div className="flex gap-3 items-center">
        <input
          type="number"
          className="input_field w-full"
          value={bnbParameters.bnb_rounds}
          onChange={handleChangeBnbRounds}
        />
        <span className="whitespace-nowrap">rounds</span>
      </div>
      <div className="flex gap-3 flex-col items-center">
        <span className="label-text">use fallback algorithm</span>
        <input
          type="checkbox"
          checked={bnbParameters.fallback}
          className="checkbox"
          onChange={handleChangeBnbFallback}
        />
      </div>
    </div>
  );

  const sufParametersFields = (
    <div className="frame_padding main_frame">
      <span className="whitespace-nowrap">Candidate Order:</span>
      <select
        className="select select-bordered rounded-none main_background rounded-none whitespace-nowrap border border-black w-full"
        onChange={handleChangeCandidateOrder}
      >
        <option
          value="largest_first"
          selected={candidateOrder === "largest_first"}
        >
          Largest First
        </option>
        <option
          value="smallest_first"
          selected={candidateOrder === "smallest_first"}
        >
          Smallest First
        </option>
      </select>
    </div>
  );
  return (
    <div className="flex flex-col justify-between">
      <div className="flex flex-col gap-4 rounded-none border frame_padding main_frame">
        <div className="flex flex-col gap-2 items-start">
          <span className="whitespace-nowrap">Coin Selection Algorithm:</span>
          <select
            className="select select-bordered rounded-none main_background rounded-none whitespace-nowrap border border-black w-full"
            onChange={handleChangeAlgorithm}
          >
            {/*<option disabled>please select</option>*/}
            <option value="bnb" selected={selectionAlgorithm === "bnb"}>
              Branch & Bound
            </option>
            <option value="select_until_finished">Select Until Finish</option>
          </select>
        </div>
        <div className="flex flex-col gap-2 items-start">
          <span className="whitespace-nowrap">Parameters:</span>
          {selectionAlgorithm === "bnb"
            ? bnbParametersFields
            : sufParametersFields}
        </div>
        <div className="flex flex-col gap-2 items-start">
          <span className="whitespace-nowrap">Excess Strategy:</span>
          <select
            className="select select-bordered rounded-none main_background rounded-none whitespace-nowrap border border-black w-full"
            onChange={handleChangeExcessStrategy}
          >
            <option
              value="best_strategy"
              selected={excessStrategy === "best_strategy"}
            >
              Best Strategy
            </option>
            <option value="to_fee" selected={excessStrategy === "to_fee"}>
              To Fee
            </option>
            <option
              value="to_recipient"
              selected={excessStrategy === "to_recipient"}
            >
              To Recipient
            </option>
          </select>
        </div>
        <button className="black_button" onClick={onRunSolution}>
          RUN
        </button>
      </div>
    </div>
  );
};
export default NewSolutionForm;
