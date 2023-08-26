"use client";
import { useCallback, useEffect, useState } from "react";
import { GET } from "@utils/request";
import { RiBitCoinLine } from "react-icons/ri";
import { SlRefresh } from "react-icons/sl";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { useCoinContext } from "@app/context/coins";
import PrintMoneyDialog from "@components/PrintMoneyDialog";
import Copy from "@components/Copy";

const Nav = () => {
  const [headerInfo, setHeaderInfo] = useState(undefined);
  const [showCopied, setShowCopied] = useState(false);
  const { address } = useCoinContext();

  useEffect(() => {
    GET("http://localhost:8080/api/network/stats").then((result) => {
      const data = Object.entries(result).map(([key, value]) => {
        const newKey = key.replaceAll("_", " ");
        return [`${newKey}`, value];
      });
      setHeaderInfo(data);
    });
  }, []);

  const handleRefresh = useCallback(() => window.location.reload(), []);
  console.log("address", address);
  return (
    <>
      <div className="min-h-fit w-full flex gap-5 frame_padding border-b border-gray-700 justify-between">
        <div className="flex gap-5">
          <div className="tooltip tooltip-bottom" data-tip="Get Free Money">
            <div className="avatar">
              <label
                htmlFor="free_money_dialog"
                className="btn nav_button_square"
              >
                <RiBitCoinLine fontSize={56} />
              </label>
            </div>
          </div>
          <div className="tooltip tooltip-bottom" data-tip="Refresh">
            <div className="avatar">
              <button className="btn nav_button_square" onClick={handleRefresh}>
                <SlRefresh fontSize={56} />
              </button>
            </div>
          </div>
          <div className="min-h-[70px] flex flex-col flex-wrap gap-x-5">
            {headerInfo &&
              Array.from(headerInfo, ([key, value]) => (
                <div className="flex flex-wrap gap-3" key={key}>
                  <span className="capitalize">{key}:</span>
                  <span>{value}</span>
                </div>
              ))}
          </div>
        </div>
        {address && (
          <div className="flex flex-wrap self-start items-center">
            <span className="capitalize">Address:</span>
            <Copy content={address} />
          </div>
        )}
      </div>
      <PrintMoneyDialog />
    </>
  );
};
export default Nav;
