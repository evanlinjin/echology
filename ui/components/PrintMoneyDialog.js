"use client";
import { GET } from "@utils/request";
import { useCoinContext } from "@app/context/coins";
import { useCallback, useState } from "react";

const COIN_VALUE_RANGE_1 = "[1000...50,000]";
const COIN_VALUE_RANGE_2 = "[50,000..100,000]";
const COIN_VALUE_RANGE_3 = "[100,000..500,000]";
const COIN_VALUE_SELECTIONS = [
  COIN_VALUE_RANGE_1,
  COIN_VALUE_RANGE_2,
  COIN_VALUE_RANGE_3,
];
const PrintMoneyDialog = () => {
  const { address } = useCoinContext();
  const [SelectedCoinValueRange, setSelectedCoinValueRange] =
    useState(COIN_VALUE_RANGE_1);
  const [SelectedCoinCounts, setSelectedCoinCounts] = useState(5);
  console.log("SelectedCoinCounts", SelectedCoinCounts);
  console.log("SelectedCoinValueRange", SelectedCoinValueRange);
  const handleGetFreeMoney = useCallback(
    async (amount) => {
      try {
        await GET(
          `http://localhost:8080/api/faucet?address=${address}&amount=${amount}`,
        );
        // setTimeout(() => window?.location.reload(), 3000);
      } catch (error) {
        console.error("An error occurred:", error);
        // Handle the error (show an error message, etc.)
      }
    },
    [address],
  );

  return (
    <>
      <input type="checkbox" id="free_money_dialog" className="modal-toggle" />
      <div className="modal">
        <div className="modal-box max-w-4xl  bg-white rounded-none">
          <h3 className="text-lg font-bold">Print Money</h3>
          <p className="py-4">Please select the amount you want:</p>
          <div className="flex flex-col gap-6 w-full">
            <div className="grid grid-cols-3 gap-4 w-full">
              {COIN_VALUE_SELECTIONS.map((option) => (
                <button
                  key={option}
                  className={`btn rounded-none bg-grey-200 ${
                    option === SelectedCoinValueRange &&
                    "bg-black text-white hover:bg-black hover:text-white"
                  }`}
                  onClick={() => setSelectedCoinValueRange(option)}
                >
                  {option}
                </button>
              ))}
            </div>
            <div className="flex gap-4">
              <ul className="flex justify-around w-full rating">
                {Array.from({ length: 10 }, (_, i) => (
                  <li key={`rating-${i + 1}`}>
                    <input
                      id={`num${i + 1}`}
                      type="radio"
                      onChange={() => setSelectedCoinCounts(i + 1)}
                      checked={SelectedCoinCounts === i + 1}
                      className="mask mask-square bg-green-400"
                    />
                    <label htmlFor={`num${i + 1}`}>{i + 1}</label>
                  </li>
                ))}
              </ul>
            </div>
            <button className="main_button" onClick={handleGetFreeMoney}>
              Print
            </button>
          </div>
        </div>
        <label className="modal-backdrop" htmlFor="free_money_dialog">
          Close
        </label>
      </div>
    </>
  );
};

export default PrintMoneyDialog;
