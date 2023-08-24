const SelectionDropdown = ({ onGlobalSelect, selected, onChange }) => {
  return (
    <select
      className="select select-bordered rounded-none main_background  whitespace-nowrap border border-black"
      onChange={onGlobalSelect || onChange}
    >
      <option disabled selected={selected === undefined}>
        please select
      </option>
      <option selected={selected === true} value={1}>
        Must Spend
      </option>
      <option selected={selected === false} value={0}>
        Select
      </option>
      {/* eslint-disable-next-line react/no-unescaped-entities */}
      <option selected={selected === null} value={-1}>
        Ignore
      </option>
    </select>
  );
};
export default SelectionDropdown;
