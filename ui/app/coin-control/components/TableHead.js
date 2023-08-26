"use client";
import { RiSortAsc, RiSortDesc } from "react-icons/ri";
import { memo, useCallback, useState } from "react";

import { useCoinContext } from "@app/context/coins";
import TableHead from "@components/TableHead";
import {
  SORT_BY_ASC,
  SORT_BY_DESC,
  TABLE_HEAD_VALUE_AMOUNT,
  TABLE_HEAD_VALUE_OUTPOINTS,
  TABLE_HEAD_VALUE_SPENT_BY,
} from "@utils/constants";

const Index = ({ label, desc, sort }) => {
  const { coins, setCoinsToView, coinsToView } = useCoinContext();
  const [sortByAsc, setSortByAsc] = useState(true);

  const handleSortOutPoints = useCallback(() => {
    const result = coinsToView.sort((a, b) => {
      const op1 = a["outpoint"];
      const op2 = b["outpoint"];
      if (sortByAsc) {
        return op1.localeCompare(op2);
      } else {
        return op2.localeCompare(op1);
      }
    });
    setCoinsToView([...result]);
  }, [setCoinsToView, coins, sortByAsc]);

  const handleSortByAmount = useCallback(() => {
    const result = coinsToView.sort((a, b) => {
      if (sortByAsc) {
        return a.amount - b.amount;
      } else {
        return b.amount - a.amount;
      }
    });
    setCoinsToView([...result]);
  }, [setCoinsToView, coinsToView, sortByAsc]);

  const handleSortBySpentId = useCallback(() => {
    let spentCoins = [];
    let unspentCoins = [];
    coinsToView.forEach((coin) => {
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

      if (sortByAsc) {
        return txidA.localeCompare(txidB);
      } else {
        return txidB.localeCompare(txidA);
      }
    });
    setCoinsToView([...unspentCoins, ...sortedSpentCoins]);
  }, []);

  const handleSort = () => {
    switch (label) {
      case TABLE_HEAD_VALUE_OUTPOINTS.label:
        handleSortOutPoints();
        break;
      case TABLE_HEAD_VALUE_SPENT_BY.label:
        handleSortBySpentId();
        break;
      case TABLE_HEAD_VALUE_AMOUNT.label:
        handleSortByAmount();
        return;
      default:
    }
  };
  return (
    <TableHead
      label={label}
      desc={desc}
      sort={
        sort && (
          <button
            onClick={() => {
              setSortByAsc((prev) => !prev);
              handleSort(sortByAsc);
            }}
          >
            {sortByAsc ? <RiSortDesc /> : <RiSortAsc />}
          </button>
        )
      }
    ></TableHead>
  );
};
export default memo(Index);
