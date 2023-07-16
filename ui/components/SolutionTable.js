import React, { useCallback } from "react";
import TableHead from "@components/TableHead";
import { RiBroadcastLine } from "@node_modules/react-icons/ri";
import { AiOutlineExclamationCircle } from "@node_modules/react-icons/ai";
import { POST } from "@utils/request";

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

  const handleBroadcast = useCallback((hex) => {
    POST(`http://localhost:8080/api/network/broadcast?tx=${hex}`).then((r) =>
      console.log("r", r),
    );
  }, []);

  return (
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
              const { timestamp, txid, request, metrics, raw_tx } = solution;
              const {
                used_excess_strategy,
                waste,
                tx_size,
                feerate_deviation,
              } = metrics;
              const time = `${new Date(timestamp * 1000).getHours()}:${new Date(
                timestamp * 1000,
              ).getMinutes()}`;
              const txId = `${txid.substring(0, 6)}.....${txid.substring(
                txid.length - 6,
              )}`;

              return (
                <tr className="hover">
                  <td>{index}</td>
                  <td className="input_field">{time}</td>
                  <td className="input_field">{txId}</td>
                  {request.algorithm ? (
                    <td className="input_field">{request.algorithm}</td>
                  ) : (
                    <td className="input_field">--</td>
                  )}
                  <td className="input_field capitalize">
                    {used_excess_strategy.split("_").join(" ")}
                  </td>
                  <td className="input_field">{waste}</td>
                  <td className="input_field">{feerate_deviation}</td>
                  <td className="input_field">{tx_size}</td>
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
  );
};
export default SolutionTable;
