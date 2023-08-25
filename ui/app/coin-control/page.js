"use client";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import Table from "@app/coin-control/components/Table";
import { convertSelectedValue } from "@app/coin-control/components/converter";
import Link from "next/link";
import { setCookie } from "@app/page";
import { useCoinContext } from "@app/context/coins";
import { GET } from "@utils/request";

export const COIN_SELECT_OPTION_CANDIDATE = "candidate";
export const COIN_SELECT_OPTION_IGNORED = "ignored";
export const COIN_SELECT_OPTION_MUST_SPEND = "must spend";

const CoinControl = () => {
  const { coins, setCoins, alias, setCoinsToView } = useCoinContext();
  const [selectAllAs, setSelectAllTo] = useState(undefined);
  const [selectedCoins, setSelectedCoins] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    GET(`http://localhost:8080/api/wallet/${alias}/coins`).then((result) => {
      const data = result.coins;
      const coinsWithSelection = data.map((coin) => {
        return { ...coin, must_select: undefined };
      });
      setCoins([...coinsWithSelection]);
      setCoinsToView([...coinsWithSelection]);
    });
  }, []);

  useEffect(() => {
    const filteredCoins = coins
      .filter((coin) => coin.must_select !== undefined)
      .filter((coin) => coin.must_select !== null);
    setSelectedCoins(filteredCoins);
  }, [coins]);

  useEffect(() => {
    if (selectedCoins.length === 0) {
      setTotalAmount(0);
    }
    const total = selectedCoins.reduce(function (acc, obj) {
      return acc + obj.amount;
    }, 0);

    setTotalAmount(total);
  }, [selectedCoins, coins]);

  const handleSelectAllAs = useCallback(
    (value) => {
      const selectedValue = convertSelectedValue(value);
      const newCoins = coins.map((coin) => {
        return { ...coin, must_select: selectedValue };
      });
      setCoins(newCoins);
      setSelectAllTo(selectedValue);
    },
    [coins],
  );

  const handleClearAllSelection = useCallback(() => {
    const deselectedCoins = coins.map((coin) => {
      return { ...coin, must_select: null };
    });
    setCoins(deselectedCoins);
    setSelectAllTo(null);
  }, [coins]);

  const hasAtLeastOneSelected = useMemo(() => {
    const result = coins.map((coin) => {
      const { must_select } = coin;
      if (must_select !== undefined) {
        return 1;
      }
      return 0;
    });
    return result.find((select) => select === 1) || 0;
  }, [coins]);

  const handleClickCreateTx = async () => {
    setCookie("selectedCoins", JSON.stringify(selectedCoins));
    setCookie("totalAmount", JSON.stringify(totalAmount));
  };

  return (
    <div className="frame_padding flex flex-col gap-8">
      <div className="flex justify-between w-full items-end ">
        <div className="page_title">Coin Control</div>
        <div className="flex gap-10">
          <button
            className="main_button"
            onClick={handleClearAllSelection}
            disabled={hasAtLeastOneSelected === 0}
          >
            Ignore All
          </button>
          <div className="main_button" onClick={() => handleSelectAllAs("0")}>
            Select all UTXOs as{" "}
            <strong className="capitalize">
              {COIN_SELECT_OPTION_CANDIDATE}
            </strong>
          </div>
        </div>
      </div>
      <Table
        selectAllAs={selectAllAs}
        selectedCoins={selectedCoins}
        hasAtLeastOneSelected={hasAtLeastOneSelected}
      />
      <div className="w-full flex justify-end pt-8">
        <div className="flex gap-4 items-center">
          <span className="font-medium whitespace-nowrap">
            <span className="input_field">{selectedCoins.length}</span> txos
            selected, total <span className="input_field">{totalAmount}</span>{" "}
            sats
          </span>
          <Link
            href={"/spent-scenario"}
            className="w-full"
            onClick={handleClickCreateTx}
          >
            <button
              className="main_button"
              disabled={hasAtLeastOneSelected === 0}
            >
              next create tx &gt;
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};
export default memo(CoinControl);
