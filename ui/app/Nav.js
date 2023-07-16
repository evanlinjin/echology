"use client";
import { useCallback, useEffect, useState } from "react";
import { GET } from "@utils/request";
import { RiBitCoinLine, RiFileCopyLine } from "react-icons/ri";
import Cookies from "js-cookie";
import { SlRefresh } from "react-icons/sl";
import { CopyToClipboard } from "react-copy-to-clipboard";

const Nav = () => {
  const [headerInfo, setHeaderInfo] = useState(undefined);
  const [showCopied, setShowCopied] = useState(false);
  const address = Cookies.get("address");

  useEffect(() => {
    GET(`api/network/stats`).then((result) => {
      const data = Object.entries(result).map(([key, value]) => {
        const newKey = key.replaceAll("_", " ");
        return [`${newKey}`, value];
      });
      setHeaderInfo(data);
    });
  }, []);

  const handleGetFreeMoney = useCallback(() => {
    const amount = Math.round(Math.random() * (4200000 - 42000) + 42000);
    GET(
      `api/faucet?address=${address}&amount=${amount}`,
    ).then(() => setTimeout(window.location.reload(), 3000));
  }, []);

  const handleRefresh = useCallback(() => window.location.reload(), []);

  return (
    <div className="min-h-fit w-full flex gap-5 frame_padding border-b border-gray-700 justify-between">
      <div className="flex gap-5">
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
        <div className="h-24 flex flex-col flex-wrap gap-x-5">
          {headerInfo &&
            Array.from(headerInfo, ([key, value]) => (
              <div className="flex flex-wrap gap-3" key={key}>
                <span className="capitalize">{key}:</span>
                <span>{value}</span>
              </div>
            ))}
        </div>
      </div>
      {/*Address*/}
      {address && (
        <div className="flex flex-wrap gap-3 self-end justify-self-end items-center">
          <span className="capitalize">Address:</span>
          <span>{address}</span>

          <CopyToClipboard text={address} onCopy={() => setShowCopied(true)}>
            <div
              className={`hover:cursor-pointer item_padding ${
                showCopied && "hover:tooltip hover:tooltip-open"
              } hover:bg-gray-300`}
              data-tip="Copied!"
            >
              <RiFileCopyLine fontSize={24} />
            </div>
          </CopyToClipboard>
        </div>
      )}
    </div>
  );
};
export default Nav;
