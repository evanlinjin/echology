"use client";
import { RiCloseFill } from "react-icons/ri";
import {
  TABLE_HEAD_VALUE_ADDRESS,
  TABLE_HEAD_VALUE_AMOUNT,
} from "@utils/constants";
import TableHead from "@components/TableHead";

const RecipientsTable = ({
  recipients,
  isDone,
  onChangeRecipientAddress,
  onChangeRecipientAmount,
  onDeleteRecipient,
}) => {
  const headers = [TABLE_HEAD_VALUE_ADDRESS, TABLE_HEAD_VALUE_AMOUNT];
  return (
    <div className="w-2/3">
      <table className="main_table">
        <thead>
          <tr>
            <th className="w-[20px]">-</th>
            {headers.map((header) => (
              <TableHead
                label={header.label}
                desc={header.desc}
                key={header.label}
                maxWidth={200}
              />
            ))}
            <th className="w-[20px]">-</th>
          </tr>
        </thead>
        <tbody>
          {recipients.length > 0 &&
            recipients.map((recipient, index) => (
              <tr className="hover" key={`recipient-${index}`}>
                <td>{index}</td>
                <td>
                  <input
                    key={`address-${index}`}
                    value={recipient.address}
                    id={index}
                    type="text"
                    className="input_field w-full"
                    onChange={onChangeRecipientAddress}
                    disabled={isDone === true}
                  />
                </td>
                <td>
                  <input
                    id={index}
                    key={`amount-${index}`}
                    value={recipient.amount}
                    type="number"
                    className="input_field w-full"
                    onChange={onChangeRecipientAmount}
                    disabled={isDone === true}
                  />
                </td>
                <td>
                  <button
                    disabled={isDone === true}
                    onClick={onDeleteRecipient}
                    className="flex items-center justify-center hover:bg-gray-500 rounded-full hover:text-white disabled:text-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed"
                  >
                    <div className="grid place-items-center h-full">
                      <RiCloseFill id={index} />
                    </div>
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
