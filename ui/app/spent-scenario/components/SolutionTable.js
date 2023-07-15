import React, { useCallback, useEffect } from "react";
import { POST } from "@utils/request";
import Cookies from "js-cookie";
import TableHead from "@components/TableHead";

const alias = Cookies.get("alias");

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
