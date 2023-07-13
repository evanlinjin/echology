"use client";
import { useCallback } from "react";
import { RiCloseFill } from "react-icons/ri";

const Table = ({ recipients, onSetRecipients }) => {
  const handleDeleteRecipient = useCallback((e) => {
    const updatedRecipients = recipients.splice(e.target.id, 1);
    // onSetRecipients(updatedRecipients);
  }, []);
  return (
    <div className="overflow-x-auto">
      <table className="table">
        {/* head */}
        <thead>
          <tr>
            <th></th>
            <th>Address:</th>
            <th>Amount:</th>
            <th></th>
          </tr>
        </thead>

        {/* row 1 */}
        <tbody>
          {recipients.map((recipient, index) => (
            <tr className="hover" key={`recipient-${index}`}>
              <th>{index + 1}</th>
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
