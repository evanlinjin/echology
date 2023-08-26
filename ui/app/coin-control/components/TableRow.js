import SelectionDropdown from "@components/SelectionDropdown";
import { memo, useCallback } from "react";
import { convertSelectedValue } from "@app/coin-control/components/converter";

const TableRow = ({ coin, index, setCoinsToView, coinsToView }) => {
  if (!coin) {
    return null;
  }
  const { outpoint, amount, confirmations, spent_by, must_select } = coin;

  const handleChangeSelect = useCallback(
    (e) => {
      const selectedValue = convertSelectedValue(e.target.value);

      const updatedCoins = coinsToView.map((eachCoin) => {
        const { outpoint: eachOutPoint } = eachCoin;
        if (eachOutPoint !== outpoint) {
          return eachCoin;
        } else {
          return { ...eachCoin, must_select: selectedValue };
        }
      });
      setCoinsToView([...updatedCoins]);
    },
    [coinsToView],
  );
  const idFormatter = (id) => {
    if (!id) {
      return "";
    }
    return `${id.substring(0, 10)}.....${id.substring(id.length - 10)}`;
  };

  const formattedOutPoint = idFormatter(outpoint);
  const formattedTxid = spent_by && idFormatter(spent_by["txid"]);
  return (
    <tr className="hover">
      <td>{index}</td>
      <td>
        <SelectionDropdown
          mustSelect={must_select}
          onChange={handleChangeSelect}
        />
      </td>
      <td className="input_field">{formattedOutPoint}</td>
      <td className="input_field text-center">{amount}</td>
      <td className="input_field text-center">{confirmations}</td>
      {spent_by ? (
        <td className="input_field">
          {formattedTxid} / {spent_by["confirmations"]}
        </td>
      ) : (
        <td className="input_field text-center">/</td>
      )}
    </tr>
  );
};
export default memo(TableRow);
