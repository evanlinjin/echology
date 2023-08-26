"use client";
import { RiSortAsc, RiSortDesc } from "react-icons/ri";
import { memo, useCallback, useState } from "react";
import {
  SORT_BY_ASC,
  SORT_BY_DESC,
  TABLE_HEAD_VALUE_AMOUNT,
  TABLE_HEAD_VALUE_OUTPOINTS,
  TABLE_HEAD_VALUE_SPENT_BY,
} from "@app/coin-control/components/Table";
import { useCoinContext } from "@app/context/coins";
import TableHead from "@components/TableHead";

const Index = ({ label, desc, sort }) => {
  const { coins, setCoinsToView, coinsToView } = useCoinContext();
  const [sortBy, setSortBy] = useState(SORT_BY_ASC);

  const handleSortByAmount = useCallback(
    (sortBy) => {
      if (sortBy === SORT_BY_ASC) {
        const result = [...coins].sort((a, b) => b.amount - a.amount);
        setCoinsToView(result);
      }
      if (sortBy === SORT_BY_DESC) {
        const result = [...coins].sort((a, b) => a.amount - b.amount);
        setCoinsToView(result);
      }
    },
    [setCoinsToView, coins],
  );

  const handleSortBySpentId = useCallback((sortBy) => {
    let spentCoins = [];
    let unspentCoins = [];
    coins.forEach((coin) => {
      const { spent_by } = coin;
      if (!spent_by) {
        unspentCoins.push({ ...coin, must_select: false });
      } else {
        spentCoins.push({ ...coin, must_select: null });
      }
    });
    const sortedSpentCoins = spentCoins.sort((a, b) => {
      const txidA = a.spent_by ? a.spent_by.txid : "";
      const txidB = b.spent_by ? b.spent_by.txid : "";

      if (sortBy === SORT_BY_ASC) {
        return txidA.localeCompare(txidB);
      }
      if (sortBy === SORT_BY_DESC) {
        return txidB.localeCompare(txidA);
      }
    });
    setCoinsToView([...unspentCoins, ...sortedSpentCoins]);
  }, []);

  let handleSort;
  switch (label) {
    case TABLE_HEAD_VALUE_OUTPOINTS:
      handleSort = "";
      break;
    case TABLE_HEAD_VALUE_SPENT_BY:
      handleSort = handleSortBySpentId;
      break;
    case TABLE_HEAD_VALUE_AMOUNT:
      handleSort = handleSortByAmount;
      break;
    default:
  }

  return (
    <TableHead
      label={label}
      desc={desc}
      sort={
        <button
          onClick={() => {
            handleSort(sortBy === SORT_BY_ASC ? SORT_BY_DESC : SORT_BY_ASC);
            setSortBy(sortBy === SORT_BY_ASC ? SORT_BY_DESC : SORT_BY_ASC);
          }}
        >
          {sortBy === SORT_BY_ASC ? <RiSortDesc /> : <RiSortAsc />}
        </button>
      }
    ></TableHead>
  );
};
export default memo(Index);
