import { useCallback } from "react";

export const convertSelectedValue = (value) => {
  if (value === "1") {
    return true;
  }
  if (value === "0") {
    return false;
  }
  if (value === "-1") {
    return null;
  }
};
