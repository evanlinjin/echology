"use client";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import Table from "@app/coin-control/components/Table";
import { convertSelectedValue } from "@app/coin-control/components/converter";
import { useCoinContext } from "@app/context/coins";
import { GET } from "@utils/request";
import { setCookie } from "@utils/setCookie";
import Cookies from "@node_modules/js-cookie/dist/js.cookie.mjs";
import BitcoinButton from "@components/BitcoinButton";

export const COIN_SELECT_OPTION_CANDIDATE = "candidate";
export const COIN_SELECT_OPTION_IGNORED = "ignored";
export const COIN_SELECT_OPTION_MUST_SPEND = "must spend";

const CoinControl = () => {
  const {
    coins,
    setCoins,
    alias,
    setCoinsToView,
    coinsToView,
    router,
    selectedAmount,
    setSelectedAmount,
    selectedCoins,
    setSelectedCoins,
  } = useCoinContext();

  const [selectAllAs, setSelectAllTo] = useState(undefined);

  useEffect(() => {
    GET(`${process.env.NEXT_PUBLIC_URI}/api/wallet/${Cookies.get("alias")}/coins`).then(
      (result) => {
        const data = result.coins;
        let spentCoins = [];
        let unspentCoins = [];
        const coinsWithSelection = data.map((coin) => ({
          ...coin,
          must_select: undefined,
        }));
        setCoins(coinsWithSelection);

        data.forEach((coin) => {
          const { spent_by } = coin;
          if (!spent_by) {
            unspentCoins.push({ ...coin, must_select: false });
          } else {
            spentCoins.push({ ...coin, must_select: null });
          }
        });
        const sortedSpentCoins = spentCoins.sort((a, b) => {
          const txidA = a["spent_by"] ? a["spent_by"]["txid"] : "";
          const txidB = b["spent_by"] ? b["spent_by"]["txid"] : "";
          return txidA.localeCompare(txidB);
        });
        setCoins([...coinsWithSelection]);
        setCoinsToView([...unspentCoins, ...sortedSpentCoins]);
      },
    );
  }, [setCoinsToView, setCoins, alias]);

  useEffect(() => {
    const filteredCoins = coinsToView
      .filter((coin) => coin.must_select !== undefined)
      .filter((coin) => coin.must_select !== null);
    setSelectedCoins(filteredCoins);
  }, [setSelectedCoins, coinsToView]);

  useEffect(() => {
    if (selectedCoins.length === 0) {
      setSelectedAmount(0);
    }
    const total = selectedCoins.reduce(function (acc, obj) {
      return acc + obj.amount;
    }, 0);

    setSelectedAmount(total);
  }, [selectedCoins, selectedCoins]);

  const handleSelectAllAsCandidate = useCallback(
    (value) => {
      const selectedValue = convertSelectedValue(value);
      const newCoins = coinsToView.map((coin) => {
        const { spent_by } = coin;
        if (spent_by) {
          return coin;
        } else {
          return { ...coin, must_select: false };
        }
      });
      setCoinsToView(newCoins);
      setSelectAllTo(selectedValue);
    },
    [coinsToView],
  );

  const handleClearAllSelection = useCallback(() => {
    const deselectedCoins = coinsToView.map((coin) => {
      return { ...coin, must_select: null };
    });
    setCoinsToView(deselectedCoins);
    setSelectAllTo(null);
  }, [coins]);

  const hasAtLeastOneSelected = useMemo(() => {
    if (!coinsToView) return 0;
    const result = coinsToView.map((coin) => {
      const { must_select } = coin;
      if (must_select !== undefined) {
        return 1;
      }
      return 0;
    });
    return result.find((select) => select === 1) || 0;
  }, [coinsToView]);

  const handleClickCreateTx = async () => {
    setCookie("selectedCoins", JSON.stringify(selectedCoins));
    setCookie("selectedAmount", JSON.stringify(selectedAmount));
  };
  const hasCoins = coinsToView && coinsToView.length > 0;

  return (
    <div className="frame_padding flex flex-col h-full gap-8">
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
          <button
            disabled={coinsToView.length === 0}
            className="main_button"
            onClick={() => handleSelectAllAsCandidate("0")}
          >
            Select all UTXOs as{" "}
            <strong className="capitalize">
              {COIN_SELECT_OPTION_CANDIDATE}
            </strong>
          </button>
        </div>
      </div>
      {hasCoins ? (
        <Table
          selectAllAs={selectAllAs}
          selectedCoins={selectedCoins}
          hasAtLeastOneSelected={hasAtLeastOneSelected}
          setCoinsToView={setCoinsToView}
        />
      ) : (
        <div className="w-full text-center h-full grid place-items-center">
          <div className="flex flex-col gap-5">
            <span>no money yet...</span>
            <div className="flex flex-col items-center gap-3">
              <BitcoinButton />
              <span>click to print</span>
            </div>
          </div>
        </div>
      )}
      <div className="w-full flex justify-end pt-8">
        <div className="flex gap-4 items-center">
          <span className="font-medium whitespace-nowrap">
            <span className="input_field">{selectedCoins.length}</span> txos
            selected, total{" "}
            <span className="input_field">{selectedAmount}</span> sats
          </span>
          <button
            className="main_button"
            disabled={hasAtLeastOneSelected === 0}
            onClick={() =>
              handleClickCreateTx().then(router.push("/spent-scenario"))
            }
          >
            next create tx &gt;
          </button>
        </div>
      </div>
    </div>
  );
};
export default memo(CoinControl);
