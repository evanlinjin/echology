"use client";
import "../styles/global.css";

import Link from "next/link";
import { useState } from "react";
import Cookies from "js-cookie";
import { GET } from "@utils/request";

export function setCookie(name, value, expires) {
  if (expires) {
    return Cookies.set(name, value, { expires });
  }
  return Cookies.set(name, value);
}

const WelcomePage = () => {
  const [alias, setAlias] = useState(null);

  const handleChange = (e) => {
    const pattern = new RegExp("[^a-z0-9]+", "g");
    const value = e.target.value.replaceAll(pattern, "");
    setAlias(value);
  };

  const handleClickEnter = async () => {
    if (!alias) {
      window.my_modal_4.showModal();
    }
    setCookie("alias", alias);
    GET(`${process.env.SERVER_HOST}/wallet/${alias}/address`).then((result) =>
      setCookie("address", result.address),
    );
  };
  return (
    <div className="flex flex-col gap-4 h-max w-max py-8 mx-8 my-8 mx-8">
      <span>Type Something To Get Started:</span>
      <input
        type="text"
        placeholder="Type here"
        maxLength="33"
        className="input border border-gray-600 input-bordered rounded-none bg-gray-300 w-full"
        value={alias}
        onChange={handleChange}
        pattern="[a-z0-9]"
      />

      <Link
        href={alias ? "/coin-control " : "/"}
        className="w-full"
        onClick={handleClickEnter}
      >
        <button
          type="button"
          className="w-full btn btn-active rounded-none bg-black text-white"
        >
          Enter
        </button>
      </Link>
      <dialog id="my_modal_4" className="modal">
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
export default WelcomePage;
