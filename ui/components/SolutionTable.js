import React from "react";
import TableHead from "@components/TableHead";

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

  return (
    <table className="main_table">
      <thead>
        <tr>
          <th></th>
          {titles.map((title, index) => (
            <TableHead key={index} label={title} />
          ))}
        </tr>
      </thead>
      {solutions.length === 0 ? (
        "no solutions yet"
      ) : (
        <tbody>
          {solutions.map((solution) => {
            const { timestamp, txid, request, metrics } = solution;
            const { algorithm } = request;
            const { used_excess_strategy, waste, tx_size, feerate_deviation } =
              metrics;
            const time = new Date(timestamp * 1000);
            const txId = `${txid.substring(0, 6)}.....${txid.substring(
              txid.length - 6,
            )}`;
            return (
              <tr className="hover">
                <td>1</td>
                <td className="input_field">{time}</td>
                <td className="input_field">{txId}</td>
                <td className="input_field">{algorithm}</td>
                <td className="input_field">{used_excess_strategy}</td>
                <td className="input_field">{waste}</td>
                <td className="input_field">{feerate_deviation}</td>
                <td className="input_field">{tx_size}</td>
              </tr>
            );
          })}
        </tbody>
      )}
    </table>
  );
};
export default SolutionTable;
