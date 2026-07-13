import { Request, Response, Router } from "express";
import asyncHandler from "../middleware/AsyncHandler";
import db from "../db";
import { TABLE_NAMES } from "../constants";
import Order, { OrderStatus, ShippingStatus } from "../models/Order";
import { RetailerOrder } from "../models/RetailerOrder";
import RetailerOrderStyles from "../models/RetailerOrderStyles";
import StockOrderStyles from "../models/StockOrderStyles";
import { AdminUserContext, requireAdminUser } from "../middleware/AdminAuth";
import { ensureScanGuardTable } from "../lib/scanGuard";
import { verifyResetPassword } from "../services/resetPassword.service";
import {
  BarcodeCommentOrderType,
  saveBarcodeComment,
} from "../services/barcodeComment.service";
import { ensureBarcodeCommentsTable } from "../utils/ensureBarcodeCommentsTable";

const router = Router();

const LATER_STAGE_DATE_FIELDS = [
  "khaka",
  "issue_beading",
  "beading",
  "zarkan",
  "stitching",
  "repair",
  "balance_pending",
  "ready_to_delivery",
  "shipped",
];

const deleteBarcodeRows = async (
  manager: any,
  tableName: string,
  barcodeColumn: string,
  barcodes: string[],
) => {
  if (!barcodes.length) {
    return;
  }

  await manager.query(
    `DELETE FROM \`${tableName}\` WHERE \`${barcodeColumn}\` IN (?)`,
    [barcodes],
  );
};

const resetRegularOrderScans = async (orderId: number) => {
  const order = await Order.findOne({
    where: { id: orderId },
    relations: ["styles"],
  });

  if (!order) {
    return null;
  }

  const barcodes = (order.styles || [])
    .map((style) => String(style.barcode || "").trim())
    .filter(Boolean);
  const resetAt = new Date();

  await db.transaction(async (manager) => {
    await manager.query(
      `
        UPDATE \`${TABLE_NAMES.ORDERS}\`
        SET
          orderStatus = ?,
          pattern = ?,
          khaka = NULL,
          issue_beading = NULL,
          beading = NULL,
          zarkan = NULL,
          stitching = NULL,
          repair = NULL,
          balance_pending = NULL,
          ready_to_delivery = NULL,
          shipped = NULL,
          shippingStatus = ?,
          shippingDate = NULL
        WHERE id = ?
      `,
      [OrderStatus.Pattern, resetAt, ShippingStatus.NotShipped, orderId],
    );

    await manager.query(
      "UPDATE `orderStyles` SET `currentStatus` = NULL WHERE `orderId` = ?",
      [orderId],
    );

    await deleteBarcodeRows(
      manager,
      "store_style_progress",
      "barcode",
      barcodes,
    );
    await deleteBarcodeRows(
      manager,
      "barcode_scan_history",
      "barcode",
      barcodes,
    );
  });

  return {
    orderId,
    orderSource: "regular",
    resetAt,
    resetBarcodeCount: barcodes.length,
  };
};

const resetRetailerOrderScans = async (orderId: number) => {
  const order = await RetailerOrder.findOne({
    where: { id: orderId },
  });

  if (!order) {
    return null;
  }

  const styles = order.is_stock_order
    ? await StockOrderStyles.find({
        where: { retailerOrder: { id: orderId } },
      })
    : await RetailerOrderStyles.find({
        where: { retailerOrder: { id: orderId } },
      });
  const barcodes = styles
    .map((style) => String(style.barcode || "").trim())
    .filter(Boolean);
  const resetAt = new Date();

  await db.transaction(async (manager) => {
    await manager.query(
      `
        UPDATE \`retailer_orders\`
        SET
          orderStatus = ?,
          pattern = ?,
          khaka = NULL,
          issue_beading = NULL,
          beading = NULL,
          zarkan = NULL,
          stitching = NULL,
          repair = NULL,
          balance_pending = NULL,
          ready_to_delivery = NULL,
          shipped = NULL,
          shiping_date = NULL,
          shippingStatus = ?,
          shippingDate = NULL,
          status_id = 0
        WHERE id = ?
      `,
      [OrderStatus.Pattern, resetAt, ShippingStatus.NotShipped, orderId],
    );

    await deleteBarcodeRows(manager, "styleProgress", "barcode", barcodes);
    await deleteBarcodeRows(
      manager,
      "barcode_scan_history",
      "barcode",
      barcodes,
    );
  });

  return {
    orderId,
    orderSource: "retailer",
    resetAt,
    resetBarcodeCount: barcodes.length,
  };
};

type SelectedResetItem = {
  barcode?: string;
  orderType?: string;
  type?: string;
};

const normalizeSelectedResetItems = (items: unknown): Array<{
  barcode: string;
  orderType: "STORE" | "RETAILER" | "STOCK";
}> => {
  if (!Array.isArray(items)) return [];

  const seen = new Set<string>();
  const normalizedItems: Array<{
    barcode: string;
    orderType: "STORE" | "RETAILER" | "STOCK";
  }> = [];

  for (const item of items as SelectedResetItem[]) {
    const barcode = String(item?.barcode || "").trim();
    const orderType = String(item?.orderType || item?.type || "")
      .trim()
      .toUpperCase();

    if (!barcode || !["STORE", "RETAILER", "STOCK"].includes(orderType)) {
      continue;
    }

    const key = `${orderType}:${barcode}`;
    if (seen.has(key)) continue;
    seen.add(key);
    normalizedItems.push({
      barcode,
      orderType: orderType as "STORE" | "RETAILER" | "STOCK",
    });
  }

  return normalizedItems;
};

const getBarcodesByType = (
  items: Array<{ barcode: string; orderType: "STORE" | "RETAILER" | "STOCK" }>,
  orderType: "STORE" | "RETAILER" | "STOCK",
) => items
  .filter((item) => item.orderType === orderType)
  .map((item) => item.barcode);

const uniqueNumbers = (values: any[]) => [
  ...new Set(
    values
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value > 0),
  ),
];

const resetSelectedBarcodeScans = async (
  items: Array<{ barcode: string; orderType: "STORE" | "RETAILER" | "STOCK" }>,
) => {
  const storeBarcodes = getBarcodesByType(items, "STORE");
  const retailerBarcodes = getBarcodesByType(items, "RETAILER");
  const stockBarcodes = getBarcodesByType(items, "STOCK");
  const retailerStyleBarcodes = [...retailerBarcodes, ...stockBarcodes];
  const resetAt = new Date();
  let resetBarcodeCount = 0;
  let affectedRegularOrderIds: number[] = [];
  let affectedRetailerOrderIds: number[] = [];

  await db.transaction(async (manager) => {
    if (storeBarcodes.length) {
      const storeRows = await manager.query(
        "SELECT DISTINCT `barcode`, `orderId` FROM `orderStyles` WHERE `barcode` IN (?)",
        [storeBarcodes],
      );
      affectedRegularOrderIds = uniqueNumbers(
        storeRows.map((row: any) => row.orderId),
      );

      await manager.query(
        "UPDATE `orderStyles` SET `currentStatus` = NULL WHERE `barcode` IN (?)",
        [storeBarcodes],
      );
      await deleteBarcodeRows(
        manager,
        "store_style_progress",
        "barcode",
        storeBarcodes,
      );
      await deleteBarcodeRows(
        manager,
        "barcode_scan_history",
        "barcode",
        storeBarcodes,
      );

      if (affectedRegularOrderIds.length) {
        await manager.query(
          `
            UPDATE \`${TABLE_NAMES.ORDERS}\`
            SET
              orderStatus = ?,
              pattern = ?,
              khaka = NULL,
              issue_beading = NULL,
              beading = NULL,
              zarkan = NULL,
              stitching = NULL,
              repair = NULL,
              balance_pending = NULL,
              ready_to_delivery = NULL,
              shipped = NULL,
              shippingStatus = ?,
              shippingDate = NULL
            WHERE id IN (?)
          `,
          [
            OrderStatus.Pattern,
            resetAt,
            ShippingStatus.NotShipped,
            affectedRegularOrderIds,
          ],
        );
      }

      resetBarcodeCount += new Set(
        storeRows.map((row: any) => String(row.barcode || "").trim()),
      ).size;
    }

    if (retailerStyleBarcodes.length) {
      const retailerRows = retailerBarcodes.length
        ? await manager.query(
            "SELECT DISTINCT `barcode`, `retailerOrderId` FROM `retailer_order_styles` WHERE `barcode` IN (?)",
            [retailerBarcodes],
          )
        : [];
      const stockRows = stockBarcodes.length
        ? await manager.query(
            "SELECT DISTINCT `barcode`, `retailerOrderId` FROM `stock_order_styles` WHERE `barcode` IN (?)",
            [stockBarcodes],
          )
        : [];

      affectedRetailerOrderIds = uniqueNumbers(
        [...retailerRows, ...stockRows].map((row: any) => row.retailerOrderId),
      );

      await deleteBarcodeRows(
        manager,
        "styleProgress",
        "barcode",
        retailerStyleBarcodes,
      );
      await deleteBarcodeRows(
        manager,
        "barcode_scan_history",
        "barcode",
        retailerStyleBarcodes,
      );

      if (affectedRetailerOrderIds.length) {
        await manager.query(
          `
            UPDATE \`retailer_orders\`
            SET
              orderStatus = ?,
              pattern = ?,
              khaka = NULL,
              issue_beading = NULL,
              beading = NULL,
              zarkan = NULL,
              stitching = NULL,
              repair = NULL,
              balance_pending = NULL,
              ready_to_delivery = NULL,
              shipped = NULL,
              shiping_date = NULL,
              shippingStatus = ?,
              shippingDate = NULL,
              status_id = 0
            WHERE id IN (?)
          `,
          [
            OrderStatus.Pattern,
            resetAt,
            ShippingStatus.NotShipped,
            affectedRetailerOrderIds,
          ],
        );
      }

      resetBarcodeCount += new Set(
        [...retailerRows, ...stockRows].map((row: any) =>
          String(row.barcode || "").trim(),
        ),
      ).size;
    }
  });

  return {
    resetAt,
    resetBarcodeCount,
    affectedRegularOrderIds,
    affectedRetailerOrderIds,
  };
};

router.post(
  "/orders/:orderSource/:id/reset",
  requireAdminUser(["/admin-panel/orders"]),
  asyncHandler(async (req: Request, res: Response) => {
    const orderId = Number(req.params.id);
    const orderSource = String(req.params.orderSource || "").trim();
    const password = String(req.body?.password || "");

    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid order id is required.",
      });
    }

    if (!["regular", "retailer"].includes(orderSource)) {
      return res.status(400).json({
        success: false,
        message: "Valid order source is required.",
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Reset password is required.",
      });
    }

    const adminUser = (req as any).adminUser as AdminUserContext;
    const isPasswordValid = await verifyResetPassword(
      password,
      adminUser?.password,
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid reset password.",
      });
    }

    await ensureScanGuardTable();

    const resetResult =
      orderSource === "regular"
        ? await resetRegularOrderScans(orderId)
        : await resetRetailerOrderScans(orderId);

    if (!resetResult) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    return res.json({
      success: true,
      message: "Product scans reset to Pattern successfully.",
      data: {
        ...resetResult,
        clearedStages: LATER_STAGE_DATE_FIELDS,
      },
    });
  }),
);

router.post(
  "/barcodes/reset",
  requireAdminUser(["/admin-panel/orders"]),
  asyncHandler(async (req: Request, res: Response) => {
    const password = String(req.body?.password || "");
    const items = normalizeSelectedResetItems(req.body?.items);

    if (!items.length) {
      return res.status(400).json({
        success: false,
        message: "Select at least one QR item to reset.",
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Reset password is required.",
      });
    }

    const adminUser = (req as any).adminUser as AdminUserContext;
    const isPasswordValid = await verifyResetPassword(
      password,
      adminUser?.password,
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid reset password.",
      });
    }

    await ensureScanGuardTable();

    const resetResult = await resetSelectedBarcodeScans(items);

    if (!resetResult.resetBarcodeCount) {
      return res.status(404).json({
        success: false,
        message: "No matching QR items were found.",
      });
    }

    return res.json({
      success: true,
      message:
        resetResult.resetBarcodeCount === 1
          ? "Selected QR reset to Pattern successfully."
          : "Selected QRs reset to Pattern successfully.",
      data: {
        ...resetResult,
        clearedStages: LATER_STAGE_DATE_FIELDS,
      },
    });
  }),
);

router.post(
  "/barcodes/comment",
  requireAdminUser(["/admin-panel/orders"]),
  asyncHandler(async (req: Request, res: Response) => {
    const barcode = String(req.body?.barcode || "").trim();
    const orderType = String(req.body?.orderType || req.body?.type || "")
      .trim()
      .toUpperCase();
    const comment = String(req.body?.comment ?? "").trim();

    if (!barcode || !["STORE", "RETAILER", "STOCK"].includes(orderType)) {
      return res.status(400).json({
        success: false,
        message: "Valid barcode and order type are required.",
      });
    }

    if (comment.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Comment must be 1000 characters or less.",
      });
    }

    await ensureBarcodeCommentsTable();
    await saveBarcodeComment({
      barcode,
      orderType: orderType as BarcodeCommentOrderType,
      comment,
    });

    return res.json({
      success: true,
      message: "QR comment saved successfully.",
      data: { barcode, orderType, comment },
    });
  }),
);

export default router;
