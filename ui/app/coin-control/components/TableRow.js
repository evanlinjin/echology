import SelectionDropdown from "@components/SelectionDropdown";

const TableRow = ({ data, index, globalSelect }) => {
  if (!data) {
    return null;
  }
  const { outpoint, amount, confirmations, spent_by } = data[1];

  const idFormatter = (id) => {
    if (!id) {
      return "";
    }
    return `${id.substring(0, 5)}...${id.substring(id.length - 5)}`;
  };

  const formattedOutPoint = idFormatter(outpoint);
  const formattedTxid = spent_by && idFormatter(spent_by.txid);
  return (
    <tr className="hover">
      <th>{index + 1}</th>
      <th>
        <SelectionDropdown selected={globalSelect} />
      </th>
      <td>{formattedOutPoint}</td>
      <td>{amount}</td>
      <td>{confirmations}</td>
      {spent_by ? (
        <td>
          {formattedTxid} / {spent_by.confirmations}
        </td>
      ) : (
        <td>/</td>
      )}
    </tr>
  );
};
export default TableRow;
