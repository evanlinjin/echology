import { GET } from "@utils/request";
import Cookies from "js-cookie";

const alias = Cookies.get("alias");

export const getCoinsByAlias = () => {
  return GET(`${process.env.SERVER_HOST}/wallet/${alias}/coins`).then(
    (result) => {
      const { coins } = result;
      return coins.map((coin) => {
        return { ...coin, must_select: undefined };
      });
    },
  );
};
