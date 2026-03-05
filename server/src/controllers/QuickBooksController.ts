import { Request, Response, Router } from "express";
import asyncHandler from "../middleware/AsyncHandler";
import OauthClient from "intuit-oauth";
import config from "../config";
import  QuickbooksToken  from "../models/QuickBooksToken";
import  QuickbooksLoginHistory  from "../models/QuickBookLoginHistory";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
import Quickbooks from "node-quickbooks";
import Clients from "../models/ClientsModel";
import Customer from "../models/Customer";

import { Client } from "@googlemaps/google-maps-services-js";

const router = Router();

const removeExtraSlash = (url: string) => {
  return url.replace(/([^:]\/)\/+/g, "$1");
};

const oauthClient = new OauthClient({
  clientId: config.QB_CLIENT_ID,
  clientSecret: config.QB_CLIENT_SECRET,
  environment: "sandbox",
  redirectUri: removeExtraSlash(
    config.CLIENT_URL + "/admin-panel/quickbook/callback"
  ),
});

const googleMapsClient = new Client({});

router.get("/", (req, res, next) => {
  return res.json({
    sup: true,
  });
});

router.get(
  "/redirect-url",
  asyncHandler((req: Request, res: Response) => {
    const authUri = oauthClient.authorizeUri({
      scope: [
        OauthClient.scopes.Accounting,
        OauthClient.scopes.Profile,
        OauthClient.scopes.OpenId,
      ],
    });

    return res.json({
      success: true,
      authUri,
    });
  })
);

router.get(
  "/access-token",
  asyncHandler(async (req: any, res: Response) => {
    try {
      const params = req.query;
      const searchParamsString = new URLSearchParams(params as any).toString();
      const url = `${config.CLIENT_URL}/admin-panel/quickbook/callback?${searchParamsString}`;

      const tokenResponse = await oauthClient.createToken(url);
      const tokenResponseJson: any = tokenResponse.getJson();

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
    } catch (error) {
      console.error("Error saving Quickbooks token:", error);
      throw error;
    }
  })
);

// Helper to check connection status
router.get(
  "/connection-status",
  asyncHandler(async (req: Request, res: Response) => {
    const token = (
      await QuickbooksToken.find({
        order: { id: "DESC" },
      })
    )[0];

    if (!token) {
      return res.json({
        connected: false,
        message: "No Quickbooks connection found",
      });
    }

    const isValid = token.expiresAt > new Date();

    return res.json({
      connected: isValid,
      expiresAt: token.expiresAt,
      message: isValid
        ? "Connected to Quickbooks"
        : "Quickbooks token has expired",
    });
  })
);

router.post(
  "/import-customers",
  asyncHandler(async (req: Request, res: Response) => {
    const token = (
      await QuickbooksToken.find({
        order: { id: "DESC" },
      })
    )[0];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No Quickbooks connection found",
      });
    }

    if (token.expiresAt <= new Date()) {
      return res.status(401).json({
        success: false,
        message: "Quickbooks token has expired. Please reconnect.",
      });
    }

    const qbo = new Quickbooks(
      config.QB_CLIENT_ID,
      config.QB_CLIENT_SECRET,
      token.accessToken,
      false,
      token.realmId,
      true, // use the sandbox
      false, // debugging
      null,
      "2.0",
      token.refreshToken
    );

    const findCustomersPromise = () =>
      new Promise((resolve, reject) => {
        qbo.findCustomers(
          {
            fetchAll: true,
          },
          function (err: any, customers: any) {
            if (err) reject(err);
            else resolve(customers);
          }
        );
      });

    try {
      const customersResponse: any = await findCustomersPromise();
      const qbCustomers = customersResponse.QueryResponse.Customer;

      const stats: any = {
        total: qbCustomers.length,
        imported: 0,
        skipped: 0,
        failed: 0,
        failedCustomers: [],
      };

      // Import each customer
      for (const qbCustomer of qbCustomers) {
        try {
          // Check if customer already exists
          const existingCustomer = await Customer.findOne({
            where: { quickbooksCustomerId: qbCustomer.Id },
          });

          if (existingCustomer) {
            stats.skipped++;
            continue; // Skip this customer
          }

         const addr = qbCustomer.ShipAddr || qbCustomer.BillAddr;

const formattedAddress = addr
  ? `${addr.Line1 || ""} ${addr.City || ""} ${
      addr.CountrySubDivisionCode || ""
    } ${addr.PostalCode || ""}`.trim()
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
        }
      }

      return res.json({
        success: true,
        message: `Import completed: ${stats.imported} imported, ${stats.skipped} already existed, ${stats.failed} failed`,
        stats,
      });
    } catch (error: any) {
      console.error("error:", JSON.stringify(error, null, 2));
      return res.status(500).json({
        success: false,
        message: "Failed to import customers",
        error: error.message,
      });
    }
  })
);

export default router;
