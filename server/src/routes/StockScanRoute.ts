import { Router, Request, Response } from "express";
import asyncHandler from "../middleware/AsyncHandler";
import StockOrderStyles from "../models/StockOrderStyles";
import StyleProgress from "../models/StyleProgress";
import { ShippingStatus } from "../models/Order";
import {
  DEFAULT_SCAN_STAGE,
  SCAN_STAGE_FLOW,
  getScannerRoleTargetStage,
  getStageDateField,
  isShippingStage,
  releaseReservedBarcodeScan,
  requireScannerIdentity,
  requireScannerRoleStageAccess,
  reserveUniqueBarcodeScan,
} from "../lib/scanGuard";

const router = Router();

const FLOW = SCAN_STAGE_FLOW;

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

  return {
    currentStage: last?.stage || DEFAULT_SCAN_STAGE,
    targetStage: getScannerRoleTargetStage(
      (req as any).scannerIdentity?.scannerRoleName,
      FLOW,
    ),
    flowStages: FLOW,
    adminGateStage: style.retailerOrder.orderStatus,
  };
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

    if (!style) {
      return res.json({ success: false, msg: "Invalid stock barcode" });
    }

    const last = await StyleProgress.findOne({
      where: { barcode },
      order: { id: "DESC" },
    });

    const currentStage = last?.stage || DEFAULT_SCAN_STAGE;
    const next = getScannerRoleTargetStage(
      (req as any).scannerIdentity?.scannerRoleName,
      FLOW,
    );

    if (!next) {
      return res.status(403).json({
        success: false,
        code: "SCANNER_STAGE_FORBIDDEN",
        message: "Your scanner login is not mapped to a stage.",
      });
    }

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

      const dateField = getStageDateField(next);
      if (dateField) {
        (order as any)[dateField] = now;
      }

      if (isShippingStage(next)) {
        order.shippingStatus = ShippingStatus.Shipped;
        order.shippingDate = now;
        order.status_id = 1;
      }

      await order.save();

      res.json({
        success: true,
        msg: `${next} updated`,
        barcode,
        previousStage: currentStage,
        next,
      });
    } catch (error) {
      await releaseReservedBarcodeScan(scanReservation.scanId);
      throw error;
    }
  }),
);

export default router;
