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
    GET("http://localhost:8080/api/network/stats").then((result) => {
      const data = Object.entries(result).map(([key, value]) => {
        const newKey = key.replaceAll("_", " ");
        return [`${newKey}`, value];
      });
      setHeaderInfo(data);
    });
  }, []);

  const handleGetFreeMoney = useCallback((amount) => {
    GET(
      `http://localhost:8080/api/faucet?address=${address}&amount=${amount}`,
    ).then(() => setTimeout(window.location.reload(), 3000));
  }, []);

  const handleRefresh = useCallback(() => window.location.reload(), []);

  return (
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
      <div>
        <input
          type="checkbox"
          id="free_money_dialog"
          className="modal-toggle"
        />
        <div className="modal">
          <div className="modal-box rounded-none">
            <h3 className="text-lg font-bold">Get Free Money!</h3>
            <p className="py-4">Please select the amount you want:</p>
            <div className="flex gap-4">
              <button
                className="black_button w-full"
                onClick={() => handleGetFreeMoney(1000)}
              >
                1000
              </button>
              <button
                className="black_button w-full"
                onClick={() => handleGetFreeMoney(2000)}
              >
                2000
              </button>
              <button
                className="black_button w-full"
                onClick={() => handleGetFreeMoney(3000)}
              >
                3000
              </button>
              <button
                className="black_button w-full"
                onClick={() => handleGetFreeMoney(4000)}
              >
                4000
              </button>
            </div>
          </div>
          <label className="modal-backdrop" htmlFor="free_money_dialog">
            Close
          </label>
        </div>
      </div>
    </div>
  );
};
export default Nav;
