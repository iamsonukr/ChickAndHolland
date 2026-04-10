import { getCookie } from "./utils";

export const getScannerRequestHeaders = () => {
  const token =
    getCookie("token") ||
    (typeof window !== "undefined" ? localStorage.getItem("token") : "") ||
    "";

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};
