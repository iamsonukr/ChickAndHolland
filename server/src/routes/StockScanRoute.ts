import { Router, Request, Response } from "express";
import asyncHandler from "../middleware/AsyncHandler";
import StockOrderStyles from "../models/StockOrderStyles";
import StyleProgress from "../models/StyleProgress";
import { ShippingStatus } from "../models/Order";
import {
  releaseReservedBarcodeScan,
  requireScannerIdentity,
  requireScannerRoleStageAccess,
  reserveUniqueBarcodeScan,
} from "../lib/scanGuard";

const router = Router();

const FLOW = [
  "Pattern",
  "Khaka",
  "Issue Beading",
  "Beading",
  "Zarkan",
  "Stitching",
  "Balance Pending",
  "Ready To Delivery",
  "Shipped",
];

function nextStage(current: string | null) {
  if (!current) return FLOW[0];
  const index = FLOW.indexOf(current);
  return FLOW[index + 1] || current;
}

async function resolveStockRouteStage(req: Request) {
  const barcode = String(req.body?.barcode ?? "").trim();

  if (!barcode) {
    return null;
  }

  const style = await StockOrderStyles.findOne({
    where: { barcode },
    relations: ["retailerOrder"],
  });

  if (!style) {
    return null;
  }

  const last = await StyleProgress.findOne({
    where: { barcode },
    order: { id: "DESC" },
  });

  return nextStage(last?.stage || null);
}

router.post(
  "/update",
  requireScannerIdentity,
  requireScannerRoleStageAccess(resolveStockRouteStage),
  asyncHandler(async (req: Request, res: Response) => {
    const { barcode } = req.body;

    const style = await StockOrderStyles.findOne({
      where: { barcode },
      relations: ["retailerOrder"],
    });

    if (!style)
      return res.json({ success: false, msg: "Invalid stock barcode" });

    const last = await StyleProgress.findOne({
      where: { barcode },
      order: { id: "DESC" },
    });

    const next = nextStage(last?.stage || null);

    const scanReservation = await reserveUniqueBarcodeScan(
      req,
      "STOCK",
      barcode,
    );

    if (!scanReservation.success) {
      return res.status(409).json(scanReservation);
    }

    try {
      const progress = new StyleProgress();
      progress.barcode = barcode;
      progress.stage = next as any;
      progress.qty = 1; 
      await progress.save();

      const order = style.retailerOrder;
      const now = new Date();

      order.orderStatus = next as any;

      switch (next) {
        case "Pattern":
          order.pattern = now;
          break;
        case "Khaka":
          order.khaka = now;
          break;
        case "Issue Beading":
          order.issue_beading = now;
          break;
        case "Beading":
          order.beading = now;
          break;
        case "Zarkan":
          order.zarkan = now;
          break;
        case "Stitching":
          order.stitching = now;
          break;
        case "Balance Pending":
          order.balance_pending = now;
          break;
        case "Ready To Delivery":
          order.ready_to_delivery = now;
          break;
        case "Shipped":
          order.shipped = now;
          order.shippingStatus = ShippingStatus.Shipped;
          order.status_id = 1;
          break;
      }

      await order.save();

      res.json({
        success: true,
        msg: `${next} updated`,
        barcode,
        next,
      });
    } catch (error) {
      await releaseReservedBarcodeScan(scanReservation.scanId);
      throw error;
    }
  })
);

export default router;
