import SelectionDropdown from "@components/SelectionDropdown";
import { memo, useCallback, useState } from "react";
import { convertSelectedValue } from "@app/coin-control/components/converter";
import { CopyToClipboard } from "react-copy-to-clipboard";

const TableRow = ({ coin, index, setCoinsToView, coinsToView }) => {
  const [showCopied, setShowCopied] = useState(false);

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

  const formattedTxid = spent_by && idFormatter(spent_by["txid"]);
  return (
    <tr className="hover">
      <td>{index}</td>
      <td className="h-[50px]">
        <SelectionDropdown
          mustSelect={must_select}
          onChange={handleChangeSelect}
        />
      </td>
      <td
        data-tip="Copied!"
        className={`input_field h-[50px] ${
          showCopied && "tooltip tooltip-top"
        }`}
      >
        <CopyToClipboard
          text={outpoint}
          onCopy={() => {
            setShowCopied(true);
            setTimeout(() => setShowCopied(false), 1000);
          }}
          className="relative max-w-[550px] hover:cursor-pointer overflow-x-scroll"
        >
          <span>{outpoint}</span>
        </CopyToClipboard>
      </td>
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
