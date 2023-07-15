"use client";
import { useCallback, useState } from "react";
import { RiCloseFill } from "react-icons/ri";
import TableHead from "@components/TableHead";

const RecipientsTable = ({ recipients, onSetRecipients }) => {
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
      const pattern = new RegExp("[^a-z0-9]+", "g");
      const targetIndex = e.target.id;
      setRecipient({ ...recipient, address: e.target.value });
    },
    [recipient],
  );

  //TODO: CHANGE AMOUNT
  const handleChangeRecipientAmount = useCallback(
    (e) => {
      const targetIndex = e.target.id;
      const updatedAmount = e.target.value;
      const target = recipient[targetIndex];
      const recipientsCopy = recipient.slice(e.target.id, 1, {
        ...target,
        amount: updatedAmount,
      });
      setRecipient({ ...recipient, amount: e.target.value });
    },
    [recipient],
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
                  id={index}
                  value={recipient.address}
                  type="text"
                  className="input_field"
                  onChange={handleChangeRecipientAddress}
                />
              </td>
              <td>
                <input
                  key={`amount-${index}`}
                  id={index}
                  value={recipient.amount}
                  type="number"
                  className="input_field"
                  onChange={handleChangeRecipientAmount}
                />
              </td>
              <td>
                <button
                  onClick={handleDeleteRecipient}
                  className="flex items-center justify-center hover:bg-gray-500 rounded-full hover:text-white"
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
