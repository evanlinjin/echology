"use client";
import "../styles/global.css";
import { memo, useState } from "react";
import { useCoinContext } from "@app/context/coins";
import { GET } from "@utils/request";
import { setCookie } from "@utils/setCookie";

const WelcomePage = () => {
  const [userInput, setUserInput] = useState("");
  const { router } = useCoinContext();
  const handleClickEnter = async () => {
    try {
      setCookie("alias", userInput);
      const result = await GET(
        `${process.env.NEXT_PUBLIC_URI}/api/wallet/${userInput}/address`,
      );
      if (result.address) {
        setCookie("address", result.address);
      }
      router.push("/coin-control");
    } catch (error) {
      console.error("An error occurred:", error);
    }
  };
  const handleChange = (e) => {
    const pattern = new RegExp("[^a-z0-9]+", "g");
    const value = e.target.value.replaceAll(pattern, "");
    setUserInput(value);
  };

  return (
    <div className="flex flex-col gap-4 h-max w-max py-8 m-8">
      <span>Type Something To Get Started:</span>
      <form onSubmit={handleClickEnter} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Type here"
          maxLength="33"
          className="input border border-gray-600 input-bordered rounded-none bg-gray-300 w-full"
          value={userInput}
          onChange={handleChange}
          pattern="[a-z0-9]"
        />
        <button
          type="submit"
          className="w-full btn btn-active rounded-none bg-black text-white"
          onClick={
            userInput
              ? handleClickEnter
              : () => window["alias_empty_warning_modal"].showModal()
          }
        >
          Enter
        </button>
      </form>
      <dialog id="alias_empty_warning_modal" className="modal">
        <form
          method="dialog"
          className="modal-box w-11/12 max-w-5xl rounded-none"
        >
          <h3 className="font-bold text-lg">Yo!</h3>
          <p className="py-4">server is down</p>
          <div className="modal-action">
            {/* if there is a button, it will close the modal */}
            <button className="main_button">Fine!</button>
          </div>
        </form>
      </dialog>
    </div>
  );
};
export default memo(WelcomePage);
