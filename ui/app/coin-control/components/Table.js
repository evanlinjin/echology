"use client";
import { memo, useCallback } from "react";
import TableHead from "@components/TableHead";
import TableRow from "@app/coin-control/components/TableRow";
import { useCoinContext } from "@app/context/coins";

export const TABLE_HEAD_VALUE_OUTPOINTS = "OutPoints";
export const TABLE_HEAD_VALUE_CONFIRMATION = "Confirmation";
export const TABLE_HEAD_VALUE_SPENT_BY = "Spent By";
export const TABLE_HEAD_VALUE_AMOUNT = "Amount";
export const SORT_BY_DESC = "desc";
export const SORT_BY_ASC = "asc";
const Table = ({ selectAllAs }) => {
  const { coins, setCoinsToView, coinsToView } = useCoinContext();

  const generateDesc = useCallback((label) => {
    if (label === TABLE_HEAD_VALUE_SPENT_BY) {
      return "txid / confirmations";
    }
    if (label === TABLE_HEAD_VALUE_AMOUNT) {
      return "sats";
    }
    return undefined;
  }, []);

  // const handleSortByAmount = useCallback(
  //   (sortBy) => {
  //     if (sortBy === SORT_BY_ASC) {
  //       const result = [...coins].sort((a, b) => b.amount - a.amount);
  //       setCoinsToView(result);
  //     }
  //     if (sortBy === SORT_BY_DESC) {
  //       const result = [...coins].sort((a, b) => a.amount - b.amount);
  //       setCoinsToView(result);
  //     }
  //   },
  //   [setCoinsToView, coins],
  // );

  // const handleSortBySpentId = useCallback(() => {
  //   let spentCoins = [];
  //   let unspentCoins = [];
  //   coins.forEach((coin) => {
  //     const { spent_by } = coin;
  //     if (!spent_by) {
  //       unspentCoins.push({ ...coin, must_select: false });
  //     } else {
  //       spentCoins.push({ ...coin, must_select: null });
  //     }
  //   });
  //   const sortedSpentCoins = spentCoins.sort((a, b) => {
  //     const txidA = a.spent_by ? a.spent_by.txid : "";
  //     const txidB = b.spent_by ? b.spent_by.txid : "";
  //     return txidA.localeCompare(txidB);
  //   });
  //   setCoinsToView([...unspentCoins, ...sortedSpentCoins]);
  // }, []);
  const handleSortByPutPoints = useCallback(() => {}, []);

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
            <TableHead
              key={label}
              label={label}
              desc={generateDesc(label)}
              sort={label === TABLE_HEAD_VALUE_AMOUNT}
            />
          ))}
        </tr>
      </thead>
      <tbody>
        {coinsToView.map((coin, index) => (
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
