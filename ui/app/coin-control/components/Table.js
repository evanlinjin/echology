"use client";
import React from "react";
import TableHead from "@components/TableHead";
import TableRow from "@app/coin-control/components/TableRow";

const TABLE_HEAD_VALUE_OUTPOINTS = "OutPoints";
const TABLE_HEAD_VALUE_CONFIRMATION = "Confirmation";
const TABLE_HEAD_VALUE_SPENT_BY = "Spent By";
const TABLE_HEAD_VALUE_AMOUNT = "Amount";
const Table = ({ selectAllAs, coins, setCoins, selectedCoins }) => {
  console.log("selectedCoins", selectedCoins);

  const generateDesc = (label) => {
    if (label === TABLE_HEAD_VALUE_SPENT_BY) {
      return "txid / confirmations";
    }
    if (label === TABLE_HEAD_VALUE_AMOUNT) {
      return "sats";
    }
    return " ";
  };
  const headers = [
    TABLE_HEAD_VALUE_OUTPOINTS,
    TABLE_HEAD_VALUE_AMOUNT,
    TABLE_HEAD_VALUE_CONFIRMATION,
    TABLE_HEAD_VALUE_SPENT_BY,
  ];
  return (
    <table className="main_table">
      <thead>
        <tr>
          <th />
          <th />
          {headers.map((label) => (
            <TableHead key={label} label={label} desc={generateDesc(label)} />
          ))}
        </tr>
      </thead>
      <tbody>
        {coins.map((coin, index) => (
          <TableRow
            key={index}
            coin={coin}
            index={index}
            globalSelect={selectAllAs}
            setCoins={setCoins}
            coins={coins}
          />
        ))}
      </tbody>
    </table>
  );
};
export default Table;
