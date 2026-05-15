import axios, { AxiosError, AxiosRequestConfig } from "axios";
import OauthClient from "intuit-oauth";
import config from "../config";
import QuickbooksToken from "../models/QuickBooksToken";

const QUICKBOOKS_API_BASE_URL = "https://quickbooks.api.intuit.com";
const QUICKBOOKS_API_MINOR_VERSION = "75";
const QUICKBOOKS_TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;
const QUICKBOOKS_ENVIRONMENT = "production";
const QUICKBOOKS_SCOPES = [
  OauthClient.scopes.Accounting,
  OauthClient.scopes.Profile,
  OauthClient.scopes.OpenId,
];

type QuickBooksFailureReason =
  | "expired_token"
  | "invalid_realm_id"
  | "revoked_or_disconnected_company"
  | "missing_scopes"
  | "production_configuration_error"
  | "permission_issue"
  | "malformed_query"
  | "quickbooks_api_error"
  | "unknown";

export interface QuickBooksApiErrorDetails {
  status?: number;
  headers?: any;
  data?: any;
  fault?: any;
  reason: QuickBooksFailureReason;
  message: string;
}

const removeExtraSlash = (url: string) => url.replace(/([^:]\/)\/+/g, "$1");

const joinUrl = (baseUrl: string, path: string) =>
  `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;

const mask = (value?: string | null) => {
  if (!value) return null;
  if (value.length <= 12) return "***";
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
};

const safeHeaders = (headers: Record<string, any>) => ({
  ...headers,
  Authorization: headers.Authorization ? "Bearer ***" : undefined,
});

const logInfo = (step: string, details: Record<string, any>) => {
  console.info(`[QuickBooksProduction] ${step}`, details);
};

const logError = (step: string, error: any, details: Record<string, any> = {}) => {
  const axiosError = error as AxiosError;
  console.error(`[QuickBooksProduction] ${step}`, {
    ...details,
    message: error?.message,
    originalMessage: error?.originalMessage,
    errorDescription: error?.error_description,
    authResponse: error?.authResponse?.json,
    responseStatus: axiosError?.response?.status,
    responseHeaders: axiosError?.response?.headers,
    responseData: axiosError?.response?.data,
    quickBooksFault: (axiosError?.response?.data as any)?.Fault || error?.Fault,
  });
};

export const getQuickBooksRedirectUri = () => {
  const explicitRedirectUri = config.QB_REDIRECT_URI.trim();
  if (explicitRedirectUri) return explicitRedirectUri;
  return removeExtraSlash(
    joinUrl(config.CLIENT_URL, "/admin-panel/quickbook/callback")
  );
};

export const validateQuickBooksProductionConfig = () => {
  const missing = [
    ["QB_CLIENT_ID", config.QB_CLIENT_ID],
    ["QB_CLIENT_SECRET", config.QB_CLIENT_SECRET],
    ["CLIENT_URL", config.CLIENT_URL],
  ]
    .filter(([, value]) => !String(value || "").trim())
    .map(([key]) => key);

  logInfo("env:loaded", {
    environment: QUICKBOOKS_ENVIRONMENT,
    apiBaseUrl: QUICKBOOKS_API_BASE_URL,
    redirectUri: getQuickBooksRedirectUri(),
    hasClientId: Boolean(config.QB_CLIENT_ID),
    clientId: mask(config.QB_CLIENT_ID),
    hasClientSecret: Boolean(config.QB_CLIENT_SECRET),
    clientUrl: config.CLIENT_URL,
    missing,
  });

  if (missing.length) {
    const error = new Error(
      `Missing QuickBooks production environment variables: ${missing.join(", ")}`
    );
    (error as any).quickBooksReason = "production_configuration_error";
    throw error;
  }
};

export const createQuickBooksOauthClient = () => {
  validateQuickBooksProductionConfig();
  const redirectUri = getQuickBooksRedirectUri();

  logInfo("oauth:init", {
    environment: QUICKBOOKS_ENVIRONMENT,
    redirectUri,
    scopes: QUICKBOOKS_SCOPES,
  });

  return {
    redirectUri,
    environment: QUICKBOOKS_ENVIRONMENT,
    scopes: QUICKBOOKS_SCOPES,
    oauthClient: new OauthClient({
      clientId: config.QB_CLIENT_ID,
      clientSecret: config.QB_CLIENT_SECRET,
      environment: QUICKBOOKS_ENVIRONMENT,
      redirectUri,
    }),
  };
};

export const getLatestQuickBooksToken = async () => {
  logInfo("token:load:start", {});
  const token = (
    await QuickbooksToken.find({
      order: { id: "DESC" },
    })
  )[0];

  logInfo("token:load:result", {
    found: Boolean(token),
    tokenId: token?.id,
    realmId: token?.realmId,
    accessTokenPresent: Boolean(token?.accessToken),
    accessToken: mask(token?.accessToken),
    refreshTokenPresent: Boolean(token?.refreshToken),
    refreshToken: mask(token?.refreshToken),
    expiresAt: token?.expiresAt,
    updatedAt: token?.updatedAt,
  });

  return token;
};

const tokenNeedsRefresh = (token: QuickbooksToken) => {
  const expiresAtMs = new Date(token.expiresAt).getTime();
  const msUntilExpiry = expiresAtMs - Date.now();
  const needsRefresh = msUntilExpiry <= QUICKBOOKS_TOKEN_REFRESH_BUFFER_MS;

  logInfo("token:validity", {
    tokenId: token.id,
    realmId: token.realmId,
    expiresAt: token.expiresAt,
    msUntilExpiry,
    refreshBufferMs: QUICKBOOKS_TOKEN_REFRESH_BUFFER_MS,
    accessTokenValidForApiCall: msUntilExpiry > 0,
    needsRefresh,
    refreshTokenPresent: Boolean(token.refreshToken),
  });

  return needsRefresh;
};

export const refreshQuickBooksToken = async (token: QuickbooksToken) => {
  logInfo("token:refresh:start", {
    tokenId: token.id,
    realmId: token.realmId,
    refreshTokenPresent: Boolean(token.refreshToken),
    refreshToken: mask(token.refreshToken),
  });

  try {
    const { oauthClient } = createQuickBooksOauthClient();
    const tokenResponse = await oauthClient.refreshUsingToken(token.refreshToken);
    const tokenResponseJson = tokenResponse.getJson() as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      x_refresh_token_expires_in?: number;
      scope?: string;
    };

    logInfo("token:refresh:response", {
      hasAccessToken: Boolean(tokenResponseJson.access_token),
      accessToken: mask(tokenResponseJson.access_token),
      hasRefreshToken: Boolean(tokenResponseJson.refresh_token),
      refreshTokenRotated: Boolean(tokenResponseJson.refresh_token),
      expiresIn: tokenResponseJson.expires_in,
      refreshTokenExpiresIn: tokenResponseJson.x_refresh_token_expires_in,
      scope: tokenResponseJson.scope,
    });

    if (!tokenResponseJson.access_token || !tokenResponseJson.expires_in) {
      throw new Error("QuickBooks refresh response did not include a new access token");
    }

    token.accessToken = tokenResponseJson.access_token;
    token.refreshToken = tokenResponseJson.refresh_token || token.refreshToken;
    token.expiresAt = new Date(Date.now() + tokenResponseJson.expires_in * 1000);
    await token.save();

    logInfo("token:refresh:persisted", {
      tokenId: token.id,
      realmId: token.realmId,
      expiresAt: token.expiresAt,
      accessToken: mask(token.accessToken),
      refreshToken: mask(token.refreshToken),
    });

    return token;
  } catch (error: any) {
    logError("token:refresh:error", error, {
      tokenId: token.id,
      realmId: token.realmId,
      diagnosis: "Refresh token may be expired, revoked, or company app access may be disconnected.",
    });
    throw error;
  }
};

export const getUsableQuickBooksToken = async () => {
  const token = await getLatestQuickBooksToken();

  if (!token) {
    logInfo("token:load:none", {
      diagnosis: "No QuickBooks connection exists. Authorize the production app.",
    });
    return null;
  }

  if (!token.accessToken || !token.refreshToken || !token.realmId) {
    logInfo("token:load:invalid", {
      tokenId: token.id,
      hasAccessToken: Boolean(token.accessToken),
      hasRefreshToken: Boolean(token.refreshToken),
      hasRealmId: Boolean(token.realmId),
    });
    return token;
  }

  if (tokenNeedsRefresh(token)) {
    return refreshQuickBooksToken(token);
  }

  return token;
};

const classifyQuickBooksError = (error: any): QuickBooksFailureReason => {
  const status = error?.response?.status || error?.status;
  const data = error?.response?.data || error;
  const fault = data?.Fault || error?.Fault;
  const text = JSON.stringify(data || {}).toLowerCase();

  if (status === 401 || text.includes("token expired")) return "expired_token";
  if (status === 400 && (text.includes("query") || text.includes("parse"))) {
    return "malformed_query";
  }
  if (status === 403) {
    if (text.includes("scope")) return "missing_scopes";
    if (text.includes("realm") || text.includes("company")) return "invalid_realm_id";
    if (text.includes("permission") || text.includes("entitlement")) return "permission_issue";
    if (text.includes("disconnect") || text.includes("revoked")) {
      return "revoked_or_disconnected_company";
    }
    return "permission_issue";
  }
  if (fault?.Error?.some?.((item: any) => String(item?.code) === "3200")) {
    return "expired_token";
  }

  return status ? "quickbooks_api_error" : "unknown";
};

export const isQuickBooksUnauthorizedError = (error: any) =>
  classifyQuickBooksError(error) === "expired_token";

export const getQuickBooksErrorDetails = (error: any): QuickBooksApiErrorDetails => {
  const status = error?.response?.status || error?.status;
  const data = error?.response?.data || error;
  const fault = data?.Fault || error?.Fault;

  return {
    status,
    headers: error?.response?.headers,
    data,
    fault,
    reason: error?.quickBooksReason || classifyQuickBooksError(error),
    message:
      fault?.Error?.[0]?.Detail ||
      fault?.Error?.[0]?.Message ||
      error?.originalMessage ||
      error?.error_description ||
      error?.message ||
      "QuickBooks API request failed",
  };
};

export class QuickBooksService {
  async createAuthorizationUri() {
    const { oauthClient, redirectUri, environment, scopes } =
      createQuickBooksOauthClient();
    const authUri = oauthClient.authorizeUri({ scope: scopes });

    logInfo("oauth:authorize-uri", {
      environment,
      redirectUri,
      scopes,
      authUriHost: "appcenter.intuit.com",
    });

    return { authUri, redirectUri, environment, scopes };
  }

  async exchangeCodeForToken(callbackUrl: string, realmId?: string) {
    const { oauthClient, redirectUri, environment, scopes } =
      createQuickBooksOauthClient();

    logInfo("oauth:create-token:start", {
      environment,
      redirectUri,
      realmId,
      scopes,
      callbackUrlContainsCode: callbackUrl.includes("code="),
    });

    try {
      const tokenResponse = await oauthClient.createToken(callbackUrl);
      const tokenResponseJson: any = tokenResponse.getJson();

      logInfo("oauth:create-token:response", {
        realmId,
        hasAccessToken: Boolean(tokenResponseJson.access_token),
        accessToken: mask(tokenResponseJson.access_token),
        hasRefreshToken: Boolean(tokenResponseJson.refresh_token),
        refreshToken: mask(tokenResponseJson.refresh_token),
        expiresIn: tokenResponseJson.expires_in,
        refreshTokenExpiresIn: tokenResponseJson.x_refresh_token_expires_in,
        scope: tokenResponseJson.scope,
      });

      return tokenResponseJson;
    } catch (error: any) {
      logError("oauth:create-token:error", error, { realmId, redirectUri });
      throw error;
    }
  }

  async getAuthorizedToken() {
    const token = await getUsableQuickBooksToken();
    if (!token) return null;

    logInfo("client:create", {
      tokenId: token.id,
      realmId: token.realmId,
      environment: QUICKBOOKS_ENVIRONMENT,
      apiBaseUrl: QUICKBOOKS_API_BASE_URL,
      accessTokenPresent: Boolean(token.accessToken),
      refreshTokenPresent: Boolean(token.refreshToken),
    });

    return token;
  }

  private companyUrl(token: QuickbooksToken, path: string) {
    return `${QUICKBOOKS_API_BASE_URL}/v3/company/${encodeURIComponent(
      token.realmId
    )}/${path.replace(/^\/+/, "")}`;
  }

  private async request<T>(
    token: QuickbooksToken,
    options: AxiosRequestConfig,
    retryOnExpiredToken = true
  ): Promise<{ data: T; token: QuickbooksToken }> {
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token.accessToken}`,
      ...(options.headers || {}),
    };
    const url = options.url || "";

    logInfo("request:start", {
      method: options.method || "GET",
      url,
      realmId: token.realmId,
      tokenId: token.id,
      headers: safeHeaders(headers),
      params: options.params,
      data: options.data,
    });

    try {
      const response = await axios.request<T>({
        ...options,
        headers,
        params: {
          minorversion: QUICKBOOKS_API_MINOR_VERSION,
          ...(options.params || {}),
        },
      });

      logInfo("request:success", {
        method: options.method || "GET",
        url,
        status: response.status,
        responseHeaders: response.headers,
        responseBody: response.data,
      });

      return { data: response.data, token };
    } catch (error: any) {
      logError("request:error", error, {
        method: options.method || "GET",
        url,
        realmId: token.realmId,
        tokenId: token.id,
        headers: safeHeaders(headers),
        params: options.params,
      });

      if (retryOnExpiredToken && isQuickBooksUnauthorizedError(error)) {
        logInfo("request:retry-expired-token", {
          tokenId: token.id,
          realmId: token.realmId,
          reason: "Access token expired or rejected. Refreshing and retrying once.",
        });
        const refreshedToken = await refreshQuickBooksToken(token);
        return this.request<T>(refreshedToken, options, false);
      }

      throw error;
    }
  }

  async query<T = any>(query: string, operationName: string) {
    const token = await this.getAuthorizedToken();
    if (!token) {
      const error = new Error("No QuickBooks connection found");
      (error as any).quickBooksReason = "revoked_or_disconnected_company";
      throw error;
    }

    logInfo("query:execute", {
      operationName,
      realmId: token.realmId,
      query,
    });

    return this.request<T>(token, {
      method: "GET",
      url: this.companyUrl(token, "query"),
      params: { query },
    });
  }

  async countCustomers() {
    const { data } = await this.query<any>(
      "SELECT COUNT(*) FROM Customer",
      "customer-count"
    );
    const total = Number(data?.QueryResponse?.totalCount || 0);

    logInfo("customer:count:result", {
      total,
      responseBody: data,
    });

    return total;
  }

  async getAllCustomers() {
    const allCustomers: any[] = [];
    let startPosition = 1;
    const pageSize = 1000;

    while (true) {
      const query = `SELECT * FROM Customer STARTPOSITION ${startPosition} MAXRESULTS ${pageSize}`;
      const { data } = await this.query<any>(query, "customer-query-page");
      const customers = data?.QueryResponse?.Customer || [];

      logInfo("customer:query:page", {
        startPosition,
        pageSize,
        returned: customers.length,
      });

      allCustomers.push(...customers);

      if (customers.length < pageSize) break;
      startPosition += pageSize;
    }

    logInfo("customer:query:complete", {
      totalFetched: allCustomers.length,
    });

    return allCustomers;
  }

  async getAllItems() {
    const allItems: any[] = [];
    let startPosition = 1;
    const pageSize = 1000;

    while (true) {
      const query = `SELECT * FROM Item STARTPOSITION ${startPosition} MAXRESULTS ${pageSize}`;
      const { data } = await this.query<any>(query, "product-item-query-page");
      const items = data?.QueryResponse?.Item || [];

      logInfo("product:item:query:page", {
        startPosition,
        pageSize,
        returned: items.length,
      });

      allItems.push(...items);

      if (items.length < pageSize) break;
      startPosition += pageSize;
    }

    logInfo("product:item:query:complete", {
      totalFetched: allItems.length,
    });

    return allItems;
  }

  async createItem(item: Record<string, any>) {
    const token = await this.getAuthorizedToken();
    if (!token) throw new Error("No QuickBooks connection found");

    logInfo("product:item:create", {
      realmId: token.realmId,
      item,
    });

    return this.request<any>(token, {
      method: "POST",
      url: this.companyUrl(token, "item"),
      data: item,
    });
  }

  async updateItem(item: Record<string, any>) {
    const token = await this.getAuthorizedToken();
    if (!token) throw new Error("No QuickBooks connection found");

    logInfo("product:item:update", {
      realmId: token.realmId,
      itemId: item?.Id,
      syncToken: item?.SyncToken,
      item,
    });

    return this.request<any>(token, {
      method: "POST",
      url: this.companyUrl(token, "item"),
      data: item,
    });
  }
}

export const quickBooksService = new QuickBooksService();
