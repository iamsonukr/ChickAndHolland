import { useState } from "react";
import { getCookie } from "../utils";
import { API_URL } from "../constants";

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

      const headers: HeadersInit = {
  ...(authorization && {
    Authorization: `Bearer ${getCookie("token") || localStorage.getItem("token")}`,
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
          body = JSON.stringify(data);
        }
      }

      const { url: _, ...restConfig } = config || {};

      const response = await fetch(fullUrl, {
        method,
        headers,
        body,
        ...restConfig,
      });

      const responseJson = await response.json();

     if (!response.ok || !responseJson.success) {
  const msg = responseJson.message || responseJson.error || "Request failed";

  // Tell the UI about the error (toast)
  errorCallback?.(new Error(msg));

  // Do NOT crash React — reject instead
  return Promise.reject({
    success: false,
    message: msg,
  });
}


      return responseJson as T;
    } catch (err) {
      console.error(err);
      const newError =
        err instanceof Error ? err : new Error("An error occurred");
      setError(newError);
      errorCallback?.(newError);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { executeAsync, loading, error };
}

export default useHttp;
