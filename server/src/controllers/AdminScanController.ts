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

const router = Router();

const LATER_STAGE_DATE_FIELDS = [
  "khaka",
  "issue_beading",
  "beading",
  "zarkan",
  "stitching",
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

export default router;
