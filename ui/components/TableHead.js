const TableHead = ({ label, desc }) => {
  return (
    <th className="rounded-none border border-gray-900">
      <div className="flex flex-col gap-1 justify-start">
        <span className="text-body1 text-black font-medium">{label}</span>
        <span>{desc ? `(${desc})` : " "}</span>
      </div>
    </th>
  );
};
export default TableHead;
