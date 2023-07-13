import React from "react";

const SelectionDropdown = () => {
  return (
    <select className="select select-bordered rounded-none main_background rounded-none whitespace-nowrap border border-black">
      <option disabled selected>
        select
      </option>
      <option>Must Select</option>
      <option>Can Select</option>
      {/* eslint-disable-next-line react/no-unescaped-entities */}
      <option>Don't Select</option>
    </select>
  );
};
export default SelectionDropdown;
