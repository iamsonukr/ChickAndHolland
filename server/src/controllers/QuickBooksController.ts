import { Request, Response, Router } from "express";
import asyncHandler from "../middleware/AsyncHandler";
import  QuickbooksToken  from "../models/QuickBooksToken";
import  QuickbooksLoginHistory  from "../models/QuickBookLoginHistory";
import Clients from "../models/ClientsModel";
import Customer from "../models/Customer";
import {
  createQuickBooksOauthClient,
  getLatestQuickBooksToken,
  getQuickBooksErrorDetails,
  getQuickBooksRedirectUri,
  quickBooksService,
} from "../services/quickbooks.service";

const router = Router();

router.get("/", (req, res, next) => {
  return res.json({
    sup: true,
  });
});

router.get(
  "/redirect-url",
  asyncHandler(async (req: Request, res: Response) => {
    const { authUri, redirectUri, environment, scopes } =
      await quickBooksService.createAuthorizationUri();

    console.info("[QuickBooksOAuth] redirect-url", {
      environment,
      redirectUri,
      scopes,
      host: req.get("host"),
      origin: req.get("origin"),
      forwardedHost: req.get("x-forwarded-host"),
      forwardedProto: req.get("x-forwarded-proto"),
    });

    return res.json({
      success: true,
      authUri,
      redirectUri,
      environment,
      scopes,
    });
  })
);

router.get(
  "/access-token",
  asyncHandler(async (req: any, res: Response) => {
    try {
      const { redirectUri, environment, scopes } =
        createQuickBooksOauthClient();
      const params = req.query;
      const searchParamsString = new URLSearchParams(params as any).toString();
      const url = `${redirectUri}?${searchParamsString}`;

      console.info("[QuickBooksOAuth] access-token:start", {
        environment,
        redirectUri,
        realmId: params.realmId,
        hasCode: Boolean(params.code),
        hasError: Boolean(params.error),
        error: params.error,
        errorDescription: params.error_description,
        scopes,
      });

      const tokenResponseJson = await quickBooksService.exchangeCodeForToken(
        url,
        params.realmId
      );

      // Save token directly using the entity
      const token = new QuickbooksToken();
      token.accessToken = tokenResponseJson.access_token;
      token.refreshToken = tokenResponseJson.refresh_token;
      token.realmId = params.realmId;
      token.expiresAt = new Date(
        Date.now() + tokenResponseJson.expires_in * 1000
      );
      await token.save();

      // Optionally log the login
      const history = new QuickbooksLoginHistory();
      history.userId = req.user?.id || "system";
      history.userEmail = req.user?.email || "test@gmail.com";
      await history.save();

      return res.json({
        success: true,
        message: "Successfully connected to Quickbooks",
      });
    } catch (error: any) {
      console.error("[QuickBooksOAuth] access-token:error", {
        message: error?.message,
        originalMessage: error?.originalMessage,
        errorDescription: error?.error_description,
        authResponse: error?.authResponse?.json,
      });

      return res.status(400).json({
        success: false,
        message:
          error?.error_description ||
          error?.originalMessage ||
          error?.message ||
          "QuickBooks connection failed",
        redirectUri: getQuickBooksRedirectUri(),
        environment: "production",
        diagnostics: getQuickBooksErrorDetails(error),
      });
    }
  })
);

// Helper to check connection status
router.get(
  "/connection-status",
  asyncHandler(async (req: Request, res: Response) => {
    const token = await getLatestQuickBooksToken();

    if (!token) {
      return res.json({
        connected: false,
        message: "No Quickbooks connection found",
      });
    }

    try {
      const usableToken = await quickBooksService.getAuthorizedToken();

      return res.json({
        connected: Boolean(usableToken),
        expiresAt: usableToken?.expiresAt,
        realmId: usableToken?.realmId,
        environment: "production",
        message: "Connected to Quickbooks",
      });
    } catch (error: any) {
      console.error("[QuickBooksOAuth] token-refresh:error", {
        message: error?.message,
        originalMessage: error?.originalMessage,
        errorDescription: error?.error_description,
        authResponse: error?.authResponse?.json,
      });

      return res.json({
        connected: false,
        expiresAt: token.expiresAt,
        message: "Quickbooks token refresh failed. Please reconnect.",
        environment: "production",
        diagnostics: getQuickBooksErrorDetails(error),
      });
    }
  })
);

router.post(
  "/import-customers",
  asyncHandler(async (req: Request, res: Response) => {
    try {
      console.info("[QuickBooksImport] customer-import:start", {
        environment: "production",
      });

      const totalContactsAvailable = await quickBooksService.countCustomers();
      const qbCustomers = await quickBooksService.getAllCustomers();

      const stats: any = {
        total: totalContactsAvailable,
        fetched: qbCustomers.length,
        imported: 0,
        skipped: 0,
        failed: 0,
        failedCustomers: [],
      };

      // Import each customer
      for (const qbCustomer of qbCustomers) {
        try {
          console.info("[QuickBooksImport] customer:import:start", {
            quickbooksCustomerId: qbCustomer.Id,
            displayName: qbCustomer.DisplayName,
            companyName: qbCustomer.CompanyName,
          });

          // Check if customer already exists
          const existingCustomer = await Customer.findOne({
            where: { quickbooksCustomerId: qbCustomer.Id },
          });

          if (existingCustomer) {
            console.info("[QuickBooksImport] customer:skip-existing", {
              quickbooksCustomerId: qbCustomer.Id,
              localCustomerId: existingCustomer.id,
            });
            stats.skipped++;
            continue; // Skip this customer
          }

         const addr = qbCustomer.ShipAddr || qbCustomer.BillAddr;
         const postalCode = addr?.PostalCode || "";

const formattedAddress = addr
  ? `${addr.Line1 || ""} ${addr.City || ""} ${
      addr.CountrySubDivisionCode || ""
    } ${postalCode}`.trim()
  : "Address not available";

const newClient = Clients.create({
  name: qbCustomer.CompanyName || qbCustomer.DisplayName || "Unknown",
  address: formattedAddress,
  proximity: 1,
  latitude:
    addr?.Lat && addr.Lat !== "INVALID" ? addr.Lat : "0",
  longitude:
    addr?.Long && addr.Long !== "INVALID" ? addr.Long : "0",
  city_name: addr?.City || "",
});

await newClient.save();


          // Create the customer
          const customer = new Customer();
          customer.quickbooksCustomerId = qbCustomer.Id;
customer.client = newClient;

          // Handle required fields with fallbacks
          customer.name =
            `${qbCustomer.GivenName || ""} ${
              qbCustomer.FamilyName || ""
            }`.trim() || "Unknown";
          customer.storeName =
            qbCustomer.CompanyName || qbCustomer.DisplayName || "Unknown Store";
          customer.storeAddress = formattedAddress;
          customer.postalCode = postalCode;
          customer.website = "";
          customer.phoneNumber =
            qbCustomer.PrimaryPhone?.FreeFormNumber || "No phone";
          customer.contactPerson =
            `${qbCustomer.GivenName || ""} ${
              qbCustomer.FamilyName || ""
            }`.trim() || "Unknown";
          customer.email =
            qbCustomer.PrimaryEmailAddr?.Address || "no-email@example.com";

          // Only set client if we successfully created one
          if (newClient) {
            customer.client = newClient;
          }

          await customer.save();
          console.info("[QuickBooksImport] customer:imported", {
            quickbooksCustomerId: qbCustomer.Id,
            localCustomerId: customer.id,
            localClientId: newClient.id,
          });
          stats.imported++;
        } catch (error: any) {
          const customerName =
            `${qbCustomer.GivenName || ""} ${
              qbCustomer.FamilyName || ""
            }`.trim() ||
            qbCustomer.DisplayName ||
            "Unknown";
          stats.failed++;
          stats.failedCustomers.push({
            name: customerName,
            id: qbCustomer.Id,
            reason: error.message || "Unknown error occurred",
          });
          console.error("[QuickBooksImport] customer:failed", {
            quickbooksCustomerId: qbCustomer.Id,
            name: customerName,
            message: error?.message,
            stack: error?.stack,
          });
        }
      }

      console.info("[QuickBooksImport] customer-import:complete", {
        stats,
      });

      return res.json({
        success: true,
        message: `QuickBooks contacts available: ${stats.total}. Imported now: ${stats.imported}. ${stats.skipped} already existed, ${stats.failed} failed.`,
        stats,
      });
    } catch (error: any) {
      const diagnostics = getQuickBooksErrorDetails(error);
      console.error("[QuickBooksImport] customer-import:error", {
        message: error?.message,
        diagnostics,
      });

      const status =
        diagnostics.status === 401 || diagnostics.reason === "expired_token"
          ? 401
          : diagnostics.status === 403
          ? 403
          : 500;

      return res.status(status).json({
        success: false,
        message: "Failed to import customers",
        error: error.message,
        diagnostics,
      });
    }
  })
);

export default router;
