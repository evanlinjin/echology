import {
  COIN_SELECT_OPTION_CANDIDATE,
  COIN_SELECT_OPTION_IGNORED,
  COIN_SELECT_OPTION_MUST_SPEND,
} from "@app/coin-control/page";

const SelectionDropdown = ({ onGlobalSelect, onChange, mustSelect }) => {
  return (
    <select
      className="select select-bordered rounded-none main_background  whitespace-nowrap border border-black capitalize"
      onChange={onGlobalSelect || onChange}
      // defaultValue={mustSelect}
    >
      <option selected={mustSelect === true} value={1}>
        {COIN_SELECT_OPTION_MUST_SPEND}
      </option>
      <option selected={mustSelect === false} value={0}>
        {COIN_SELECT_OPTION_CANDIDATE}
      </option>
      <option selected={mustSelect === null} value={-1}>
        {COIN_SELECT_OPTION_IGNORED}
      </option>
    </select>
  );
};
export default SelectionDropdown;
