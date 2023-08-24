"use client";
import { RiSortAsc, RiSortDesc } from "react-icons/ri";
import { memo, useState } from "react";

const TableHead = ({ label, desc, onSortAmount }) => {
  const [sortAsc, setSortAsc] = useState(false);
  return (
    <th className="rounded-none border border-gray-900 item_padding">
      <div className="flex flex-col gap-1 justify-start">
        <div className="text-body1 text-black font-medium flex gap-1.5 w-full align-center justify-center">
          <span>{label}</span>
          {sortAsc ? (
            <button
              onClick={() => {
                onSortAmount();
                setSortAsc((prev) => !prev);
              }}
            >
              <RiSortAsc />
            </button>
          ) : (
            <button
              onClick={() => {
                onSortAmount(sortAsc);
                setSortAsc((prev) => !prev);
              }}
            >
              <RiSortDesc />
            </button>
          )}
        </div>
        <span className="whitespace-nowrap text-body2 text-gray-500">
          {desc ? `(${desc})` : "---"}
        </span>
      </div>
    </th>
  );
};
export default memo(TableHead);
