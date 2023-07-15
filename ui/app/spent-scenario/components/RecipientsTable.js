"use client";
import { useCallback, useState } from "react";
import { RiCloseFill } from "react-icons/ri";
import TableHead from "@components/TableHead";

const RecipientsTable = ({ recipients, onSetRecipients, isDone }) => {
  const [recipient, setRecipient] = useState({
    address: "",
    amount: 0,
  });

  // TODO: DELETE RECIPIENTS BY ID
  const handleDeleteRecipient = useCallback((e) => {
    // setRecipient()
  }, []);

  // TODO: CHANGE ADDRESS
  const handleChangeRecipientAddress = useCallback(
    (e) => {
      const targetIndex = e.target.id;
      const updatedRecipient = {
        address: e.target.value,
        amount: recipient.amount,
      };
      setRecipient(updatedRecipient);
      const res = recipients.map(
        (obj) =>
          [updatedRecipient].find((o) => o.address === obj.address) || obj,
      );
      onSetRecipients(res);
    },
    [recipient, recipients],
  );

  const handleChangeRecipientAmount = useCallback(
    (e) => {
      console.log("click");
      const targetIndex = e.target.id;
      const updatedRecipient = {
        address: recipient.address,
        amount: e.target.value,
      };
      setRecipient(updatedRecipient);
      const res = recipients.map(
        (obj) =>
          [updatedRecipient].find((o) => o.address === obj.address) || obj,
      );
      onSetRecipients(res);
    },
    [recipient, recipients],
  );
  return (
    <div className="w-2/3">
      <table className="main_table">
        <thead>
          <tr>
            <th></th>
            <TableHead label="Address:" />
            <TableHead label="Amount:" />
            <th></th>
          </tr>
        </thead>
        <tbody>
          {recipients.map((recipient, index) => (
            <tr className="hover" key={`recipient-${index}`}>
              <th>{index + 1}</th>
              <td>
                <input
                  key={`address-${index}`}
                  value={recipient.address}
                  type="text"
                  className="input_field"
                  onChange={handleChangeRecipientAddress}
                  disabled={isDone === true}
                />
              </td>
              <td>
                <input
                  key={`amount-${index}`}
                  value={recipient.amount}
                  type="number"
                  className="input_field"
                  onChange={handleChangeRecipientAmount}
                  disabled={isDone === true}
                />
              </td>
              <td>
                <button
                  disabled={isDone === true}
                  onClick={handleDeleteRecipient}
                  className="flex items-center justify-center hover:bg-gray-500 rounded-full hover:text-white disabled:text-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed"
                >
                  <RiCloseFill id={index} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
export default RecipientsTable;
