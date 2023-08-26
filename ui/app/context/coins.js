"use client";
import { createContext, useContext, useEffect, useState } from "react";
import Cookies from "@node_modules/js-cookie/dist/js.cookie.mjs";
import { useRouter } from "next/navigation";

const CoinContext = createContext({});

export const CoinContextProvider = ({ children }) => {
  const [address, setAddress] = useState(undefined);

  const [coins, setCoins] = useState([]);
  const [coinsToView, setCoinsToView] = useState(coins);

  const [selectedAmount, setSelectedAmount] = useState(0);
  const [selectedCoins, setSelectedCoins] = useState([]);

  const [spentScenarioId, setSpentScenarioId] = useState(undefined);

  const [errorMessage, setErrorMessage] = useState(undefined);
  const router = useRouter();

  useEffect(() => {
    setAddress(Cookies.get("address"));
  }, []);

  useEffect(() => {
    setSelectedAmount(Cookies.get("selectedAmount"));
  }, []);

  useEffect(() => {
    const id = Cookies.get("spentScenarioId")
      ? Cookies.get("spentScenarioId")
      : undefined;
    setSpentScenarioId(id);
  }, [setSpentScenarioId]);

  useEffect(() => {
    const selectedCoins = Cookies.get("selectedCoins")
      ? JSON.parse(Cookies.get("selectedCoins"))
      : [];
    setSelectedCoins(selectedCoins);
  }, [setSelectedCoins]);

  return (
    <CoinContext.Provider
      value={{
        address,
        coins,
        coinsToView,
        router,
        selectedAmount,
        selectedCoins,
        setAddress,
        setCoins,
        setCoinsToView,
        setSelectedAmount,
        setSelectedCoins,
        spentScenarioId,
        setErrorMessage,
        errorMessage,
      }}
    >
      {children}
    </CoinContext.Provider>
  );
};

export const useCoinContext = () => useContext(CoinContext);
