import SelectionDropdown from "@components/SelectionDropdown";
import { useCallback } from "react";
import { convertSelectedValue } from "@app/coin-control/components/converter";

const TableRow = ({ coin, index, setCoins, coins }) => {
  if (!coin) {
    return null;
  }
  console.log("coin", coin);
  const { outpoint, amount, confirmations, spent_by, must_select } = coin;

  const handleChangeSelect = useCallback(
    (e) => {
      const selectedValue = convertSelectedValue(e.target.value);

      const updatedCoins = coins.map((eachCoin) => {
        if (eachCoin.outpoint !== outpoint) {
          return eachCoin;
        } else {
          return { ...eachCoin, must_select: selectedValue };
        }
      });
      setCoins([...updatedCoins]);
    },
    [coins],
  );
  const idFormatter = (id) => {
    if (!id) {
      return "";
    }
    return `${id.substring(0, 10)}.....${id.substring(id.length - 10)}`;
  };

  const formattedOutPoint = idFormatter(outpoint);
  const formattedTxid = spent_by && idFormatter(spent_by.txid);
  return (
    <tr className="hover">
      <td>{index}</td>
      <td>
        <SelectionDropdown
          selected={must_select}
          onChange={handleChangeSelect}
        />
      </td>
      <td className="input_field">{formattedOutPoint}</td>
      <td className="input_field text-center">{amount}</td>
      <td className="input_field text-center">{confirmations}</td>
      {spent_by ? (
        <td className="input_field">
          {formattedTxid} / {spent_by.confirmations}
        </td>
      ) : (
        <td className="input_field text-center">/</td>
      )}
    </tr>
  );
};
export default TableRow;
