const SelectionDropdown = ({ onGlobalSelect, selected, onChange }) => {
  console.log("selected", selected);
  return (
    <select
      className="select select-bordered rounded-none main_background rounded-none whitespace-nowrap border border-black"
      onChange={onGlobalSelect || onChange}
    >
      <option disabled selected={selected === undefined}>
        please select
      </option>
      <option selected={selected === true} value={1}>
        Must Select
      </option>
      <option selected={selected === false} value={0}>
        Can Select
      </option>
      {/* eslint-disable-next-line react/no-unescaped-entities */}
      <option selected={selected === null} value={-1}>
        Don't Select
      </option>
    </select>
  );
};
export default SelectionDropdown;
