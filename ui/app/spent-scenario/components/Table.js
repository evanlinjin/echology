"use client";
import { useCallback } from "react";
import { RiCloseFill } from "react-icons/ri";
import TableHead from "../../../components/TableHead";

const Table = ({ recipients, onSetRecipients }) => {
  const handleDeleteRecipient = useCallback((e) => {
    const updatedRecipients = recipients.splice(e.target.id, 1);
    // onSetRecipients(updatedRecipients);
  }, []);
  return (
    <div className="overflow-x-auto">
      <table className="main_table">
        {/* head */}
        <thead>
          <tr>
            <th></th>
            <TableHead label="Address:" />
            <TableHead label="Amount:" />
            <th></th>
          </tr>
        </thead>

        {/* row 1 */}
        <tbody>
          {recipients.map((recipient, index) => (
            <tr className="hover" key={`recipient-${index}`}>
              <th>{index}</th>
              <td>Hart Hagerty</td>
              <td>Desktop Support Technician</td>
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
export default Table;
