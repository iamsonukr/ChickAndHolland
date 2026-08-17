import { raw, Request, Response, Router } from "express";
import asyncHandler from "../middleware/AsyncHandler";
import {
  requireAdminUser,
  requireEditPasswordHeader,
} from "../middleware/AdminAuth";
import Order, {
  OrderType,
  OrderStatus,
  ShippingStatus,
  OrderPublishStatus,
  OrderEmailStatus,
} from "../models/Order";
import { Equal, In, Like } from "typeorm";
import Busboy from "busboy";
import sharp from "sharp";
import path from "path";
import { getFullUrl, storeFileInS3 } from "../lib/s3";
import Style from "../models/OrderStyle";
import Customer from "../models/Customer";
import CONFIG from "../config";
import Product from "../models/Product";
import Beader from "../models/Beader";
import fetch from "node-fetch";
import { imageCache, productCache } from "../lib/cache.service";
import db from "../db";
import { RetailerOrder } from "../models/RetailerOrder";
import { createStyleBarcode } from "../services/style.service";
import { updateOrderByBarcode } from "../services/orderStatus.service";
import {
  buildPurchaseOrderPrefix,
  generateUniquePO,
  peekGlobalNextPoNumber,
} from "../utils/generatePO";
import {
  DEFAULT_SCAN_STAGE,
  SCAN_STAGE_FLOW,
  getScannerRoleTargetStage,
  releaseReservedBarcodeScan,
  requireScannerIdentity,
  requireScannerRoleStageAccess,
  reserveUniqueBarcodeScan,
} from "../lib/scanGuard";
import {
  calculateRetailerStylePricing,
  parseCustomSizesQuantity,
  resolveProductCurrencyPrice,
} from "../lib/orderPricing";
import ProductColour from "../models/ProductColours";
import OrderPayments from "../models/OrderPayments";
import RetailerOrdersPayment from "../models/RetailerPaymentModal";
import Country from "../models/Country";
import { mail } from "../lib/Utils";
import { generateOrderPdf } from "../pdf/generateOrderPdf";
import { formatDateOnly, parseDateOnly } from "../lib/dateOnly";
import { assertDeliverableEmailAddress } from "../lib/emailValidation";
import { getBarcodeComment } from "../services/barcodeComment.service";
import { ensureBarcodeCommentsTable } from "../utils/ensureBarcodeCommentsTable";
import { ORDER_BEADERS_TABLE } from "../utils/ensureOrderBeadersTable";
import {
  DEFAULT_ORDER_STAGE,
  ORDER_STAGE_FLOW,
  getCanonicalStage,
  getLowestStage,
  getStageIndex,
} from "../lib/stageFlow";
import { buildRegularOrderStyleTotalSql } from "../lib/orderTotals";
import { adjustStockInventoryForDeletedRetailerOrders } from "../services/stockInventory.service";

import StoreStyleProgress from "../models/StoreStyleProgress"; // ⬅ top me import add karna
// import { updateOrderAndStyleStatus } from "../services/orderStatus.service";

const router = Router();
// ----------------------
// SAFE ARRAY FIX
// ----------------------
function safeArray(value: any) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  }
  return [];
}

let orderStylesBeaderColumnAvailable: boolean | null = null;
let productsBeaderColumnAvailable: boolean | null = null;

async function hasOrderStylesBeaderColumn() {
  if (orderStylesBeaderColumnAvailable !== null) {
    return orderStylesBeaderColumnAvailable;
  }

  const columns = await db.query("SHOW COLUMNS FROM `orderStyles` LIKE ?", [
    "beader",
  ]);
  orderStylesBeaderColumnAvailable =
    Array.isArray(columns) && columns.length > 0;

  return orderStylesBeaderColumnAvailable;
}

async function hasProductsBeaderColumn() {
  if (productsBeaderColumnAvailable !== null) {
    return productsBeaderColumnAvailable;
  }

  const columns = await db.query("SHOW COLUMNS FROM `products` LIKE ?", [
    "beader",
  ]);
  productsBeaderColumnAvailable = Array.isArray(columns) && columns.length > 0;

  return productsBeaderColumnAvailable;
}

async function buildOrderStylesBeaderSelect(alias = "s") {
  return (await hasOrderStylesBeaderColumn())
    ? `${alias}.beader AS beader`
    : "NULL AS beader";
}

const buildResolvedOrderStyleBeaderSql = (
  styleAlias = "s",
  orderBeaderAlias = "ob",
  productAlias = "p",
) =>
  `TRIM(COALESCE(NULLIF(TRIM(${styleAlias}.beader), ''), NULLIF(TRIM(${orderBeaderAlias}.beader), ''), NULLIF(TRIM(${productAlias}.beader), '')))`;

async function addOrderStylesBeaderFilter(
  queryBuilder: any,
  orderAlias: string,
  beader?: string,
) {
  const beaderValue = String(beader || "").trim();

  if (!beaderValue) {
    return false;
  }

  queryBuilder.andWhere(
    `EXISTS (
      SELECT 1
      FROM orderStyles styleBeaderFilter
      LEFT JOIN \`${ORDER_BEADERS_TABLE}\` orderBeaderFilter
        ON orderBeaderFilter.styleId = styleBeaderFilter.id
      LEFT JOIN products productBeaderFilter
        ON productBeaderFilter.productCode = styleBeaderFilter.styleNo
      WHERE styleBeaderFilter.orderId = ${orderAlias}.id
        AND LOWER(${buildResolvedOrderStyleBeaderSql(
          "styleBeaderFilter",
          "orderBeaderFilter",
          "productBeaderFilter",
        )}) = LOWER(:beaderFilter)
    )`,
    {
      beaderFilter: beaderValue,
    },
  );

  return true;
}

async function getProductBeaderByCode(productCode?: string | null) {
  const code = sanitizeText(productCode);
  if (!code || !(await hasProductsBeaderColumn())) return "";

  const product = await Product.findOne({
    where: { productCode: code },
    select: ["id", "productCode", "beader"],
  });

  return sanitizeText(product?.beader);
}

async function resolveOrderStyleBeader(
  styleNo?: string | null,
  styleBeader?: string | null,
  productsMap?: Map<string, Product>,
) {
  const explicitBeader = sanitizeText(styleBeader);
  if (explicitBeader) return explicitBeader;

  const productBeader = sanitizeText(
    productsMap?.get(sanitizeText(styleNo).toLowerCase())?.beader,
  );
  if (productBeader) return productBeader;

  return getProductBeaderByCode(styleNo);
}

async function upsertOrderBeader({
  orderId,
  styleId,
  productCode,
  beader,
}: {
  orderId: number;
  styleId: number;
  productCode?: string | null;
  beader?: string | null;
}) {
  const beaderValue = sanitizeText(beader);

  if (!beaderValue) {
    await db.query(`DELETE FROM \`${ORDER_BEADERS_TABLE}\` WHERE styleId = ?`, [
      styleId,
    ]);
    return;
  }

  await db.query(
    `
    INSERT INTO \`${ORDER_BEADERS_TABLE}\` (
      orderId,
      styleId,
      productCode,
      beader
    )
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      orderId = VALUES(orderId),
      productCode = VALUES(productCode),
      beader = VALUES(beader),
      updatedAt = CURRENT_TIMESTAMP
    `,
    [orderId, styleId, sanitizeText(productCode) || null, beaderValue],
  );
}

async function deleteOrderBeadersByStyleIds(styleIds: number[]) {
  if (!styleIds.length) return;

  await db.query(
    `DELETE FROM \`${ORDER_BEADERS_TABLE}\` WHERE styleId IN (?)`,
    [styleIds],
  );
}

async function deleteStyleProgressByStyleIds(styleIds: number[]) {
  if (!styleIds.length) return;

  await db.query("DELETE FROM `styleProgress` WHERE styleId IN (?)", [
    styleIds,
  ]);
}

async function getRegularOrderPaymentSummary(order: Order) {
  const [totalRow] = await db.query(
    `
      SELECT COALESCE(SUM(${buildRegularOrderStyleTotalSql()}), 0) AS purchaseAmount
      FROM orderStyles os
      LEFT JOIN orders style_order ON style_order.id = os.orderId
      LEFT JOIN customers c ON c.id = style_order.customerId
      LEFT JOIN products p ON p.productCode = os.styleNo
      LEFT JOIN product_currency_pricing pcp
        ON pcp.productId = p.id
       AND pcp.currencyId = COALESCE(os.currencyId, c.currencyId)
      WHERE os.orderId = ?
    `,
    [order.id],
  );
  const payments = await OrderPayments.find({
    where: { order: { id: order.id } },
  });
  const paidAmount = payments.reduce(
    (sum, payment) => sum + Number(payment.amount || 0),
    0,
  );
  const purchaseAmount = Number(totalRow?.purchaseAmount || 0);
  const balance = Math.max(purchaseAmount - paidAmount, 0);

  return {
    purchaseAmount,
    paidAmount,
    balance,
  };
}

function buildStageMap(rows: any[], field: "status" | "stage") {
  const map = new Map<string, string>();

  rows.forEach((row) => {
    if (row?.barcode) {
      map.set(
        String(row.barcode),
        getCanonicalStage(row[field]) ?? DEFAULT_ORDER_STAGE,
      );
    }
  });

  return map;
}

const isMissingTableError = (error: any) =>
  error?.code === "ER_NO_SUCH_TABLE" ||
  error?.errno === 1146 ||
  /table .* doesn't exist/i.test(String(error?.message ?? ""));

async function queryOptionalRows<T = any>(sql: string, params: any[] = []) {
  try {
    return (await db.query(sql, params)) as T[];
  } catch (error) {
    if (isMissingTableError(error)) {
      return [];
    }

    throw error;
  }
}

async function getLatestProgressRows(
  tableName: "store_style_progress" | "styleProgress",
  stageColumn: "status" | "stage",
  barcodes: string[],
) {
  const uniqueBarcodes = Array.from(
    new Set(
      barcodes.map((barcode) => String(barcode || "").trim()).filter(Boolean),
    ),
  );

  if (!uniqueBarcodes.length) return [];

  const placeholders = uniqueBarcodes.map(() => "?").join(",");

  return queryOptionalRows(
    `
    SELECT progress.barcode, progress.${stageColumn}
    FROM ${tableName} progress
    INNER JOIN (
      SELECT barcode, MAX(id) AS latestId
      FROM ${tableName}
      WHERE barcode IN (${placeholders})
      GROUP BY barcode
    ) latest
      ON latest.latestId = progress.id
    `,
    uniqueBarcodes,
  );
}

function getComputedOrderStage(
  barcodes: string[],
  progressByBarcode: Map<string, string>,
): string {
  if (!barcodes.length) {
    return DEFAULT_ORDER_STAGE ?? "Pattern";
  }

  return (
    getLowestStage(
      barcodes.map(
        (barcode) => progressByBarcode.get(barcode) ?? DEFAULT_ORDER_STAGE,
      ),
    ) ??
    DEFAULT_ORDER_STAGE ??
    "Pattern"
  );
}

function getMostAdvancedKnownStage(
  progressStage?: string | null,
  parentStage?: string | null,
) {
  const canonicalProgress = getCanonicalStage(progressStage);
  const canonicalParent = getCanonicalStage(parentStage);

  if (!canonicalProgress) {
    return canonicalParent ?? DEFAULT_ORDER_STAGE;
  }

  if (!canonicalParent) {
    return canonicalProgress;
  }

  return getStageIndex(canonicalParent) > getStageIndex(canonicalProgress)
    ? canonicalParent
    : canonicalProgress;
}

function getDisplayedOrderStage(
  barcodes: string[],
  progressByBarcode: Map<string, string>,
  parentStage?: string | null,
) {
  return getMostAdvancedKnownStage(
    getComputedOrderStage(barcodes, progressByBarcode),
    parentStage,
  );
}

const emptyStageCounts = () =>
  ORDER_STAGE_FLOW.reduce<Record<string, number>>((acc, stage) => {
    acc[stage] = 0;
    return acc;
  }, {});

const addStageCount = (
  counts: Record<string, number>,
  stage?: string | null,
) => {
  const canonicalStage = getCanonicalStage(stage) ?? DEFAULT_ORDER_STAGE;
  counts[canonicalStage] = (counts[canonicalStage] ?? 0) + 1;
};

const buildOrderStatusById = (
  orders: any[],
  orderSource: "regular" | "retailer",
) => {
  const statusById = new Map<number, string>();

  orders
    .filter((order) => order.orderSource === orderSource)
    .forEach((order) => {
      const id = Number(order.id);
      if (!id) return;
      statusById.set(
        id,
        getCanonicalStage(order.orderStatus) ?? DEFAULT_ORDER_STAGE,
      );
    });

  return statusById;
};

const dedupeProductRowsByBarcode = (
  rows: Array<{ orderId: number; barcode: string }>,
) => {
  const productRowsByBarcode = new Map<
    string,
    { orderId: number; barcode: string }
  >();

  rows.forEach((row) => {
    const orderId = Number(row.orderId);
    const barcode = String(row.barcode || "").trim();

    if (!orderId || !barcode || productRowsByBarcode.has(barcode)) return;
    productRowsByBarcode.set(barcode, { orderId, barcode });
  });

  return Array.from(productRowsByBarcode.values());
};

const getRegularProductRows = async (orderIds: number[]) => {
  if (!orderIds.length) return [];

  const placeholders = orderIds.map(() => "?").join(",");
  const [orderStyleRows, legacyOrderStyleRows, storeOrderStyleRows] =
    await Promise.all([
      queryOptionalRows(
        `
        SELECT orderId, barcode
        FROM orderStyles
        WHERE orderId IN (${placeholders})
        `,
        orderIds,
      ),
      queryOptionalRows(
        `
        SELECT orderId, barcode
        FROM orderstyles
        WHERE orderId IN (${placeholders})
        `,
        orderIds,
      ),
      queryOptionalRows(
        `
        SELECT orderId, barcode
        FROM store_order_styles
        WHERE orderId IN (${placeholders})
        `,
        orderIds,
      ),
    ]);

  return dedupeProductRowsByBarcode([
    ...orderStyleRows,
    ...legacyOrderStyleRows,
    ...storeOrderStyleRows,
  ]);
};

const getRetailerProductRows = async (orderIds: number[]) => {
  if (!orderIds.length) return [];

  const placeholders = orderIds.map(() => "?").join(",");
  const [freshStyleRows, stockStyleRows] = await Promise.all([
    queryOptionalRows(
      `
      SELECT retailerOrderId AS orderId, barcode
      FROM retailer_order_styles
      WHERE retailerOrderId IN (${placeholders})
      `,
      orderIds,
    ),
    queryOptionalRows(
      `
      SELECT retailerOrderId AS orderId, barcode
      FROM stock_order_styles
      WHERE retailerOrderId IN (${placeholders})
      `,
      orderIds,
    ),
  ]);

  return dedupeProductRowsByBarcode([...freshStyleRows, ...stockStyleRows]);
};

async function getProductStageCounts(baseOrders: any[]) {
  const counts = emptyStageCounts();

  const regularOrderIds = baseOrders
    .filter((order) => order.orderSource === "regular")
    .map((order) => Number(order.id))
    .filter(Boolean);
  const retailerOrderIds = baseOrders
    .filter((order) => order.orderSource === "retailer")
    .map((order) => Number(order.id))
    .filter(Boolean);
  const regularOrderStatusById = buildOrderStatusById(baseOrders, "regular");
  const retailerOrderStatusById = buildOrderStatusById(baseOrders, "retailer");

  if (regularOrderIds.length) {
    const regularRows = await getRegularProductRows(regularOrderIds);
    const regularBarcodes = regularRows.map((row) => row.barcode);
    const regularProgressByBarcode = buildStageMap(
      await getLatestProgressRows(
        "store_style_progress",
        "status",
        regularBarcodes,
      ),
      "status",
    );

    regularRows.forEach((row) => {
      addStageCount(
        counts,
        getMostAdvancedKnownStage(
          regularProgressByBarcode.get(row.barcode),
          regularOrderStatusById.get(row.orderId),
        ),
      );
    });
  }

  if (retailerOrderIds.length) {
    const retailerRows = await getRetailerProductRows(retailerOrderIds);
    const retailerBarcodes = retailerRows.map((row) => row.barcode);
    const retailerProgressByBarcode = buildStageMap(
      await getLatestProgressRows("styleProgress", "stage", retailerBarcodes),
      "stage",
    );

    retailerRows.forEach((row) => {
      addStageCount(
        counts,
        getMostAdvancedKnownStage(
          retailerProgressByBarcode.get(row.barcode),
          retailerOrderStatusById.get(row.orderId),
        ),
      );
    });
  }

  return counts;
}

async function getOrderStageCountSourceOrders({
  query,
  orderType,
  publishStatus,
  beader,
}: {
  query?: string;
  orderType?: string;
  publishStatus?: string;
  beader?: string;
}) {
  const likeQuery = query ? `%${query.toLowerCase()}%` : undefined;
  const requestedPublishStatus =
    publishStatus === OrderPublishStatus.Draft
      ? OrderPublishStatus.Draft
      : OrderPublishStatus.Published;
  const includeRetailerOrders =
    requestedPublishStatus === OrderPublishStatus.Published;

  const regularOrdersQuery = db
    .createQueryBuilder()
    .select([
      "o.id as id",
      "o.orderStatus as orderStatus",
      "'regular' as orderSource",
      "o.createdAt as createdAt",
    ])
    .from(Order, "o")
    .leftJoin("o.customer", "customer")
    .where("o.status = 0")
    .andWhere("COALESCE(o.publishStatus, :publishedStatus) = :publishStatus", {
      publishedStatus: OrderPublishStatus.Published,
      publishStatus: requestedPublishStatus,
    });

  if (likeQuery) {
    regularOrdersQuery.andWhere(
      "(LOWER(o.purchaeOrderNo) LIKE :likeQuery OR LOWER(customer.storeName) LIKE :likeQuery OR LOWER(customer.name) LIKE :likeQuery)",
      { likeQuery },
    );
  }

  const hasBeaderFilter = await addOrderStylesBeaderFilter(
    regularOrdersQuery,
    "o",
    beader,
  );

  const retailerOrdersQuery = db
    .createQueryBuilder()
    .select([
      "ro.id as id",
      "ro.orderStatus as orderStatus",
      "'retailer' as orderSource",
      "ro.createdAt as createdAt",
    ])
    .from(RetailerOrder, "ro")
    .leftJoin("ro.retailer", "retailer")
    .leftJoin("retailer.customer", "customer")
    .where("ro.status = 0");

  if (likeQuery) {
    retailerOrdersQuery.andWhere(
      "(LOWER(ro.purchaeOrderNo) LIKE :likeQuery OR LOWER(customer.storeName) LIKE :likeQuery OR LOWER(customer.name) LIKE :likeQuery)",
      { likeQuery },
    );
  }

  let unionQuery: string;

  if (orderType) {
    if (!includeRetailerOrders) {
      regularOrdersQuery.andWhere("o.orderType = :orderType", { orderType });
      unionQuery = regularOrdersQuery.getQuery();
    } else if (hasBeaderFilter && ["Fresh", "Stock"].includes(orderType)) {
      regularOrdersQuery.andWhere("1 = 0");
      unionQuery = regularOrdersQuery.getQuery();
    } else if (orderType === "Stock") {
      retailerOrdersQuery.andWhere("ro.is_stock_order = 1");
      unionQuery = retailerOrdersQuery.getQuery();
    } else if (orderType === "Fresh") {
      retailerOrdersQuery.andWhere("ro.is_stock_order = 0");
      unionQuery = retailerOrdersQuery.getQuery();
    } else {
      regularOrdersQuery.andWhere("o.orderType = :orderType", { orderType });
      unionQuery = regularOrdersQuery.getQuery();
    }
  } else {
    unionQuery =
      includeRetailerOrders && !hasBeaderFilter
        ? `(${regularOrdersQuery.getQuery()}) UNION ALL (${retailerOrdersQuery.getQuery()})`
        : regularOrdersQuery.getQuery();
  }

  const mergedParams = {
    ...regularOrdersQuery.getParameters(),
    ...retailerOrdersQuery.getParameters(),
  };

  return db
    .createQueryBuilder()
    .select("*")
    .from(`(${unionQuery})`, "combined_orders")
    .setParameters(mergedParams)
    .getRawMany();
}

async function getProgressQuantityMap(
  tableName: "store_style_progress" | "styleProgress",
  barcodes: string[],
) {
  const map = new Map<string, number>();
  if (!barcodes.length) return map;

  const rows = await db.query(
    `
      SELECT barcode, SUM(qty) AS completedQty
      FROM ${tableName}
      WHERE barcode IN (?)
      GROUP BY barcode
    `,
    [barcodes],
  );

  rows.forEach((row: any) => {
    map.set(String(row.barcode), Number(row.completedQty || 0));
  });

  return map;
}

async function getBarcodeCommentMap(
  barcodes: string[],
  orderType: "STORE" | "RETAILER" | "STOCK",
) {
  const map = new Map<string, string>();
  if (!barcodes.length) return map;

  const rows = await db.query(
    `
      SELECT barcode, comment
      FROM barcode_comments
      WHERE barcode IN (?) AND orderType = ?
    `,
    [barcodes, orderType],
  );

  rows.forEach((row: any) => {
    map.set(String(row.barcode), String(row.comment ?? ""));
  });

  return map;
}

const getDueDateDifference = (orderCancellationDate: unknown) => {
  if (!orderCancellationDate) return Infinity;

  const targetDate = new Date(String(formatDateOnly(orderCancellationDate)));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (Number.isNaN(targetDate.getTime())) return Infinity;
  return Math.floor((targetDate.getTime() - today.getTime()) / 86_400_000);
};

const matchesDueFilter = (
  dueFilter: string | undefined,
  orderStatus: string,
  orderCancellationDate: unknown,
) => {
  if (!dueFilter) return true;

  const hasDueDate = !!orderCancellationDate;
  const difference = getDueDateDifference(orderCancellationDate);

  if (dueFilter === "lt14") {
    return orderStatus !== "Shipped" && hasDueDate && difference < 14;
  }

  if (dueFilter === "lt28") {
    return (
      orderStatus !== "Shipped" &&
      hasDueDate &&
      difference >= 14 &&
      difference < 28
    );
  }

  if (dueFilter === "shipped") {
    return orderStatus === "Shipped";
  }

  return true;
};

const formatQrBoxColor = (value: unknown) => {
  const color = sanitizeText(value);
  if (!color) {
    return { display: "", prefix: "", name: "" };
  }

  const match = color.match(/^([A-Z0-9]+)\((.+)\)$/);
  if (!match) {
    return { display: color, prefix: "", name: color };
  }

  return {
    display: color,
    prefix: match[1],
    name: match[2],
  };
};

const getQrBoxColorDisplay = (row: any) =>
  formatQrBoxColor(
    row.meshColor ||
      row.meshColorRaw ||
      row.qrBoxColor ||
      row.color ||
      row.colorType,
  ).display;

function sanitizeText(value: unknown) {
  if (typeof value !== "string") return "";

  const trimmed = value.trim();
  if (!trimmed) return "";

  const lowered = trimmed.toLowerCase();
  if (lowered === "null" || lowered === "undefined") return "";

  return trimmed;
}

function commentsToArray(value: any) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((comment) => String(comment).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((comment) => String(comment).trim()).filter(Boolean);
      }
    } catch {
      // Plain-text comments from older records are still valid customization data.
    }

    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }

  return [String(value).trim()].filter(Boolean);
}

function getStyleTotalQuantity(style: any) {
  const customSizesQuantity = safeArray(style?.customSizesQuantity);
  const customTotal = customSizesQuantity.reduce(
    (sum: number, item: any) => sum + Number(item?.quantity || 0),
    0,
  );

  return customTotal || Number(style?.quantity || 0);
}

function mapOrderStyleCustomization(style: any) {
  return {
    id: style.id,
    color: style.colorType || "",
    mesh_color: style.mesh_color || "",
    beading_color: style.beading_color || "",
    beader: style.beader || "",
    lining: style.lining || "",
    lining_color: style.lining_color || "",
    product_size: style.size || "",
    quantity: getStyleTotalQuantity(style),
    customization_price: 0,
    customization: commentsToArray(style.comments).join(", "),
    size_country: style.sizeCountry || "",
    product: {
      productCode: style.styleNo || "",
    },
  };
}

async function applyResolvedRegularOrderBeaders(order: any) {
  const orderId = Number(order?.id);
  if (!orderId || !Array.isArray(order?.styles) || order.styles.length === 0) {
    return order;
  }

  const rows = await db.query(
    `
    SELECT
      s.id AS styleId,
      TRIM(COALESCE(NULLIF(TRIM(s.beader), ''), ob.beader, p.beader)) AS beader
    FROM orderStyles s
    LEFT JOIN \`${ORDER_BEADERS_TABLE}\` ob ON ob.styleId = s.id
    LEFT JOIN products p ON p.productCode = s.styleNo
    WHERE s.orderId = ?
    `,
    [orderId],
  );
  const beadersByStyleId = new Map(
    rows.map((row: any) => [Number(row.styleId), sanitizeText(row.beader)]),
  );

  return {
    ...order,
    styles: order.styles.map((style: any) => {
      const beader = beadersByStyleId.get(Number(style.id)) || "";

      return {
        ...style,
        beader,
        product: style.product ? { ...style.product, beader } : style.product,
      };
    }),
  };
}

const ORDER_PDF_EMAIL_LOG_PREFIX = "[AutoOrderPdfEmail]";

const normalizeFieldArray = (value: any) => {
  if (Array.isArray(value)) return value;
  if (!value) return [];

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : value.trim() ? [value] : [];
    } catch {
      return value.trim() ? [value] : [];
    }
  }

  return [value];
};

const getCustomSizeText = (value: any) => {
  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim();
  }

  if (value && typeof value === "object") {
    return String(value.size ?? value.value ?? value.label ?? "").trim();
  }

  return "";
};

const getCustomSizeEntriesForEmail = (
  customSize: any,
  customSizesQuantity: any[],
) => {
  const customSizeEntries = normalizeFieldArray(customSize)
    .map(getCustomSizeText)
    .filter(Boolean);

  return customSizeEntries.length
    ? customSizeEntries
    : customSizesQuantity.map(getCustomSizeText).filter(Boolean);
};

const buildOrderPdfFilename = (purchaseOrderNo?: string | null) => {
  const baseName = sanitizeText(purchaseOrderNo) || "order-details";
  const safeBaseName = baseName.replace(/[\\/:*?"<>|]+/g, "-");

  return safeBaseName.toLowerCase().endsWith(".pdf")
    ? safeBaseName
    : `${safeBaseName}.pdf`;
};

const getUploadedOrderDocumentFilename = (
  filePath?: string | null,
  purchaseOrderNo?: string | null,
) => {
  const cleanPath = sanitizeText(filePath).split(/[?#]/)[0];
  const parsedName = cleanPath ? path.basename(cleanPath) : "";
  const decodedName = (() => {
    try {
      return decodeURIComponent(parsedName);
    } catch {
      return parsedName;
    }
  })();
  const safeParsedName = decodedName
    .replace(/"/g, "")
    .replace(/[\\/:*?"<>|]+/g, "-")
    .trim();

  if (safeParsedName && path.extname(safeParsedName)) {
    return safeParsedName;
  }

  const baseName = (sanitizeText(purchaseOrderNo) || "order-document")
    .replace(/"/g, "")
    .replace(/[\\/:*?"<>|]+/g, "-")
    .trim();
  const extension = path.extname(cleanPath) || ".pdf";

  return baseName.toLowerCase().endsWith(extension.toLowerCase())
    ? baseName
    : `${baseName}${extension}`;
};

const fetchUploadedOrderDocumentAttachment = async (order: Order) => {
  const fileUrl = sanitizeText(order.ppt_path);

  if (!fileUrl) return null;

  if (!/^https?:\/\//i.test(fileUrl)) {
    throw new Error("Uploaded order document URL is invalid.");
  }

  const response = await fetch(fileUrl);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch uploaded order document (${response.status}).`,
    );
  }

  const arrayBuffer = await response.arrayBuffer();

  return {
    filename: getUploadedOrderDocumentFilename(fileUrl, order.purchaeOrderNo),
    content: Buffer.from(arrayBuffer),
  };
};

const buildCreatedOrderEmailHtml = (purchaseOrderNo?: string | null) => `
  <div style="font-family: Arial, sans-serif; font-size:14px; color:#000;">
    <p>Hello,</p>
    <p>Please find the order document attached with this email.</p>
    ${
      purchaseOrderNo
        ? `<p><strong>Purchase Order:</strong> ${purchaseOrderNo}</p>`
        : ""
    }
    <br/>
    <p>Best Regards,<br/>Chic & Holland Team</p>
    <br/>
    <hr style="border:none;border-top:1px solid #ddd;" />
    <p style="font-size:12px; color:#666;">
      &copy; ${new Date().getFullYear()} Chic & Holland. All rights reserved.
    </p>
  </div>
`;

const recordOrderEmailStatus = async (
  orderId: number,
  emailStatus: OrderEmailStatus,
  failureReason: string | null = null,
) => {
  await Order.update(
    { id: orderId },
    {
      emailStatus,
      emailFailureReason: failureReason,
      emailLastAttemptAt: new Date(),
    },
  );
};

const createColorNameResolver = async () => {
  const productColours = await ProductColour.find({});

  return (hex?: string | null) => {
    if (!hex || hex === "SAS") return "SAS";

    return (
      productColours.find(
        (colour) => colour.hexcode.toLowerCase() === hex.toLowerCase(),
      )?.name || hex
    );
  };
};

const buildRegularOrderPdfDetails = (
  order: any,
  getColorName: (hex?: string | null) => string,
) =>
  (order.styles ?? []).reduce((acc: any[], item: any) => {
    const sizes = normalizeFieldArray(item.customSizesQuantity);
    const customSizeEntries = getCustomSizeEntriesForEmail(
      item.customSize,
      sizes,
    );
    const isCustomSize =
      String(item.size ?? "")
        .trim()
        .toLowerCase() === "custom";

    const detail = {
      quantity:
        sizes.length === 0
          ? Number(item.quantity || 0)
          : sizes.reduce(
              (sum: number, sizeItem: any) =>
                sum + Number(sizeItem?.quantity || 0),
              0,
            ),
      size:
        isCustomSize && customSizeEntries.length
          ? "Custom"
          : sizes.length === 0
            ? `${item.size ?? ""}/${item.quantity ?? ""}`.trim()
            : sizes
                .map((sizeItem: any) => `${sizeItem.size}/${sizeItem.quantity}`)
                .join(", "),
      customSize: customSizeEntries,
      customSizesQuantity: sizes,
      styleNo: item.styleNo,
      barcode: item.barcode,
      size_country: item.sizeCountry ?? item.size_country,
      comments: normalizeFieldArray(item.comments).join(", "),
      color: item.colorType || item.color,
      image: item.convertedFirstProductImage || item.image,
      meshColor:
        item.mesh_color === "SAS" ? "SAS" : getColorName(item.mesh_color),
      beadingColor:
        item.beading_color === "SAS" ? "SAS" : getColorName(item.beading_color),
      beader: item.beader || item.product?.beader || "",
      lining: item.lining,
      liningColor:
        item.lining_color === "SAS" ? "SAS" : getColorName(item.lining_color),
      refImg: normalizeFieldArray(item.photoUrls),
    };

    const existing = acc.find(
      (existingItem) =>
        JSON.stringify({ ...existingItem, refImg: undefined }) ===
        JSON.stringify({ ...detail, refImg: undefined }),
    );

    if (existing) {
      existing.quantity += detail.quantity;
      if (detail.customSize.length) {
        existing.customSize = Array.from(
          new Set([...(existing.customSize ?? []), ...detail.customSize]),
        );
      } else if (detail.size) {
        existing.size = existing.size
          ? `${existing.size}, ${detail.size}`
          : detail.size;
      }
    } else {
      acc.push(detail);
    }

    return acc;
  }, []);

async function sendCreatedOrderPdfEmail(orderId: number) {
  console.log(`${ORDER_PDF_EMAIL_LOG_PREFIX} Preparing email`, { orderId });

  const order = await Order.findOne({
    where: { id: orderId, status: 0 },
    relations: ["customer", "styles"],
  });

  if (!order) {
    console.warn(`${ORDER_PDF_EMAIL_LOG_PREFIX} Order not found`, { orderId });
    return;
  }

  if (order.publishStatus === OrderPublishStatus.Draft) {
    console.log(
      `${ORDER_PDF_EMAIL_LOG_PREFIX} Email not sent: order is draft`,
      {
        orderId,
        purchaseOrderNo: order.purchaeOrderNo,
        recipient: order.manufacturingEmailAddress,
      },
    );
    return;
  }

  let recipient: string;

  try {
    recipient = await assertDeliverableEmailAddress(
      order.manufacturingEmailAddress,
    );
  } catch (error: any) {
    const message = error?.message ?? "Invalid email address";
    await recordOrderEmailStatus(order.id, OrderEmailStatus.Failed, message);
    console.warn(`${ORDER_PDF_EMAIL_LOG_PREFIX} Invalid recipient email`, {
      orderId,
      purchaseOrderNo: order.purchaeOrderNo,
      message,
    });
    throw error;
  }

  let attachment: { filename: string; content: Buffer | string };
  let emailSubject = order.purchaeOrderNo || "Order Confirmation";

  try {
    const uploadedAttachment =
      await fetchUploadedOrderDocumentAttachment(order);

    if (uploadedAttachment) {
      attachment = uploadedAttachment;
      console.info(`${ORDER_PDF_EMAIL_LOG_PREFIX} Using uploaded document`, {
        orderId,
        purchaseOrderNo: order.purchaeOrderNo,
        filename: uploadedAttachment.filename,
      });
    } else {
      const [processedOrderRaw] = await processOrders([order]);
      const processedOrder =
        await applyResolvedRegularOrderBeaders(processedOrderRaw);
      const getColorName = await createColorNameResolver();
      const details = buildRegularOrderPdfDetails(processedOrder, getColorName);

      if (!details.length) {
        const message = "No order styles to email";
        await recordOrderEmailStatus(
          order.id,
          OrderEmailStatus.Failed,
          message,
        );
        console.warn(`${ORDER_PDF_EMAIL_LOG_PREFIX} ${message}`, {
          orderId,
          purchaseOrderNo: order.purchaeOrderNo,
          recipient,
        });
        throw new Error(message);
      }

      const orderData = {
        id: order.id,
        customerId: order.customer?.id,
        manufacturingEmailAddress: recipient,
        orderCancellationDate: formatDateOnly(order.orderCancellationDate),
        orderReceivedDate: formatDateOnly(order.orderReceivedDate),
        orderType: order.orderType,
        purchaseOrderNo: order.purchaeOrderNo,
        details,
      };
      const pdfBuffer = await generateOrderPdf(orderData);

      attachment = {
        filename: buildOrderPdfFilename(orderData.purchaseOrderNo),
        content: pdfBuffer,
      };
      emailSubject = orderData.purchaseOrderNo || "Order Confirmation";
    }
  } catch (error: any) {
    await recordOrderEmailStatus(
      order.id,
      OrderEmailStatus.Failed,
      error?.message ?? String(error),
    );
    throw error;
  }

  await recordOrderEmailStatus(order.id, OrderEmailStatus.Pending);

  try {
    console.log(`${ORDER_PDF_EMAIL_LOG_PREFIX} Sending email`, {
      orderId,
      purchaseOrderNo: order.purchaeOrderNo,
      recipient,
      subject: emailSubject,
      attachment: attachment.filename,
    });

    const emailResult = await mail({
      to: recipient,
      subject: emailSubject,
      html: buildCreatedOrderEmailHtml(order.purchaeOrderNo),
      attachments: [attachment],
    });
    await recordOrderEmailStatus(order.id, OrderEmailStatus.Sent);
    console.log(`${ORDER_PDF_EMAIL_LOG_PREFIX} Email sent successfully`, {
      orderId,
      purchaseOrderNo: order.purchaeOrderNo,
      recipient,
      subject: emailSubject,
      resendId: emailResult?.id,
    });
  } catch (error: any) {
    console.error(`${ORDER_PDF_EMAIL_LOG_PREFIX} Email send error`, {
      orderId,
      purchaseOrderNo: order.purchaeOrderNo,
      recipient,
      subject: emailSubject,
      message: error?.message ?? String(error),
      stack: error?.stack,
    });
    await recordOrderEmailStatus(
      order.id,
      OrderEmailStatus.Failed,
      error?.message ?? String(error),
    );
    throw error;
  }

  console.info(`${ORDER_PDF_EMAIL_LOG_PREFIX} Email sent`, {
    orderId,
    purchaseOrderNo: order.purchaeOrderNo,
    recipient,
  });
}

function queueCreatedOrderPdfEmail(orderId: number) {
  setImmediate(() => {
    sendCreatedOrderPdfEmail(orderId).catch((error) => {
      console.error(`${ORDER_PDF_EMAIL_LOG_PREFIX} Failed`, {
        orderId,
        message: error instanceof Error ? error.message : String(error),
        error,
      });
    });
  });
}

function buildOrderAddress(
  orderAddress: unknown,
  customer?: {
    storeAddress?: string | null;
    postalCode?: string | null;
    country?: { name?: string | null } | null;
  } | null,
) {
  const explicitAddress = sanitizeText(orderAddress);
  const defaultAddress = sanitizeText(customer?.storeAddress);
  const postalCode = sanitizeText(customer?.postalCode);
  const countryName = sanitizeText(customer?.country?.name);

  if (explicitAddress) return explicitAddress;

  let baseAddress = defaultAddress;

  if (
    postalCode &&
    baseAddress &&
    !baseAddress.toLowerCase().includes(postalCode.toLowerCase())
  ) {
    baseAddress = `${baseAddress}, ${postalCode}`;
  } else if (!baseAddress) {
    baseAddress = postalCode;
  }

  if (!baseAddress) return countryName;
  if (!countryName) return baseAddress;

  const baseAddressLower = baseAddress.toLowerCase();
  const countryNameLower = countryName.toLowerCase();
  const bracketedCountry = `(${countryNameLower})`;

  if (baseAddressLower.includes(bracketedCountry)) {
    return baseAddress;
  }

  if (baseAddressLower.includes(countryNameLower)) {
    const trailingCountryPattern = new RegExp(
      `(?:,|\\-|\\s)*\\(?${countryName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\)?\\s*$`,
      "i",
    );

    const baseWithoutCountry = baseAddress
      .replace(trailingCountryPattern, "")
      .replace(/[,-]\s*$/, "")
      .trim();

    if (!baseWithoutCountry) return `(${countryName})`;

    return `${baseWithoutCountry} (${countryName})`;
  }

  return `${baseAddress} (${countryName})`;
}

function buildOrderCustomerPayload(
  customer: Customer | null | undefined,
  resolvedPhoneNumber: string | null,
  shippingCountryNameById: Map<string, string>,
) {
  if (!customer) return null;

  const shippingCountryId = sanitizeText(customer.shippingCountryId);
  const customerCountryName = sanitizeText(customer.country?.name);
  const shippingCountryName =
    sanitizeText(shippingCountryNameById.get(shippingCountryId)) ||
    customerCountryName;

  return {
    id: customer.id,
    name: customer.name ?? null,
    storeName: customer.storeName ?? null,
    customerStoreName: customer.storeName ?? customer.name ?? null,
    contactPerson: customer.contactPerson ?? null,
    phoneNumber: resolvedPhoneNumber ?? customer.phoneNumber,
    storeAddress: customer.storeAddress,
    postalCode: customer.postalCode,
    country: customerCountryName || null,
    shippingAddress: customer.shippingAddress ?? null,
    shippingCityName:
      sanitizeText(customer.shippingCityName) ||
      sanitizeText(customer.client?.city_name) ||
      null,
    shippingCountryId: shippingCountryId || null,
    shippingCountryName: shippingCountryName || null,
    shippingContactPerson:
      sanitizeText(customer.shippingContactPerson) ||
      sanitizeText(customer.contactPerson) ||
      sanitizeText(customer.name) ||
      null,
    shippingEmail:
      sanitizeText(customer.shippingEmail) ||
      sanitizeText(customer.email) ||
      null,
    shippingPhoneNumber:
      sanitizeText(customer.shippingPhoneNumber) ||
      resolvedPhoneNumber ||
      sanitizeText(customer.phoneNumber) ||
      null,
    email: customer.email ?? null,
    client: customer.client
      ? {
          address: customer.client.address ?? null,
          city_name: customer.client.city_name ?? null,
        }
      : null,
  };
}

function getCustomerStoreName(
  customer?: { storeName?: string | null; name?: string | null } | null,
) {
  return sanitizeText(customer?.storeName) || sanitizeText(customer?.name);
}

interface Field {
  [key: string]: string;
}

interface FileData {
  fieldname: string;
  filename: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
}

function resolveUploadedOrderDocumentExtension(
  file: FileData,
  uploadedOrderFileType?: string,
) {
  const filename =
    typeof file.filename === "string"
      ? file.filename
      : String(file.filename || "");
  const ext = path.extname(filename).toLowerCase();

  if (ext) return ext;
  if (uploadedOrderFileType === "pdf") return ".pdf";
  if (uploadedOrderFileType === "ppt") return ".pptx";
  if (file.mimetype === "application/pdf") return ".pdf";
  if (
    file.mimetype.includes("presentation") ||
    file.mimetype.includes("powerpoint")
  ) {
    return ".pptx";
  }

  return "";
}

async function resolveRegularPurchaseOrderNo(
  customerName: string,
  submittedPurchaseOrderNo?: string,
) {
  const prefix = buildPurchaseOrderPrefix(customerName);
  const generatedPurchaseOrderNo = await generateUniquePO(prefix);

  return sanitizeText(submittedPurchaseOrderNo) || generatedPurchaseOrderNo;
}

function parseJsonArrayField(value: unknown) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseMultipartRequest(req: Request) {
  return new Promise<{ fields: Field; files: FileData[] }>(
    (resolve, reject) => {
      const busboy = Busboy({ headers: req.headers });
      const fields: Field = {};
      const filePromises: Promise<FileData>[] = [];

      busboy.on("field", (fieldname: string, val: string) => {
        fields[fieldname] = val;
      });

      busboy.on(
        "file",
        (
          fieldname: string,
          file: NodeJS.ReadableStream,
          filename: string,
          encoding: string,
          mimetype: string,
        ) => {
          const buffers: Buffer[] = [];

          const filePromise = new Promise<FileData>(
            (fileResolve, fileReject) => {
              file.on("data", (data: Buffer) => {
                buffers.push(data);
              });

              file.on("end", () => {
                fileResolve({
                  fieldname,
                  filename,
                  encoding,
                  mimetype,
                  buffer: Buffer.concat(buffers),
                });
              });

              file.on("error", fileReject);
            },
          );

          filePromises.push(filePromise);
        },
      );

      busboy.on("finish", async () => {
        try {
          resolve({ fields, files: await Promise.all(filePromises) });
        } catch (error) {
          reject(error);
        }
      });

      busboy.on("error", reject);
      busboy.end(req.body);
    },
  );
}

function parseStylesFromFields(fields: Field) {
  const styles: any[] = [];

  for (const key in fields) {
    if (!key.startsWith("styles[")) continue;

    const matches = key.match(/\[(\d+)\]\.(.+)/);
    if (!matches) continue;

    const index = Number(matches[1]);
    const field = matches[2];

    if (!styles[index]) styles[index] = {};
    styles[index][field] = fields[key];
  }

  return styles.filter(Boolean);
}

function parseStylesFromFieldsWithIndexes(fields: Field) {
  const stylesMap: Record<number, any> = {};

  for (const key in fields) {
    if (!key.startsWith("styles[")) continue;

    const matches = key.match(/\[(\d+)\]\.(.+)/);
    if (!matches) continue;

    const index = Number(matches[1]);
    const field = matches[2];

    if (!stylesMap[index]) stylesMap[index] = {};
    stylesMap[index][field] = fields[key];
  }

  return Object.keys(stylesMap)
    .map(Number)
    .sort((a, b) => a - b)
    .map((index) => ({ _index: index, ...stylesMap[index] }));
}

function parseDateField(value: unknown) {
  return parseDateOnly(value);
}

function parsePositiveInteger(value: unknown) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

const ORDER_QUANTITY_VALIDATION_MESSAGE =
  "Quantity must be greater than 0 for every style/size";

function parsePositiveOrderQuantity(value: unknown) {
  const textValue = String(value ?? "").trim();
  if (!textValue) return null;

  const parsed = Number(textValue);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function getRegularOrderQuantityValidationError(styles: any[]) {
  if (!Array.isArray(styles) || styles.length === 0) {
    return "At least one style is required";
  }

  for (const style of styles) {
    const customSizesQuantity = parseCustomSizesQuantity(
      style?.customSizesQuantity,
    );

    if (customSizesQuantity.length > 0) {
      const hasInvalidCustomSizeQuantity = customSizesQuantity.some(
        (item) => parsePositiveOrderQuantity(item?.quantity) === null,
      );

      if (hasInvalidCustomSizeQuantity) {
        return ORDER_QUANTITY_VALIDATION_MESSAGE;
      }

      continue;
    }

    if (parsePositiveOrderQuantity(style?.quantity) === null) {
      return ORDER_QUANTITY_VALIDATION_MESSAGE;
    }
  }

  return null;
}

function hasRegularOrderDraftStyleData(style: any) {
  if (!style || typeof style !== "object") return false;

  return Boolean(
    sanitizeText(style.styleNo) ||
    sanitizeText(style.size) ||
    sanitizeText(style.quantity) ||
    !["", "SAS"].includes(sanitizeText(style.mesh)) ||
    !["", "SAS"].includes(sanitizeText(style.beading)) ||
    !["", "SAS"].includes(sanitizeText(style.lining)) ||
    !["", "SAS"].includes(sanitizeText(style.liningColor)) ||
    commentsToArray(style.comments).length ||
    normalizeFieldArray(style.customColor).length ||
    normalizeFieldArray(style.customSize).length ||
    normalizeFieldArray(style.customSizesQuantity).length,
  );
}

function parsePublishStatus(value: unknown) {
  return value === OrderPublishStatus.Draft
    ? OrderPublishStatus.Draft
    : OrderPublishStatus.Published;
}

async function fetchPricingProductsMap(styles: any[]) {
  const styleNos = [
    ...new Set(
      styles.map((style) => sanitizeText(style?.styleNo)).filter(Boolean),
    ),
  ];

  if (!styleNos.length) return new Map<string, Product>();

  const products = await Product.find({
    where: { productCode: In(styleNos) },
    relations: ["currencyPricing", "currencyPricing.currency"],
  });

  return new Map(
    products.map((product) => [product.productCode.toLowerCase(), product]),
  );
}

function applyPricingToStyle(
  style: Style,
  styleInput: any,
  product: any,
  customer?: Customer | null,
) {
  if (!product) {
    console.warn("[AdminOrderPricing] Missing product for style total", {
      styleNo: styleInput?.styleNo,
      customerId: customer?.id,
    });

    style.unitPrice = null;
    style.subtotal = null;
    style.discount = 0;
    style.totalPrice = null;
    style.currencyId = customer?.currencyId
      ? Number(customer.currencyId)
      : null;
    style.currencyCode = customer?.currency?.code ?? null;
    style.currencySymbol = customer?.currency?.symbol ?? null;
    return;
  }

  const resolvedPrice = resolveProductCurrencyPrice(
    product,
    customer?.currencyId ?? customer?.currency?.id,
  );
  const pricing = calculateRetailerStylePricing({
    basePrice: resolvedPrice.amount,
    size: styleInput.size,
    quantity: styleInput.quantity,
    customSizesQuantity: parseCustomSizesQuantity(
      styleInput.customSizesQuantity,
    ),
  });

  style.unitPrice = pricing.unitPrice;
  style.subtotal = pricing.subtotal;
  style.discount = pricing.discount;
  style.totalPrice = pricing.total;
  style.currencyId =
    resolvedPrice.currencyId == null ? null : Number(resolvedPrice.currencyId);
  style.currencyCode = resolvedPrice.currencyCode;
  style.currencySymbol = resolvedPrice.currencySymbol;

  if (pricing.total <= 0) {
    console.warn("[AdminOrderPricing] Missing or zero total price", {
      styleNo: styleInput?.styleNo,
      customerId: customer?.id,
      basePrice: resolvedPrice.amount,
      quantity: pricing.quantity,
      totalPrice: pricing.total,
    });
  }
}

const getPositivePieceCount = (quantity: unknown) => {
  return parsePositiveOrderQuantity(quantity) ?? 0;
};

const buildRegularOrderStylePieces = (styleInput: any) => {
  const customSizeRows = parseCustomSizesQuantity(
    styleInput?.customSizesQuantity,
  );

  if (customSizeRows.length > 0) {
    return customSizeRows.flatMap((sizeRow) => {
      const pieceCount = getPositivePieceCount(sizeRow.quantity);
      const size = getCustomSizeText(sizeRow) || styleInput?.size;

      return Array.from({ length: pieceCount }, () => ({
        ...styleInput,
        size,
        quantity: 1,
        customSize: JSON.stringify([]),
        customSizesQuantity: JSON.stringify([]),
      }));
    });
  }

  const quantity = getPositivePieceCount(styleInput?.quantity);

  if (quantity <= 0) {
    return [];
  }

  if (quantity === 1) {
    return [
      {
        ...styleInput,
        quantity,
      },
    ];
  }

  return Array.from({ length: quantity }, () => ({
    ...styleInput,
    quantity: 1,
  }));
};

router.post(
  "/",
  raw({
    type: "multipart/form-data",
    limit: "100mb",
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const busboy = Busboy({ headers: req.headers });
    const fields: Field = {};
    const filePromises: Promise<FileData>[] = [];

    busboy.on("field", (fieldname: string, val: string) => {
      fields[fieldname] = val;
    });

    // @ts-ignore
    busboy.on(
      "file",
      (
        fieldname: string,
        file: NodeJS.ReadableStream,
        filename: string,
        encoding: string,
        mimetype: string,
      ) => {
        const buffers: Buffer[] = [];

        const filePromise = new Promise<FileData>((resolve, reject) => {
          file.on("data", (data: Buffer) => {
            buffers.push(data);
          });

          file.on("end", () => {
            const fileBuffer = Buffer.concat(buffers);
            resolve({
              fieldname,
              filename,
              encoding,
              mimetype,
              buffer: fileBuffer,
            });
          });

          file.on("error", (error: Error) => {
            reject(error);
          });
        });

        filePromises.push(filePromise);
      },
    );

    busboy.on("finish", async () => {
      try {
        const files = await Promise.all(filePromises);

        const purchaseOrderNo = fields["purchaseOrderNo"];
        const manufacturingEmailAddress = fields["manufacturingEmailAddress"];
        const orderType = fields["orderType"];
        const orderReceivedDate = parseDateOnly(fields["orderReceivedDate"]);
        const orderCancellationDate = parseDateOnly(
          fields["orderCancellationDate"],
        );
        const address = fields["address"];
        const phoneNumber = fields["phoneNumber"];
        const estimateNo = fields["estimate"];
        const invoiceNo = fields["invoice"];
        const customerId = parsePositiveInteger(fields["customerId"]);
        const publishStatus = parsePublishStatus(fields["publishStatus"]);
        const isDraft = publishStatus === OrderPublishStatus.Draft;

        if (!isDraft && (!orderReceivedDate || !orderCancellationDate)) {
          return res.status(400).json({
            success: false,
            message: "Valid order received and shipping dates are required",
          });
        }

        const styles: any = [];

        // PARSE STYLES
        for (const key in fields) {
          if (key.startsWith("styles[")) {
            const matches = key.match(/\[(\d+)\]\.(.+)/);
            if (matches) {
              const index = Number(matches[1]);
              const field = matches[2];

              if (!styles[index]) styles[index] = {};
              styles[index][field] = fields[key];
            }
          }
        }

        if (!isDraft && !customerId) {
          return res.status(400).json({
            success: false,
            message: "Customer is required",
          });
        }

        const customer = customerId
          ? await Customer.findOne({
              where: { id: customerId },
              relations: ["currency"],
            })
          : null;
        if (!isDraft && !customer) {
          return res.status(404).json({
            success: false,
            message: "Customer not found",
          });
        }
        const pricingProductsMap = await fetchPricingProductsMap(styles);
        const resolvedPurchaseOrderNo = customer
          ? await resolveRegularPurchaseOrderNo(
              getCustomerStoreName(customer),
              purchaseOrderNo,
            )
          : sanitizeText(purchaseOrderNo) || `PO#DRAFT ${Date.now()}`;

        const quantityValidationError = isDraft
          ? null
          : getRegularOrderQuantityValidationError(styles);

        if (quantityValidationError) {
          return res.status(400).json({
            success: false,
            message: quantityValidationError,
          });
        }

        // CREATE ORDER
        const order = new Order();
        order.purchaeOrderNo = resolvedPurchaseOrderNo;
        order.manufacturingEmailAddress =
          sanitizeText(manufacturingEmailAddress) || "rubyinc@hotmail.com";
        order.orderType = (sanitizeText(orderType) ||
          OrderType.Store) as OrderType;
        order.orderReceivedDate = orderReceivedDate || new Date();
        order.orderCancellationDate = (orderCancellationDate ?? null) as any;
        order.address = address;
        order.phoneNumber = sanitizeText(phoneNumber) || null;
        order.estimateNo = sanitizeText(estimateNo) || null;
        order.invoiceNo = sanitizeText(invoiceNo) || null;
        order.publishStatus = publishStatus;
        if (customer) order.customer = customer;

        await order.save(); // ⬅ MUST SAVE BEFORE STYLES

        const orderID = order.id;

        const uploadedOrderFile = files.find(
          (file) => file.fieldname === "uploadedOrderFile",
        );
        const uploadedOrderFileType = fields["uploadedOrderFileType"];

        if (uploadedOrderFile) {
          const extension = resolveUploadedOrderDocumentExtension(
            uploadedOrderFile,
            uploadedOrderFileType,
          );

          const uploadedDocument = await storeFileInS3(
            uploadedOrderFile.buffer,
            `order-documents/${orderID}/${Date.now()}${extension}`,
          );

          if (!uploadedDocument) {
            throw new Error("Failed to upload order document");
          }

          order.ppt_path = getFullUrl(uploadedDocument.fileName);
          await order.save();
        }

        // ================================
        // PROCESS ALL STYLES (EACH GETS UNIQUE BARCODE)
        // ================================
        const stylesForBarcodeRows = isDraft
          ? styles
              .filter(hasRegularOrderDraftStyleData)
              .map((style: any, index: number) => ({
                ...style,
                quantity: parsePositiveOrderQuantity(style?.quantity) ?? 0,
                _sourceIndex: index,
              }))
          : styles.flatMap((style: any, index: number) =>
              buildRegularOrderStylePieces(style).map((piece) => ({
                ...piece,
                _sourceIndex: index,
              })),
            );
        const uploadedStyleImageUrlsBySourceIndex = new Map<number, string[]>();

        for (let i = 0; i < stylesForBarcodeRows.length; i++) {
          const s = stylesForBarcodeRows[i];

          const newStyle = new Style();
          newStyle.order = order;
          newStyle.styleNo = s.styleNo;
          newStyle.customColor = s.customColor;
          newStyle.comments = s.comments;
          newStyle.customSize = s.customSize;
          newStyle.customSizesQuantity = s.customSizesQuantity;
          newStyle.colorType = s.colorType;
          newStyle.sizeCountry = s.sizeCountry;
          newStyle.size = s.size;
          newStyle.mesh_color = s.mesh;
          newStyle.beading_color = s.beading;
          newStyle.beader = s.beader || null;
          newStyle.lining = s.lining;
          newStyle.lining_color =
            s.lining === "No Lining" ? null : s.liningColor;
          newStyle.quantity = s.quantity ? Number(s.quantity) : 0;
          applyPricingToStyle(
            newStyle,
            s,
            pricingProductsMap.get(sanitizeText(s.styleNo).toLowerCase()),
            customer,
          );

          // STEP 1 — SAVE FIRST (GETS ID)
          await newStyle.save();

          // STEP 2 — CREATE UNIQUE BARCODE FOR EACH STYLE
          newStyle.barcode = `${order.purchaeOrderNo}-${newStyle.styleNo}-${newStyle.id}`;
          await newStyle.save();
          await upsertOrderBeader({
            orderId: order.id,
            styleId: newStyle.id,
            productCode: newStyle.styleNo,
            beader: await resolveOrderStyleBeader(
              newStyle.styleNo,
              newStyle.beader,
              pricingProductsMap,
            ),
          });

          // STEP 3 — UPLOAD IMAGES
          const sourceIndex = Number(s._sourceIndex ?? i);
          let uploadedPhotoUrls =
            uploadedStyleImageUrlsBySourceIndex.get(sourceIndex);

          if (!uploadedPhotoUrls) {
            const styleImages = files.filter(
              (file) =>
                file.fieldname === `styles[${sourceIndex}].modifiedPhotoImage`,
            );

            const imageUrls = await Promise.all(
              styleImages.map(async (file) => {
                if (!file) return null;

                const fileName = `orders/${orderID}/${Math.random()
                  .toString(36)
                  .substring(7)}.jpeg`;

                const compressedImage = await sharp(file.buffer)
                  .jpeg()
                  .toBuffer();

                return await storeFileInS3(compressedImage, fileName);
              }),
            );

            uploadedPhotoUrls = imageUrls
              .filter((x) => x)
              .map((x) => x?.fileName)
              .filter((fileName): fileName is string => Boolean(fileName));
            uploadedStyleImageUrlsBySourceIndex.set(
              sourceIndex,
              uploadedPhotoUrls,
            );
          }

          newStyle.photoUrls = JSON.stringify(uploadedPhotoUrls);

          // STEP 4 — SAVE FINAL STYLE
          await newStyle.save();
        }

        console.log("Order create: email decision", {
          orderId: order.id,
          purchaseOrderNo: order.purchaeOrderNo,
          publishStatus: order.publishStatus,
          manufacturingEmailAddress: order.manufacturingEmailAddress,
        });

        // If this is a draft, respond immediately.
        if (order.publishStatus === OrderPublishStatus.Draft) {
          console.log("Order create: email not sent because order is draft", {
            orderId: order.id,
            purchaseOrderNo: order.purchaeOrderNo,
            manufacturingEmailAddress: order.manufacturingEmailAddress,
          });

          return res.json({
            success: true,
            message: "Draft saved successfully",
            orderId: order.id,
            purchaseOrderNo: order.purchaeOrderNo,
          });
        }

        // For published orders, attempt to send the email synchronously.
        try {
          console.log("Order create: sending order email now", {
            orderId: order.id,
            purchaseOrderNo: order.purchaeOrderNo,
            manufacturingEmailAddress: order.manufacturingEmailAddress,
          });
          await sendCreatedOrderPdfEmail(order.id);
        } catch (emailError: any) {
          console.error("Order create: email send failed, reverting to draft", {
            orderId: order.id,
            error: emailError?.message ?? String(emailError),
          });

          // Revert to draft so the admin can retry and data is preserved
          order.publishStatus = OrderPublishStatus.Draft;
          await order.save();

          return res.status(500).json({
            success: false,
            message:
              "Failed to send order email. The order was saved as a draft. Please check the email address or try again.",
            error: emailError?.message ?? String(emailError),
            purchaseOrderNo: order.purchaeOrderNo,
          });
        }

        return res.json({
          success: true,
          message: "Order created with barcode successfully",
          purchaseOrderNo: order.purchaeOrderNo,
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({
          error: "An error occurred while processing order",
        });
      }
    });

    busboy.end(req.body);
  }),
);

router.patch(
  "/restore",
  asyncHandler(async (req: Request, res: Response) => {
    const bulk = Array.isArray(req.body?.bulk) ? req.body.bulk : [];

    const regularIds: number[] = [];
    const retailerIds: number[] = [];

    bulk.forEach((item: any) => {
      const id = Number(item?.id);
      if (!id) return;

      const source = String(item?.orderSource ?? "").toLowerCase();
      const orderType = String(item?.orderType ?? "");
      const isRetailerOrder = source
        ? source === "retailer"
        : orderType === "Fresh" || orderType === "Stock";

      if (isRetailerOrder) {
        retailerIds.push(id);
      } else {
        regularIds.push(id);
      }
    });

    if (!regularIds.length && !retailerIds.length) {
      return res.status(400).json({
        success: false,
        message: "No valid orders selected to restore",
      });
    }

    if (retailerIds.length) {
      await adjustStockInventoryForDeletedRetailerOrders(
        retailerIds,
        "reserve",
      );
    }

    if (regularIds.length) {
      await Order.update({ id: In([...new Set(regularIds)]) }, { status: 0 });
    }

    if (retailerIds.length) {
      await RetailerOrder.update(
        { id: In([...new Set(retailerIds)]) },
        { status: 0 },
      );
    }

    return res.json({
      success: true,
      msg: "Order restored",
    });
  }),
);

router.patch(
  "/permanent-delete",
  asyncHandler(async (req: Request, res: Response) => {
    const bulk = Array.isArray(req.body?.bulk) ? req.body.bulk : [];

    const regularIds: number[] = [];
    const retailerIds: number[] = [];

    bulk.forEach((item: any) => {
      const id = Number(item?.id);
      if (!id) return;

      const source = String(item?.orderSource ?? "").toLowerCase();
      const orderType = String(item?.orderType ?? "");
      const isRetailerOrder = source
        ? source === "retailer"
        : orderType === "Fresh" || orderType === "Stock";

      if (isRetailerOrder) {
        retailerIds.push(id);
      } else {
        regularIds.push(id);
      }
    });

    if (!regularIds.length && !retailerIds.length) {
      return res.status(400).json({
        success: false,
        message: "No valid orders selected to delete",
      });
    }

    const uniqueRegularIds = [...new Set(regularIds)];
    const uniqueRetailerIds = [...new Set(retailerIds)];

    const deletedRegularOrders = uniqueRegularIds.length
      ? await Order.find({
          select: ["id"],
          where: { id: In(uniqueRegularIds), status: 1 },
        })
      : [];
    const deletedRetailerOrders = uniqueRetailerIds.length
      ? await RetailerOrder.find({
          select: ["id"],
          where: { id: In(uniqueRetailerIds), status: 1 },
        })
      : [];

    const deletedRegularIds = deletedRegularOrders.map((order) => order.id);
    const deletedRetailerIds = deletedRetailerOrders.map((order) => order.id);

    if (deletedRegularIds.length) {
      const styleRows = await db.query(
        "SELECT id FROM `orderStyles` WHERE orderId IN (?)",
        [deletedRegularIds],
      );
      const styleIds = Array.isArray(styleRows)
        ? styleRows.map((row: any) => Number(row.id)).filter(Boolean)
        : [];

      await deleteStyleProgressByStyleIds(styleIds);
      await deleteOrderBeadersByStyleIds(styleIds);
      await OrderPayments.createQueryBuilder()
        .delete()
        .where("orderId IN (:...ids)", { ids: deletedRegularIds })
        .execute();
      await Order.delete({ id: In(deletedRegularIds), status: 1 });
    }

    if (deletedRetailerIds.length) {
      await RetailerOrdersPayment.createQueryBuilder()
        .delete()
        .where("orderId IN (:...ids)", { ids: deletedRetailerIds })
        .execute();
      await RetailerOrder.delete({ id: In(deletedRetailerIds), status: 1 });
    }

    const deletedCount = deletedRegularIds.length + deletedRetailerIds.length;

    return res.json({
      success: true,
      msg: `${deletedCount} order${deletedCount === 1 ? "" : "s"} permanently deleted`,
    });
  }),
);

router.patch(
  "/:id",
  raw({
    type: "multipart/form-data",
    limit: "100mb",
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const busboy = Busboy({ headers: req.headers });
    const fields: Field = {};
    const filePromises: Promise<FileData>[] = [];

    busboy.on("field", (fieldname: string, val: string) => {
      fields[fieldname] = val;
    });

    // @ts-ignore
    busboy.on(
      "file",
      (
        fieldname: string,
        file: NodeJS.ReadableStream,
        filename: string,
        encoding: string,
        mimetype: string,
      ) => {
        const buffers: Buffer[] = [];

        const filePromise = new Promise<FileData>((resolve, reject) => {
          file.on("data", (data: Buffer) => {
            buffers.push(data);
          });

          file.on("end", () => {
            const fileBuffer = Buffer.concat(buffers);
            resolve({
              fieldname,
              filename,
              encoding,
              mimetype,
              buffer: fileBuffer,
            });
          });

          file.on("error", (error: Error) => {
            reject(error);
          });
        });

        filePromises.push(filePromise);
      },
    );

    busboy.on("finish", async () => {
      try {
        const files = await Promise.all(filePromises);
        const orderId = parsePositiveInteger(req.params.id);
        if (!orderId) {
          return res.status(400).json({
            success: false,
            message: "Valid order id is required",
          });
        }

        // ================================
        // LOAD EXISTING ORDER
        // ================================
        const order = await Order.findOneOrFail({
          where: { id: orderId },
          relations: ["customer", "customer.currency", "styles"],
        });

        const hasField = (fieldName: string) =>
          Object.prototype.hasOwnProperty.call(fields, fieldName);

        let customer = order.customer;
        if (hasField("customerId")) {
          const customerId = parsePositiveInteger(fields["customerId"]);
          if (!customerId) {
            return res.status(400).json({
              success: false,
              message: "Customer is required",
            });
          }

          const updatedCustomer = await Customer.findOne({
            where: { id: customerId },
            relations: ["currency"],
          });
          if (!updatedCustomer) {
            return res.status(404).json({
              success: false,
              message: "Customer not found",
            });
          }

          customer = updatedCustomer;
          order.customer = customer;
        }

        if (!customer) {
          return res.status(400).json({
            success: false,
            message: "Customer is required",
          });
        }

        // ================================
        // PARSE STYLES FROM FIELDS
        // ================================
        const styles = parseStylesFromFieldsWithIndexes(fields);
        const deleteStyleIds = parseJsonArrayField(fields.deleteStyleIds)
          .map((styleId) => Number(styleId))
          .filter(Boolean);
        const incomingStylesById = new Map(
          styles
            .filter((style) => style.id)
            .map((style) => [Number(style.id), style]),
        );
        const effectiveStylesForValidation = [
          ...(order.styles ?? [])
            .filter((style) => !deleteStyleIds.includes(style.id))
            .map((style) => incomingStylesById.get(style.id) ?? style),
          ...styles.filter((style) => !style.id),
        ];
        const quantityValidationError = getRegularOrderQuantityValidationError(
          effectiveStylesForValidation,
        );

        if (quantityValidationError) {
          return res.status(400).json({
            success: false,
            message: quantityValidationError,
          });
        }

        // ================================
        // UPDATE ORDER-LEVEL FIELDS (only if present in payload)
        // ================================
        if (fields["purchaseOrderNo"]) {
          order.purchaeOrderNo = await resolveRegularPurchaseOrderNo(
            getCustomerStoreName(customer),
            fields["purchaseOrderNo"],
          );
        }
        if (fields["manufacturingEmailAddress"]) {
          order.manufacturingEmailAddress = fields["manufacturingEmailAddress"];
        }
        if (fields["orderType"]) {
          order.orderType = fields["orderType"] as OrderType;
        }
        if (fields["orderReceivedDate"]) {
          const date = parseDateOnly(fields["orderReceivedDate"]);
          if (!date) {
            return res.status(400).json({
              success: false,
              message: "Valid order received date is required",
            });
          }
          order.orderReceivedDate = date;
        }
        if (fields["orderCancellationDate"]) {
          const date = parseDateOnly(fields["orderCancellationDate"]);
          if (!date) {
            return res.status(400).json({
              success: false,
              message: "Valid order shipping date is required",
            });
          }
          order.orderCancellationDate = date;
        }
        if (fields["address"]) {
          order.address = fields["address"];
        }
        if (hasField("phoneNumber")) {
          order.phoneNumber = sanitizeText(fields["phoneNumber"]) || null;
        }
        if (hasField("estimate")) {
          order.estimateNo = sanitizeText(fields["estimate"]) || null;
        }
        if (hasField("invoice")) {
          order.invoiceNo = sanitizeText(fields["invoice"]) || null;
        }
        if (fields["publishStatus"]) {
          order.publishStatus = parsePublishStatus(fields["publishStatus"]);
        }

        order.customer = customer;
        await order.save();

        // ================================
        // HANDLE ORDER-LEVEL FILE UPLOAD (replace if new file sent)
        // ================================
        const uploadedOrderFile = files.find(
          (file) => file.fieldname === "uploadedOrderFile",
        );
        const uploadedOrderFileType = fields["uploadedOrderFileType"];

        if (uploadedOrderFile) {
          const extension = resolveUploadedOrderDocumentExtension(
            uploadedOrderFile,
            uploadedOrderFileType,
          );

          const uploadedDocument = await storeFileInS3(
            uploadedOrderFile.buffer,
            `order-documents/${orderId}/${Date.now()}${extension}`,
          );

          if (!uploadedDocument) {
            throw new Error("Failed to upload order document");
          }

          order.ppt_path = getFullUrl(uploadedDocument.fileName);
          await order.save();
        }

        // ================================
        // RECONCILE STYLES
        // ================================
        const pricingProductsMap = await fetchPricingProductsMap(styles);

        for (const styleId of deleteStyleIds) {
          const style = order.styles?.find((item) => item.id === styleId);
          if (style) {
            await deleteOrderBeadersByStyleIds([style.id]);
            await style.remove();
          }
        }

        // ================================
        // PROCESS EACH STYLE (UPDATE or INSERT)
        // ================================
        for (const s of styles) {
          const i = s._index;
          const isExisting = !!s.id;

          let styleEntity: Style;

          if (isExisting) {
            // Load existing style — keep barcode untouched
            styleEntity = await Style.findOneOrFail({
              where: { id: Number(s.id) },
            });
          } else {
            // New style
            styleEntity = new Style();
            styleEntity.order = order;
          }

          // Apply common fields
          styleEntity.styleNo = s.styleNo;
          styleEntity.customColor = s.customColor;
          styleEntity.comments = s.comments;
          styleEntity.customSize = s.customSize;
          styleEntity.customSizesQuantity = s.customSizesQuantity;
          styleEntity.colorType = s.colorType;
          styleEntity.sizeCountry = s.sizeCountry;
          styleEntity.size = s.size;
          styleEntity.mesh_color = s.mesh;
          styleEntity.beading_color = s.beading;
          styleEntity.beader = s.beader || null;
          styleEntity.lining = s.lining;
          styleEntity.lining_color =
            s.lining === "No Lining" ? null : s.liningColor;
          styleEntity.quantity = s.quantity ? Number(s.quantity) : 0;

          applyPricingToStyle(
            styleEntity,
            s,
            pricingProductsMap.get(sanitizeText(s.styleNo).toLowerCase()),
            customer,
          );

          // STEP 1 — SAVE (gets ID if new)
          await styleEntity.save();

          // STEP 2 — Assign barcode only for new styles
          if (!isExisting) {
            styleEntity.barcode = `${order.purchaeOrderNo}-${styleEntity.styleNo}-${styleEntity.id}`;
            await styleEntity.save();
          }
          await upsertOrderBeader({
            orderId: order.id,
            styleId: styleEntity.id,
            productCode: styleEntity.styleNo,
            beader: await resolveOrderStyleBeader(
              styleEntity.styleNo,
              styleEntity.beader,
              pricingProductsMap,
            ),
          });

          // STEP 3 — HANDLE IMAGES
          const styleImages = files.filter(
            (file) => file.fieldname === `styles[${i}].modifiedPhotoImage`,
          );

          if (styleImages.length > 0) {
            // New images sent — replace existing
            const imageUrls = await Promise.all(
              styleImages.map(async (file) => {
                if (!file) return null;

                const fileName = `orders/${orderId}/${Math.random()
                  .toString(36)
                  .substring(7)}.jpeg`;

                const compressedImage = await sharp(file.buffer)
                  .jpeg()
                  .toBuffer();

                return await storeFileInS3(compressedImage, fileName);
              }),
            );

            const existingPhotoUrls = normalizeFieldArray(
              styleEntity.photoUrls,
            ).filter(Boolean);
            const uploadedPhotoUrls = imageUrls
              .filter((x) => x)
              .map((x) => x?.fileName)
              .filter(Boolean);
            const nextPhotoUrls = Array.from(
              new Set([...existingPhotoUrls, ...uploadedPhotoUrls]),
            );

            if (nextPhotoUrls.length > 0) {
              styleEntity.photoUrls = JSON.stringify(nextPhotoUrls);
            }

            // STEP 4 — SAVE FINAL STYLE
            await styleEntity.save();
          }
          // If no images sent for this style, existing photoUrls are preserved
        }

        res.json({
          success: true,
          message:
            order.publishStatus === OrderPublishStatus.Draft
              ? "Draft updated successfully"
              : "Order updated successfully",
          purchaseOrderNo: order.purchaeOrderNo,
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({
          error: "An error occurred while updating the order",
        });
      }
    });

    busboy.end(req.body);
  }),
);

router.patch(
  "/:id/publish",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const order = await Order.findOne({
      where: { id: Number(id), status: 0 },
      relations: ["styles"],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const quantityValidationError = getRegularOrderQuantityValidationError(
      order.styles ?? [],
    );

    if (quantityValidationError) {
      return res.status(400).json({
        success: false,
        message: quantityValidationError,
      });
    }

    order.publishStatus = OrderPublishStatus.Published;
    await order.save();

    console.log("Order publish: sending order email now", {
      orderId: order.id,
      purchaseOrderNo: order.purchaeOrderNo,
      manufacturingEmailAddress: order.manufacturingEmailAddress,
    });

    // Try to send the order PDF email immediately. If sending fails,
    // revert the order back to Draft so the admin can retry and inform
    // the client about the failure.
    try {
      await sendCreatedOrderPdfEmail(order.id);
    } catch (emailError: any) {
      console.error("Order publish: email send failed, reverting to draft", {
        orderId: order.id,
        error: emailError?.message ?? String(emailError),
      });

      // Revert to draft so data is preserved and admin can retry
      order.publishStatus = OrderPublishStatus.Draft;
      await order.save();

      return res.status(500).json({
        success: false,
        message:
          "Failed to send order email. The order was saved as a draft. Please check the email address or try again.",
        error: emailError?.message ?? String(emailError),
      });
    }

    return res.json({
      success: true,
      message: "Order published and email sent successfully",
    });
  }),
);

export async function convertImageToBase64Jpeg(
  imageUrl: string,
): Promise<string | null> {
  try {
    if (!imageUrl) return null;

    const cachedImage = imageCache.get(imageUrl);
    if (cachedImage) {
      return cachedImage;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(imageUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const imageBufferFromURL = await response.arrayBuffer();

      // Increased size limit to 50MB
      if (imageBufferFromURL.byteLength > 50 * 1024 * 1024) {
        throw new Error("Image size too large (max 50MB)");
      }

      const processedBuffer = await sharp(imageBufferFromURL)
        .jpeg({
          quality: 80,
          mozjpeg: true,
        })
        .resize({
          width: 1200,
          height: 1200,
          fit: "inside",
          withoutEnlargement: true,
        })
        .toBuffer();

      const base64Image = `data:image/jpeg;base64,${processedBuffer.toString(
        "base64",
      )}`;

      imageCache.set(imageUrl, base64Image);
      return base64Image;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  } catch (error) {
    console.error(`Error converting image (${imageUrl}):`, error);
    return null;
  }
}

async function fetchProductsMap(styles: any[]) {
  const styleNos = [
    ...new Set(styles.map((style) => style.styleNo.toLowerCase())),
  ];

  // Create a map to store products we'll need to fetch
  const productsToFetch = new Set<string>();
  const productsMap = new Map();

  // Check cache first for each product
  for (const styleNo of styleNos) {
    const cachedProduct = productCache.get(styleNo);
    if (cachedProduct) {
      productsMap.set(styleNo, cachedProduct);
    } else {
      productsToFetch.add(styleNo);
    }
  }

  // If we have products to fetch, get them from database
  if (productsToFetch.size > 0) {
    const products = await Product.find({
      where: { productCode: In([...productsToFetch]) },
      relations: ["images"],
    });

    // Add fetched products to cache and map
    for (const product of products) {
      const productCode = product.productCode.toLowerCase();
      productCache.set(productCode, product);
      productsMap.set(productCode, product);
    }
  }

  return productsMap;
}

async function processOrders(orders: any[]) {
  try {
    // Extract all styles from all orders
    const allStyles = orders.flatMap((order) => order.styles);

    // Fetch all products at once
    const productsMap = await fetchProductsMap(allStyles);

    const newOrders = await Promise.all(
      orders.map(async (order) => {
        const processedStyles = await Promise.all(
          order.styles.map(
            async (style: { styleNo: string; photoUrls: any }) => {
              const product = productsMap.get(style.styleNo.toLowerCase());

              if (!product) {
                console.warn(
                  `No product found with productCode: ${style.styleNo.toLowerCase()}`,
                );
                // return {
                //     ...style,
                //     product: null,
                //     convertedFirstProductImage: null,
                //     photoUrl: null,
                //     convertedPhotoUrl: null,
                // };
              }

              // Process images in parallel
              let convertFirstProductImage;
              // const [base64FirstProductImage] = await Promise.all([
              //     product.images[0] ? convertImageToBase64Jpeg(product.images[0].name) : null
              // ]);

              if (product?.images[0]) {
                convertFirstProductImage = await convertImageToBase64Jpeg(
                  product.images[0].name,
                );
              }

              // const photoUrls = style.photoUrls ? style.photoUrls.map((path: string) => `https://${CONFIG.S3_BUCKET}.${CONFIG.S3_AWS_ENDPOINT}/${path}`) : null;
              // const photoUrls = order.isPreview
              //   ? style.photoUrls
              //   : style.photoUrls
              //   ? style.photoUrls.map(
              //       (path: string) =>
              //         `https://${CONFIG.S3_BUCKET}.${CONFIG.S3_AWS_ENDPOINT}/${path}`
              //     )
              //   : null;
              // 🔥 SAFE FIX FOR photoUrls
              let rawPhotoUrls = [];

              try {
                rawPhotoUrls = style.photoUrls
                  ? Array.isArray(style.photoUrls)
                    ? style.photoUrls
                    : typeof style.photoUrls === "string"
                      ? JSON.parse(style.photoUrls)
                      : []
                  : [];
              } catch {
                rawPhotoUrls = [];
              }

              const photoUrls = order.isPreview
                ? rawPhotoUrls
                : rawPhotoUrls.map(
                    (path: string) =>
                      `https://${CONFIG.S3_BUCKET}.${CONFIG.S3_AWS_ENDPOINT}/${path}`,
                  );

              return {
                ...style,
                product,
                convertedFirstProductImage: convertFirstProductImage,
                // photoUrl: style.photoUrl ?
                //     `https://${CONFIG.S3_BUCKET}.${CONFIG.S3_AWS_ENDPOINT}/${style.photoUrl}` :
                //     null,
                photoUrls: photoUrls,
              };
            },
          ),
        );

        return {
          ...order,
          styles: processedStyles,
        };
      }),
    );

    return newOrders;
  } catch (error) {
    console.error("Error processing orders:", error);
    throw error;
  }
}

const parseSelectedExportOrders = (value: unknown) => {
  const rawValue = Array.isArray(value) ? value[0] : value;
  if (typeof rawValue !== "string" || !rawValue.trim()) {
    return {
      hasSelection: false,
      regularIds: [] as number[],
      retailerIds: [] as number[],
    };
  }

  try {
    const parsed = JSON.parse(rawValue);
    const selectedOrders = Array.isArray(parsed) ? parsed : [];
    const regularIds = new Set<number>();
    const retailerIds = new Set<number>();

    selectedOrders.forEach((item: any) => {
      const id = Number(item?.id);
      if (!Number.isInteger(id) || id <= 0) return;

      const orderSource = String(item?.orderSource || "").toLowerCase();
      const orderType = String(item?.orderType || "");

      if (
        orderSource === "retailer" ||
        (!orderSource && ["Fresh", "Stock"].includes(orderType))
      ) {
        retailerIds.add(id);
        return;
      }

      regularIds.add(id);
    });

    return {
      hasSelection: true,
      regularIds: [...regularIds],
      retailerIds: [...retailerIds],
    };
  } catch {
    return {
      hasSelection: true,
      regularIds: [] as number[],
      retailerIds: [] as number[],
    };
  }
};

const appendIdFilter = (
  where: string[],
  params: any[],
  columnName: string,
  ids: number[],
) => {
  if (!ids.length) return;

  where.push(`${columnName} IN (${ids.map(() => "?").join(",")})`);
  params.push(...ids);
};

router.get(
  "/export-products",
  asyncHandler(async (req: Request, res: Response) => {
    const {
      query,
      orderType,
      stage,
      due,
      beader,
      selectedOrders,
    }: {
      query?: string;
      orderType?: string;
      stage?: string;
      due?: string;
      beader?: string;
      selectedOrders?: string;
    } = req.query;

    const likeQuery = query ? `%${query.toLowerCase()}%` : undefined;
    const beaderFilter = String(beader || "").trim();
    const hasBeaderFilter = Boolean(beaderFilter);
    const selectedExportOrders = parseSelectedExportOrders(selectedOrders);

    if (
      selectedExportOrders.hasSelection &&
      selectedExportOrders.regularIds.length === 0 &&
      selectedExportOrders.retailerIds.length === 0
    ) {
      return res.json({
        success: true,
        data: [],
      });
    }

    const regularWhere = [
      "o.status = 0",
      "COALESCE(o.publishStatus, 'published') = 'published'",
    ];
    const regularParams: any[] = [];
    const retailerWhere = ["ro.status = 0"];
    const retailerParams: any[] = [];

    if (likeQuery) {
      regularWhere.push(
        "(LOWER(o.purchaeOrderNo) LIKE ? OR LOWER(c.storeName) LIKE ? OR LOWER(c.name) LIKE ?)",
      );
      regularParams.push(likeQuery, likeQuery, likeQuery);

      retailerWhere.push(
        "(LOWER(ro.purchaeOrderNo) LIKE ? OR LOWER(c.storeName) LIKE ? OR LOWER(c.name) LIKE ?)",
      );
      retailerParams.push(likeQuery, likeQuery, likeQuery);
    }

    const includeRegular = selectedExportOrders.hasSelection
      ? selectedExportOrders.regularIds.length > 0
      : !orderType || !["Fresh", "Stock"].includes(String(orderType));
    const includeRetailer =
      !hasBeaderFilter &&
      (selectedExportOrders.hasSelection
        ? selectedExportOrders.retailerIds.length > 0
        : !orderType || ["Fresh", "Stock"].includes(String(orderType)));

    if (orderType && includeRegular) {
      regularWhere.push("o.orderType = ?");
      regularParams.push(orderType);
    }

    if (hasBeaderFilter) {
      regularWhere.push(
        `LOWER(${buildResolvedOrderStyleBeaderSql("s", "ob", "p")}) = LOWER(?)`,
      );
      regularParams.push(beaderFilter);
    }

    appendIdFilter(
      regularWhere,
      regularParams,
      "o.id",
      selectedExportOrders.regularIds,
    );
    appendIdFilter(
      retailerWhere,
      retailerParams,
      "ro.id",
      selectedExportOrders.retailerIds,
    );

    if (orderType === "Fresh") {
      retailerWhere.push("ro.is_stock_order = 0");
    } else if (orderType === "Stock") {
      retailerWhere.push("ro.is_stock_order = 1");
    }

    const orderStylesBeaderSelect = `${buildResolvedOrderStyleBeaderSql("s", "ob", "p")} AS beader`;

    const [regularRows, retailerRows, stockRows] = await Promise.all([
      includeRegular
        ? db.query(
            `
              SELECT
                'regular' AS orderSource,
                'STORE' AS qrType,
                o.id AS orderId,
                o.purchaeOrderNo AS purchaseOrderNo,
                o.orderType AS orderType,
                o.orderReceivedDate AS orderReceivedDate,
                o.orderCancellationDate AS orderCancellationDate,
                o.shippingStatus AS shippingStatus,
                o.shippingDate AS shippingDate,
                o.trackingNo AS trackingNo,
                o.address AS orderAddress,
                c.name AS customerName,
                c.storeName AS customerStoreName,
                c.phoneNumber AS customerPhone,
                c.storeAddress AS customerAddress,
                c.postalCode AS customerPostalCode,
                country.name AS customerCountry,
                s.id AS styleId,
                s.styleNo AS styleNo,
                s.barcode AS barcode,
                s.size AS size,
                s.sizeCountry AS size_country,
                s.quantity AS quantity,
                s.colorType AS colorType,
                s.mesh_color AS meshColorRaw,
                s.beading_color AS beadingColor,
                ${orderStylesBeaderSelect},
                s.lining AS lining,
                s.lining_color AS liningColor,
                s.comments AS styleComments,
                CONCAT('SAS(', COALESCE(pc.name, s.mesh_color), ')') AS meshColor
              FROM orderStyles s
              INNER JOIN orders o ON o.id = s.orderId
              LEFT JOIN \`${ORDER_BEADERS_TABLE}\` ob ON ob.styleId = s.id
              LEFT JOIN products p ON p.productCode = s.styleNo
              LEFT JOIN customers c ON c.id = o.customerId
              LEFT JOIN country country ON country.id = c.countryId
              LEFT JOIN product_colours pc ON LOWER(pc.hexcode) = LOWER(s.mesh_color)
              WHERE ${regularWhere.join(" AND ")}
              ORDER BY o.createdAt DESC, s.id ASC
            `,
            regularParams,
          )
        : [],
      includeRetailer && orderType !== "Stock"
        ? db.query(
            `
              SELECT
                'retailer' AS orderSource,
                'RETAILER' AS qrType,
                ro.id AS orderId,
                ro.purchaeOrderNo AS purchaseOrderNo,
                'Fresh' AS orderType,
                ro.orderReceivedDate AS orderReceivedDate,
                ro.orderCancellationDate AS orderCancellationDate,
                ro.shippingStatus AS shippingStatus,
                ro.shippingDate AS shippingDate,
                ro.trackingNo AS trackingNo,
                ro.address AS orderAddress,
                c.name AS customerName,
                c.storeName AS customerStoreName,
                c.phoneNumber AS customerPhone,
                c.storeAddress AS customerAddress,
                c.postalCode AS customerPostalCode,
                country.name AS customerCountry,
                ros.id AS styleId,
                ros.styleNo AS styleNo,
                ros.barcode AS barcode,
                ros.size AS size,
                ros.size_country AS size_country,
                ros.quantity AS quantity,
                NULL AS colorType,
                matchedFavourite.mesh_color AS meshColorRaw,
                NULL AS beadingColor,
                NULL AS beader,
                NULL AS lining,
                NULL AS liningColor,
                NULL AS styleComments,
                CONCAT('SAS(', COALESCE(pc.name, matchedFavourite.mesh_color), ')') AS meshColor
              FROM retailer_order_styles ros
              INNER JOIN retailer_orders ro ON ro.id = ros.retailerOrderId
              LEFT JOIN retailers r ON r.id = ro.retailerId
              LEFT JOIN customers c ON c.id = r.customerId
              LEFT JOIN country country ON country.id = c.countryId
              LEFT JOIN retailer_favourites_orders rfo ON rfo.id = ro.favouriteOrderId
              LEFT JOIN products p ON p.productCode = ros.styleNo
              LEFT JOIN favourites matchedFavourite
                ON FIND_IN_SET(matchedFavourite.id, rfo.favourite_ids) > 0
               AND matchedFavourite.productId = p.id
               AND (
                    ros.size = CAST(matchedFavourite.admin_us_size AS CHAR)
                 OR ros.size = CAST(matchedFavourite.product_size AS CHAR)
                 OR ros.size = CONCAT(CAST(matchedFavourite.product_size AS CHAR), ' (', matchedFavourite.size_country, ')')
               )
               AND (
                    ros.size_country = matchedFavourite.size_country
                 OR ros.size_country IS NULL
                 OR ros.size_country = ''
               )
              LEFT JOIN product_colours pc ON LOWER(pc.hexcode) = LOWER(matchedFavourite.mesh_color)
              WHERE ${retailerWhere.join(" AND ")} AND ro.is_stock_order = 0
              ORDER BY ro.createdAt DESC, ros.id ASC
            `,
            retailerParams,
          )
        : [],
      includeRetailer && orderType !== "Fresh"
        ? db.query(
            `
              SELECT
                'retailer' AS orderSource,
                'STOCK' AS qrType,
                ro.id AS orderId,
                ro.purchaeOrderNo AS purchaseOrderNo,
                'Stock' AS orderType,
                ro.orderReceivedDate AS orderReceivedDate,
                ro.orderCancellationDate AS orderCancellationDate,
                ro.shippingStatus AS shippingStatus,
                ro.shippingDate AS shippingDate,
                ro.trackingNo AS trackingNo,
                ro.address AS orderAddress,
                c.name AS customerName,
                c.storeName AS customerStoreName,
                c.phoneNumber AS customerPhone,
                c.storeAddress AS customerAddress,
                c.postalCode AS customerPostalCode,
                country.name AS customerCountry,
                sos.id AS styleId,
                sos.styleNo AS styleNo,
                sos.barcode AS barcode,
                sos.size AS size,
                sos.size_country AS size_country,
                sos.quantity AS quantity,
                NULL AS colorType,
                s.mesh_color AS meshColorRaw,
                NULL AS beadingColor,
                NULL AS beader,
                NULL AS lining,
                NULL AS liningColor,
                NULL AS styleComments,
                CONCAT('SAS(', COALESCE(pc.name, s.mesh_color), ')') AS meshColor
              FROM stock_order_styles sos
              INNER JOIN retailer_orders ro ON ro.id = sos.retailerOrderId
              LEFT JOIN retailers r ON r.id = ro.retailerId
              LEFT JOIN customers c ON c.id = r.customerId
              LEFT JOIN country country ON country.id = c.countryId
              LEFT JOIN retailer_stock_orders rso ON rso.id = ro.stockOrderId
              LEFT JOIN stock s ON s.id = rso.stockId
              LEFT JOIN product_colours pc ON LOWER(pc.hexcode) = LOWER(s.mesh_color)
              WHERE ${retailerWhere.join(" AND ")} AND ro.is_stock_order = 1
              ORDER BY ro.createdAt DESC, sos.id ASC
            `,
            retailerParams,
          )
        : [],
    ]);

    const productRows = [...regularRows, ...retailerRows, ...stockRows];
    const regularBarcodes = productRows
      .filter((row) => row.qrType === "STORE")
      .map((row) => String(row.barcode || "").trim())
      .filter(Boolean);
    const retailerBarcodes = productRows
      .filter((row) => row.qrType === "RETAILER")
      .map((row) => String(row.barcode || "").trim())
      .filter(Boolean);
    const stockBarcodes = productRows
      .filter((row) => row.qrType === "STOCK")
      .map((row) => String(row.barcode || "").trim())
      .filter(Boolean);
    const sharedRetailerBarcodes = [...retailerBarcodes, ...stockBarcodes];

    const [regularProgressByBarcode, retailerProgressByBarcode] =
      await Promise.all([
        getLatestProgressRows(
          "store_style_progress",
          "status",
          regularBarcodes,
        ).then((rows) => buildStageMap(rows, "status")),
        getLatestProgressRows(
          "styleProgress",
          "stage",
          sharedRetailerBarcodes,
        ).then((rows) => buildStageMap(rows, "stage")),
      ]);

    const data = productRows
      .map((row) => {
        const progressMap =
          row.qrType === "STORE"
            ? regularProgressByBarcode
            : retailerProgressByBarcode;
        const barcode = String(row.barcode || "");
        const productStatus = progressMap.get(barcode) ?? DEFAULT_ORDER_STAGE;
        const quantity = Number(row.quantity ?? 1) || 1;
        const qrBoxColor = getQrBoxColorDisplay(row);

        return {
          productStatus,
          orderCancellationDate: row.orderCancellationDate,
          row: {
            "Style No": row.styleNo,
            Size: row.size ?? "",
            Quantity: quantity,
            Color: qrBoxColor,
            Beader: row.beader ?? "",
            "PO Number": row.purchaseOrderNo,
            "Product Status": productStatus,
          },
        };
      })
      .filter(({ productStatus, orderCancellationDate }) => {
        if (stage && productStatus !== stage) return false;
        return matchesDueFilter(due, productStatus, orderCancellationDate);
      })
      .map(({ row }) => row);

    return res.json({
      success: true,
      data,
    });
  }),
);

router.get(
  "/stage-counts",
  asyncHandler(async (req: Request, res: Response) => {
    const { query, orderType, publishStatus, beader } = req.query as {
      query?: string;
      orderType?: string;
      publishStatus?: string;
      beader?: string;
    };

    const sourceOrders = await getOrderStageCountSourceOrders({
      query,
      orderType,
      publishStatus,
      beader,
    });
    const stageCounts = await getProductStageCounts(sourceOrders);

    return res.json({
      success: true,
      stageCounts,
    });
  }),
);

router.get(
  "/beaders",
  asyncHandler(async (_req: Request, res: Response) => {
    const beaders = await Beader.find({
      order: { name: "ASC" },
    });

    return res.json({
      success: true,
      beaders: beaders
        .map((beader) => sanitizeText(beader.name))
        .filter(Boolean),
    });
  }),
);

router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const {
      page,
      limit,
      query,
      orderType,
      stage,
      publishStatus,
      beader,
      deletedOnly,
    }: {
      page?: string;
      limit?: string;
      query?: string;
      orderType?: string;
      stage?: string;
      publishStatus?: string;
      beader?: string;
      deletedOnly?: string;
    } = req.query;

    const pageSize = Math.min(100, Math.max(1, Number(limit) || 50));
    const skip = (page ? Number(page) - 1 : 0) * pageSize;
    const likeQuery = query ? `%${query.toLowerCase()}%` : undefined;
    const isDeletedOnly = deletedOnly === "true";
    const deletedStatus = isDeletedOnly ? 1 : 0;
    const hasPublishStatusFilter = Boolean(publishStatus);
    const requestedPublishStatus =
      publishStatus === OrderPublishStatus.Draft
        ? OrderPublishStatus.Draft
        : OrderPublishStatus.Published;
    const includeRetailerOrders =
      requestedPublishStatus === OrderPublishStatus.Published;

    let unionQuery;

    // First query for regular orders
    const regularOrdersQuery = db
      .createQueryBuilder()
      .select([
        "o.id as id",
        "o.purchaeOrderNo as purchaeOrderNo",
        "o.manufacturingEmailAddress as manufacturingEmailAddress",
        "o.orderType as orderType",
        "o.orderReceivedDate as orderReceivedDate",
        "o.orderCancellationDate as orderCancellationDate",
        "o.address as address",
        "o.phoneNumber as phoneNumber",
        "o.estimateNo as estimateNo",
        "o.invoiceNo as invoiceNo",
        "o.orderStatus as orderStatus",
        "o.shippingStatus as shippingStatus",
        "o.shippingDate as shippingDate",
        "o.trackingNo as trackingNo",
        "COALESCE(o.publishStatus, 'published') as publishStatus",
        "o.emailStatus as emailStatus",
        "o.emailFailureReason as emailFailureReason",
        "o.emailLastAttemptAt as emailLastAttemptAt",
        "o.createdAt as createdAt",
        "'regular' as orderSource",
      ])
      .from(Order, "o")
      .leftJoin("o.customer", "customer") // Join the Customer table to filter by name
      .where("o.status = :deletedStatus", { deletedStatus });

    if (!isDeletedOnly || hasPublishStatusFilter) {
      regularOrdersQuery.andWhere(
        "COALESCE(o.publishStatus, :publishedStatus) = :publishStatus",
        {
          publishedStatus: OrderPublishStatus.Published,
          publishStatus: requestedPublishStatus,
        },
      );
    }

    if (likeQuery) {
      regularOrdersQuery.andWhere(
        "(LOWER(o.purchaeOrderNo) LIKE :likeQuery OR LOWER(o.estimateNo) LIKE :likeQuery OR LOWER(o.invoiceNo) LIKE :likeQuery OR LOWER(customer.storeName) LIKE :likeQuery OR LOWER(customer.name) LIKE :likeQuery)",
        { likeQuery },
      );
    }

    const hasBeaderFilter = await addOrderStylesBeaderFilter(
      regularOrdersQuery,
      "o",
      beader,
    );

    // Second query for retailer orders
    const retailerOrdersQuery = db
      .createQueryBuilder()
      .select([
        "ro.id as id",
        "ro.purchaeOrderNo as purchaeOrderNo",
        "ro.manufacturingEmailAddress as manufacturingEmailAddress",
        "CASE WHEN ro.is_stock_order = 1 THEN 'Stock' ELSE 'Fresh' END as orderType",
        "ro.orderReceivedDate as orderReceivedDate",
        "ro.orderCancellationDate as orderCancellationDate",
        "ro.address as address",
        "ro.phoneNumber as phoneNumber",
        "ro.estimateNo as estimateNo",
        "ro.invoiceNo as invoiceNo",
        "ro.orderStatus as orderStatus",
        "ro.shippingStatus as shippingStatus",
        "ro.shippingDate as shippingDate",
        "ro.trackingNo as trackingNo",
        "'published' as publishStatus",
        "NULL as emailStatus",
        "NULL as emailFailureReason",
        "NULL as emailLastAttemptAt",
        "ro.createdAt as createdAt",
        "'retailer' as orderSource",
      ])
      .from(RetailerOrder, "ro")
      .leftJoin("ro.retailer", "retailer") // Join the Retailer table
      .leftJoin("retailer.customer", "customer") // Join the Customer table to filter by name
      .where("ro.status = :deletedStatus", { deletedStatus });

    if (likeQuery) {
      retailerOrdersQuery.andWhere(
        "(LOWER(ro.purchaeOrderNo) LIKE :likeQuery OR LOWER(ro.estimateNo) LIKE :likeQuery OR LOWER(ro.invoiceNo) LIKE :likeQuery OR LOWER(customer.storeName) LIKE :likeQuery OR LOWER(customer.name) LIKE :likeQuery)",
        { likeQuery },
      );
    }

    if (orderType) {
      if (!includeRetailerOrders) {
        regularOrdersQuery.andWhere("o.orderType = :orderType", { orderType });
        unionQuery = regularOrdersQuery.getQuery();
      } else if (hasBeaderFilter && ["Fresh", "Stock"].includes(orderType)) {
        regularOrdersQuery.andWhere("1 = 0");
        unionQuery = regularOrdersQuery.getQuery();
      } else if (orderType === "Stock") {
        retailerOrdersQuery.andWhere("ro.is_stock_order = 1");
        unionQuery = retailerOrdersQuery.getQuery();
      } else if (orderType === "Fresh") {
        retailerOrdersQuery.andWhere("ro.is_stock_order = 0");
        unionQuery = retailerOrdersQuery.getQuery();
      } else {
        regularOrdersQuery.andWhere("o.orderType = :orderType", { orderType });
        unionQuery = regularOrdersQuery.getQuery();
      }
    } else {
      unionQuery =
        includeRetailerOrders && !hasBeaderFilter
          ? `(${regularOrdersQuery.getQuery()}) UNION ALL (${retailerOrdersQuery.getQuery()})`
          : regularOrdersQuery.getQuery();
    }

    const finalQuery = db
      .createQueryBuilder()
      .select("*")
      .from(`(${unionQuery})`, "combined_orders")
      .orderBy("createdAt", "DESC");

    if (!stage) {
      finalQuery.limit(pageSize).offset(skip);
    }

    const countQuery = db
      .createQueryBuilder()
      .select("COUNT(*) as count")
      .from(`(${unionQuery})`, "combined_orders");
    const productCountSourceQuery = db
      .createQueryBuilder()
      .select("*")
      .from(`(${unionQuery})`, "combined_orders");

    const mergedParams = {
      ...regularOrdersQuery.getParameters(),
      ...retailerOrdersQuery.getParameters(),
    };

    const [combinedOrders, countResult, productCountSourceOrders] =
      await Promise.all([
        finalQuery.setParameters(mergedParams).getRawMany(),
        countQuery.setParameters(mergedParams).getRawOne(),
        productCountSourceQuery.setParameters(mergedParams).getRawMany(),
      ]);
    const stageCounts = await getProductStageCounts(productCountSourceOrders);

    const regularOrderIds = combinedOrders
      .filter((order) => order.orderSource === "regular")
      .map((order) => order.id);

    const retailerOrderIds = combinedOrders
      .filter((order) => order.orderSource === "retailer")
      .map((order) => order.id);

    let regularOrdersWithRelations = [] as any;
    let retailerOrdersWithRelations = [] as any;

    if (regularOrderIds.length > 0) {
      regularOrdersWithRelations = await db
        .createQueryBuilder()
        .select("order")
        .from(Order, "order")
        .leftJoinAndSelect("order.customer", "customer")
        .leftJoinAndSelect("customer.country", "customerCountry")
        .leftJoinAndSelect("customer.client", "customerClient")
        .leftJoinAndSelect("order.styles", "styles")
        .addSelect("styles.beader")
        .where("order.id IN (:...ids)", { ids: regularOrderIds })
        .getMany();
    }

    if (retailerOrderIds.length > 0) {
      retailerOrdersWithRelations = await db
        .createQueryBuilder()
        .select("order")
        .from(RetailerOrder, "order")
        .leftJoinAndSelect("order.retailer", "retailer")
        .leftJoinAndSelect("retailer.customer", "customer")
        .leftJoinAndSelect("customer.country", "customerCountry")
        .leftJoinAndSelect("customer.client", "customerClient")
        .leftJoinAndSelect("order.favourite_order", "favourite_order")
        .leftJoinAndSelect("order.Stock_order", "Stock_order")
        .where("order.id IN (:...ids)", { ids: retailerOrderIds })
        .getMany();
    }

    const shippingCountryIds = Array.from(
      new Set(
        [
          ...regularOrdersWithRelations.map(
            (order: any) => order.customer?.shippingCountryId,
          ),
          ...retailerOrdersWithRelations.map(
            (order: any) => order.retailer?.customer?.shippingCountryId,
          ),
        ]
          .map((id) => Number(sanitizeText(id)))
          .filter((id) => Number.isFinite(id) && id > 0),
      ),
    );
    const shippingCountries = shippingCountryIds.length
      ? await Country.find({ where: { id: In(shippingCountryIds) } })
      : [];
    const shippingCountryNameById = new Map(
      shippingCountries.map((country) => [
        String(country.id),
        sanitizeText(country.name),
      ]),
    );

    // Fetch and map payment data for retailer orders
    const paymentsMap = new Map<number, number>();
    const retailerStageDatesMap = new Map<number, Record<string, string>>();
    if (retailerOrderIds.length > 0) {
      const retailerPayments = await db
        .createQueryBuilder()
        .select("payment.orderId", "orderId")
        .addSelect("SUM(payment.amount)", "paidAmount")
        .from("retailer_order_payments", "payment")
        .where("payment.orderId IN (:...ids)", { ids: retailerOrderIds })
        .groupBy("payment.orderId")
        .getRawMany();

      retailerPayments.forEach((p) => {
        paymentsMap.set(Number(p.orderId), Number(p.paidAmount));
      });

      const [freshProgressDates, stockProgressDates] = await Promise.all([
        db
          .createQueryBuilder()
          .select("ros.retailerOrderId", "orderId")
          .addSelect("sp.stage", "stage")
          .addSelect("MAX(sp.createdAt)", "stageDate")
          .from("styleProgress", "sp")
          .innerJoin("retailer_order_styles", "ros", "ros.barcode = sp.barcode")
          .where("ros.retailerOrderId IN (:...ids)", { ids: retailerOrderIds })
          .groupBy("ros.retailerOrderId")
          .addGroupBy("sp.stage")
          .getRawMany(),
        db
          .createQueryBuilder()
          .select("sos.retailerOrderId", "orderId")
          .addSelect("sp.stage", "stage")
          .addSelect("MAX(sp.createdAt)", "stageDate")
          .from("styleProgress", "sp")
          .innerJoin("stock_order_styles", "sos", "sos.barcode = sp.barcode")
          .where("sos.retailerOrderId IN (:...ids)", { ids: retailerOrderIds })
          .groupBy("sos.retailerOrderId")
          .addGroupBy("sp.stage")
          .getRawMany(),
      ]);

      const stageToFieldMap: Record<string, string> = {
        Pattern: "pattern",
        Khaka: "khaka",
        "Issue Beading": "issue_beading",
        Beading: "beading",
        Zarkan: "zarkan",
        Stitching: "stitching",
        Repair: "repair",
        "Balance Pending": "balance_pending",
        "Ready To Delivery": "ready_to_delivery",
        Shipped: "shipped",
      };

      [...freshProgressDates, ...stockProgressDates].forEach((row: any) => {
        const orderId = Number(row.orderId);
        const field = stageToFieldMap[row.stage];
        if (!field || !row.stageDate) return;

        const existing = retailerStageDatesMap.get(orderId) ?? {};
        existing[field] = row.stageDate;
        retailerStageDatesMap.set(orderId, existing);
      });
    }

    const regularProductRows = await getRegularProductRows(
      regularOrderIds.map(Number).filter(Boolean),
    );
    const regularBarcodesByOrderId = new Map<number, string[]>();

    regularProductRows.forEach((row) => {
      const existing = regularBarcodesByOrderId.get(row.orderId) ?? [];
      existing.push(row.barcode);
      regularBarcodesByOrderId.set(row.orderId, existing);
    });

    const regularOrderBarcodes = regularProductRows.map((row) => row.barcode);
    const regularProgressByBarcode = buildStageMap(
      await getLatestProgressRows(
        "store_style_progress",
        "status",
        regularOrderBarcodes,
      ),
      "status",
    );

    const retailerBarcodesByOrderId = new Map<number, string[]>();
    let retailerProgressByBarcode = new Map<string, string>();

    if (retailerOrderIds.length > 0) {
      const placeholders = retailerOrderIds.map(() => "?").join(",");
      const retailerStyleRows = await db.query(
        `
        SELECT retailerOrderId AS orderId, barcode
        FROM retailer_order_styles
        WHERE retailerOrderId IN (${placeholders})
        UNION ALL
        SELECT retailerOrderId AS orderId, barcode
        FROM stock_order_styles
        WHERE retailerOrderId IN (${placeholders})
        `,
        [...retailerOrderIds, ...retailerOrderIds],
      );

      retailerStyleRows.forEach((row: any) => {
        const orderId = Number(row.orderId);
        const barcode = String(row.barcode || "");
        if (!orderId || !barcode) return;

        const existing = retailerBarcodesByOrderId.get(orderId) ?? [];
        existing.push(barcode);
        retailerBarcodesByOrderId.set(orderId, existing);
      });

      retailerProgressByBarcode = buildStageMap(
        await getLatestProgressRows(
          "styleProgress",
          "stage",
          retailerStyleRows
            .map((row: any) => String(row.barcode))
            .filter(Boolean),
        ),
        "stage",
      );
    }

    // Final formatting
    const formattedOrders = combinedOrders.map((baseOrder) => {
      let detailedOrder;
      if (baseOrder.orderSource === "regular") {
        detailedOrder = regularOrdersWithRelations.find(
          (o: any) => o.id === baseOrder.id,
        );
      } else {
        detailedOrder = retailerOrdersWithRelations.find(
          (o: any) => o.id === baseOrder.id,
        );
      }

      const styles = detailedOrder?.styles?.map((style: any) => {
        return {
          ...style,

          // Fix photoUrls
          photoUrls: safeArray(style.photoUrls).map(
            (url: string) =>
              `https://${CONFIG.S3_BUCKET}.${CONFIG.S3_AWS_ENDPOINT}/${url}`,
          ),

          // Fix comments
          comments: safeArray(style.comments),

          // Fix custom colors
          customColor: safeArray(style.customColor),

          // Fix custom sizes
          customSize: safeArray(style.customSize),
        };
      });
      const totalQuantity =
        baseOrder.orderSource === "regular"
          ? (styles || []).reduce(
              (sum: number, style: any) => sum + getStyleTotalQuantity(style),
              0,
            )
          : Number(detailedOrder?.quantity || 0) || 0;
      const computedOrderStatus =
        baseOrder.orderSource === "regular"
          ? getDisplayedOrderStage(
              regularBarcodesByOrderId.get(Number(baseOrder.id)) ??
                (styles || [])
                  .map((style: any) => String(style.barcode))
                  .filter(Boolean),
              regularProgressByBarcode,
              baseOrder.orderStatus,
            )
          : getDisplayedOrderStage(
              retailerBarcodesByOrderId.get(Number(baseOrder.id)) ?? [],
              retailerProgressByBarcode,
              baseOrder.orderStatus,
            );

      const recoveredStageDates =
        baseOrder.orderSource === "retailer"
          ? (retailerStageDatesMap.get(baseOrder.id) ?? {})
          : {};

      const resolvedCustomer =
        baseOrder.orderSource === "regular"
          ? detailedOrder?.customer
          : detailedOrder?.retailer?.customer;

      const resolvedAddress = buildOrderAddress(
        baseOrder.address,
        resolvedCustomer,
      );
      const resolvedPhoneNumber = sanitizeText(baseOrder.phoneNumber) || null;

      const result: any = {
        id: baseOrder.id,
        createdAt: baseOrder.createdAt,
        purchaeOrderNo: baseOrder.purchaeOrderNo,
        manufacturingEmailAddress: baseOrder.manufacturingEmailAddress,
        orderType: baseOrder.orderType,
        orderReceivedDate: formatDateOnly(baseOrder.orderReceivedDate),
        orderCancellationDate: formatDateOnly(baseOrder.orderCancellationDate),
        address: resolvedAddress,
        phoneNumber: resolvedPhoneNumber,
        estimateNo: baseOrder.estimateNo ?? null,
        invoiceNo: baseOrder.invoiceNo ?? null,
        orderStatus: computedOrderStatus,
        shippingStatus: baseOrder.shippingStatus,
        shippingDate: baseOrder.shippingDate,
        trackingNo: baseOrder.trackingNo,
        publishStatus: baseOrder.publishStatus ?? OrderPublishStatus.Published,
        emailStatus: baseOrder.emailStatus ?? null,
        emailFailureReason: baseOrder.emailFailureReason ?? null,
        emailLastAttemptAt: baseOrder.emailLastAttemptAt ?? null,
        pattern: detailedOrder?.pattern ?? recoveredStageDates.pattern ?? null,
        khaka: detailedOrder?.khaka ?? recoveredStageDates.khaka ?? null,
        issue_beading:
          detailedOrder?.issue_beading ??
          recoveredStageDates.issue_beading ??
          null,
        beading: detailedOrder?.beading ?? recoveredStageDates.beading ?? null,
        zarkan: detailedOrder?.zarkan ?? recoveredStageDates.zarkan ?? null,
        stitching:
          detailedOrder?.stitching ?? recoveredStageDates.stitching ?? null,
        repair: detailedOrder?.repair ?? recoveredStageDates.repair ?? null,
        balance_pending:
          detailedOrder?.balance_pending ??
          recoveredStageDates.balance_pending ??
          null,
        ready_to_delivery:
          detailedOrder?.ready_to_delivery ??
          recoveredStageDates.ready_to_delivery ??
          null,
        shipped: detailedOrder?.shipped ?? recoveredStageDates.shipped ?? null,
        ppt_path: detailedOrder?.ppt_path || null,
        customer: buildOrderCustomerPayload(
          resolvedCustomer,
          resolvedPhoneNumber,
          shippingCountryNameById,
        ),
        totalQuantity,
        styles: styles || [],
        orderSource: baseOrder.orderSource,
      };

      if (baseOrder.orderSource === "retailer") {
        result.retailer = detailedOrder?.retailer;

        if (baseOrder.orderType === "Stock" && detailedOrder?.Stock_order) {
          result.stockId = detailedOrder.Stock_order.id;
          result.Stock_order = detailedOrder.Stock_order;
        }

        if (baseOrder.orderType === "Fresh" && detailedOrder?.favourite_order) {
          result.favouriteOrder = detailedOrder.favourite_order;
        }

        // payment-related info
        const purchaseAmount = Number(detailedOrder?.purchaseAmount || 0);
        const paidAmount = paymentsMap.get(baseOrder.id) || 0;
        const balancePayment = purchaseAmount - paidAmount;

        result.purchaseAmount = purchaseAmount;
        result.paidAmount = paidAmount;
        result.balancePayment = balancePayment;
      }

      return result;
    });

    const stageFilteredOrders = stage
      ? formattedOrders.filter((order) => order.orderStatus === stage)
      : formattedOrders;
    const paginatedOrders = stage
      ? stageFilteredOrders.slice(skip, skip + pageSize)
      : stageFilteredOrders;

    res.json({
      orders: paginatedOrders,
      totalCount: stage
        ? stageFilteredOrders.length
        : parseInt(countResult?.count || "0"),
      stageCounts,
    });
  }),
);

router.get(
  "/customization/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const order = await Order.findOne({
      where: {
        id: Number(id),
        status: 0,
      },
      relations: ["styles"],
    });

    if (!order || order.publishStatus === OrderPublishStatus.Draft) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
        data: [],
      });
    }

    return res.json({
      success: true,
      data: (order.styles || []).map(mapOrderStyleCustomization),
    });
  }),
);

router.patch(
  "/customization/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const incoming = Array.isArray(req.body?.data) ? req.body.data : [];

    const order = await Order.findOne({
      where: {
        id: Number(id),
        status: 0,
      },
      relations: ["styles"],
    });

    if (!order || order.publishStatus === OrderPublishStatus.Draft) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const stylesById = new Map(
      (order.styles || []).map((style) => [Number(style.id), style]),
    );

    for (const item of incoming) {
      const style = stylesById.get(Number(item?.id));
      if (!style) continue;

      style.comments = JSON.stringify(
        commentsToArray(item?.customization ?? item?.comments),
      );
      await style.save();
    }

    return res.json({
      success: true,
      message: "Customization Edited successfully",
      data: (order.styles || []).map(mapOrderStyleCustomization),
    });
  }),
);

router.post(
  "/admin/payment-update/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { amount, payment_type } = req.body;
    const paymentAmount = Number(amount);
    const paymentMethod = String(payment_type || "").trim();

    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid payment amount",
        msg: "Please enter a valid payment amount",
      });
    }

    if (!paymentMethod || paymentMethod === "select") {
      return res.status(400).json({
        success: false,
        message: "Please select a payment method",
        msg: "Please select a payment method",
      });
    }

    const order = await Order.findOne({
      where: { id: Number(id), status: 0 },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
        msg: "Order not found",
      });
    }

    const summaryBeforePayment = await getRegularOrderPaymentSummary(order);

    if (paymentAmount > summaryBeforePayment.balance) {
      const message = `Payment amount cannot exceed pending balance (${summaryBeforePayment.balance})`;
      return res.status(400).json({
        success: false,
        message,
        msg: message,
        data: summaryBeforePayment,
      });
    }

    const payment = new OrderPayments();
    payment.order = order;
    payment.amount = paymentAmount;
    payment.paymentMethod = paymentMethod;
    await payment.save();

    const summary = await getRegularOrderPaymentSummary(order);

    return res.json({
      success: true,
      msg: "Payment Updated",
      data: summary,
    });
  }),
);

router.get(
  "/orderDetails",
  asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.query as any;

    const order = await db
      .createQueryBuilder(Order, "order")
      .leftJoinAndSelect("order.customer", "customer")
      .leftJoinAndSelect("order.styles", "styles")
      .leftJoinAndSelect("order.orderPayments", "orderPayments")
      .addSelect("styles.beader")
      .where("order.id = :orderId", { orderId: Number(orderId) })
      .andWhere("order.status = 0")
      .andWhere(
        "COALESCE(order.publishStatus, :publishedStatus) = :publishedStatus",
        {
          publishedStatus: OrderPublishStatus.Published,
        },
      )
      .getOne();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
        orders: [],
      });
    }

    const processedOrders = await processOrders([order]); // ← convert to array

    const resolvedOrders = await Promise.all(
      processedOrders.map(applyResolvedRegularOrderBeaders),
    );

    res.json({
      success: true,
      orders: resolvedOrders,
    });
  }),
);

router.post(
  "/preview",
  raw({
    type: "multipart/form-data",
    limit: "100mb",
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const busboy = Busboy({ headers: req.headers });
    const fields: Field = {};
    const filePromises: Promise<FileData>[] = [];

    busboy.on("field", (fieldname: string, val: string) => {
      fields[fieldname] = val;
    });

    busboy.on(
      "file",
      (
        fieldname: string,
        file: NodeJS.ReadableStream,
        filename: string,
        encoding: string,
        mimetype: string,
      ) => {
        const buffers: Buffer[] = [];

        const filePromise = new Promise<FileData>((resolve, reject) => {
          file.on("data", (data: Buffer) => {
            buffers.push(data);
          });

          file.on("end", () => {
            const fileBuffer = Buffer.concat(buffers);
            resolve({
              fieldname,
              filename,
              encoding,
              mimetype,
              buffer: fileBuffer,
            });
          });

          file.on("error", (error: Error) => {
            reject(error);
          });
        });

        filePromises.push(filePromise);
      },
    );

    busboy.on("finish", async () => {
      try {
        const files = await Promise.all(filePromises);

        // Parse the fields
        const purchaseOrderNo = fields["purchaseOrderNo"];
        const manufacturingEmailAddress = fields["manufacturingEmailAddress"];
        const orderType = fields["orderType"];
        const orderReceivedDate = parseDateOnly(fields["orderReceivedDate"]);
        const orderCancellationDate = parseDateOnly(
          fields["orderCancellationDate"],
        );
        const address = fields["address"];
        const customerId = parsePositiveInteger(fields["customerId"]);

        if (!orderReceivedDate || !orderCancellationDate) {
          return res.status(400).json({
            success: false,
            message: "Valid order received and shipping dates are required",
          });
        }

        // Parse styles from fields
        const styles: any = [];
        for (const key in fields) {
          if (key.startsWith("styles[")) {
            const matches = key.match(/\[(\d+)\]\.(.+)/);
            if (matches) {
              const index = Number(matches[1]);
              const field = matches[2];
              if (!styles[index]) {
                styles[index] = {};
              }
              styles[index][field] = fields[key];
            }
          }
        }

        const quantityValidationError = getRegularOrderQuantityValidationError(
          styles.filter(Boolean),
        );

        if (quantityValidationError) {
          return res.status(400).json({
            success: false,
            message: quantityValidationError,
          });
        }

        // Fetch the customer
        if (!customerId) {
          return res.status(400).json({
            success: false,
            message: "Customer is required",
          });
        }

        const customer = await Customer.findOne({
          where: {
            id: customerId,
          },
        });
        if (!customer) {
          return res.status(404).json({
            success: false,
            message: "Customer not found",
          });
        }

        const stylesForPreview = styles.flatMap((style: any, index: number) =>
          buildRegularOrderStylePieces(style).map((piece) => ({
            ...piece,
            _sourceIndex: index,
          })),
        );
        const previewPhotoUrlsBySourceIndex = new Map<
          number,
          Promise<string[]>
        >();

        // Create a temporary order object (not saved to database)
        const orderPreview = {
          id: -1, // Temporary ID for preview
          purchaseOrderNo,
          manufacturingEmailAddress,
          orderType,
          orderReceivedDate: formatDateOnly(orderReceivedDate),
          orderCancellationDate: formatDateOnly(orderCancellationDate),
          address,
          customer: {
            ...customer,
            customerStoreName: getCustomerStoreName(customer),
          },
          isPreview: true,
          styles: await Promise.all(
            stylesForPreview.map(async (style: any, index: number) => {
              const sourceIndex = Number(style._sourceIndex ?? index);
              let photoUrlsPromise =
                previewPhotoUrlsBySourceIndex.get(sourceIndex);

              if (!photoUrlsPromise) {
                const styleImages = files.filter(
                  (file) =>
                    file.fieldname ===
                    `styles[${sourceIndex}].modifiedPhotoImage`,
                );
                const existingPhotoUrls = normalizeFieldArray(
                  styles[sourceIndex]?.existingPhotoUrls,
                ).filter(Boolean);

                photoUrlsPromise = Promise.all(
                  styleImages.map(async (file) => {
                    if (!file) return null;

                    const compressedImage = await sharp(file.buffer)
                      .jpeg()
                      .toBuffer();

                    return {
                      fileName: `data:image/jpeg;base64,${compressedImage.toString(
                        "base64",
                      )}`,
                    };
                  }),
                ).then((imageUrls) => {
                  const uploadedPhotoUrls = imageUrls
                    .filter((url) => url !== null)
                    .map((url) => url?.fileName)
                    .filter((url): url is string => Boolean(url));

                  return Array.from(
                    new Set([...existingPhotoUrls, ...uploadedPhotoUrls]),
                  );
                });
                previewPhotoUrlsBySourceIndex.set(
                  sourceIndex,
                  photoUrlsPromise,
                );
              }

              const photoUrls = await photoUrlsPromise;

              return {
                colorType: style.colorType,
                // customColor: style.customColor,
                customColor:
                  typeof style.customColor === "string"
                    ? JSON.parse(style.customColor)
                    : style.customColor,
                sizeCountry: style.sizeCountry,
                size: style.size,
                // customSize: style.customSize,
                customSize:
                  typeof style.customSize === "string"
                    ? JSON.parse(style.customSize)
                    : style.customSize,
                quantity: Number(style.quantity),
                styleNo: style.styleNo,
                // comments: style.comments,
                comments:
                  typeof style.comments === "string"
                    ? JSON.parse(style.comments)
                    : style.comments,
                // customSizesQuantity: style.customSizesQuantity,
                customSizesQuantity:
                  typeof style.customSizesQuantity === "string"
                    ? JSON.parse(style.customSizesQuantity)
                    : style.customSizesQuantity,
                photoUrls,
                color: style.colorType || "",
                meshColor: style.mesh || "SAS",
                beadingColor: style.beading || "SAS",
                beader: style.beader || "",
                liningColor: style.liningColor || "SAS",
                lining: style.lining || "SAS",
              };
            }),
          ),
        };

        // Process the preview order using the existing processOrders function
        const processedOrder = await processOrders([orderPreview]);

        res.json({
          success: true,
          orders: processedOrder,
        });
      } catch (error: any) {
        console.error(error);
        res.status(500).json({
          error: "An error occurred while processing the preview",
          details: error.message,
        });
      }
    });

    busboy.end(req.body);
  }),
);

router.put(
  "/orderStatus",
  asyncHandler(async (req: Request, res: Response) => {
    const { barcode, orderId, status } = req.body as {
      barcode?: string;
      orderId?: number;
      status?: OrderStatus;
    };

    if ((!barcode && !orderId) || !status) {
      return res.status(400).json({
        success: false,
        message: "Order identifier and status required",
      });
    }

    let order: Order | null = null;
    let styles: Style[] = [];

    if (orderId) {
      order = await Order.findOne({
        where: { id: Number(orderId) },
        relations: ["styles"],
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      styles = order.styles ?? [];
    } else {
      const style = await db
        .createQueryBuilder(Style, "style")
        .addSelect("style.beader")
        .leftJoinAndSelect("style.order", "order")
        .where("style.barcode = :barcode", { barcode })
        .getOne();

      if (!style) {
        return res.status(404).json({
          success: false,
          message: "Invalid barcode",
        });
      }

      order = style.order;
      styles = [style];
    }

    if (!styles.length || !order) {
      return res.status(404).json({
        success: false,
        message: "No styles found for this order",
      });
    }

    // 2️⃣ BLOCK SHIP IF BALANCE PENDING
    if (
      status === OrderStatus.Shipped &&
      order.orderStatus === OrderStatus.Balance_Pending
    ) {
      return res.json({
        success: false,
        message: "Balance pending. Cannot ship order.",
      });
    }

    // 3️⃣ 🔥 SINGLE SOURCE OF TRUTH (ADMIN ACTION)
    for (const style of styles) {
      await updateOrderByBarcode(
        style.barcode,
        status,
        0, // qty = 0 → admin/manual update
      );
    }

    return res.json({
      success: true,
      message: `Order moved to ${status}`,
    });
  }),
);

router.put(
  "/orderShippingStatus",
  asyncHandler(async (req: Request, res: Response) => {
    const { orderId, status } = req.body as { orderId: number; status: string };

    const order = await Order.findOne({
      where: {
        id: orderId,
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    order.shippingStatus = status as any;

    await order.save();

    res.json({
      success: true,
      message: "Order status updated successfully",
    });
  }),
);

router.put(
  "/tracking",
  asyncHandler(async (req: Request, res: Response) => {
    const { orderId, trackingNo } = req.body as {
      orderId: number;
      trackingNo: string;
    };

    const order = await Order.findOne({
      where: {
        id: orderId,
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    order.trackingNo = trackingNo;

    await order.save();

    res.json({
      success: true,
      message: "Tracking ID updated successfully",
    });
  }),
);

router.get(
  "/retailer-order/status/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const order = await RetailerOrder.findOne({
      select: [
        "pattern",
        "khaka",
        "issue_beading",
        "beading",
        "zarkan",
        "stitching",
        "repair",
        "balance_pending",
        "ready_to_delivery",
        "shipped",
      ],
      where: {
        id: Number(id),
      },
    });

    res.json({
      success: true,
      data: order,
    });
  }),
);

router.get(
  "/order/status/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const order = await Order.findOne({
      select: [
        "pattern",
        "khaka",
        "issue_beading",
        "beading",
        "zarkan",
        "stitching",
        "repair",
        "balance_pending",
        "ready_to_delivery",
        "shipped",
      ],
      where: {
        id: Number(id),
        publishStatus: OrderPublishStatus.Published,
      },
    });

    res.json({
      success: true,
      data: order,
    });
  }),
);

router.get(
  "/latest-regular-order",
  asyncHandler(async (req: Request, res: Response) => {
    const nextNumber = await peekGlobalNextPoNumber();
    const purchaeOrderNo =
      nextNumber > 1 ? `PO#GLOBAL ${nextNumber - 1}` : null;
    return res.json({ purchaeOrderNo });
  }),
);

router.get(
  "/latest-retailer-order",
  asyncHandler(async (req: Request, res: Response) => {
    const nextNumber = await peekGlobalNextPoNumber();
    const purchaeOrderNo =
      nextNumber > 1 ? `PO#GLOBAL ${nextNumber - 1}` : null;
    return res.json({ purchaeOrderNo });
  }),
);

router.put(
  "/deliver",
  asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.body as { orderId: number };

    const order = await Order.findOne({ where: { id: orderId } });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Final delivery stage according to your workflow
    order.orderStatus = OrderStatus.Shipped; // last step
    order.shippingStatus = ShippingStatus.Shipped; // marks shipped
    order.shippingDate = new Date(); // delivery date

    await order.save();

    res.json({
      success: true,
      message: "Order delivered successfully",
    });
  }),
);
// ===============================

export default router;
export const PublicStoreRoutes = Router();

PublicStoreRoutes.get(
  "/store-scan/:barcode",
  asyncHandler(async (req: Request, res: Response) => {
    const { barcode } = req.params;

    const style = await db
      .createQueryBuilder(Style, "style")
      .addSelect("style.beader")
      .leftJoinAndSelect("style.order", "order")
      .where("style.barcode = :barcode", { barcode })
      .getOne();

    if (!style) {
      return res.status(404).json({
        success: false,
        message: "Invalid barcode",
      });
    }

    if (style.order?.publishStatus === OrderPublishStatus.Draft) {
      return res.status(404).json({
        success: false,
        message: "Invalid barcode",
      });
    }

    // 🔥 Fetch progress logs for this style
    const progress = await StoreStyleProgress.find({
      where: { barcode },
      order: { createdAt: "ASC" },
    });

    // 🔥 Total completed qty
    const completedQty = progress.reduce((sum, p) => sum + p.qty, 0);

    const remainingQty = style.quantity - completedQty;
    const beaderRows = await db.query(
      `
      SELECT
        TRIM(COALESCE(NULLIF(TRIM(s.beader), ''), ob.beader, p.beader)) AS beader
      FROM orderStyles s
      LEFT JOIN \`${ORDER_BEADERS_TABLE}\` ob ON ob.styleId = s.id
      LEFT JOIN products p ON p.productCode = s.styleNo
      WHERE s.id = ?
      LIMIT 1
      `,
      [style.id],
    );
    const resolvedBeader = sanitizeText(beaderRows?.[0]?.beader);

    // 🔥 Safe parsing JSON fields
    const photoUrls = Array.isArray(style.photoUrls)
      ? style.photoUrls
      : typeof style.photoUrls === "string"
        ? JSON.parse(style.photoUrls)
        : [];

    const comments = Array.isArray(style.comments)
      ? style.comments
      : typeof style.comments === "string"
        ? JSON.parse(style.comments)
        : [];

    const customColor = Array.isArray(style.customColor)
      ? style.customColor
      : typeof style.customColor === "string"
        ? JSON.parse(style.customColor)
        : [];

    const customSize = Array.isArray(style.customSize)
      ? style.customSize
      : typeof style.customSize === "string"
        ? JSON.parse(style.customSize)
        : [];

    const customSizesQuantity = Array.isArray(style.customSizesQuantity)
      ? style.customSizesQuantity
      : typeof style.customSizesQuantity === "string"
        ? JSON.parse(style.customSizesQuantity)
        : [];

    res.json({
      success: true,
      data: {
        orderId: style.order.id,
        purchaeOrderNo: style.order.purchaeOrderNo,

        // 🔥 FULL STYLE DETAILS
        styleId: style.id,
        styleNo: style.styleNo,
        quantity: style.quantity,
        barcode: style.barcode,

        colorType: style.colorType,
        customColor,
        sizeCountry: style.sizeCountry,
        size: style.size,
        customSize,
        customSizesQuantity,

        mesh_color: style.mesh_color || "SAS",
        beading_color: style.beading_color || "SAS",
        beader: resolvedBeader,
        lining: style.lining || "SAS",
        lining_color: style.lining_color || "SAS",

        comments,
        photoUrls,

        // 🔥 PROGRESS + REMAINING
        progress,
        completedQty,
        remainingQty,
      },
    });
  }),
);

PublicStoreRoutes.post(
  "/store-scan-update",
  requireScannerIdentity,
  requireScannerRoleStageAccess(resolveStoreScannerStage),
  asyncHandler(async (req: Request, res: Response) => {
    const { barcode } = req.body;

    if (!barcode) {
      return res.json({
        success: false,
        message: "Barcode required",
      });
    }

    // 1️⃣ Find style + order (sirf validation ke liye)
    const style = await Style.findOne({
      where: { barcode },
      relations: ["order"],
    });

    if (!style) {
      return res.json({
        success: false,
        message: "Invalid barcode",
      });
    }

    const order = style.order;

    if (order?.publishStatus === OrderPublishStatus.Draft) {
      return res.json({
        success: false,
        message: "Invalid barcode",
      });
    }

    // 2️⃣ Last progress
    const lastProgress = await StoreStyleProgress.findOne({
      where: { barcode },
      order: { createdAt: "DESC" },
    });

    const currentStage: OrderStatus | null = lastProgress?.status
      ? (lastProgress.status as OrderStatus)
      : (DEFAULT_SCAN_STAGE as OrderStatus);
    const nextStage = getScannerRoleTargetStage(
      (req as any).scannerIdentity?.scannerRoleName,
      SCAN_STAGE_FLOW,
    ) as OrderStatus | null;

    if (!nextStage) {
      return res.status(403).json({
        success: false,
        code: "SCANNER_STAGE_FORBIDDEN",
        message: "Your scanner login is not mapped to a stage.",
      });
    }

    if (currentStage === nextStage) {
      return res.json({
        success: false,
        message: `Already at ${nextStage}`,
      });
    }

    const scanReservation = await reserveUniqueBarcodeScan(
      req,
      "STORE",
      barcode,
    );

    if (!scanReservation.success) {
      return res.status(409).json(scanReservation);
    }

    try {
      // 3️⃣ 🔥 SINGLE SOURCE OF TRUTH
      await updateOrderByBarcode(
        barcode,
        nextStage,
        1, // qty = 1 → store scan
      );

      return res.json({
        success: true,
        barcode,
        currentStage,
        nextStage,
      });
    } catch (error) {
      await releaseReservedBarcodeScan(scanReservation.scanId);
      throw error;
    }
  }),
);

async function resolveStoreScannerStage(req: Request) {
  const barcode = String(req.body?.barcode ?? "").trim();

  if (!barcode) {
    return null;
  }

  const style = await Style.findOne({
    where: { barcode },
    relations: ["order"],
  });

  if (!style) {
    return null;
  }

  if (style.order?.publishStatus === OrderPublishStatus.Draft) {
    return null;
  }

  const lastProgress = await StoreStyleProgress.findOne({
    where: { barcode },
    order: { createdAt: "DESC" },
  });

  const currentStage = lastProgress?.status
    ? (lastProgress.status as OrderStatus)
    : (DEFAULT_SCAN_STAGE as OrderStatus);
  const nextStage = getScannerRoleTargetStage(
    (req as any).scannerIdentity?.scannerRoleName,
    SCAN_STAGE_FLOW,
  );

  return {
    currentStage,
    targetStage: nextStage,
    flowStages: SCAN_STAGE_FLOW,
    adminGateStage: style.order.orderStatus,
  };
}

PublicStoreRoutes.get(
  "/store-status/report/:orderId",
  asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.params;

    const rows = await db.query(
      `
      SELECT
        s.id AS styleId,
        s.styleNo,
        s.barcode,

        s.size,
        s.sizeCountry AS size_country,
        s.quantity,
        TRIM(COALESCE(NULLIF(TRIM(s.beader), ''), ob.beader, p.beader)) AS beader,

        o.purchaeOrderNo,

        -- ✅ SAME FIX AS OTHER REPORTS
        CONCAT(
          'SAS(',
          COALESCE(pc.name, s.mesh_color),
          ')'
        ) AS meshColor,
        s.mesh_color AS meshColorRaw

      FROM orderStyles s
      INNER JOIN orders o
        ON o.id = s.orderId

      LEFT JOIN product_colours pc
        ON LOWER(pc.hexcode) = LOWER(s.mesh_color)
      LEFT JOIN \`${ORDER_BEADERS_TABLE}\` ob
        ON ob.styleId = s.id
      LEFT JOIN products p
        ON p.productCode = s.styleNo

      WHERE o.id = ?
        AND COALESCE(o.publishStatus, 'published') = 'published'
      ORDER BY s.id ASC
      `,
      [orderId],
    );

    const final = [];

    for (const row of rows) {
      const progress = await StoreStyleProgress.find({
        where: { barcode: row.barcode },
        order: { createdAt: "ASC" },
      });

      const completedQty = progress.reduce((sum, p) => sum + p.qty, 0);

      final.push({
        styleId: row.styleId,
        styleNo: row.styleNo,
        barcode: row.barcode,
        comment: await getBarcodeComment(row.barcode, "STORE"),

        // ✅ LABEL DATA
        size: row.size,
        size_country: row.size_country,
        quantity: row.quantity,
        meshColor: row.meshColor,
        meshColorRaw: row.meshColorRaw,
        beader: row.beader ?? "",
        purchaseOrderNo: row.purchaeOrderNo,

        totalQty: row.quantity,
        completedQty,
        remainingQty: row.quantity - completedQty,
        progress,
      });
    }

    res.json({ success: true, data: final });
  }),
);

router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const order = await RetailerOrder.findOne({
      where: { id: Number(id) },
      relations: [
        "retailer",
        "retailer.customer",
        "favourite_order",
        "Stock_order",
      ],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Retailer order not found",
      });
    }

    const styles = await Style.find({
      where: { order: { id: Number(id) } },
    });

    res.json({
      success: true,
      data: { ...order, styles },
    });
  }),
);

router.get(
  "/retailer/store-orders/:retailerId",
  asyncHandler(async (req: Request, res: Response) => {
    const { retailerId } = req.params;
    const { page = 1 } = req.query;

    const take = 10;
    const skip = (Number(page) - 1) * take;

    const [orders] = await db.query(
      `
      SELECT 
        o.id,
        o.purchaeOrderNo,
        o.orderType,
        o.orderStatus,
        o.trackingNo,
        o.orderReceivedDate,
        DATE_FORMAT(o.createdAt,'%Y-%m-%d') as createdAt
      FROM orders o
      WHERE o.status = 0
        AND COALESCE(o.publishStatus, 'published') = 'published'
      ORDER BY o.createdAt DESC
      LIMIT ? OFFSET ?
      `,
      [take, skip],
    );

    res.json({
      success: true,
      orders,
      totalCount: orders.length,
    });
  }),
);

router.put(
  "/mark-ready",
  asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID required",
      });
    }

    // 1️⃣ Find order with styles
    const order = await Order.findOne({
      where: { id: orderId },
      relations: ["styles"],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // 2️⃣ Already Ready?
    if (order.orderStatus === OrderStatus.Ready_To_Delivery) {
      return res.json({
        success: false,
        message: "Order already Ready To Delivery",
      });
    }

    // 3️⃣ 🔥 ADMIN ACTION — SAME ENGINE AS STORE SCAN
    for (const style of order.styles) {
      await updateOrderByBarcode(
        style.barcode,
        OrderStatus.Ready_To_Delivery,
        0, // qty = 0 → admin action
      );
    }

    return res.json({
      success: true,
      message: "Order marked Ready To Delivery",
    });
  }),
);
