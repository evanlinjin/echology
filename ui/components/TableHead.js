const TableHead = ({ label, desc }) => {
  return (
    <th className="rounded-none border border-gray-900 item_padding">
      <div className="flex flex-col gap-1 justify-start">
        <span className="text-body1 text-black font-medium">{label}</span>
        <span className="whitespace-nowrap text-body2 text-gray-500">
          {desc ? `(${desc})` : " "}
        </span>
      </div>
    </th>
  );
};
export default TableHead;
