"use client";
import { memo, useMemo } from "react";
import TableHead from "@app/coin-control/components/TableHead";
import TableRow from "@app/coin-control/components/TableRow";
import { useCoinContext } from "@app/context/coins";
import {
  TABLE_HEAD_VALUE_AMOUNT,
  TABLE_HEAD_VALUE_CONFIRMATION,
  TABLE_HEAD_VALUE_OUTPOINTS,
  TABLE_HEAD_VALUE_SPENT_BY,
} from "@utils/constants";
import BitcoinButton from "@components/BitcoinButton";

const Table = ({ selectAllAs }) => {
  const { setCoinsToView, coinsToView } = useCoinContext();

  const hasSpentCoins = useMemo(
    () => coinsToView.find((coin) => coin["spent_by"] !== null),
    [coinsToView],
  );

  const headers = [
    TABLE_HEAD_VALUE_OUTPOINTS,
    TABLE_HEAD_VALUE_AMOUNT,
    TABLE_HEAD_VALUE_CONFIRMATION,
    { ...TABLE_HEAD_VALUE_SPENT_BY, sort: hasSpentCoins },
  ];

  return (
    <table className="main_table">
      <thead>
        <tr>
          <th />
          <th />
          {headers.map((header) => (
            <TableHead
              key={header.label}
              label={header.label}
              desc={header.desc}
              sort={header.sort}
            />
          ))}
        </tr>
      </thead>
      {coinsToView.length === 0 && (
        <div className="w-full">
          no money...
          <BitcoinButton />
        </div>
      )}
      <tbody>
        {coinsToView.length > 0 &&
          coinsToView.map((coin, index) => (
            <TableRow
              key={index}
              coin={coin}
              index={index}
              globalSelect={selectAllAs}
              setCoinsToView={setCoinsToView}
              coinsToView={coinsToView}
            />
          ))}
      </tbody>
    </table>
  );
};
export default memo(Table);
