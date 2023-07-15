"use client";
import { createContext, useEffect, useState } from "react";
import { getCoinsByAlias } from "@context/coins/coinActions";

const CoinContext = createContext();

export const CoinProvider = ({ children }) => {
  const [myCoins, setMyCoins] = useState([]);

  useEffect(() => {
    getCoinsByAlias().then((result) => {
      setMyCoins(result);
    });
  }, []);
  return (
    <CoinContext.Provider value={{ myCoins }}>{children}</CoinContext.Provider>
  );
};
export default CoinProvider;
