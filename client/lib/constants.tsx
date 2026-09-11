export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.chicandholland.com/api";

export const getApiUrl = (path = "") => {
  const baseUrl = API_URL.replace(/\/+$/, "");
  const normalizedPath = path.replace(/^\/+/, "");

  return normalizedPath ? `${baseUrl}/${normalizedPath}` : baseUrl;
};

export const parseJsonResponse = async <T = any>(
  response: Response,
  context: string,
): Promise<T> => {
  const rawResponse = await response.text();

  try {
    return rawResponse ? JSON.parse(rawResponse) : null;
  } catch (error) {
    const preview = rawResponse.replace(/\s+/g, " ").slice(0, 160);
    throw new Error(
      `${context} returned non-JSON response (${response.status} ${response.statusText}): ${preview}`,
    );
  }
};

export const GOOGLE_MAPS_API_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ??
  "AIzaSyCm6BCGEB30k2P5xAPys5KU1dfuJT9H6V4";

export const SMTP_URL =
  process.env.SMTP_URL ||
  "smtp://info@chicandholland.com:yktwlbuwklsawauv@139.59.83.183:2587";
