import Stripe from "stripe";

import { Router, Request, Response, raw } from "express";
import asyncHandler from "../middleware/AsyncHandler";
import {
  requireAdminUser,
  requireEditPasswordHeader,
} from "../middleware/AdminAuth";
import Favourites from "../models/Favourites";
import RetailerFavouritesOrders from "../models/ReailerFavouritesOrder";
import Retailer from "../models/Retailer";
import Stock from "../models/Stock";
import { RetailerOrder } from "../models/RetailerOrder";
import { OrderStatus, ShippingStatus } from "../models/Order";

import RetailerStockOrders from "../models/RetailerStockOrders";
import db from "../db";
import RetailerOrdersPayment from "../models/RetailerPaymentModal";
import { getRepository, In, MoreThan } from "typeorm";
import Order from "../models/Order";
import { convertToUSSize } from "../lib/sizeConversion";
import {
  generateUniquePO,
  peekGlobalNextPoNumber,
  setGlobalPoSequence,
} from "../utils/generatePO";
import RetailerOrderStyles from "../models/RetailerOrderStyles";
import StockOrderStyles from "../models/StockOrderStyles";
import express from "express";
import StyleProgress from "../models/StyleProgress";
import {
  SCAN_STAGE_FLOW,
  getScanStageIndex,
  getScanStageLabel,
  getScannerRoleTargetStage,
  getStageDateField,
  isShippingStage,
  requireScannerIdentity,
  requireScannerRoleStageAccess,
} from "../lib/scanGuard";
import {
  buildRegularOrderMissingStyleTotalSql,
  buildRegularOrderStyleTotalSql,
} from "../lib/orderTotals";
import { parseDateOnly } from "../lib/dateOnly";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

const router = Router();

const RETAILER_QR_STATUS_FLOW = SCAN_STAGE_FLOW as OrderStatus[];

const REGULAR_ORDER_STYLE_TOTAL_SQL = buildRegularOrderStyleTotalSql();
const REGULAR_ORDER_MISSING_STYLE_TOTAL_SQL =
  buildRegularOrderMissingStyleTotalSql();
const REGULAR_ADMIN_ORDER_TOTALS_JOIN_SQL = `
    LEFT JOIN (
      SELECT
        os.orderId,
        SUM(${REGULAR_ORDER_STYLE_TOTAL_SQL}) AS total_amount,
        COUNT(*) AS style_count,
        SUM(${REGULAR_ORDER_MISSING_STYLE_TOTAL_SQL}) AS missing_total_values,
        SUM(
          CASE
            WHEN COALESCE(NULLIF(os.totalPrice, 0), NULLIF(os.subtotal, 0), NULLIF(os.unitPrice, 0), pcp.price, p.price) IS NULL
            THEN 1
            ELSE 0
          END
        ) AS unresolved_total_values,
        MAX(COALESCE(os.currencyId, c.currencyId)) AS currencyId,
        MAX(os.currencyCode) AS currencyCode,
        MAX(os.currencySymbol) AS currencySymbol
      FROM orderStyles os
      LEFT JOIN orders style_order ON style_order.id = os.orderId
      LEFT JOIN customers c ON c.id = style_order.customerId
      LEFT JOIN products p ON p.productCode = os.styleNo
      LEFT JOIN product_currency_pricing pcp
        ON pcp.productId = p.id
       AND pcp.currencyId = COALESCE(os.currencyId, c.currencyId)
      GROUP BY os.orderId
    ) total_pay ON total_pay.orderId = o.id
    LEFT JOIN currencies curr ON curr.id = total_pay.currencyId
`;

const logAdminOrderTotalDiagnostics = (rows: any[], scope: string) => {
  const diagnosticRows = rows.filter((row) => {
    const total = Number(row.total || 0);
    const missingStyleTotals = Number(row.missing_total_values || 0);
    const unresolvedStyleTotals = Number(row.unresolved_total_values || 0);

    return total <= 0 || missingStyleTotals > 0 || unresolvedStyleTotals > 0;
  });

  if (!diagnosticRows.length) return;

  console.warn("[AdminOrders] Missing total value diagnostics", {
    scope,
    affectedOrders: diagnosticRows.length,
  });

  diagnosticRows.slice(0, 10).forEach((row) => {
    console.warn("[AdminOrders] Missing total values", {
      scope,
      orderId: row.id,
      purchaseOrderNo: row.order_id,
      styleCount: Number(row.style_count || 0),
      missingStyleTotals: Number(row.missing_total_values || 0),
      unresolvedStyleTotals: Number(row.unresolved_total_values || 0),
      total: Number(row.total || 0),
      paid: Number(row.paid_amount || 0),
      balance: Number(row.balance || 0),
    });
  });
};

const sanitizeText = (value: unknown) => {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return trimmed && trimmed.toLowerCase() !== "null" && trimmed.toLowerCase() !== "undefined"
    ? trimmed
    : "";
};

const getCustomerStoreName = (customer?: { storeName?: string | null; name?: string | null } | null) =>
  sanitizeText(customer?.storeName) || sanitizeText(customer?.name);

async function resolveSubmittedOrGeneratedPurchaseOrderNo(
  submittedPurchaseOrderNo: unknown,
  customerName: string,
) {
  const customerPrefix = customerName
    .split(" ")[0]
    .replace(/[^A-Za-z]/g, "")
    .toUpperCase();
  const generatedPurchaseOrderNo = await generateUniquePO(
    `PO#${customerPrefix || "ORDER"}`,
  );

  return sanitizeText(submittedPurchaseOrderNo) || generatedPurchaseOrderNo;
}

async function resolveRetailerOrderQrStage(req: Request) {
  const order = await RetailerOrder.findOne({
    where: { id: Number(req.params.id), status: 0 },
  });

  if (!order) {
    return null;
  }

  const currentStage = order.orderStatus as OrderStatus;

  const targetStage = getScannerRoleTargetStage(
    (req as any).scannerIdentity?.scannerRoleName,
    RETAILER_QR_STATUS_FLOW,
  );

  return targetStage
    ? {
        currentStage,
        targetStage,
        flowStages: RETAILER_QR_STATUS_FLOW,
        adminGateStage: order.orderStatus,
      }
    : null;
}

const normalizeAcceptedStyleSize = (
  rawSize: unknown,
  fallbackSizeCountry?: string | null,
) => {
  const displaySize = String(rawSize ?? "").trim();
  const countryFromParens =
    displaySize.match(/\(([^)]+)\)\s*$/)?.[1]?.trim().toUpperCase() || "";
  const countryFromPrefix =
    displaySize.match(/^(US|UK|EU|IT)\s+/i)?.[1]?.trim().toUpperCase() || "";
  const sizeCountry =
    countryFromParens ||
    countryFromPrefix ||
    String(fallbackSizeCountry ?? "").trim().toUpperCase();

  return {
    displaySize,
    sizeCountry,
  };
};
// 🔥 Get Latest Purchase Order Number (Fresh Orders Only)
// Used to auto-generate the next PO number for approval page
const hasDirtyPath = (dirtyFields: any, path: string) =>
  path.split(".").reduce((current, key) => current?.[key], dirtyFields) != null;

const hasDirtyValue = (dirtyFields: any): boolean => {
  if (!dirtyFields || typeof dirtyFields !== "object") return false;

  return Object.values(dirtyFields).some((value) =>
    value === true ? true : hasDirtyValue(value),
  );
};

const parseIncomingDate = (value: unknown) => {
  return parseDateOnly(value);
};

const ORDER_QUANTITY_VALIDATION_MESSAGE =
  "Quantity must be greater than 0 for every product/style/size";

const parsePositiveOrderQuantity = (value: unknown) => {
  const textValue = String(value ?? "").trim();
  if (!textValue) return null;

  const quantity = Number(textValue);
  return Number.isInteger(quantity) && quantity > 0 ? quantity : null;
};

const sendQuantityValidationError = (res: Response) =>
  res.status(400).json({
    success: false,
    message: ORDER_QUANTITY_VALIDATION_MESSAGE,
    msg: ORDER_QUANTITY_VALIDATION_MESSAGE,
  });

async function upsertRetailerOrderAdvance(
  order: RetailerOrder,
  amount: unknown,
) {
  const numericAmount = Number(amount);
  if (Number.isNaN(numericAmount) || numericAmount < 0) {
    throw new Error("Advance amount must be a valid number");
  }

  const payments = await RetailerOrdersPayment.find({
    where: { order: { id: order.id } },
    order: { id: "ASC" },
  });
  const payment = payments[0] ?? new RetailerOrdersPayment();

  payment.order = order;
  payment.amount = numericAmount;
  await payment.save();
}

async function syncFreshOrderStyleRows(order: RetailerOrder, style: any) {
  const normalizedSize = normalizeAcceptedStyleSize(style?.size, style?.size_country);
  const desiredQuantity = parsePositiveOrderQuantity(style?.quantity);

  if (!desiredQuantity) {
    throw new Error(ORDER_QUANTITY_VALIDATION_MESSAGE);
  }

  const incomingBarcodes = Array.isArray(style?.barcodes)
    ? style.barcodes.map((barcode: any) => String(barcode)).filter(Boolean)
    : [];

  const existingRows = incomingBarcodes.length
    ? await RetailerOrderStyles.find({ where: { barcode: In(incomingBarcodes) } })
    : await RetailerOrderStyles.find({
        where: {
          retailerOrder: { id: order.id },
          styleNo: String(style?.styleNo ?? ""),
        },
      });

  const sortedRows = existingRows.sort((a, b) => a.id - b.id);
  const rowsToKeep = sortedRows.slice(0, desiredQuantity);
  const rowsToRemove = sortedRows.slice(desiredQuantity);

  for (const row of rowsToKeep) {
    row.styleNo = String(style?.styleNo ?? row.styleNo ?? "");
    row.size = normalizedSize.displaySize;
    row.size_country = normalizedSize.sizeCountry;
    row.quantity = 1;
    await row.save();
  }

  for (const row of rowsToRemove) {
    await row.remove();
  }

  for (let index = rowsToKeep.length; index < desiredQuantity; index++) {
    const row = new RetailerOrderStyles();
    row.retailerOrder = order;
    row.styleNo = String(style?.styleNo ?? "");
    row.size = normalizedSize.displaySize;
    row.size_country = normalizedSize.sizeCountry;
    row.quantity = 1;
    row.photoUrls = JSON.stringify([]);

    await row.save();
    row.barcode = `${order.purchaeOrderNo}-${row.id}`;
    await row.save();
  }
}

async function syncStockOrderStyleRows(order: RetailerOrder, data: any) {
  const normalizedSize = normalizeAcceptedStyleSize(data?.size, data?.size_country);
  const desiredQuantity = parsePositiveOrderQuantity(data?.quantity);

  if (!desiredQuantity) {
    throw new Error(ORDER_QUANTITY_VALIDATION_MESSAGE);
  }

  const existingRows = await StockOrderStyles.find({
    where: { retailerOrder: { id: order.id } },
  });
  const sortedRows = existingRows.sort((a, b) => a.id - b.id);
  const rowsToKeep = sortedRows.slice(0, desiredQuantity);
  const rowsToRemove = sortedRows.slice(desiredQuantity);

  for (const row of rowsToKeep) {
    row.styleNo = String(data?.styleNo ?? row.styleNo ?? "");
    row.size = normalizedSize.displaySize;
    row.size_country = normalizedSize.sizeCountry;
    row.quantity = 1;
    await row.save();
  }

  for (const row of rowsToRemove) {
    await row.remove();
  }

  for (let index = rowsToKeep.length; index < desiredQuantity; index++) {
    const row = new StockOrderStyles();
    row.retailerOrder = order;
    row.styleNo = String(data?.styleNo ?? "");
    row.size = normalizedSize.displaySize;
    row.size_country = normalizedSize.sizeCountry;
    row.quantity = 1;

    await row.save();
    row.barcode = `${order.purchaeOrderNo}-${row.id}`;
    await row.save();
  }
}

router.get(
  "/latest-po",
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const nextNumber = await peekGlobalNextPoNumber();

      return res.json({
        success: true,
        latestPO: nextNumber > 1 ? `PO#GLOBAL ${nextNumber - 1}` : null,
      });
    } catch (err) {
      console.error("Error fetching latest PO:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch latest PO number",
      });
    }
  })
);

router.post(
  "/favourites/:retailerId",
  asyncHandler(async (req: Request, res: Response) => {
    const { favourateData } = req.body;
    const { retailerId } = req.params;
    const favouriteItems = Array.isArray(favourateData)
      ? favourateData
      : favourateData
        ? [favourateData]
        : [];

    if (
      favouriteItems.length === 0 ||
      favouriteItems.some(
        (item: any) => parsePositiveOrderQuantity(item?.quantity) === null,
      )
    ) {
      return sendQuantityValidationError(res);
    }

    const favouriteIds = favouriteItems
      .map((item: any) => Number(item?.id))
      .filter(Boolean);

    if (favouriteIds.length !== favouriteItems.length) {
      return sendQuantityValidationError(res);
    }

    const favouritesInDb = await Favourites.find({
      where: { id: In(favouriteIds) },
    });

    if (
      favouritesInDb.length !== favouriteIds.length ||
      favouritesInDb.some(
        (favorite) => parsePositiveOrderQuantity(favorite.quantity) === null,
      )
    ) {
      return sendQuantityValidationError(res);
    }

    if (favourateData && favourateData.length > 0) {
      for (let index = 0; index < favourateData.length; index++) {
        const favorite = await Favourites.findOne({
          where: {
            id: favourateData[index].id,
          },
        });
        if (favorite) {
          favorite.is_order_placed = 1;
          favorite.customization = favourateData[index].customization;
          // 🔥 Add this here
          favorite.admin_us_size = convertToUSSize(
            favorite.product_size,
            favorite.size_country
          );
          await favorite.save();
        }
      }
    } else {
      const favorite = await Favourites.findOne({
        where: {
          id: favourateData.id,
        },
      });
      if (favorite) {
        favorite.is_order_placed = 1;
        favorite.customization = favourateData.customization;
        await favorite.save();
      }
    }

    const favOrders = new RetailerFavouritesOrders();

    const retailer = await Retailer.findOne({
      where: {
        id: Number(retailerId),
      },
    });
    if (favourateData && favourateData.length > 0) {
      favOrders.favourite_ids = favourateData
        .map((item: any) => item.id)
        .join(",");
    } else {
      favOrders.favourite_ids = favourateData.id;
    }
    if (retailer) {
      favOrders.retailer = retailer;
    }

    await favOrders.save();
    res.json({
      success: true,
      message: "Add to orders",
    });
  })
);
router.post(
  "/admin/address-update/:orderId",
  asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const { address } = req.body;

    const retailerOrder = await RetailerOrder.findOne({
      where: { id: Number(orderId) },
      relations: ["retailer"],
    });

    if (!retailerOrder) {
      return res.status(404).json({ success: false, msg: "Order not found" });
    }

    // Update retailer order table
    retailerOrder.address = address;
    await retailerOrder.save();

    // Update main Order Table as well
    const mainOrder = await Order.findOne({
      where: { id: retailerOrder.id },
    });

    if (mainOrder) {
      mainOrder.address = address;
      await mainOrder.save();
    }

    return res.json({
      success: true,
      message: "Address updated successfully",
      address,
    });
  })
);


router.post(
  "/stock/:retailerId/:stockId/:quantity",
  asyncHandler(async (req: Request, res: Response) => {
    const { retailerId, stockId, quantity } = req.params;
    const { currencyId } = req.body;
    const requestedQty = parsePositiveOrderQuantity(quantity);

    if (!requestedQty) {
      return sendQuantityValidationError(res);
    }

    const retailer = await Retailer.findOne({
      where: {
        id: Number(retailerId),
      },
      relations: ["customer", "customer.currency"],
    });

    const stock = await Stock.findOne({
      where: {
        id: Number(stockId),
      },
      relations: ["currencyPricing", "currencyPricing.currency"],
    });

    if (!stock || !retailer) {
      res.json({
        success: false,
        message: "Fail to orders",
      });
      return;
    }

    if (Number(stock.quantity) < requestedQty) {
      return res.status(400).json({
        success: false,
        message: "Entered quantity exceeds available stock",
      });
    }

    const stock_orders = new RetailerStockOrders();
    stock_orders.admin_us_size = convertToUSSize(
      stock.size,
      stock.size_country
    );


    stock_orders.retailer = retailer;
    stock_orders.quantity = requestedQty;
    stock_orders.stock = stock;
    stock_orders.mesh_color = stock.mesh_color;
    stock_orders.beading_color = stock.beading_color;
    stock_orders.lining = stock.lining;
    stock_orders.lining_color = stock.lining_color;

    // Store retailer's currency for order processing
    let retailerCurrency: any;
    if (retailer.customer && retailer.customer.currency) {
      retailerCurrency = retailer.customer.currency;
    }

    if (retailerCurrency) {
      stock_orders.currency = retailerCurrency;
      stock_orders.currencyId = retailerCurrency.id;
    }

    await stock_orders.save();
    res.json({
      success: true,
      message: "Add to orders",
    });
  })
);

router.get(
  "/customer/:id/:retailerOrderID",
  asyncHandler(async (req: Request, res: Response) => {
    const { id, retailerOrderID } = req.params;

    const retailer = await Retailer.findOneOrFail({
      where: {
        id: Number(id),
      },
    });

    const retailerOrder = await RetailerFavouritesOrders.findOneOrFail({
      where: {
        id: Number(retailerOrderID),
      },
    });

    const approvedData = await RetailerOrder.findOne({
      where: {
        favourite_order: {
          id: Number(retailerOrderID) || 0,
        },
      },
    });

    let splitValue = retailerOrder.favourite_ids.split(",");

    const fav: any = [];

    for (let index = 0; index < splitValue.length; index++) {
      const favourites = await Favourites.findOne({
        where: {
          retailer: {
            id: retailer.id,
          },
          id: Number(splitValue[index]),
          is_order_placed: 1,
        },
        relations: [
          "product",
          "product.images",
          "product.currencyPricing",
          "product.currencyPricing.currency",
          "currency",
        ],
      });

      if (favourites) {
        // Calculate currency-specific price
        let displayPrice = favourites.product.price; // Default Euro price

        if (favourites.currency) {
          // Find product price in favourite's stored currency
          const currencyPricing = favourites.product.currencyPricing.find(
            (pricing) => pricing.currency.id === favourites.currency.id
          );

          if (currencyPricing) {
            displayPrice = currencyPricing.price;
          }
        }

        // Apply size-based graduated markup (matches CASE logic)
        const size = Number(favourites.product_size);
        let markup = 1.0; // Default no markup
        if (size >= 58) {
          markup = 1.6; // 60% markup for sizes 58+
        } else if (size >= 54) {
          markup = 1.4; // 40% markup for sizes 54-57
        } else if (size >= 50) {
          markup = 1.2; // 20% markup for sizes 50-52
        }
        displayPrice = displayPrice * markup;

        // Add currency information for frontend display
        const enhancedFavourite = {
          ...favourites,
          admin_us_size: favourites.admin_us_size, // 🔥 Add this line

          displayPrice: Math.round(displayPrice * favourites.quantity),
          unitPrice: displayPrice,
          currencyName: favourites.currency?.name || null,
          currencySymbol: favourites.currency?.symbol || null,
          regionPrice: displayPrice * favourites.quantity,
        };

        fav.push(enhancedFavourite);
      }
    }

    res.json({
      success: true,
      favourites: fav,
      // rr: favourites,
    });
  })
);

router.get(
  "/customer-stock/:id/:stockId",
  asyncHandler(async (req: Request, res: Response) => {
    const { id, stockId } = req.params;

    // Raw SQL Query with positional parameters
    const query = `
      SELECT 
          rf.id,
          rf.createdAt,
          rf.quantity as buy_quantity,
          s.*,
          CASE
            WHEN CAST(s.size AS SIGNED) >= 58 THEN COALESCE(scp.discountedPrice, s.discountedPrice) * 1.60
            WHEN CAST(s.size AS SIGNED) >= 54 THEN COALESCE(scp.discountedPrice, s.discountedPrice) * 1.40
            WHEN CAST(s.size AS SIGNED) >= 50 THEN COALESCE(scp.discountedPrice, s.discountedPrice) * 1.20
            ELSE COALESCE(scp.discountedPrice, s.discountedPrice)
          END AS unitPrice,
          p.id AS product_id,
          p.createdAt AS product_createdAt,
          p.quantity AS product_quantity,
          p.productCode,
          p.description,
          p.minSaleQuantity,
          p.hasReturnPolicy,
          p.hasDiscount,
          p.stockAlert,
          pm.id AS image_id,
          pm.createdAt AS image_createdAt,
          pm.name AS image_name,
          pm.isMain AS image_isMain,
          c.id AS color_id,
          c.createdAt AS color_createdAt,
          c.name AS color_name,
          c.hexcode AS color_hexcode,
          COALESCE(curr.symbol, '€') as currencySymbol,
          COALESCE(curr.name, 'Euro') as currencyName,
          COALESCE(curr.id, 1) as currencyId
      FROM retailer_stock_orders AS rf
      INNER JOIN stock AS s ON s.id = rf.stockId
      INNER JOIN products AS p ON p.id = s.styleNo
      LEFT JOIN productimages AS pm ON pm.id = (
        SELECT pm2.id
        FROM productimages AS pm2
        WHERE pm2.productId = p.id
        ORDER BY pm2.isMain DESC, pm2.id ASC
        LIMIT 1
      )
      LEFT JOIN product_colours AS c ON c.id = s.colors
      LEFT JOIN currencies curr ON curr.id = rf.currencyId
      LEFT JOIN stock_currency_pricing scp ON scp.stockId = s.id AND scp.currencyId = rf.currencyId
      WHERE rf.id = ? AND rf.retailerId = ?
    `;

    // Execute the raw SQL query using positional parameters
    const result = await db.query(query, [stockId, id]);

    if (result.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Stock not found" });
    }
    // Transform the first row into the desired format
    // const firstRow = result[0];

    res.json({
      success: true,
      favourites: result,
    });
  })
);
router.get(
  "/admin/stock-orders",
  asyncHandler(async (req: Request, res: Response) => {
    const { retailerId, page, query } = req.query as {
      retailerId?: string;
      page?: string;
      query?: string;
    };

    const skip = (page ? Number(page) - 1 : 0) * 10;
    const take = 10;
    const params: any[] = [];
    const whereClauses: string[] = [];

    // Base SQL query
    let dataSql = `
      SELECT 
      DATE_FORMAT(rf.createdAt, '%Y-%m-%d') AS formatted_date,
        rf.id as id,
        s.id as stock_id,
        COALESCE(NULLIF(c.storeName, ''), c.name) AS customerStoreName,
        COALESCE(NULLIF(c.storeName, ''), c.name) AS name,
        p.productCode,
        p.id as product_id,
        rf.quantity,
        s.size as size,
        s.size_country,
        CASE 
          WHEN CAST(s.size AS SIGNED) >= 58 THEN COALESCE(scp.discountedPrice, s.discountedPrice) * 1.60 * rf.quantity
          WHEN CAST(s.size AS SIGNED) >= 54 THEN COALESCE(scp.discountedPrice, s.discountedPrice) * 1.40 * rf.quantity
          WHEN CAST(s.size AS SIGNED) >= 50 THEN COALESCE(scp.discountedPrice, s.discountedPrice) * 1.20 * rf.quantity
          ELSE COALESCE(scp.discountedPrice, s.discountedPrice) * rf.quantity
        END AS total_price,
        COALESCE(curr.symbol, '€') as currencySymbol,
        COALESCE(curr.name, 'Euro') as currencyName
      FROM retailer_stock_orders rf
      INNER JOIN stock s ON s.id = rf.stockId
      INNER JOIN products p ON p.id = s.styleNo
      INNER JOIN retailers r ON r.id = rf.retailerId
      INNER JOIN customers as c on c.id = r.customerId
      LEFT JOIN currencies curr ON curr.id = rf.currencyId
      LEFT JOIN stock_currency_pricing scp ON scp.stockId = s.id AND scp.currencyId = rf.currencyId
    `;

    // Handle retailerId condition
    if (retailerId !== "all") {
      whereClauses.push("rf.retailerId = ?");
      params.push(Number(retailerId));
    }

    // Add is_approved condition
    whereClauses.push("rf.is_approved = 0");

    // Handle search query
    if (query) {
      const likeQuery = `%${query.toLowerCase()}%`;
      whereClauses.push(
        "(LOWER(p.productCode) LIKE ? OR LOWER(c.storeName) LIKE ? OR LOWER(c.name) LIKE ?)"
      );
      params.push(likeQuery, likeQuery, likeQuery);
    }

    // Add WHERE clauses
    dataSql += " WHERE " + whereClauses.join(" AND ");

    // Add ordering and pagination
    dataSql += `
      ORDER BY rf.createdAt DESC
      LIMIT ? OFFSET ?
    `;
    params.push(take, skip);

    // Total count query
    const countSql = `
      SELECT COUNT(*) AS total
      FROM retailer_stock_orders rf
      INNER JOIN stock s ON s.id = rf.stockId
      INNER JOIN products p ON p.id = s.styleNo
      INNER JOIN customers r ON r.id = rf.retailerId
      WHERE ${whereClauses.join(" AND ")}
    `;

    const stockOrders = await db.query(dataSql, params);
    const totalResult = await db.query(countSql, params.slice(0, -2)); // Remove limit/offset params

    return res.json({
      success: true,
      stockOrders: stockOrders,
      totalCount: totalResult?.[0]?.total,
    });
  })
);

router.get(
  "/admin/favorites-orders",
  asyncHandler(async (req: Request, res: Response) => {
    const { retailerId, page, query } = req.query as {
      retailerId?: string;
      page?: string;
      query?: string;
    };

    const skip = (page ? Number(page) - 1 : 0) * 100;
    const take = 100;
    const params: any[] = [];
    const whereClauses: string[] = [];

    // -----------------------------
    // BASE SQL (Correct Joins)
    // -----------------------------
    let dataSql = `
      SELECT 
        rf.id AS id,
        DATE_FORMAT(rf.createdAt, '%Y-%m-%d') AS formatted_date,
        COALESCE(NULLIF(c.storeName, ''), c.name) AS customerStoreName,
        COALESCE(NULLIF(c.storeName, ''), c.name) AS customer_name,
        SUM(f.quantity) AS total_quantity,
        
        -- first favourite id
        MIN(f.id) AS fav_id,

        -- Total amount with markup
        SUM(
          CASE
            WHEN CAST(f.product_size AS SIGNED) >= 58 THEN COALESCE(pcp.price, p.price) * 1.60 * f.quantity
            WHEN CAST(f.product_size AS SIGNED) >= 54 THEN COALESCE(pcp.price, p.price) * 1.40 * f.quantity
            WHEN CAST(f.product_size AS SIGNED) >= 50 THEN COALESCE(pcp.price, p.price) * 1.20 * f.quantity
            ELSE COALESCE(pcp.price, p.price) * f.quantity
          END
        ) AS total_amount,

        GROUP_CONCAT(f.admin_us_size) AS admin_us_size,
        GROUP_CONCAT(f.product_size) AS product_size,
        GROUP_CONCAT(f.size_country) AS size_country,

        rf.retailerId AS retailerId,

        MAX(curr.symbol) AS currencySymbol,
        MAX(curr.name) AS currencyName

      FROM retailer_favourites_orders rf
      INNER JOIN retailers r ON r.id = rf.retailerId
      INNER JOIN customers c ON c.id = r.customerId
      INNER JOIN favourites f ON FIND_IN_SET(f.id, rf.favourite_ids) > 0
      LEFT JOIN currencies curr ON curr.id = f.currencyId
      LEFT JOIN product_currency_pricing pcp 
            ON pcp.productId = f.productId 
           AND pcp.currencyId = f.currencyId
      INNER JOIN products p ON p.id = f.productId
    `;

    // -----------------------------
    // FILTERS
    // -----------------------------

    // Retailer filter
    if (retailerId && retailerId !== "all") {
      whereClauses.push("rf.retailerId = ?");
      params.push(Number(retailerId));
    }

    // Show only pending orders
    whereClauses.push("rf.is_approved = 0");

    // Search
    if (query) {
      const likeQuery = `%${query.toLowerCase()}%`;
      whereClauses.push(
        "(LOWER(c.storeName) LIKE ? OR LOWER(c.name) LIKE ? OR LOWER(p.productCode) LIKE ?)"
      );
      params.push(likeQuery, likeQuery, likeQuery);
    }

    if (whereClauses.length > 0) {
      dataSql += " WHERE " + whereClauses.join(" AND ");
    }

    // -----------------------------
    // GROUP + PAGINATION
    // -----------------------------
    dataSql += `
      GROUP BY rf.id
      ORDER BY rf.createdAt DESC
      LIMIT ? OFFSET ?
    `;

    params.push(take, skip);

    // -----------------------------
    // COUNT QUERY FIXED
    // -----------------------------
    const countSql = `
      SELECT COUNT(*) AS total
      FROM retailer_favourites_orders rf
      WHERE rf.is_approved = 0
      ${retailerId && retailerId !== "all" ? "AND rf.retailerId = ?" : ""}
    `;

    const countParams =
      retailerId && retailerId !== "all" ? [Number(retailerId)] : [];

    // -----------------------------
    // EXECUTION
    // -----------------------------
    const favoritesOrders = await db.query(dataSql, params);
    const totalResult = await db.query(countSql, countParams);

    return res.json({
      success: true,
      favoritesOrders,
      totalCount: totalResult?.[0]?.total || 0,
    });
  })
);

router.get(
  "/admin/stock-order/form/:id/:status",
  asyncHandler(async (req: Request, res: Response) => {
    const { id, status } = req.params;

    console.log("[DEBUG] Route hit /admin/stock-order/form/:id/:status", {
      params: { id, status },
      rawUrl: req.originalUrl,
      timestamp: new Date().toISOString(),
    });

    // Validate params early
    if (!id || isNaN(Number(id))) {
      console.error("[DEBUG] Invalid or missing 'id' param:", id);
      return res.status(400).json({ success: false, error: "Invalid id param" });
    }
    if (status === undefined || status === null) {
      console.error("[DEBUG] Missing 'status' param");
      return res.status(400).json({ success: false, error: "Missing status param" });
    }

    console.log("[DEBUG] Params validated | id:", id, "| status:", status, "| status coerced:", Number(status));

    let query = `
  SELECT 
  DATE_FORMAT(MIN(rf.createdAt), '%Y-%m-%d') AS received,
  rf.id as id,
  MIN(ro.id) AS retailerOrderId,
  MIN(ro.purchaeOrderNo) AS purchaseOrderNo,
  MIN(ro.manufacturingEmailAddress) AS manufacturingEmailAddress,
  MIN(ro.orderReceivedDate) AS orderReceivedDate,
  MIN(ro.orderCancellationDate) AS orderCancellationDate,
  MIN(ro.address) AS address,
  MIN(ro.invoiceNo) AS invoiceNo,
  MIN(ro.estimateNo) AS estimateNo,
  MIN(ro.shippingAmount) AS shippingAmount,
  MIN(ro.purchaseAmount) AS purchaseAmount,
  MIN(payments.paidAmount) AS paidAmount,
  MIN(s.id) as stock_id,
  MIN(r.name) as name,
  MIN(r.email) as email,
  MIN(p.productCode) as productCode,
  COALESCE(MAX(sos.quantity), MIN(rf.quantity)) as quantity,
  MIN(s.size) as size,
  MIN(rf.retailerId) as retailer_id,
  MIN(COALESCE(scp.discountedPrice, s.discountedPrice) * rf.quantity) as total_price,
  MIN(r.storeAddress) as storeAddress,
  MIN(s.size_country) as size_country,
  COALESCE(MIN(pm.name), '') as image,
  MIN(rf.mesh_color) as mesh_color,
  MIN(rf.beading_color) as beading_color,
  MIN(rf.lining) as lining,
  MIN(rf.lining_color) as lining_color,
  MIN(COALESCE(curr.symbol, '€')) as currencySymbol,
  MIN(COALESCE(curr.name, 'Euro')) as currencyName,
  MIN(s.styleNo) as product_id,
  sos.barcode AS barcode

FROM retailer_stock_orders rf

LEFT JOIN retailer_orders ro 
  ON ro.stockOrderId = rf.id

LEFT JOIN stock_order_styles sos 
  ON sos.retailerOrderId = ro.id

LEFT JOIN (
  SELECT orderId, SUM(amount) AS paidAmount
  FROM retailer_order_payments
  GROUP BY orderId
) payments ON payments.orderId = ro.id

INNER JOIN stock s ON s.id = rf.stockId
INNER JOIN products p ON p.id = s.styleNo
INNER JOIN retailers ret ON ret.id = rf.retailerId
INNER JOIN customers r ON r.id = ret.customerId
LEFT JOIN productimages pm ON pm.productId = s.styleNo
LEFT JOIN currencies curr ON curr.id = rf.currencyId
LEFT JOIN stock_currency_pricing scp 
  ON scp.stockId = s.id AND scp.currencyId = rf.currencyId

WHERE rf.id = ? 
  AND rf.is_approved = ?

GROUP BY rf.id, curr.symbol, sos.barcode;
`;

    console.log("[DEBUG] Executing query with bindings:", { id, status });

    let dd;
    try {
      dd = await db.query(query, [id, status]);
      console.log("[DEBUG] Query succeeded | Row count:", Array.isArray(dd) ? dd.length : "N/A");

      if (!dd || (Array.isArray(dd) && dd.length === 0)) {
        console.warn("[DEBUG] Query returned no rows — check if rf.id =", id, "exists and is_approved =", status, "matches");
      } else {
        // Log first row only to inspect shape without flooding logs
        console.log("[DEBUG] First row sample:", JSON.stringify(dd[0], null, 2));
      }
    } catch (queryErr: any) {
      console.error("[DEBUG] Query FAILED:", {
        message: queryErr.message,
        sqlMessage: queryErr.sqlMessage,   // MySQL-specific: shows exact SQL error
        sqlState: queryErr.sqlState,       // MySQL-specific: e.g. '42S22' = unknown column
        errno: queryErr.errno,
        sql: queryErr.sql,                 // The actual query that ran
        bindings: [id, status],
      });
      throw queryErr;
    }

    console.log("[DEBUG] Sending response");
    res.json({
      success: true,
      details: dd,
    });
  })
);

// router.get(
//   "/admin/stock-order/form/:id/:status",
//   asyncHandler(async (req: Request, res: Response) => {
//     const { id, status } = req.params;

//     console.log(id, status);

//     let query = `
//   SELECT 
//   DATE_FORMAT(rf.createdAt, '%Y-%m-%d') AS received,
//   rf.id as id,
//   s.id as stock_id,
//   r.name,
//   r.email as email,
//   p.productCode,
//   rf.quantity,
//   s.size as size,
//   rf.retailerId as retailer_id,
//   COALESCE(scp.discountedPrice, s.discountedPrice) * rf.quantity as total_price,
//   r.storeAddress,
//   r.email,
//   s.size_country,
//   pm.name as image,
//   rf.mesh_color,
//   rf.beading_color,
//   rf.lining,
//   rf.lining_color,
//   COALESCE(curr.symbol, '€') as currencySymbol,
//   COALESCE(curr.name, 'Euro') as currencyName,
//   s.styleNo as product_id,

//   -- ⭐ Correct barcode source
//   sos.barcode AS barcode

// FROM retailer_stock_orders rf

// -- 🔥 Correct join: retailer_orders
// LEFT JOIN retailer_orders ro 
//   ON ro.stockOrderId = rf.id

// -- 🔥 Correct join: stock_order_styles
// LEFT JOIN stock_order_styles sos 
//   ON sos.retailerOrderId = ro.id

// INNER JOIN stock s ON s.id = rf.stockId
// INNER JOIN products p ON p.id = s.styleNo
// INNER JOIN retailers ret ON ret.id = rf.retailerId
// INNER JOIN customers r ON r.id = ret.customerId
// INNER JOIN productimages pm ON pm.productId = s.styleNo
// LEFT JOIN currencies curr ON curr.id = rf.currencyId
// LEFT JOIN stock_currency_pricing scp 
//   ON scp.stockId = s.id AND scp.currencyId = rf.currencyId

// WHERE rf.id = ? 
//   AND rf.is_approved = ?

// GROUP BY rf.id, sos.barcode;
// `;


//     const dd = await db.query(query, [id, status]);

//     res.json({
//       success: true,
//       details: dd,
//     });
//   })
// );


// Api to fetch price based on size and currency for a specific favourite order (used in approval form)
router.get(
  "/admin/favorites-order/details/:id/:status",
  asyncHandler(async (req: Request, res: Response) => {
    const { id, status } = req.params;

    const sql = `
    SELECT 
        MIN(f.admin_us_size) AS admin_us_size,
        f.id AS fav_id,
        MIN(COALESCE(ros.quantity, f.quantity)) AS quantity,
        rf.id AS favouriteOrderId,

        -- 🔥 ACTUAL RETAILER ORDER ID
        ro.id AS retailerOrderId,
        MIN(ro.purchaeOrderNo) AS purchaseOrderNo,
        MIN(ro.orderCancellationDate) AS orderCancellationDate,
        MIN(ro.invoiceNo) AS invoiceNo,
        MIN(ro.estimateNo) AS estimateNo,
        MIN(ro.shippingAmount) AS shippingAmount,
        MIN(ro.purchaseAmount) AS purchaseAmount,
        MIN(payments.paidAmount) AS paidAmount,

        p.id AS product_id,
        MIN(pm.name) AS image,
        MIN(f.retailerId) AS retailerId,

        -- 🔥 BARCODE (FINAL)
        ros.barcode AS barcode,

        MIN(COALESCE(NULLIF(ros.size, ''), NULLIF(f.admin_us_size, ''), CAST(f.product_size AS CHAR))) AS size,
        MIN(f.product_size) AS original_size,
        MIN(COALESCE(NULLIF(c.storeName, ''), c.name)) AS customerStoreName,
        MIN(COALESCE(NULLIF(c.storeName, ''), c.name)) AS customer_name,
        MIN(COALESCE(ro.manufacturingEmailAddress, c.email)) AS manufacturingEmailAddress,
        MIN(c.phoneNumber) AS phoneNumber,
        MIN(p.productCode) AS styleNo,
        MIN(COALESCE(ro.orderReceivedDate, rf.createdAt)) AS orderReceivedDate,
        MIN(COALESCE(ro.address, c.storeAddress)) AS address,

        MIN(f.color) AS color,
        MIN(f.mesh_color) AS mesh_color,
        MIN(f.beading_color) AS beading_color,
        MIN(f.add_lining) AS add_lining,
        MIN(f.lining) AS lining,
        MIN(f.lining_color) AS lining_color,
        MIN(f.reference_image) AS reference_image,
        MIN(f.customization) AS comments,
        MIN(f.customization_price) AS customization_price,
        MIN(COALESCE(NULLIF(ros.size_country, ''), f.size_country)) AS size_country,

        MIN(COALESCE(NULLIF(f.product_price, 0) * f.quantity, CASE 
            WHEN CAST(f.product_size AS SIGNED) >= 58 THEN COALESCE(pcp.price, p.price) * 1.60 * f.quantity
            WHEN CAST(f.product_size AS SIGNED) >= 54 THEN COALESCE(pcp.price, p.price) * 1.40 * f.quantity
            WHEN CAST(f.product_size AS SIGNED) >= 50 THEN COALESCE(pcp.price, p.price) * 1.20 * f.quantity
            ELSE COALESCE(pcp.price, p.price) * f.quantity
        END)) AS total_amount,

        MIN(COALESCE(NULLIF(f.product_price, 0), CASE
            WHEN CAST(f.product_size AS SIGNED) >= 58 THEN COALESCE(pcp.price, p.price) * 1.60
            WHEN CAST(f.product_size AS SIGNED) >= 54 THEN COALESCE(pcp.price, p.price) * 1.40
            WHEN CAST(f.product_size AS SIGNED) >= 50 THEN COALESCE(pcp.price, p.price) * 1.20
            ELSE COALESCE(pcp.price, p.price)
        END)) AS price,

        MIN(curr.symbol) AS currencySymbol,
        MIN(curr.name) AS currencyName

    FROM retailer_favourites_orders rf

    INNER JOIN favourites f 
        ON FIND_IN_SET(f.id, rf.favourite_ids) > 0

    INNER JOIN products p 
        ON p.id = f.productId

    INNER JOIN productimages pm 
        ON pm.productId = p.id

    INNER JOIN retailers r 
        ON r.id = f.retailerId

    INNER JOIN customers c 
        ON c.id = r.customerId

    -- 🔥 APPROVED RETAILER ORDER
    LEFT JOIN retailer_orders ro
        ON ro.favouriteOrderId = rf.id

    LEFT JOIN (
        SELECT orderId, SUM(amount) AS paidAmount
        FROM retailer_order_payments
        GROUP BY orderId
    ) payments ON payments.orderId = ro.id

    -- 🔥 BARCODE TABLE
    LEFT JOIN retailer_order_styles ros
        ON ros.retailerOrderId = ro.id
       AND ros.styleNo = p.productCode
       AND (
            ros.size = CAST(f.admin_us_size AS CHAR)
         OR ros.size = CAST(f.product_size AS CHAR)
         OR ros.size = CONCAT(CAST(f.product_size AS CHAR), ' (', f.size_country, ')')
       )
       AND (
            ros.size_country = f.size_country
         OR ros.size_country IS NULL
         OR ros.size_country = ''
       )

    LEFT JOIN currencies curr 
        ON curr.id = f.currencyId

    LEFT JOIN product_currency_pricing pcp 
        ON pcp.productId = p.id 
       AND pcp.currencyId = f.currencyId

    WHERE rf.id = ?
      AND rf.is_approved = ?

    GROUP BY 
        f.id,
        rf.id,
        ro.id,
        p.id,
        ros.barcode;
    `;

    const data = await db.query(sql, [id, status]);

    res.json({
      success: true,
      data,
    });
  })
);


router.post(
  "/admin/accepted/stock-order",
  asyncHandler(async (req: Request, res: Response) => {
    const { data } = req.body;
    const requestedQty = parsePositiveOrderQuantity(data?.quantity);

    if (!data || !requestedQty) {
      return sendQuantityValidationError(res);
    }

    // ------------------------
    // 🔥 1. Find stock
    // ------------------------
    const stock = await Stock.findOne({
      where: { id: data.stock_id },
    });

    if (!stock) {
      return res.json({ success: false, msg: "Stock not found" });
    }

    if (stock.quantity < requestedQty) {
      return res.json({
        success: false,
        message: "No Stock Available",
      });
    }

    // ------------------------
    // 🔥 2. Find Retailer
    // ------------------------
    const retailer = await Retailer.findOne({
      where: { id: data.retailerId },
      relations: ["customer"],
    });

    if (!retailer) {
      return res.json({ success: false, msg: "Retailer not found" });
    }

    // ------------------------
    // 🔥 3. Find RetailerStockOrders (child)
    // ------------------------
    const stock_retailer = await RetailerStockOrders.findOne({
      where: { id: data.id },
    });

    if (!stock_retailer) {
      return res.json({ success: false, msg: "Stock order not found" });
    }

    // ------------------------
    // 🔥 4. CREATE MAIN ORDER (parent)
    // ------------------------
    const order = new RetailerOrder();

    order.address = data.address;
    order.phoneNumber = data.phoneNumber || retailer.customer.phoneNumber;

    // Resolve submitted PO, falling back to the global sequence.
    const purchaseOrderNo = await resolveSubmittedOrGeneratedPurchaseOrderNo(
      data.purchaseOrderNo,
      getCustomerStoreName(retailer.customer),
    );

    order.purchaeOrderNo = purchaseOrderNo;
    order.hasId = data.color;
    order.purchaseAmount = data.total_amount;
    order.is_stock_order = true;

    order.manufacturingEmailAddress =
      data.email || retailer.customer.email;

    const orderCancellationDate = parseIncomingDate(data.orderCancellationDate);
    const orderReceivedDate = parseIncomingDate(data.received_date);

    if (!orderCancellationDate || !orderReceivedDate) {
      return res.status(400).json({
        success: false,
        message: "Valid order received and shipping dates are required",
      });
    }

    order.orderCancellationDate = orderCancellationDate;
    order.orderReceivedDate = orderReceivedDate;

    order.Stock_order = stock_retailer;
    order.retailer = retailer;

    order.Size = data.size;
    order.StyleNo = data.styleNo;
    order.size_country = data.size_country;
    order.quantity = String(requestedQty);

    order.invoiceNo = data.invoice;
    order.estimateNo = data.estimate;
    order.shippingAmount = data.shipping;

    stock_retailer.is_approved = 1;

    // Reduce stock quantity
    stock.quantity = stock.quantity - requestedQty;

    await order.save();

    // ------------------------
    // 🔥 5. INSERT STOCK STYLE + GENERATE BARCODE
    // ------------------------
    const createdStyles: Array<{
      styleNo: string;
      size: string;
      size_country: string;
      quantity: number;
      barcode: string;
    }> = [];
    const pieceCount = requestedQty;

    for (let pieceIndex = 0; pieceIndex < pieceCount; pieceIndex++) {
      const stockStyle = new StockOrderStyles();
      stockStyle.retailerOrder = order;
      stockStyle.styleNo = data.styleNo;
      stockStyle.size = data.size;
      stockStyle.size_country = data.size_country;
      stockStyle.quantity = 1; // one row = one physical piece

      await stockStyle.save(); // generate ID first

      stockStyle.barcode = `${order.purchaeOrderNo}-${stockStyle.id}`;
      await stockStyle.save();

      createdStyles.push({
        styleNo: stockStyle.styleNo,
        size: stockStyle.size,
        size_country: stockStyle.size_country,
        quantity: stockStyle.quantity,
        barcode: stockStyle.barcode,
      });
    }

    // ------------------------
    // 🔥 6. Payment Entry
    // ------------------------
    const payment = new RetailerOrdersPayment();
    payment.amount = Number(data.advance) || 0;
    payment.order = order;

    await stock_retailer.save();
    await stock.save();
    await payment.save();

    return res.json({
      success: true,
      msg: "Stock Order Accepted Successfully",
      message: "Stock Order Accepted Successfully",
      orderId: order.id,
      purchaseOrderNo: order.purchaeOrderNo,
      po_number: order.purchaeOrderNo,
      barcode: createdStyles[0]?.barcode ?? null,
      barcodes: createdStyles.map((style) => style.barcode),
      createdStyles,
    });
  })
);

// Adjust global PO sequence (admin tool)
router.post(
  "/sequence",
  asyncHandler(async (req: Request, res: Response) => {
    const { nextNumber } = req.body as { nextNumber?: number };
    if (!nextNumber || isNaN(Number(nextNumber))) {
      return res.status(400).json({ success: false, msg: "Invalid nextNumber" });
    }

    const newNext = await setGlobalPoSequence(Number(nextNumber));

    res.json({
      success: true,
      nextSequence: newNext,
      message: `Next PO sequence set to ${newNext}`,
    });
  })
);


router.post(
  "/admin/accepted/favorites-order",
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { orderData } = req.body;

      if (!orderData) {
        return res.json({ success: false, msg: "Invalid order data" });
      }

      // -------------------------------
      // 🔹 Get Retailer + Resolve PO
      // -------------------------------
      const retailer = await Retailer.findOne({
        where: { id: orderData.retailerId },
        relations: ["customer"],
      });

      if (!retailer) {
        return res.json({ success: false, msg: "Retailer not found" });
      }

      const purchaseOrderNo = await resolveSubmittedOrGeneratedPurchaseOrderNo(
        orderData.purchaseOrderNo,
        getCustomerStoreName(retailer.customer),
      );
      const normalizedStyles = Array.isArray(orderData.styles)
        ? orderData.styles.map((style: any) => {
            const normalizedSize = normalizeAcceptedStyleSize(
              style?.size,
              style?.size_country,
            );

            return {
              ...style,
              normalizedSize: normalizedSize.displaySize,
              normalizedSizeCountry: normalizedSize.sizeCountry,
              normalizedQuantity: parsePositiveOrderQuantity(style?.quantity),
            };
          })
        : [];

      if (
        normalizedStyles.length === 0 ||
        normalizedStyles.some((style: any) => !style.normalizedQuantity)
      ) {
        return sendQuantityValidationError(res);
      }

      // -------------------------------
      // 🔹 Update favourites (price + customization)
      // -------------------------------
      for (let i = 0; i < normalizedStyles.length; i++) {
        const favItem = normalizedStyles[i];

        const fav = await Favourites.findOne({
          where: { id: favItem.fav_id },
        });

        if (fav) {
          fav.product_price = Number(favItem.amount) || fav.product_price || 0;
          fav.customization_price = Number(favItem.customization_p) || 0;
          fav.quantity = favItem.normalizedQuantity;
          fav.customization =
            typeof favItem.comments === "string"
              ? favItem.comments
              : fav.customization;
          fav.color =
            typeof favItem.customColor === "string" && favItem.customColor.trim()
              ? favItem.customColor.trim()
              : fav.color;
          fav.mesh_color =
            typeof favItem.meshColor === "string" && favItem.meshColor.trim()
              ? favItem.meshColor.trim()
              : fav.mesh_color;
          fav.beading_color =
            typeof favItem.beadingColor === "string" && favItem.beadingColor.trim()
              ? favItem.beadingColor.trim()
              : fav.beading_color;
          fav.lining =
            typeof favItem.lining === "string" && favItem.lining.trim()
              ? favItem.lining.trim()
              : fav.lining;

          if (favItem.normalizedSize) {
            fav.admin_us_size = favItem.normalizedSize;
          }

          if (favItem.normalizedSizeCountry) {
            fav.size_country = favItem.normalizedSizeCountry;
          }

          if (
            typeof favItem.lining === "string" &&
            favItem.lining.trim().length > 0
          ) {
            fav.add_lining = favItem.lining === "No Lining" ? 0 : 1;
            fav.lining_color =
              favItem.lining === "No Lining"
                ? "No Color"
                : typeof favItem.liningColor === "string" &&
                    favItem.liningColor.trim()
                  ? favItem.liningColor.trim()
                  : fav.lining_color;
          }

          await fav.save();
        }
      }

      // -------------------------------
      // 🔹 Approve favourite order
      // -------------------------------
      const favOrders = await RetailerFavouritesOrders.findOne({
        where: { id: orderData.rfo_id }
      });

      if (!favOrders) {
        return res.json({ success: false, msg: "Favorite order not found" });
      }

      favOrders.is_approved = 1;
      await favOrders.save();

      // -------------------------------
      // 🔹 Create Main Order
      // -------------------------------
      const order = new RetailerOrder();

      order.purchaeOrderNo = purchaseOrderNo;
      order.retailer = retailer;
      order.favourite_order = favOrders;

      order.address = orderData.address;
      order.manufacturingEmailAddress = orderData.manufacturingEmailAddress;
      order.phoneNumber = orderData.phoneNumber || retailer.customer.phoneNumber;

      const orderReceivedDate = parseIncomingDate(orderData.orderReceivedDate);
      const orderCancellationDate = parseIncomingDate(orderData.orderCancellationDate);

      if (!orderReceivedDate || !orderCancellationDate) {
        return res.status(400).json({
          success: false,
          message: "Valid order received and shipping dates are required",
        });
      }

      order.orderReceivedDate = orderReceivedDate;
      order.orderCancellationDate = orderCancellationDate;

      order.purchaseAmount = orderData.total_amount;
      order.shippingAmount = orderData.shipping;
      order.Size = normalizedStyles
        .map((style: any) => style.normalizedSize)
        .join(",");
      order.StyleNo = normalizedStyles
        .map((style: any) => style.styleNo)
        .join(",");
      order.size_country = normalizedStyles
        .map((style: any) => style.normalizedSizeCountry)
        .join(",");
      order.quantity = normalizedStyles
        .map((style: any) => String(style.normalizedQuantity))
        .join(",");

      order.is_stock_order = false;
      order.invoiceNo = orderData.invoice;
      order.estimateNo = orderData.estimate;

      // -------------------------------
      // ⭐⭐ MOST IMPORTANT FIX ⭐⭐
      // -------------------------------
      order.isApproved = true;
      order.status_id = 0;             // 👈 approved state
      order.status = 0;                // 👈 active (not deleted)
      order.orderStatus = OrderStatus.Pattern;

      await order.save();

      // -------------------------------
      // 🔹 Insert styles + barcode generation
      // -------------------------------
      const createdStyles: Array<{
        fav_id: number | null;
        styleNo: string;
        size: string;
        size_country: string;
        quantity: number;
        barcode: string;
      }> = [];

      if (normalizedStyles.length > 0) {
        for (let i = 0; i < normalizedStyles.length; i++) {
          const style = normalizedStyles[i];
          const pieceCount = style.normalizedQuantity;

          for (let pieceIndex = 0; pieceIndex < pieceCount; pieceIndex++) {
            const ros = new RetailerOrderStyles();
            ros.retailerOrder = order;
            ros.styleNo = style.styleNo;
            ros.quantity = 1; // one row = one physical piece
            ros.size = style.normalizedSize;
            ros.size_country = style.normalizedSizeCountry;
            ros.photoUrls = JSON.stringify([]);

            await ros.save(); // generate ID
            ros.barcode = `${order.purchaeOrderNo}-${ros.id}`;
            await ros.save();

            createdStyles.push({
              fav_id: style.fav_id ? Number(style.fav_id) : null,
              styleNo: ros.styleNo,
              size: ros.size,
              size_country: ros.size_country,
              quantity: ros.quantity,
              barcode: ros.barcode,
            });
          }
        }
      }

      // -------------------------------
      // 🔹 Save Payment
      // -------------------------------
      const payment = new RetailerOrdersPayment();
      payment.amount = Number(orderData.advance) || 0;
      payment.order = order;
      await payment.save();

      return res.json({
        success: true,
        msg: "Order Accepted",
        purchaseOrderNo: order.purchaeOrderNo,
        orderId: order.id,
        createdStyles,
      });

    } catch (err) {
      console.error("FRESH ORDER ACCEPT ERROR:", err);
      return res.json({
        success: false,
        msg: "Something went wrong while accepting order",
      });
    }
  })
);



router.patch(
  "/admin/stock-order/reject",
  asyncHandler(async (req: Request, res: Response) => {
    const { comment, id } = req.body;
    const retailerStock = await RetailerStockOrders.findOne({
      where: {
        id: Number(id),
      },
    });

    if (retailerStock) {
      retailerStock.rejected_comments = comment;
      retailerStock.is_approved = 3;
      await retailerStock.save();
    }

    res.json({
      success: true,
      msg: "Rejected Successfully",
    });
  })
);

router.patch(
  "/admin/fresh-order/reject",
  asyncHandler(async (req: Request, res: Response) => {
    const { comment, id } = req.body;
    const retailerStock = await RetailerFavouritesOrders.findOne({
      where: {
        id: Number(id),
      },
    });

    if (retailerStock) {
      retailerStock.rejected_comments = comment;
      retailerStock.is_approved = 3;
      await retailerStock.save();
    }

    res.json({
      success: true,
      msg: "Rejected Successfully",
    });
  })
);

router.get(
  "/orders/accepted/customer/:isApprovedStatus",
  asyncHandler(async (req: Request, res: Response) => {
    const { isApprovedStatus } = req.params;
    const { retailerId, page, query } = req.query as {
      retailerId?: string;
      page?: string;
      query?: string;
    };

    // Validate isApprovedStatus
    const isApproved = Number(isApprovedStatus);
    if (isNaN(isApproved) || ![0, 1].includes(isApproved)) {
      return res.status(400).json({
        success: false,
        message: "Invalid isApproved value. Must be 0 or 1",
      });
    }

    // Pagination setup
    const skip = (page ? Number(page) - 1 : 0) * 10;
    const take = 10;
    const params: any[] = [];
    const whereClauses: string[] = [];

    // Main query with LEFT JOIN optimization
    let dataSql = `
      SELECT 
      DATE_FORMAT(ro.createdAt, '%Y-%m-%d') AS formatted_date,
        ro.purchaeOrderNo as order_id,
        ro.id,
        ro.trackingNo,
        CASE 
          WHEN ro.is_stock_order = 1 THEN 'Stock' 
          ELSE 'Fresh' 
        END AS type,
       COALESCE(ro.stockOrderId , ro.favouriteOrderId) as childId,
         payments.orderId as payment_id,
        ro.purchaseAmount AS total,
        DATE_FORMAT(ro.orderReceivedDate,'%Y-%m-%d')  AS orderReceivedDate,
        DATE_FORMAT(ro.orderCancellationDate,'%Y-%m-%d')  AS orderCancellationDate,
        ro.manufacturingEmailAddress as email,
        ro.orderStatus,
          ro.favouriteOrderId,
        ro.stockOrderId,
        IFNULL(payments.paid_amount, 0) AS paid_amount,
        (ro.purchaseAmount - IFNULL(payments.paid_amount, 0)) AS balance,
        COALESCE(stockCurr.symbol, favCurr.symbol, curr.symbol) as currencySymbol,
        COALESCE(stockCurr.name, favCurr.name, curr.name) as currencyName
      FROM retailer_orders AS ro
      LEFT JOIN (
        SELECT orderId, SUM(amount) AS paid_amount 
        FROM retailer_order_payments 
        GROUP BY orderId
      ) AS payments ON payments.orderId = ro.id
      LEFT JOIN retailers r ON r.id = ro.retailerId
      LEFT JOIN customers c ON c.id = r.customerId
      LEFT JOIN currencies curr ON curr.id = c.currencyId
      /* Fresh orders: currency stored on favourites */
      LEFT JOIN (
        SELECT 
          rfo.id as favouriteOrderId,
          MAX(curr.symbol) as symbol,
          MAX(curr.name) as name
        FROM retailer_favourites_orders rfo
        JOIN favourites f ON FIND_IN_SET(f.id, rfo.favourite_ids) > 0
        LEFT JOIN currencies curr ON curr.id = f.currencyId
        GROUP BY rfo.id
      ) favCurr ON favCurr.favouriteOrderId = ro.favouriteOrderId
      /* Stock orders: currency stored on retailer_stock_orders */
      LEFT JOIN (
        SELECT 
          rso.id as stockOrderId,
          curr.symbol as symbol,
          curr.name as name
        FROM retailer_stock_orders rso
        LEFT JOIN currencies curr ON curr.id = rso.currencyId
      ) stockCurr ON stockCurr.stockOrderId = ro.stockOrderId
    `;

    // Build WHERE clauses
    if (retailerId) {
      whereClauses.push("ro.retailerId = ?");
      params.push(Number(retailerId));
    }

    whereClauses.push("ro.status_id = ?");
    whereClauses.push("ro.status = 0 ");

    params.push(isApproved);

    if (query) {
      const likeQuery = `%${query.toLowerCase()}%`;
      whereClauses.push("LOWER(ro.purchaeOrderNo) LIKE ?");
      params.push(likeQuery);
    }

    // Add WHERE conditions
    if (whereClauses.length > 0) {
      dataSql += " WHERE " + whereClauses.join(" AND ");
    }

    // Add pagination
    dataSql += " ORDER BY ro.createdAt DESC LIMIT ? OFFSET ?";
    params.push(take, skip);

    // Count query (EXCLUDE limit/offset params)
    const countSql = `
      SELECT COUNT(*) AS total
      FROM retailer_orders AS ro
     ${whereClauses.length > 0
        ? "WHERE " + "ro.status = 0 AND" + " " + whereClauses.join(" AND ")
        : " WHERE ro.status = 0 "
      }
    `;

    // Execute queries
    const [retailerOrders, totalResult] = await Promise.all([
      db.query(dataSql, params),
      db.query(countSql, params.slice(0, -2)), // Correct parameter slicing
    ]);

    return res.json({
      success: true,
      retailerOrders,
      totalCount: totalResult?.[0]?.total || 0,
    });
  })
);


router.get(
  "/customer/accepted/fresh/:id/:retailerOrderID/:paymentId",
  asyncHandler(async (req: Request, res: Response) => {
    const { id, retailerOrderID, paymentId } = req.params;

    // FIND RETAILER ORDER
    const retailerOrder = await RetailerOrder.findOne({
      where: { id: Number(paymentId) },
    });
    if (!retailerOrder) {
      return res.json({ success: false });
    }

    // PAYMENT HISTORY
    const paymentHis = await RetailerOrdersPayment.find({
      where: { order: { id: retailerOrder.id }, amount: MoreThan(0) },
      order: { id: "DESC" },
    });

    const paidAmount = paymentHis.reduce(
      (sum, payment) => sum + (payment.amount || 0),
      0
    );

    // FETCH APPROVED FAVOURITE ORDER
    const retailerFreshOrder = await RetailerFavouritesOrders.findOneOrFail({
      where: { id: Number(retailerOrderID) },
    });

    let splitValue = retailerFreshOrder.favourite_ids.split(",");
    const fav: any = [];

    // FETCH FAVOURITE ITEMS
    for (let index = 0; index < splitValue.length; index++) {
      const favourites = await Favourites.findOne({
        where: {
          retailer: { id: Number(id) },
          id: Number(splitValue[index]),
        },
        relations: [
          "product",
          "product.images",
          "product.currencyPricing",
          "product.currencyPricing.currency",
          "currency",
        ],
      });

      if (favourites) {
        fav.push({
          ...favourites,
          admin_us_size: favourites.admin_us_size, // USA SIZE INCLUDED
        });
      }
    }

    // CURRENCY INFO
    let currencyInfo = null;
    if (fav.length > 0 && fav[0]?.currency) {
      currencyInfo = {
        symbol: fav[0].currency.symbol,
        name: fav[0].currency.name,
        id: fav[0].currency.id,
      };
    }

    // 🔥 FETCH ALL STYLES WITH BARCODE
    const styles = await RetailerOrderStyles.find({
      where: { retailerOrder: { id: retailerOrder.id } },
    });

    console.log("STYLES WITH BARCODE →", styles);

    // FINAL RESPONSE
    res.json({
      success: true,
      favourites: fav,
      styles: styles, // 🔥 BARCODE NOW INCLUDED IN PREVIEW
      payment: paymentHis,
      bill_amount: retailerOrder.purchaseAmount,
      paidAmount: paidAmount,
      retailerOrder: retailerOrder,
      currency: currencyInfo,
    });
  })
);



// accepted stock details
router.get(
  "/customer-stock/accepted/:id/:stockId/:paymentId",
  asyncHandler(async (req: Request, res: Response) => {
    const { id, stockId, paymentId } = req.params;

    // Raw SQL Query with positional parameters
    const query = `
      SELECT 
          rf.id,
          rf.createdAt,
          rf.quantity,
          rf.quantity * COALESCE(scp.price, s.price) as product_price,
          s.size as size,
          COALESCE(scp.discountedPrice, s.discountedPrice) as price,
          p.id AS product_id,
          p.createdAt AS product_createdAt,
          p.quantity AS product_quantity,
          p.productCode,
          p.description,
          p.minSaleQuantity,
          p.hasReturnPolicy,
          p.hasDiscount,
          p.stockAlert,
          pm.id AS image_id,
          pm.createdAt AS image_createdAt,
          pm.name AS image_name,
          pm.isMain AS image_isMain,
          c.id AS color_id,
          c.createdAt AS color_createdAt,
          c.name AS color_name,
          c.hexcode AS color_hexcode,
          COALESCE(curr.symbol, '€') as currencySymbol,
          COALESCE(curr.name, 'Euro') as currencyName,
          COALESCE(curr.id, 1) as currencyId
      FROM retailer_stock_orders AS rf
      INNER JOIN stock AS s ON s.id = rf.stockId
      INNER JOIN products AS p ON p.id = s.styleNo
      INNER JOIN productimages AS pm ON pm.productId = p.id
      LEFT JOIN product_colours AS c ON c.id = s.colors
      LEFT JOIN currencies curr ON curr.id = rf.currencyId
      LEFT JOIN stock_currency_pricing scp ON scp.stockId = s.id AND scp.currencyId = rf.currencyId
      WHERE rf.id = ? AND rf.retailerId = ?
    `;

    // Execute the raw SQL query using positional parameters
    const result = await db.query(query, [stockId, id]);

    const retailerOrder = await RetailerOrder.findOne({
      where: {
        id: Number(paymentId),
      },
    });
    if (!retailerOrder) {
      return res.json({
        success: false,
      });
    }
    const paymentHis = await RetailerOrdersPayment.find({
      where: {
        order: {
          id: retailerOrder.id,
        },
        amount: MoreThan(0),
      },
      order: { id: "DESC" },
    });

    const paidAmount = paymentHis.reduce(
      (sum, payment) => sum + (payment.amount || 0),
      0
    );

    if (result.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Stock not found" });
    }

    // Transform the first row into the desired format
    const firstRow = result[0];

    const transformedData = {
      id: firstRow.id,
      createdAt: firstRow.createdAt,
      product_size: firstRow.size,
      quantity: firstRow.quantity,
      customization: firstRow.customization,
      is_order_placed: firstRow.is_order_placed,
      product_price: firstRow.price,
      product: {
        id: firstRow.product_id,
        createdAt: firstRow.product_createdAt,
        quantity: firstRow.product_quantity,
        productCode: firstRow.productCode,
        price: firstRow.price,
        description: firstRow.description,
        minSaleQuantity: firstRow.minSaleQuantity,
        hasReturnPolicy: firstRow.hasReturnPolicy,
        hasDiscount: firstRow.hasDiscount,
        stockAlert: firstRow.stockAlert,
        images: result.map((row: any) => ({
          id: row.image_id,
          createdAt: row.image_createdAt,
          name: row.image_name,
          isMain: row.image_isMain,
        })),
      },
      color: firstRow.color_id
        ? {
          id: firstRow.color_id,
          createdAt: firstRow.color_createdAt,
          name: firstRow.color_name,
          hexcode: firstRow.color_hexcode,
        }
        : null,
    };

    res.json({
      success: true,
      favourites: [transformedData],
      payment: paymentHis,
      bill_amount: retailerOrder.purchaseAmount,
      paidAmount: paidAmount,
      retailerOrder: retailerOrder,
      currency: {
        symbol: firstRow.currencySymbol,
        name: firstRow.currencyName,
        id: firstRow.currencyId,
      },
    });
  })
);

//acceptedOrders.retailerOrders
router.get(
  "/admin/orders/accepted/:isApprovedStatus", // Admin route
  asyncHandler(async (req: Request, res: Response) => {
    const { isApprovedStatus } = req.params;
    const { page, query } = req.query as {
      page?: string;
      query?: string;
    };

    // Validate isApprovedStatus
    const isApproved = Number(isApprovedStatus);

    // Pagination setup
    const skip = (page ? Number(page) - 1 : 0) * 100;
    const take = 100;
    const params: any[] = [];
    const whereClauses: string[] = [];

    // Main query with LEFT JOIN optimization
    let dataSql = `
      SELECT 
        DATE_FORMAT(ro.createdAt, '%Y-%m-%d') AS formatted_date,
        ro.purchaeOrderNo as order_id,
        CASE 
          WHEN ro.is_stock_order = 1 THEN 'Stock' 
          ELSE 'Fresh' 
        END AS type,
        payments.orderId as payment_id,
        ro.purchaseAmount AS total,
        DATE_FORMAT(ro.orderReceivedDate,'%Y-%m-%d')  AS received_date,
        ro.manufacturingEmailAddress as email,
        ro.orderStatus,
        ro.favouriteOrderId,
        ro.stockOrderId,
        ro.id as id,
        ro.retailerId as retailer_id,
        ro.invoiceNo,
        ro.estimateNo,
        DATE_FORMAT(ro.orderCancellationDate,'%Y-%m-%d') AS orderCancellationDate,
        DATE_FORMAT(ro.orderCancellationDate,'%Y-%m-%d') AS shipping_date,
        IFNULL(payments.paid_amount, 0) AS paid_amount,
        (ro.purchaseAmount - IFNULL(payments.paid_amount, 0)) AS balance,
        COALESCE(NULLIF(c.storeName, ''), c.name) as customerStoreName,
        COALESCE(NULLIF(c.storeName, ''), c.name) as retailer_name,  
        c.email as retailer_email,
        curr.symbol as currencySymbol,
        curr.name as currencyName
      FROM retailer_orders AS ro
      LEFT JOIN (
        SELECT orderId, SUM(amount) AS paid_amount 
        FROM retailer_order_payments 
        GROUP BY orderId
      ) AS payments ON payments.orderId = ro.id
      left join retailers r on r.id = ro.retailerId
      LEFT JOIN customers c ON c.id = r.customerId 
      LEFT JOIN currencies curr ON curr.id = c.currencyId
    `;

    // Add isApproved condition
    whereClauses.push("ro.status_id = ?");
    params.push(isApproved);

    // Handle search query
    if (query) {
      const likeQuery = `%${query.toLowerCase()}%`;
      whereClauses.push(
        "(LOWER(ro.purchaeOrderNo) LIKE ? OR LOWER(c.storeName) LIKE ? OR LOWER(c.name) LIKE ? OR LOWER(ro.orderStatus) LIKE ?)"
      );
      params.push(likeQuery, likeQuery, likeQuery, likeQuery);

      if (query.toLowerCase() === "stock") {
        whereClauses.push("ro.is_stock_order = 1");
      } else if (query.toLowerCase() === "fresh") {
        whereClauses.push("ro.is_stock_order = 0");
      }
    }

    // Add WHERE conditions if any
    if (whereClauses.length > 0) {
      dataSql +=
        " WHERE " + "ro.status = 0 AND" + " " + whereClauses.join(" AND ");
    } else {
      dataSql += " WHERE ro.status = 0 ";
    }

    // Add pagination
    dataSql += " ORDER BY ro.createdAt DESC LIMIT ? OFFSET ?";
    params.push(take, skip);

    // Count query (EXCLUDE limit/offset params)
    const countSql = `
      SELECT COUNT(*) AS total
      FROM retailer_orders AS ro
      LEFT JOIN customers c ON c.id = ro.retailerId
      ${whereClauses.length > 0
        ? "WHERE " + "ro.status = 0 AND" + " " + whereClauses.join(" AND ")
        : " WHERE ro.status = 0 "
      }
    `;

    // Execute queries
    const [retailerOrders, totalResult] = await Promise.all([
      db.query(dataSql, params),
      db.query(countSql, params.slice(0, -2)), // Correct parameter slicing
    ]);

    return res.json({
      success: true,
      retailerOrders,
      totalCount: totalResult?.[0]?.total || 0,
    });
  })
);

// payment Update
router.post(
  "/admin/payment-update/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const { amount, payment_type } = req.body;

    const order = await RetailerOrder.findOne({
      where: {
        id: Number(id),
      },
    });

    if (!order) {
      return res.json({
        success: false,
        msg: "Error",
      });
    }

    const paymentHis = await RetailerOrdersPayment.find({
      where: {
        order: {
          id: Number(id),
        },
      },
    });

    const totalAmount =
      paymentHis.reduce((sum, payment) => sum + (payment.amount || 0), 0) +
      amount;

    if (totalAmount > order.purchaseAmount) {
      return res.json({
        success: false,
        msg: "Payment is Fully Paid",
      });
    }

    const payment = new RetailerOrdersPayment();

    payment.amount = amount;
    payment.paymentMethod = payment_type;

    if (order) {
      payment.order = order;
      await payment.save();
    }

    res.json({
      success: true,
      msg: "Payment Updated",
    });
  })
);

router.post(
  "/admin/status-update/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, track_id, shipping } = req.body;

    const order = await RetailerOrder.findOne({
      where: { id: Number(id) },
    });

    if (!order)
      return res.json({ success: false, msg: "Order Not Found" });

    if (track_id) order.trackingNo = String(track_id).trim();

    if (shipping !== undefined && shipping !== null && shipping !== "") {
      const shippingAmount = Number(shipping);

      if (Number.isNaN(shippingAmount) || shippingAmount < 0) {
        return res.status(400).json({
          success: false,
          msg: "Invalid shipping amount",
        });
      }

      const base =
        Number(order.purchaseAmount) -
        Number(order.shippingAmount || 0);
      order.shippingAmount = shippingAmount;
      order.purchaseAmount = base + shippingAmount;
    }

    if (!status) {
      await order.save();

      return res.json({
        success: true,
        msg: "Tracking ID Updated Successfully",
      });
    }

    // /* ------------------------------------------
    //    🔥 PAYMENT VALIDATION BEFORE STATUS UPDATE
    // ------------------------------------------ */
    // const payments = await RetailerOrdersPayment.find({
    //   where: { order: { id: order.id } },
    // });

    // const paidAmount = payments.reduce(
    //   (sum, p) => sum + Number(p.amount || 0),
    //   0
    // );

    // const remaining = Number(order.purchaseAmount) - paidAmount;

    // if (
    //   order.orderStatus === OrderStatus.Balance_Pending &&
    //   status !== OrderStatus.Balance_Pending &&
    //   remaining > 0
    // ) {
    //   return res.json({
    //     success: false,
    //     msg: "Cannot move forward! Payment still pending.",
    //     remaining,
    //   });
    // }

    // if (
    //   order.orderStatus === OrderStatus.Ready_To_Delivery &&
    //   status === OrderStatus.Shipped &&
    //   remaining > 0
    // ) {
    //   return res.json({
    //     success: false,
    //     msg: "Payment pending! Cannot mark as Shipped.",
    //     remaining,
    //   });
    // }



    /* ------------------------------------------
       ⭐ LOWEST STAGE VALIDATION (manual cannot jump)
    ------------------------------------------ */


    /* ------------------------------------------
       🔥 NOW UPDATE ORDER STATUS
    ------------------------------------------ */
    /* NOW UPDATE ORDER STATUS */
    const now = new Date();

    // Convert frontend value to DB ENUM format
    let finalStatus = status;

    // Replace underscores
    finalStatus = finalStatus?.replace(/_/g, " ");

    // Split camelCase or PascalCase into words (IssueBeading → Issue Beading)
    finalStatus = finalStatus?.replace(/([a-z])([A-Z])/g, "$1 $2");

    const normalizedFinalStatus = getScanStageLabel(
      finalStatus,
      RETAILER_QR_STATUS_FLOW,
    ) as OrderStatus | null;

    if (!normalizedFinalStatus) {
      return res.status(400).json({
        success: false,
        msg: "Invalid order status",
      });
    }

    const currentStageIndex = getScanStageIndex(
      order.orderStatus,
      RETAILER_QR_STATUS_FLOW,
    );
    const targetStageIndex = getScanStageIndex(
      normalizedFinalStatus,
      RETAILER_QR_STATUS_FLOW,
    );

    if (
      currentStageIndex === -1 ||
      targetStageIndex === -1 ||
      targetStageIndex <= currentStageIndex
    ) {
      return res.status(409).json({
        success: false,
        msg:
          targetStageIndex === currentStageIndex
            ? `Order is already at ${normalizedFinalStatus}`
            : "Cannot move order status backward.",
      });
    }

    finalStatus = normalizedFinalStatus;

    console.log("Converted finalStatus:", finalStatus);

    order.orderStatus = finalStatus as OrderStatus;


    switch (finalStatus) {
      case OrderStatus.Pattern:
        order.pattern = now;
        break;
      case OrderStatus.Khaka:
        order.khaka = now;
        break;
      case OrderStatus.Issue_Beading:
        order.issue_beading = now;
        break;
      case OrderStatus.Beading:
        order.beading = now;
        break;
      case OrderStatus.Zarkan:
        order.zarkan = now;
        break;
      case OrderStatus.Stitching:
        order.stitching = now;
        break;
      case OrderStatus.Balance_Pending:
        order.balance_pending = now;
        break;
      case OrderStatus.Ready_To_Delivery:
        order.ready_to_delivery = now;
        break;
      case OrderStatus.Shipped:
        order.shipped = now;
        order.shippingStatus = ShippingStatus.Shipped;
        order.shippingDate = now;
        order.status_id = 1;
        break;
    }

    /* ------------------------------------------
       🔥 INSERT STYLE PROGRESS (same as barcode)
    ------------------------------------------ */
    const styles = await RetailerOrderStyles.find({
      where: { retailerOrder: { id: order.id } },
    });

    for (const s of styles) {
      const progress = new StyleProgress();
      progress.barcode = s.barcode;
      progress.stage = finalStatus as any;
      progress.qty = 1;
      await progress.save();
    }

    await order.save();

    return res.json({
      success: true,
      msg: "Status Updated Successfully",
    });
  })
);

router.patch(
  "/admin/edit-order/:id",
  requireAdminUser(["/admin-panel/orders"]),
  requireEditPasswordHeader,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const payload = req.body?.orderData ?? req.body?.data;
    const changedFields = req.body?.changedFields ?? {};

    if (!payload) {
      return res.status(400).json({
        success: false,
        message: "No order data was provided",
      });
    }

    const order = await RetailerOrder.findOne({
      where: { id: Number(id), status: 0 },
      relations: ["favourite_order", "Stock_order", "retailer", "retailer.customer"],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const incomingEmail = payload.manufacturingEmailAddress ?? payload.email;
    const incomingReceivedDate = payload.orderReceivedDate ?? payload.received_date;

    if (hasDirtyPath(changedFields, "purchaseOrderNo")) {
      const purchaseOrderNo = sanitizeText(payload.purchaseOrderNo);
      if (!purchaseOrderNo) {
        return res.status(400).json({
          success: false,
          message: "Purchase order number is required",
        });
      }
      order.purchaeOrderNo = purchaseOrderNo;
    }

    if (
      hasDirtyPath(changedFields, "manufacturingEmailAddress") ||
      hasDirtyPath(changedFields, "email")
    ) {
      const email = sanitizeText(incomingEmail);
      if (!email || !email.includes("@")) {
        return res.status(400).json({
          success: false,
          message: "Valid manufacturing email is required",
        });
      }
      order.manufacturingEmailAddress = email;
    }

    if (
      hasDirtyPath(changedFields, "orderReceivedDate") ||
      hasDirtyPath(changedFields, "received_date")
    ) {
      const date = parseIncomingDate(incomingReceivedDate);
      if (!date) {
        return res.status(400).json({
          success: false,
          message: "Valid order received date is required",
        });
      }
      order.orderReceivedDate = date;
    }

    if (hasDirtyPath(changedFields, "orderCancellationDate")) {
      const date = parseIncomingDate(payload.orderCancellationDate);
      if (!date) {
        return res.status(400).json({
          success: false,
          message: "Valid order shipping date is required",
        });
      }
      order.orderCancellationDate = date;
    }

    if (hasDirtyPath(changedFields, "address")) {
      order.address = payload.address ?? "";
    }

    if (hasDirtyPath(changedFields, "phoneNumber")) {
      order.phoneNumber = sanitizeText(payload.phoneNumber);
    }

    if (hasDirtyPath(changedFields, "invoice")) {
      order.invoiceNo = sanitizeText(payload.invoice);
    }

    if (hasDirtyPath(changedFields, "estimate")) {
      order.estimateNo = sanitizeText(payload.estimate);
    }

    if (hasDirtyPath(changedFields, "shipping")) {
      const shippingAmount = Number(payload.shipping);
      if (Number.isNaN(shippingAmount) || shippingAmount < 0) {
        return res.status(400).json({
          success: false,
          message: "Shipping amount must be a valid number",
        });
      }
      order.shippingAmount = shippingAmount;
    }

    if (hasDirtyPath(changedFields, "advance")) {
      await upsertRetailerOrderAdvance(order, payload.advance);
    }

    const stylesChanged = Array.isArray(changedFields.styles)
      ? changedFields.styles.some((styleDirty: any) => hasDirtyValue(styleDirty))
      : false;
    const shouldUpdateAmount =
      hasDirtyPath(changedFields, "total_amount") ||
      hasDirtyPath(changedFields, "shipping") ||
      stylesChanged;

    if (shouldUpdateAmount) {
      const purchaseAmount = Number(payload.total_amount);
      if (Number.isNaN(purchaseAmount) || purchaseAmount < 0) {
        return res.status(400).json({
          success: false,
          message: "Total amount must be a valid number",
        });
      }
      order.purchaseAmount = purchaseAmount;
    }

    if (order.is_stock_order) {
      if (hasDirtyPath(changedFields, "styleNo")) {
        order.StyleNo = sanitizeText(payload.styleNo);
      }

      if (hasDirtyPath(changedFields, "size")) {
        const normalizedSize = normalizeAcceptedStyleSize(
          payload.size,
          payload.size_country,
        );
        order.Size = normalizedSize.displaySize;
        order.size_country = normalizedSize.sizeCountry;
      }

      if (hasDirtyPath(changedFields, "quantity")) {
        const quantity = parsePositiveOrderQuantity(payload.quantity);

        if (!quantity) {
          return sendQuantityValidationError(res);
        }

        order.quantity = String(quantity);
        await syncStockOrderStyleRows(order, { ...payload, quantity });
      }
    } else if (Array.isArray(payload.styles) && stylesChanged) {
      const normalizedStyles = payload.styles.map((style: any) => ({
        ...style,
        normalizedSize: normalizeAcceptedStyleSize(
          style?.size,
          style?.size_country,
        ),
        normalizedQuantity: parsePositiveOrderQuantity(style?.quantity),
      }));

      if (
        normalizedStyles.length === 0 ||
        normalizedStyles.some((style: any) => !style.normalizedQuantity)
      ) {
        return sendQuantityValidationError(res);
      }

      for (let index = 0; index < normalizedStyles.length; index++) {
        const style = normalizedStyles[index];
        const styleDirty = changedFields.styles?.[index];
        if (!hasDirtyValue(styleDirty)) continue;

        if (style.fav_id) {
          const fav = await Favourites.findOne({
            where: { id: Number(style.fav_id) },
          });

          if (fav) {
            if (styleDirty.amount) fav.product_price = Number(style.amount) || 0;
            if (styleDirty.customization_p) {
              fav.customization_price = Number(style.customization_p) || 0;
            }
            if (styleDirty.quantity) fav.quantity = style.normalizedQuantity;
            if (styleDirty.comments) fav.customization = String(style.comments ?? "");
            if (styleDirty.customColor) fav.color = String(style.customColor ?? "");
            if (styleDirty.meshColor) fav.mesh_color = String(style.meshColor ?? "");
            if (styleDirty.beadingColor) fav.beading_color = String(style.beadingColor ?? "");
            if (styleDirty.lining) {
              fav.lining = String(style.lining ?? "");
              fav.add_lining = fav.lining === "No Lining" ? 0 : 1;
            }
            if (styleDirty.liningColor) fav.lining_color = String(style.liningColor ?? "");
            if (styleDirty.size) {
              fav.admin_us_size = style.normalizedSize.displaySize;
              fav.size_country = style.normalizedSize.sizeCountry;
            }

            await fav.save();
          }
        }

        if (
          styleDirty.quantity ||
          styleDirty.size ||
          styleDirty.styleNo
        ) {
          await syncFreshOrderStyleRows(order, {
            ...style,
            quantity: style.normalizedQuantity,
          });
        }
      }

      order.StyleNo = normalizedStyles.map((style: any) => style.styleNo).join(",");
      order.Size = normalizedStyles
        .map((style: any) => style.normalizedSize.displaySize)
        .join(",");
      order.size_country = normalizedStyles
        .map((style: any) => style.normalizedSize.sizeCountry)
        .join(",");
      order.quantity = normalizedStyles
        .map((style: any) => String(style.normalizedQuantity))
        .join(",");
    }

    await order.save();

    return res.json({
      success: true,
      message: "Order updated successfully",
    });
  })
);




router.patch(
  "/admin/editPayment/:id/:amount",
  asyncHandler(async (req: Request, res: Response) => {
    const { id, amount } = req.params;

    const payment = await RetailerOrdersPayment.findOne({
      where: {
        id: Number(id),
      },
    });

    if (!payment) {
      return res.json({
        success: false,
      });
    }

    payment.amount = Number(amount);

    await payment.save();
    return res.json({
      success: true,
    });
  })
);

router.delete(
  "/admin/deletePayment/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const payment = await RetailerOrdersPayment.findOne({
      where: {
        id: Number(id),
      },
    });

    if (!payment) {
      return res.json({
        success: false,
      });
    }

    payment.remove();

    await payment.save();
    return res.json({
      success: true,
    });
  })
);

router.get(
  "/orderStatusDates/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const qa = `SELECT 
  pattern,
  khaka,
  issue_beading,
  beading,
  zarkan,
  stitching,
  balance_pending,
  ready_to_delivery,
  shipped
FROM retailer_orders WHERE id = ?`;

    const [result] = await db.query(qa, [id]);

    res.json({
      success: true,
      data: result,
    });
  })
);

router.get(
  "/orderStatusDates/stock/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const qa = `SELECT
  pattern,
  khaka,
  issue_beading,
  beading,
  zarkan,
  stitching,
  balance_pending,
  ready_to_delivery,
  shipped
FROM orders AS r
WHERE r.id = ?`;

    const [result] = await db.query(qa, [id]);

    res.json({
      success: true,
      data: result,
    });
  })
);
router.get(
  "/customization/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const retailerOrder = await RetailerOrder.createQueryBuilder(
      "retailerOrder"
    )
      .leftJoinAndSelect("retailerOrder.favourite_order", "favourite_order")
      .select(["retailerOrder.id", "favourite_order.favourite_ids"]) // Specify only needed fields
      .where("retailerOrder.id = :id", { id: Number(id) })
      .getOne();

    if (!retailerOrder) {
      res.json({
        success: false,
      });
      return;
    }

    let ids = retailerOrder.favourite_order.favourite_ids
      .split(",")
      .map((item) => Number(item));

    const favorites = await Favourites.createQueryBuilder("favourites")
      .leftJoinAndSelect("favourites.product", "product") // Join the product relation
      .select([
        "favourites.id",
        "favourites.product_size",
        "favourites.quantity",
        "favourites.customization",
        "favourites.size_country",
        "favourites.customization_price",
        "favourites.color",
        "favourites.mesh_color",
        "favourites.beading_color",
        "favourites.lining",
        "favourites.lining_color",
        "product.productCode",
      ]) // Select specific fields
      .where("favourites.id IN (:...ids)", { ids })
      .getMany();

    res.json({
      success: true,
      data: favorites,
    });
  })
);

router.patch(
  "/customization/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { data } = req.body;

    const { id } = req.params;

    const orders = await RetailerOrder.findOne({
      where: {
        id: Number(id),
      },
    });

    if (!orders) {
      return;
    }

    let oldPrice = 0;
    let newPrice = 0;

    for (let index = 0; index < data.length; index++) {
      const fav = await Favourites.findOne({
        where: {
          id: Number(data[index].id),
        },
      });
      if (!fav) {
        return;
      }
      const multiplyOld =
        Number(fav.customization_price) * Number(fav.quantity);
      oldPrice = oldPrice + Number(multiplyOld);

      fav.customization_price = data[index].customization_price;
      await fav.save();

      const multiplyNew =
        Number(data[index].customization_price) * Number(data[index].quantity);
      newPrice = newPrice + multiplyNew;
    }
    const minus = orders.purchaseAmount - oldPrice;
    orders.purchaseAmount = minus + newPrice;

    await orders.save();

    res.json({
      success: true,
      message: "Customization Edited successfully",
    });
  })
);

router.patch(
  "/admin/order/reject",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.body;
    const stock = await RetailerOrder.findOne({
      where: {
        id: Number(id),
      },
    });

    if (stock) {
      stock.status = 1;
      await stock.save();
    }

    res.json({
      success: true,
      msg: "Order Deleted",
    });
  })
);

router.patch(
  "/admin/order/store/reject",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.body;
    const stock = await Order.findOne({
      where: {
        id: Number(id),
      },
    });

    if (stock) {
      stock.status = 1;
      await stock.save();
    }

    res.json({
      success: true,
      msg: "Order Deleted",
    });
  })
);

router.patch(
  "/admin/bulkOrder/reject",
  asyncHandler(async (req: Request, res: Response) => {
    const { bulk } = req.body;

    let freshBulk: any = [];
    let storeBulk: any = [];

    bulk.forEach((i: any) => {
      if (i.orderType == "Fresh" || i.orderType == "Stock") {
        freshBulk = [...freshBulk, i];
      } else {
        storeBulk = [...storeBulk, i];
      }
    });

    if (freshBulk.length > 0) {
      for (let index = 0; index < freshBulk.length; index++) {
        const stocks = await RetailerOrder.findOne({
          where: {
            id: freshBulk[index].id,
          },
        });
        if (stocks) {
          stocks.status = 1;
          await stocks.save();
        }
      }
    }

    if (storeBulk.length > 0) {
      for (let index = 0; index < storeBulk.length; index++) {
        const stocks = await Order.findOne({
          where: {
            id: storeBulk[index].id,
          },
        });
        if (stocks) {
          stocks.status = 1;
          await stocks.save();
        }
      }
    }

    res.json({
      success: true,
      msg: "Order Deleted",
    });
  })
);

//soft delete in reject
router.patch(
  "/admin/bulkOrder/delete",
  asyncHandler(async (req: Request, res: Response) => {
    const { bulk } = req.body;

    let freshBulk: any = [];
    let storeBulk: any = [];

    bulk.forEach((i: any) => {
      if (i.orderType == "Fresh") {
        freshBulk = [...freshBulk, i];
      } else {
        storeBulk = [...storeBulk, i];
      }
    });

    if (freshBulk.length > 0) {
      for (let index = 0; index < freshBulk.length; index++) {
        const stocks = await RetailerFavouritesOrders.findOne({
          where: {
            id: freshBulk[index].id,
          },
        });
        if (stocks) {
          stocks.isDeleted = true;
          await stocks.save();
        }
      }
    }

    if (storeBulk.length > 0) {
      for (let index = 0; index < storeBulk.length; index++) {
        const stocks = await RetailerStockOrders.findOne({
          where: {
            id: storeBulk[index].id,
          },
        });
        if (stocks) {
          stocks.isDeleted = true;
          await stocks.save();
        }
      }
    }

    res.json({
      success: true,
      msg: "Rejected Order Deleted",
    });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    // Fetch both possible relations safely
    const order = await RetailerOrder.findOne({
      where: { id: Number(id), status: 0 },
      relations: {
        favourite_order: true,
        Stock_order: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    let styles = [];

    if (order.is_stock_order) {
      styles = await StockOrderStyles.find({
        where: { retailerOrder: { id: order.id } },
      });
    } else {
      styles = await RetailerOrderStyles.find({
        where: { retailerOrder: { id: order.id } },
      });
    }

    return res.json({
      success: true,
      data: {
        ...order,
        styles,
      },
    });
  })
);


router.put(
  "/qr-scan-update/:id",
  requireScannerIdentity,
  requireScannerRoleStageAccess(resolveRetailerOrderQrStage),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const order = await RetailerOrder.findOne({
      where: { id: Number(id), status: 0 }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const workflow = RETAILER_QR_STATUS_FLOW;

    const currentStatus: OrderStatus = order.orderStatus as OrderStatus;
    const targetStatus = getScannerRoleTargetStage(
      (req as any).scannerIdentity?.scannerRoleName,
      workflow,
    ) as OrderStatus | null;

    const currentIndex = workflow.indexOf(order.orderStatus);
    const now = new Date();
    // ❌ Already shipped
    if (order.orderStatus === OrderStatus.Shipped) {
      return res.json({
        success: false,
        message: "Order already shipped",
      });
    }

    if (!targetStatus) {
      return res.status(403).json({
        success: false,
        code: "SCANNER_STAGE_FORBIDDEN",
        message: "Your scanner login is not mapped to a stage.",
      });
    }

    // 🚚 FINAL QR CONFIRM → SHIP ORDER
    if (
      order.orderStatus === OrderStatus.Ready_To_Delivery &&
      req.body?.confirmShip === true &&
      targetStatus === OrderStatus.Shipped
    ) {
      const now = new Date();

      order.orderStatus = OrderStatus.Shipped;
      order.shipped = now;
      order.shippingStatus = ShippingStatus.Shipped;
      order.shippingDate = now;
      order.status_id = 1;

      await order.save();

      return res.json({
        success: true,
        code: "SHIPPED",
        message: "Order shipped successfully",
        orderStatus: OrderStatus.Shipped,
        shippedAt: now,
      });
    }

    // 🟡 Ready To Delivery ho chuka hai
    if (
      currentStatus === OrderStatus.Ready_To_Delivery &&
      targetStatus !== OrderStatus.Shipped
    ) {
      return res.json({
        success: true,
        code: "READY_FOR_SHIP",
        message:
          "Ready To Delivery ho chuka hai. Shipping master last scan karke Shipped karein.",
        nextAction: "SHIP",
      });
    }

    if (currentIndex < 0) {
      return res.status(400).json({
        success: false,
        message: "Order status not in workflow",
      });
    }

    if (currentIndex === workflow.length - 1) {
      return res.json({
        success: true,
        message: "Order already completed!",
        orderStatus: order.orderStatus,
      });
    }

    const nextStatus = targetStatus;


    const field = getStageDateField(nextStatus);
    order.orderStatus = nextStatus;
    if (field) {
      (order as any)[field] = now;
    }

    // If shipped update shipping fields too
    if (isShippingStage(nextStatus)) {
      order.shippingStatus = ShippingStatus.Shipped;
      order.shippingDate = now;
      order.status_id = 1; // Mark completed
    }

    await order.save();

    return res.json({
      success: true,
      message: `Status moved to ${nextStatus}`,
      orderId: order.id,
      orderStatus: nextStatus,
      updatedAt: now,
    });
  })
);




router.post("/create-checkout", async (req, res) => {
  try {
    const { orderId } = req.body;

    console.log("🟦 Incoming Request — Create Checkout for Order:", orderId);

    // Fetch order
    const order = await RetailerOrder.findOne({
      where: { id: Number(orderId) },
    });

    if (!order) {
      console.log("❌ Order not found:", orderId);
      return res.json({ success: false, message: "Order not found" });
    }

    console.log("🟩 Order Found:", order.id, "Amount:", order.purchaseAmount);

    const amount = Number(order.purchaseAmount) * 100;

    console.log("💰 Stripe Amount (in cents):", amount);

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: amount,
            product_data: {
              name: `Order ${order.purchaeOrderNo}`,
            },
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/payment-success/${orderId}`,
      cancel_url: `${process.env.CLIENT_URL}/payment-cancel/${orderId}`,

      // SEND METADATA
      metadata: {
        orderId: String(orderId),
      },
    });

    console.log("🟨 Stripe Session Created:");
    console.log("👉 Session ID:", session.id);
    console.log("👉 Session URL:", session.url);
    console.log("👉 Metadata:", session.metadata);

    return res.json({ success: true, url: session.url });

  } catch (err) {
    console.log("❌ STRIPE SESSION ERROR:", err);
    return res.json({ success: false, message: "Stripe error" });
  }
});

// router.post("/admin-panel/request", asyncHandler(async (req: Request, res: Response) => {
//   const { orderId } = req.body;

//   const order = await RetailerOrder.findOne({
//     where: { id: Number(orderId) },
//     relations: ["favourite_order", "Stock_order"]
//   });

//   if (!order) {
//     return res.status(404).json({ success: false });
//   }

//   let styles = [];

//   if (order.is_stock_order) {
//     styles = await StockOrderStyles.find({
//       where: { retailerOrder: { id: order.id } }
//     });
//   } else {
//     styles = await RetailerOrderStyles.find({
//       where: { retailerOrder: { id: order.id } }
//     });
//   }

//   return res.json({
//     success: true,
//     data: { ...order, styles }
//   });
// }));


router.post("/admin-panel/request", asyncHandler(async (req: Request, res: Response) => {
  console.log("[DEBUG] /admin-panel/request hit", {
    body: req.body,
    headers: req.headers["content-type"],
    timestamp: new Date().toISOString()
  });

  const { orderId } = req.body;

  console.log("[DEBUG] Parsed orderId:", orderId, "| Type:", typeof orderId);

  if (orderId === undefined || orderId === null) {
    console.error("[DEBUG] orderId is missing from request body");
    return res.status(400).json({ success: false, error: "orderId is required" });
  }

  let order;
  try {
    order = await RetailerOrder.findOne({
      where: { id: Number(orderId) },
      relations: ["favourite_order", "Stock_order"]
    });
    console.log("[DEBUG] RetailerOrder.findOne result:", order ? `Found (id=${order.id})` : "Not found");
  } catch (dbErr) {
    console.error("[DEBUG] DB error on RetailerOrder.findOne:", dbErr);
    throw dbErr;
  }

  if (!order) {
    return res.status(404).json({ success: false });
  }

  console.log("[DEBUG] order.is_stock_order:", order.is_stock_order);

  let styles = [];
  try {
    if (order.is_stock_order) {
      console.log("[DEBUG] Fetching StockOrderStyles for orderId:", order.id);
      styles = await StockOrderStyles.find({
        where: { retailerOrder: { id: order.id } }
      });
    } else {
      console.log("[DEBUG] Fetching RetailerOrderStyles for orderId:", order.id);
      styles = await RetailerOrderStyles.find({
        where: { retailerOrder: { id: order.id } }
      });
    }
    console.log("[DEBUG] Styles fetched, count:", styles.length);
  } catch (stylesErr) {
    console.error("[DEBUG] DB error fetching styles:", stylesErr);
    throw stylesErr;
  }

  console.log("[DEBUG] Sending success response");
  return res.json({
    success: true,
    data: { ...order, styles }
  });
}));


router.get(
  "/retailer/admin-orders",
  asyncHandler(async (req: Request, res: Response) => {
      const retailerIdRaw = req.query.retailerId;
      const retailerId = retailerIdRaw ? Number(retailerIdRaw) : null;

      // If a specific retailerId is provided, return orders for that retailer's customer
      if (retailerId) {
        const retailer = await Retailer.findOne({
          where: { id: retailerId },
          relations: ["customer"],
        });

        if (!retailer) {
          return res.json({ success: false, message: "Retailer not found" });
        }

        const SQL = `
    SELECT 
      o.id,
      'regular' AS orderSource,
      o.purchaeOrderNo AS order_id,
      o.orderType,
      o.orderStatus,
      o.trackingNo,
      o.ppt_path,
      o.createdAt,
      DATE_FORMAT(o.orderReceivedDate, '%Y-%m-%d') AS orderReceivedDate,
      COALESCE(total_pay.total_amount, 0) AS total,
      COALESCE(total_pay.total_amount, 0) AS grandTotal,
      COALESCE(paid_pay.paid_amount, 0) AS paid_amount,
      (COALESCE(total_pay.total_amount, 0) - COALESCE(paid_pay.paid_amount, 0)) AS balance,
      COALESCE(total_pay.currencySymbol, curr.symbol, '€') AS currencySymbol,
      COALESCE(total_pay.currencyCode, curr.code, 'EUR') AS currencyCode,
      curr.name AS currencyName,
      COALESCE(total_pay.style_count, 0) AS style_count,
      COALESCE(total_pay.missing_total_values, 0) AS missing_total_values,
      COALESCE(total_pay.unresolved_total_values, 0) AS unresolved_total_values
    FROM orders o
    ${REGULAR_ADMIN_ORDER_TOTALS_JOIN_SQL}
    LEFT JOIN (
      SELECT orderId, SUM(amount) AS paid_amount
      FROM orderpayments
      GROUP BY orderId
    ) paid_pay ON paid_pay.orderId = o.id
    WHERE o.customerId = ?
      AND o.status = 0
      AND COALESCE(o.publishStatus, 'published') = 'published'
    ORDER BY o.id DESC;
  `;

        const rows = await db.query(SQL, [retailer.customer.id]);
        logAdminOrderTotalDiagnostics(rows, `retailer:${retailerId}`);

        return res.json({
          success: true,
          orders: rows,
        });
      }

      // No retailerId provided -> admin panel use-case: return admin-created orders across all retailers
      // We treat orders that belong to customers who have an associated retailer as "admin orders" for the admin panel.
      const GLOBAL_SQL = `
    SELECT 
      o.id,
      'regular' AS orderSource,
      o.purchaeOrderNo AS order_id,
      o.orderType,
      o.orderStatus,
      o.trackingNo,
      o.ppt_path,
      o.createdAt,
      DATE_FORMAT(o.orderReceivedDate, '%Y-%m-%d') AS orderReceivedDate,
      COALESCE(total_pay.total_amount, 0) AS total,
      COALESCE(total_pay.total_amount, 0) AS grandTotal,
      COALESCE(paid_pay.paid_amount, 0) AS paid_amount,
      (COALESCE(total_pay.total_amount, 0) - COALESCE(paid_pay.paid_amount, 0)) AS balance,
      COALESCE(total_pay.currencySymbol, curr.symbol, '€') AS currencySymbol,
      COALESCE(total_pay.currencyCode, curr.code, 'EUR') AS currencyCode,
      curr.name AS currencyName,
      COALESCE(total_pay.style_count, 0) AS style_count,
      COALESCE(total_pay.missing_total_values, 0) AS missing_total_values,
      COALESCE(total_pay.unresolved_total_values, 0) AS unresolved_total_values
    FROM orders o
    JOIN customers c ON o.customerId = c.id
    JOIN retailers r ON r.customerId = c.id
    ${REGULAR_ADMIN_ORDER_TOTALS_JOIN_SQL}
    LEFT JOIN (
      SELECT orderId, SUM(amount) AS paid_amount
      FROM orderpayments
      GROUP BY orderId
    ) paid_pay ON paid_pay.orderId = o.id
    WHERE o.status = 0
      AND COALESCE(o.publishStatus, 'published') = 'published'
    ORDER BY o.id DESC;
  `;

      const rows = await db.query(GLOBAL_SQL);
      logAdminOrderTotalDiagnostics(rows, "admin-panel");

      return res.json({ success: true, orders: rows });
  })
);



export default router;
