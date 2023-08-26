"use client";
import { memo } from "react";
import TableHead from "@app/coin-control/components/TableHead";
import TableRow from "@app/coin-control/components/TableRow";
import { useCoinContext } from "@app/context/coins";
import {
  TABLE_HEAD_VALUE_AMOUNT,
  TABLE_HEAD_VALUE_CONFIRMATION,
  TABLE_HEAD_VALUE_OUTPOINTS,
  TABLE_HEAD_VALUE_SPENT_BY,
} from "@utils/constants";
import { RiBitCoinLine } from "react-icons/ri";
import { useMemo } from "react";

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
          <div className="avatar">
            <label
              htmlFor="free_money_dialog"
              className="btn nav_button_square"
            >
              <RiBitCoinLine fontSize={56} />
            </label>
          </div>
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
