"use client";
import { useCoinContext } from "@app/context/coins";
import { memo } from "react";

const ErrorDialog = () => {
  const { errorMessage, setErrorMessage } = useCoinContext();
  return (
    <div className={`relative ${!errorMessage && "hidden"}`}>
      <input
        type="checkbox"
        id="my_modal_7"
        className="modal-toggle"
        checked={errorMessage}
      />
      <div className="modal">
        <form
          method="dialog"
          className="modal-box rounded-none border-4 border-red-500"
        >
          <label
            onClick={() => setErrorMessage(undefined)}
            htmlFor="my_modal_7"
            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          >
            ✕
          </label>
          <h3 className="font-bold text-lg">Error!</h3>
          <p className="py-4">{errorMessage}</p>
        </form>
      </div>
    </div>
  );
};

export default memo(ErrorDialog);
