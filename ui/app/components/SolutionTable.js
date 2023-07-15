import React from "react";
import TableHead from "@components/TableHead";

const SolutionTable = () => {
  const titles = [
    "Time",
    "Txid",
    "Algorithm",
    "Excess Strategy",
    "Waste Metric",
    "Feerate Dev.",
    "Target Dev.",
    "TX size",
  ];

  return (
    <table className="main_table">
      {/* head */}
      <thead>
        <tr>
          <th></th>
          {titles.map((title, index) => (
            <TableHead key={index} label={title} />
          ))}
        </tr>
      </thead>

      {/* row 1 */}
      <tbody>
        <tr className="hover">
          <td>1</td>
          <td className="input_field"></td>
          <td className="input_field"></td>
          <td className="input_field"></td>
          <td className="input_field"></td>
          <td className="input_field"></td>
          <td className="input_field"></td>
          <td className="input_field"></td>
          <td className="input_field"></td>
        </tr>
      </tbody>
    </table>
  );
};
export default SolutionTable;
