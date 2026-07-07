import { API_URL } from "@/lib/constants";
import { getCookie } from "@/lib/utils";

export type BeaderOption = {
  id?: string | number;
  name?: string;
};

const getAuthToken = () => {
  if (typeof window === "undefined") return "";

  return (
    getCookie("token") ||
    window.localStorage.getItem("token") ||
    ""
  );
};

export const normalizeBeaderNames = (beaders: Array<BeaderOption | string>) =>
  Array.from(
    new Set(
      (beaders ?? [])
        .map((beader) =>
          typeof beader === "string" ? beader : String(beader?.name ?? ""),
        )
        .map((name) => name.trim())
        .filter(Boolean),
    ),
  ).sort((left, right) => left.localeCompare(right));

export const fetchBeaders = async () => {
  const token = getAuthToken();
  const response = await fetch(`${API_URL}/beaders`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Beaders fetch failed: ${response.statusText}`);
  }

  const json = await response.json();
  return Array.isArray(json?.beaders) ? json.beaders : [];
};
