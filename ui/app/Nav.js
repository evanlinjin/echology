"use client";
import { useCallback, useEffect, useState } from "react";
import { API_ROOT, GET } from "@utils/request";
import { RiBitCoinLine } from "react-icons/ri";
import Cookies from "js-cookie";
import { SlRefresh } from "react-icons/sl";

const Nav = () => {
  const [headerInfo, setHeaderInfo] = useState(undefined);

  useEffect(() => {
    GET(`http://localhost:8080/api/network/stats`).then((result) => {
      const data = Object.entries(result).map(([key, value]) => {
        const newKey = key.replaceAll("_", " ");
        return [`${newKey}`, value];
      });
      setHeaderInfo(data);
    });
  }, []);

  const handleGetFreeMoney = useCallback(() => {
    const amount = Math.round(Math.random() * (4200000 - 42000) + 42000);
    const address = Cookies.get("address");
    GET(
      `http://localhost:8080/api/faucet?address=${address}&amount=${amount}`,
    ).then((r) => setTimeout(window.location.reload(), 3000));
  }, []);

  const handleRefresh = useCallback(() => window.location.reload(), []);

  return (
    <div className="min-h-fit w-full flex gap-5 frame_padding border-b border-gray-700">
      <div className="avatar">
        <div className="w-24 rounded-none">
          <img src="/assets/images/avatar.jpg" alt="QR_code" />
        </div>
      </div>
      <div className="tooltip tooltip-bottom" data-tip="Get Free Money">
        <div className="avatar">
          <button onClick={handleGetFreeMoney} className="nav_button_square">
            <RiBitCoinLine fontSize={56} />
          </button>
        </div>
      </div>
      <div className="tooltip tooltip-bottom" data-tip="Refresh">
        <div className="avatar">
          <button className="nav_button_square " onClick={handleRefresh}>
            <SlRefresh fontSize={56} />
          </button>
        </div>
      </div>
      <div className=" h-24 flex flex-col flex-wrap gap-x-5">
        {headerInfo &&
          Array.from(headerInfo, ([key, value]) => (
            <div className="flex flex-wrap gap-3" key={key}>
              <span className="capitalize">{key}:</span>
              <span>{value}</span>
            </div>
          ))}
      </div>
    </div>
  );
};
export default Nav;
