"use client";

import { createContext, useContext, useEffect, useState } from "react";
import Cookies from "@node_modules/js-cookie/dist/js.cookie.mjs";

const CoinContext = createContext({});

export const CoinContextProvider = ({ children }) => {
  const [alias, setAlias] = useState(undefined);
  const [address, setAddress] = useState(undefined);
  const [spentScenarioId, setSpentScenarioId] = useState(undefined);
  const [selectedCoins, setSelectedCoins] = useState(
    Cookies.get("selectedCoins") || [],
  );

  useEffect(() => {
    setAlias(Cookies.get("alias"));
    setAddress(Cookies.get("address"));
  }, []);

  useEffect(() => {
    const id =
      Cookies.get("spentScenarioId") !== "undefined"
        ? Cookies.get("spentScenarioId")
        : undefined;
    setSpentScenarioId(id);
  });

  useEffect(() => {
    setSelectedCoins(JSON.parse(Cookies.get("selectedCoins") || []));
  }, []);

  return (
    <CoinContext.Provider
      value={{ alias, setAlias, address, spentScenarioId, selectedCoins }}
    >
      {children}
    </CoinContext.Provider>
  );
};

export const useCoinContext = () => useContext(CoinContext);
