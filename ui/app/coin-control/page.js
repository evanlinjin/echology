"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import SelectionDropdown from "@components/SelectionDropdown";
import Table from "@app/coin-control/components/Table";
import { API_ROOT, GET } from "@utils/request";
import { convertSelectedValue } from "@app/coin-control/components/converter";
import Cookies from "js-cookie";
import Link from "next/link";
import { setCookie } from "@app/page";

const CoinControl = () => {
  const [selectAllAs, setSelectAllTo] = useState(undefined);
  const [selectedCoins, setSelectedCoins] = useState([]);
  const [myCoins, setMyCoins] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);

  const alias = Cookies.get("alias");

  useEffect(() => {
    GET(`api/wallet/${alias}/coins`).then((result) => {
      const data = result.coins;
      const coinsWithSelection = data.map((coin) => {
        return { ...coin, must_select: undefined };
      });
      setMyCoins(coinsWithSelection);
    });
  }, []);

  useEffect(() => {
    const filteredCoins = myCoins
      .filter((coin) => coin.must_select !== undefined)
      .filter((coin) => coin.must_select !== null);
    setSelectedCoins(filteredCoins);
  }, [myCoins]);

  useEffect(() => {
    if (selectedCoins.length === 0) {
      setTotalAmount(0);
    }
    const total = selectedCoins.reduce(function (acc, obj) {
      return acc + obj.amount;
    }, 0);

    setTotalAmount(total);
  }, [selectedCoins, myCoins]);

  const handleSelectAllAs = useCallback(
    (e) => {
      const selectedValue = convertSelectedValue(e.target.value);
      const newCoins = myCoins.map((coin) => {
        return { ...coin, must_select: selectedValue };
      });
      setMyCoins(newCoins);
      setSelectAllTo(selectedValue);
    },
    [myCoins],
  );

  const handleClearAllSelection = useCallback(() => {
    const deselectedCoins = myCoins.map((coin) => {
      return { ...coin, must_select: undefined };
    });
    setMyCoins(deselectedCoins);
    setSelectAllTo(undefined);
  }, [myCoins]);

  const hasAtLeastOneSelected = useMemo(() => {
    const result = myCoins.map((coin) => {
      const { must_select } = coin;
      if (must_select !== undefined && must_select !== null) {
        return 1;
      }
      return 0;
    });
    return result.find((select) => select === 1) || 0;
  }, [myCoins]);

  const handleClickCreateTx = async () => {
    setCookie("selectedCoins", JSON.stringify(selectedCoins));
    setCookie("totalAmount", JSON.stringify(totalAmount));
  };

  return (
    <div className="frame_padding flex flex-col gap-8">
      <div className="flex justify-between w-full items-end ">
        <div className="page_title">Coin Control</div>
        <div className="flex flex gap-10">
          <button
            className="main_button disabled:cursor-not-allowed disabled:text-gray-500"
            onClick={handleClearAllSelection}
            disabled={hasAtLeastOneSelected === 0}
          >
            Clear Selection
          </button>
          <div className="flex gap-3 items-center">
            <span>Select all as</span>
            <SelectionDropdown
              onGlobalSelect={handleSelectAllAs}
              selected={selectAllAs}
            />
          </div>
        </div>
      </div>
      <Table
        selectAllAs={selectAllAs}
        coins={myCoins}
        setCoins={setMyCoins}
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
            href="/spent-scenario"
            className="w-full"
            onClick={handleClickCreateTx}
          >
            <button
              className="main_button disabled:cursor-not-allowed disabled:text-gray-500"
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
export default CoinControl;
