import Cookies from "js-cookie";

export function setCookie(name, value, expires) {
  if (expires) {
    return Cookies.set(name, value, { expires });
  }
  return Cookies.set(name, value);
}
