import React, { useCallback, useState } from "react";
import TableHead from "@components/TableHead";
import { RiBroadcastLine } from "@node_modules/react-icons/ri";
import { AiOutlineExclamationCircle } from "@node_modules/react-icons/ai";
import { GET, POST } from "@utils/request";

const SolutionTable = ({ solutions }) => {
  const titles = [
    "Time",
    "Txid",
    "Algorithm",
    "Excess Strategy",
    "Waste Metric",
    "Feerate Dev.",
    "TX size",
  ];
  const [details, setDetails] = useState("");
  const handleBroadcast = useCallback((hex) => {
    POST(`http://localhost:8080/api/network/broadcast?tx=${hex}`).then(() =>
      window.my_modal_2.showModal(),
    );
  }, []);

  const handleGetMoreDetails = useCallback((hex) => {
    GET(`http://localhost:8080/api/decode?tx=${hex}`)
      .then((r) => setDetails({ ...r }))
      .then(() => setTimeout(window.my_modal_8.showModal(), 1500));
  }, []);
  return (
    <>
      <table className="main_table">
        <thead>
          <tr>
            <th></th>
            {titles.map((title, index) => (
              <TableHead key={index} label={title} />
            ))}
            <th></th>
          </tr>
        </thead>
        {solutions.length === 0 ? (
          "no solutions yet"
        ) : (
          <tbody>
            {solutions.length > 0 &&
              solutions.map((solution, index) => {
                const { timestamp, txid, request, raw_tx } = solution;
                const time = `${new Date(
                  timestamp * 1000,
                ).getHours()}:${new Date(timestamp * 1000).getMinutes()}`;
                const txId = `${txid.substring(0, 6)}.....${txid.substring(
                  txid.length - 6,
                )}`;

                return (
                  <tr className="hover">
                    <td>{index}</td>
                    <td className="input_field">{time}</td>
                    <td className="input_field">{txId}</td>
                    {request.algorithm ? (
                      <td className="input_field capitalize">
                        {request.algorithm.split("_").join(" ")}
                      </td>
                    ) : (
                      <td className="input_field">--</td>
                    )}
                    <td className="input_field capitalize">
                      {solution.metrics &&
                        solution.metrics.used_excess_strategy
                          .split("_")
                          .join(" ")}
                    </td>
                    <td className="input_field">
                      {solution.metrics && solution.metrics.waste}
                    </td>
                    <td className="input_field">
                      {solution.metrics && solution.metrics.feerate_deviation}
                    </td>
                    <td className="input_field">
                      {solution.metrics && solution.metrics.tx_size}
                    </td>
                    <td className="flex gap-6 items-center h-full pt-2">
                      <button
                        onClick={() => handleBroadcast(raw_tx)}
                        className="tooltip tooltip-bottom"
                        data-tip="Broadcast"
                      >
                        <RiBroadcastLine fontSize={24} />
                      </button>
                      <button
                        className="tooltip tooltip-bottom"
                        data-tip="More Detail"
                        onClick={() => handleGetMoreDetails(raw_tx)}
                      >
                        <AiOutlineExclamationCircle fontSize={24} />
                      </button>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        )}
      </table>

      <dialog id="my_modal_2" className="modal">
        <form
          method="dialog"
          className="modal-box w-1/2 max-w-5xl rounded-none"
        >
          <h3 className="font-bold text-lg">Broadcast Success!</h3>
          <p className="py-4">Press ESC key or click outside to close</p>
        </form>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
      <dialog id="my_modal_8" className="modal">
        <form
          method="dialog"
          className="modal-box w-5/6 max-w-5xl rounded-none"
        >
          <h3 className="font-bold text-lg">More Details</h3>
          <p className="py-4">{JSON.stringify(details)}</p>
        </form>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </>
  );
};
export default SolutionTable;
