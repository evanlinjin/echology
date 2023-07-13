"use client";
import React, {useEffect, useState} from "react";
import Cookies from "js-cookie";
import TableHead from "@components/TableHead";
import TableRow from "@app/coin-control/components/TableRow";
import Link from "next/link";
import {GET} from "@utils/request";


const TABLE_HEAD_VALUE_OUTPOINTS = "OutPoints";
const TABLE_HEAD_VALUE_CONFIRMATION = "Confirmation";
const TABLE_HEAD_VALUE_SPENT_BY = "Spent By";
const TABLE_HEAD_VALUE_AMOUNT = "Amount";
const Table = () => {
    const [txData, setTxData] = useState([]);
    const alias = Cookies.get('alias')


    useEffect(() => {
        GET(`${process.env.SERVER_HOST}/wallet/${alias}/coins`).then((result) => {
            const data = Object.entries(result).map(([key, value]) => {
                return value;
            });
            setTxData(data[0]);
        });
    }, []);
    const generateDesc = (label) => {
        if (label === TABLE_HEAD_VALUE_SPENT_BY) {
            return "txid / confirmations";
        }
        if (label === TABLE_HEAD_VALUE_AMOUNT) {
            return "sats";
        }
        return " ";
    };
    const headers = [TABLE_HEAD_VALUE_OUTPOINTS, TABLE_HEAD_VALUE_AMOUNT, TABLE_HEAD_VALUE_CONFIRMATION, TABLE_HEAD_VALUE_SPENT_BY]
    return (
        <div className="overflow-x-auto">
            <table className="table">
                <thead>
                <tr>
                    <th></th>
                    <th></th>
                    {headers.map((label) => (
                        <TableHead key={label} label={label} desc={generateDesc(label)}/>
                    ))}
                </tr>
                </thead>
                <tbody>
                {Object.entries(txData).map((data, index) =>
                    <TableRow key={index} data={data} index={index}/>
                )}
                </tbody>
            </table>
            <div className="w-full flex justify-end pt-12">
                <div className="flex gap-4 items-center">
          <span className="font-medium whitespace-nowrap">
            5 txos selected, totally 2600 sats
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
