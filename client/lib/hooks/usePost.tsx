import { useState } from "react";
import { getCookie } from "../utils";
import { API_URL } from "../constants";
import { normalizeOrderDatePayload } from "../dateOnly";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

interface UseHttpResult<T> {
  executeAsync: (
    data?: any,
    config?: RequestInit & { url?: string },
    errorCallback?: (error: Error | null) => void,
  ) => Promise<T>;
  loading: boolean;
  error: Error | null;
}

const isLikelyJwt = (token?: string | null) => {
  const value = String(token ?? "").trim();

  return (
    Boolean(value) &&
    value !== "undefined" &&
    value !== "null" &&
    value.split(".").length === 3
  );
};

const getAuthToken = () => {
  const cookieToken = getCookie("token");
  const localStorageToken =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  if (isLikelyJwt(cookieToken)) return String(cookieToken).trim();
  if (isLikelyJwt(localStorageToken)) return String(localStorageToken).trim();

  return "";
};

function useHttp<T = any>(
  defaultUrl: string,
  method: HttpMethod = "POST",
  authorization = true,
  isLocalUrl = false,
): UseHttpResult<T> {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const executeAsync = async (
    data?: any,
    config?: RequestInit & { url?: string },
    errorCallback?: (error: Error | null) => void,
  ): Promise<T> => {
    try {
      setLoading(true);
      setError(null);

      const token = authorization ? getAuthToken() : "";
      const headers: HeadersInit = {
        ...(token && {
          Authorization: `Bearer ${token}`,
        }),
      };

      const url = config?.url || defaultUrl;
      // let fullUrl = `${API_URL}${url}`;
      let fullUrl = isLocalUrl ? url : `${API_URL}${url}`;
      let body: string | FormData | undefined = undefined;

      if (method === "GET" && data) {
        // For GET requests, append data as query parameters
        const params = new URLSearchParams(data);
        fullUrl += `?${params.toString()}`;
      } else if (data) {
        if (data instanceof FormData) {
          body = data;
        } else {
          headers["Content-Type"] = "application/json";
          body = JSON.stringify(normalizeOrderDatePayload(data));
        }
      }

      const { url: _, headers: configHeaders, ...restConfig } = config || {};
      const requestHeaders = new Headers(headers);
      if (configHeaders) {
        new Headers(configHeaders).forEach((value, key) => {
          requestHeaders.set(key, value);
        });
      }

      const response = await fetch(fullUrl, {
        method,
        headers: requestHeaders,
        body,
        ...restConfig,
      });

      const contentType = response.headers.get("content-type") ?? "";
      let responseJson: any;

      try {
        responseJson = contentType.includes("application/json")
          ? await response.json()
          : {
              success: false,
              message:
                (await response.text()) ||
                `Unexpected ${response.status} response from server`,
            };
      } catch {
        responseJson = {
          success: false,
          message: `Invalid JSON response from server (${response.status})`,
        };
      }

      if (!response.ok || !responseJson.success) {
        // Try to extract the most useful error message from various backend shapes
        const extractMessage = (obj: any): string | null => {
          if (!obj) return null;
          if (typeof obj === "string") return obj;
          if (obj.message && typeof obj.message === "string") return obj.message;
          if (obj.msg && typeof obj.msg === "string") return obj.msg;
          if (obj.error && typeof obj.error === "string") return obj.error;
          // Rails/Express validation style: { errors: { field: ['msg'] } } or { errors: ['msg'] }
          if (obj.errors) {
            if (Array.isArray(obj.errors) && obj.errors.length > 0) return String(obj.errors[0]);
            if (typeof obj.errors === "object") {
              const first = Object.values(obj.errors)[0];
              if (Array.isArray(first) && first.length > 0) return String(first[0]);
              if (typeof first === "string") return first;
            }
          }
          // Some APIs nest under data
          if (obj.data) return extractMessage(obj.data);
          return null;
        };

        const msg = extractMessage(responseJson) || "Request failed";

        const errorObj = new Error(msg);

        // Tell the UI about the error (toast)
        errorCallback?.(errorObj);
        setError(errorObj);

        // Reject with an Error instance so callers can read `error.message`
        return Promise.reject(errorObj);
      }

      return responseJson as T;
    } catch (err) {
      console.error(err);
      const normalizedError =
        err instanceof Error ? err : new Error(err?.message ?? "An error occurred");
      setError(normalizedError);
      errorCallback?.(normalizedError);
      throw normalizedError;
    } finally {
      setLoading(false);
    }
  };

  return { executeAsync, loading, error };
}

export default useHttp;
