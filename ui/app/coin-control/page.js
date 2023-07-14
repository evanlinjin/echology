"use client";
import { useCallback, useState } from "react";
import SelectionDropdown from "@components/SelectionDropdown";
import Table from "@app/coin-control/components/Table";

const CoinControl = () => {
  const [globalSelect, setGlobalSelect] = useState(undefined);

  const handleGlobalSelect = useCallback((e) => {
    setGlobalSelect(e.target.value);
  }, []);

  const handleClearGlobalSelect = useCallback(() => {
    setGlobalSelect(undefined);
  }, []);
  return (
    <div className="page_padding flex flex-col gap-8">
      <div className="flex justify-between w-full items-end ">
        <div className="page_title">Coin Control</div>
        <div className="flex flex gap-10">
          <button className="main_button" onClick={handleClearGlobalSelect}>
            Clear Selection
          </button>
          <div className="flex gap-3 items-center">
            <span>Select all as</span>
            <SelectionDropdown
              onGlobalSelect={handleGlobalSelect}
              value={globalSelect}
            />
          </div>
        </div>
      </div>
      <Table globalSelect={globalSelect} />
    </div>
  );
};
export default CoinControl;
