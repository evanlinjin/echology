"use client";
import React, { useEffect, useState } from "react";
import TableHead from "@components/TableHead";
import TableRow from "@app/coin-control/components/TableRow";
import Link from "next/link";

const TABLE_HEAD_VALUE_OUTPOINTS = "OutPoints";
const TABLE_HEAD_VALUE_CONFIRMATION = "Confirmation";
const TABLE_HEAD_VALUE_SPENT_BY = "Spent By";
const TABLE_HEAD_VALUE_AMOUNT = "Amount";
const Table = ({ selectAllAs, coins, setCoins, selectedCoins }) => {
  const [totalAmount, setTotalAmount] = useState(0);
  console.log("selectedCoins", selectedCoins);

  useEffect(() => {
    if (selectedCoins.length === 0) {
      setTotalAmount(0);
    }
    const total = selectedCoins.reduce(function (acc, obj) {
      return acc + obj.amount;
    }, 0);

    setTotalAmount(total);
  }, [selectedCoins, coins]);
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
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th></th>
            <th></th>
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
              // setSelectedCoins={setSelectedCoins}
              setCoins={setCoins}
              coins={coins}
            />
          ))}
        </tbody>
      </table>
      <div className="w-full flex justify-end pt-12">
        <div className="flex gap-4 items-center">
          <span className="font-medium whitespace-nowrap">
            {selectedCoins.length} txos selected, totally {totalAmount} sats
          </span>
          <Link href="/spent-scenario" className="w-full">
            <button className="main_button">next create tx &gt; </button>
          </Link>
        </div>
      </div>
    </div>
  );
};
export default Table;
