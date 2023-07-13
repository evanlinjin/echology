"use client";
import { useCallback, useState } from "react";
import Table from "@app/spent-scenario/components/Table";
import { RiAddFill } from "react-icons/ri";

const Page = () => {
  const [recipients, setRecipients] = useState([{ address: "", amount: "" }]);

  const addRecipientsClick = useCallback(() => {
    setRecipients((prev) => [...prev, { address: "", amount: "" }]);
  }, []);
  return (
    <div className="w-full page_padding flex gap-8 flex-col">
      <div className="page_title">Create Spent Scenarios:</div>
      <div className="section">
        <div className="section_title">Candidates:</div>
        <div className="section_desc">5 txos selected, totally 2600 sats</div>
      </div>
      <div className="section">
        <div className="section_title">Parameters:</div>
        <div className="border rounded-none border flex-col border-black item_padding flex gap-4">
          <div className="flex gap-4 items-center">
            <span>Recipient:</span>
            <button className="icon_button" onClick={addRecipientsClick}>
              <RiAddFill className=" hover:text-h5" />
            </button>
          </div>
          <Table recipients={recipients} onSetRecipients={setRecipients} />
        </div>
      </div>
    </div>
  );
};
export default Page;
