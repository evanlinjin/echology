import { memo } from "react";
import { LiaBitcoin } from "react-icons/lia";

const BitcoinButton = () => {
  return (
    <div className="avatar border-4 hover:border-primary-300 border-black w-[70px] h-[70px] btn btn-ghost hover:bg-primary-300 rounded-full hover:text-white">
      <label htmlFor="free_money_dialog">
        <LiaBitcoin fontSize={45} />
      </label>
    </div>
  );
};

export default memo(BitcoinButton);
