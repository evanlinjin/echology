import { memo } from "react";

const TableHead = ({ label, desc, sort }) => {
  return (
    <th className="rounded-none border border-gray-900 item_padding">
      <div className="flex flex-col gap-1 justify-start">
        <div className="text-body1 text-black font-medium flex gap-1.5 align-center">
          {label}
          <span className="whitespace-nowrap text-[14px] text-gray-500">
            {desc && `(${desc})`}
          </span>
          {sort && sort}
        </div>
      </div>
    </th>
  );
};

export default memo(TableHead);
