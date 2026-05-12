import { Router, Request, Response } from "express";
import asyncHandler from "../middleware/AsyncHandler";
import RetailerOrderStyles from "../models/RetailerOrderStyles";
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

const RETAILER_STATUS_FLOW = SCAN_STAGE_FLOW;

async function resolveRetailerStatusUpdateStage(req: Request) {
  const barcode = String(req.body?.barcode ?? "").trim();

  if (!barcode) {
    return null;
  }

  const style = await RetailerOrderStyles.findOne({
    where: { barcode },
    relations: ["retailerOrder"],
  });

  if (!style) {
    return null;
  }

  const lastProgress = await StyleProgress.findOne({
    where: { barcode },
    order: { createdAt: "DESC" },
  });

  return {
    currentStage:
      lastProgress?.stage ||
      style.retailerOrder.orderStatus ||
      DEFAULT_SCAN_STAGE,
    targetStage: getScannerRoleTargetStage(
      (req as any).scannerIdentity?.scannerRoleName,
      RETAILER_STATUS_FLOW,
    ),
    flowStages: RETAILER_STATUS_FLOW,
  };
}

/**
 * Update status of RETAILER barcode.
 */
router.post(
  "/update-status",
  requireScannerIdentity,
  requireScannerRoleStageAccess(resolveRetailerStatusUpdateStage),
  asyncHandler(async (req: Request, res: Response) => {
    const { barcode, qty } = req.body;

    if (!barcode || !qty) {
      return res.status(400).json({
        success: false,
        message: "barcode and qty required",
      });
    }

    const style = await RetailerOrderStyles.findOne({
      where: { barcode },
      relations: ["retailerOrder"],
    });

    if (!style) {
      return res.status(404).json({
        success: false,
        message: "Invalid Barcode (Retailer style not found)",
      });
    }

    const lastProgress = await StyleProgress.findOne({
      where: { barcode },
      order: { createdAt: "DESC" },
    });

    const currentStage =
      lastProgress?.stage ||
      style.retailerOrder.orderStatus ||
      DEFAULT_SCAN_STAGE;
    const nextStage = getScannerRoleTargetStage(
      (req as any).scannerIdentity?.scannerRoleName,
      RETAILER_STATUS_FLOW,
    );

    if (!nextStage) {
      return res.status(403).json({
        success: false,
        code: "SCANNER_STAGE_FORBIDDEN",
        message: "Your scanner login is not mapped to a stage.",
      });
    }

    const scanReservation = await reserveUniqueBarcodeScan(
      req,
      "RETAILER",
      barcode,
    );

    if (!scanReservation.success) {
      return res.status(409).json(scanReservation);
    }

    try {
      const progress = new StyleProgress();
      progress.barcode = barcode;
      progress.stage = nextStage as any;
      progress.qty = qty;
      await progress.save();

      const order = style.retailerOrder;
      const now = new Date();

      order.orderStatus = nextStage as any;
      const dateField = getStageDateField(nextStage);
      if (dateField) {
        (order as any)[dateField] = now;
      }

      if (isShippingStage(nextStage)) {
        order.shippingStatus = ShippingStatus.Shipped;
        order.shippingDate = now;
        order.status_id = 1;
      }

      await order.save();

      return res.json({
        success: true,
        message: `Moved to ${nextStage}`,
        data: {
          barcode,
          previousStage: currentStage,
          currentStage: nextStage,
        },
      });
    } catch (error) {
      await releaseReservedBarcodeScan(scanReservation.scanId);
      throw error;
    }
  }),
);

export default router;
