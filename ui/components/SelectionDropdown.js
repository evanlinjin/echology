const SELECT_VALUE_MUST = "Must Select";
const SELECT_VALUE_CAN = "Can Select";
const SELECT_VALUE_DONT = "Don't Select";

const SelectionDropdown = ({ onGlobalSelect, selected }) => {
  return (
    <select
      className="select select-bordered rounded-none main_background rounded-none whitespace-nowrap border border-black"
      onChange={onGlobalSelect}
    >
      <option disabled selected={selected === undefined}>
        please select
      </option>
      <option selected={selected === SELECT_VALUE_MUST}>Must Select</option>
      <option selected={selected === SELECT_VALUE_CAN}>Can Select</option>
      {/* eslint-disable-next-line react/no-unescaped-entities */}
      <option selected={selected === SELECT_VALUE_DONT}>Don't Select</option>
    </select>
  );
};
export default SelectionDropdown;
