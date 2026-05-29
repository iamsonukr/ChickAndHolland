import { Router, Request, Response } from "express";
import asyncHandler from "../middleware/AsyncHandler";

import OrderStyle from "../models/OrderStyle";
import RetailerOrderStyles from "../models/RetailerOrderStyles";
import StockOrderStyles from "../models/StockOrderStyles";

import StyleProgress from "../models/StyleProgress";
import RetailerOrdersPayment from "../models/RetailerPaymentModal";

import { OrderStatus, ShippingStatus } from "../models/Order";
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

/* -----------------------------------------
   🔵 FRESH ORDER STATUS FLOW
------------------------------------------ */
const RETAILER_FLOW = SCAN_STAGE_FLOW;
/* -----------------------------------------
   ORDER STAGE INDEX FOR LOWEST STAGE LOGIC
------------------------------------------ */
const STAGE_INDEX = SCAN_STAGE_FLOW.reduce<Record<string, number>>(
  (stageIndex, stage, index) => {
    stageIndex[stage] = index + 1;
    return stageIndex;
  },
  {},
);

/* --------- FUNCTION : Lowest Stage Finder --------- */
async function getLowestStage(orderId: number) {
  const styles = await RetailerOrderStyles.find({
    where: { retailerOrder: { id: orderId } }
  });

  let lowestStage = "Shipped";

  for (const s of styles) {
    const last = await StyleProgress.findOne({
      where: { barcode: s.barcode },
      order: { id: "DESC" },
    });

    const currentStage = last?.stage || DEFAULT_SCAN_STAGE;

    if (STAGE_INDEX[currentStage] < STAGE_INDEX[lowestStage]) {
      lowestStage = currentStage;
    }
  }

  return lowestStage;
}


/* -----------------------------------------
   🔵 STOCK ORDER STATUS FLOW
------------------------------------------ */
const STOCK_FLOW = SCAN_STAGE_FLOW;
const STOCK_GUARD_FLOW = SCAN_STAGE_FLOW;

async function resolveRetailerScannerStage(req: Request) {
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

  const order = style.retailerOrder;

  const last = await StyleProgress.findOne({
    where: { barcode },
    order: { createdAt: "DESC" },
  });

  const currentStage =
    last?.stage || (order.orderStatus as OrderStatus) || DEFAULT_SCAN_STAGE;
  const targetStage = getScannerRoleTargetStage(
    (req as any).scannerIdentity?.scannerRoleName,
    RETAILER_FLOW,
  );

  if (!targetStage) {
    return null;
  }

  return {
    currentStage,
    targetStage,
    flowStages: RETAILER_FLOW,
    adminGateStage: order.orderStatus,
  };
}

async function resolveStockScannerStage(req: Request) {
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

  const order = style.retailerOrder;

  const payments = await RetailerOrdersPayment.find({
    where: { order: { id: order.id } },
  });

  const paid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const remaining = Number(order.purchaseAmount) - paid;

  if (
    ["Ready To Delivery", "Shipped"].includes(order.orderStatus) &&
    remaining > 0
  ) {
    return null;
  }

  const targetStage = getScannerRoleTargetStage(
    (req as any).scannerIdentity?.scannerRoleName,
    STOCK_FLOW,
  );

  if (!targetStage) {
    return null;
  }

  const last = await StyleProgress.findOne({
    where: { barcode },
    order: { createdAt: "DESC" },
  });

  return {
    currentStage: last?.stage || DEFAULT_SCAN_STAGE,
    targetStage,
    flowStages: STOCK_GUARD_FLOW,
    adminGateStage: order.orderStatus,
  };
}

/* -----------------------------------------
   1️⃣ GET PROGRESS + STORE ORDER DETAIL
------------------------------------------ */
router.get(
  "/:barcode",
  asyncHandler(async (req: Request, res: Response) => {
    const { barcode } = req.params;

    const style = await OrderStyle.findOne({
      where: { barcode },
      relations: ["order"],
    });

    if (!style) {
      return res.json({ success: false, message: "Barcode not found" });
    }

    const progress = await StyleProgress.find({
      where: { barcode },
      order: { id: "ASC" },
    });

    return res.json({ success: true, style, progress });
  })
);

/* -----------------------------------------
   2️⃣ AUTO SCAN — FRESH RETAILER ORDER
------------------------------------------ */
router.post(
  "/scan",
  requireScannerIdentity,
  requireScannerRoleStageAccess(resolveRetailerScannerStage),
  asyncHandler(async (req: Request, res: Response) => {
    const { barcode } = req.body;

    if (!barcode) {
      return res.json({ success: false, message: "Barcode required" });
    }

    const style = await RetailerOrderStyles.findOne({
      where: { barcode },
      relations: ["retailerOrder"],
    });

    if (!style) {
      return res.json({ success: false, message: "Invalid barcode" });
    }

    const order = style.retailerOrder;

    // /* --------- PAYMENT VALIDATION --------- */
    // const payments = await RetailerOrdersPayment.find({
    //   where: { order: { id: order.id } },
    // });

    // const paid = payments.reduce((sum, p) => sum + p.amount, 0);
    // const remaining = Number(order.purchaseAmount) - paid;
    const scannerTargetStage = getScannerRoleTargetStage(
      (req as any).scannerIdentity?.scannerRoleName,
      RETAILER_FLOW,
    );

    if (!scannerTargetStage) {
      return res.status(403).json({
        success: false,
        code: "SCANNER_STAGE_FORBIDDEN",
        message: "Your scanner login is not mapped to a stage.",
      });
    }

   /* ------------------------------------
   🔒 BARCODE FLOW CONTROL (FINAL)
------------------------------------- */

if (
  (order.orderStatus as OrderStatus) === OrderStatus.Balance_Pending &&
  scannerTargetStage !== OrderStatus.Ready_To_Delivery &&
  scannerTargetStage !== OrderStatus.Shipped
) {
  return res.json({
    success: false,
    code: "WAIT_ADMIN",
    message:
      "Balance Pending hai. Ready To Delivery scan pending hai.",
  });
}

/* ------------------------------------
   🔒 BARCODE FLOW CONTROL (FINAL)
------------------------------------- */


// 🚚 FINAL BARCODE SCAN → SHIP CONFIRM
if (
  (order.orderStatus as OrderStatus) === OrderStatus.Ready_To_Delivery
 &&
  req.body.confirmShip === true &&
  scannerTargetStage === OrderStatus.Shipped
) {
  const scanReservation = await reserveUniqueBarcodeScan(
    req,
    "RETAILER",
    barcode,
  );

  if (!scanReservation.success) {
    return res.status(409).json(scanReservation);
  }

  try {
    const now = new Date();

    order.orderStatus = OrderStatus.Shipped;
    order.shipped = now;
    order.shippingStatus = ShippingStatus.Shipped;
    order.shippingDate = now;
    order.status_id = 1;

    await order.save();

    const progress = new StyleProgress();
    progress.barcode = barcode;
    progress.stage = OrderStatus.Shipped as any;
    progress.qty = 1;
    await progress.save();

    return res.json({
      success: true,
      code: "SHIPPED",
      message: "Order shipped successfully",
      nextStage: "Shipped",
    });
  } catch (error) {
    await releaseReservedBarcodeScan(scanReservation.scanId);
    throw error;
  }
}

// 🟡 Admin Ready To Delivery → message only
if (
  (order.orderStatus as OrderStatus) === OrderStatus.Ready_To_Delivery &&
  scannerTargetStage !== OrderStatus.Shipped
) {
  return res.json({
    success: true,
    code: "READY_FOR_SHIP",
    message:
      "Ready To Delivery ho chuka hai. Shipping master last scan karke Shipped karein.",
    nextAction: "CONFIRM_SHIP",
  });
}
    /* --------- CURRENT STAGE --------- */
    const last = await StyleProgress.findOne({
      where: { barcode },
      order: { createdAt: "DESC" },
    });

    const currentStage = last?.stage || DEFAULT_SCAN_STAGE;
    const isShippingScan =
      (order.orderStatus as OrderStatus) === OrderStatus.Ready_To_Delivery &&
      req.body.confirmShip === true;
    const targetStage = isShippingScan
      ? OrderStatus.Shipped
      : scannerTargetStage;

    if (!targetStage) {
      return res.status(403).json({
        success: false,
        code: "SCANNER_STAGE_FORBIDDEN",
        message: "Your scanner login is not mapped to a stage.",
      });
    }

    if (!isShippingScan && !RETAILER_FLOW.includes(targetStage)) {
      return res.status(403).json({
        success: false,
        code: "SCANNER_STAGE_FORBIDDEN",
        message: `${targetStage} cannot be scanned in the retailer manufacturing flow.`,
        currentStage,
        nextStage: targetStage,
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
      /* --------- INSERT STYLE PROGRESS --------- */
      const progress = new StyleProgress();
      progress.barcode = barcode;
      progress.stage = targetStage as any;
      progress.qty = 1;
      await progress.save();

      /* --------- UPDATE ORDER ONLY IF ALL STYLES MATCH --------- */
    /* --------- SMART ORDER STATUS UPDATE --------- */

    // 1) Find lowest stage among all styles
    const lowestStage = await getLowestStage(order.id);

    // 2) If lowest stage equals next stage → update order
    if (lowestStage === targetStage) {
      const now = new Date();

      order.orderStatus = targetStage as any;

      const field = getStageDateField(targetStage);
      if (field) {
        (order as any)[field] = now;
      }

      if (isShippingStage(targetStage)) {
        order.shippingStatus = ShippingStatus.Shipped;
        order.shippingDate = now;
        order.status_id = 1;
      }

      await order.save();

      return res.json({
        success: true,
        message: `Order moved to ${targetStage}`,
        currentStage,
        nextStage: targetStage,
        orderUpdated: true,
      });
    }

    // 3) Order will NOT update because other styles are behind
    return res.json({
      success: true,
      message: `Style moved to ${targetStage}, waiting for all styles`,
      currentStage,
      nextStage: targetStage,
      orderUpdated: false,
    });
    } catch (error) {
      await releaseReservedBarcodeScan(scanReservation.scanId);
      throw error;
    }
  })
);

/* -----------------------------------------
   3️⃣ AUTO SCAN — STOCK ORDER
------------------------------------------ */
router.post(
  "/stock/scan",
  requireScannerIdentity,
  requireScannerRoleStageAccess(resolveStockScannerStage),
  asyncHandler(async (req: Request, res: Response) => {
    const { barcode } = req.body;

    if (!barcode) {
      return res.json({ success: false, message: "Barcode required" });
    }

    const style = await StockOrderStyles.findOne({
      where: { barcode },
      relations: ["retailerOrder"],
    });

    if (!style) {
      return res.json({ success: false, message: "Invalid stock barcode" });
    }

    const order = style.retailerOrder;

    /* -------- STOCK PAYMENT SAME LOGIC -------- */
    const payments = await RetailerOrdersPayment.find({
      where: { order: { id: order.id } },
    });

    const paid = payments.reduce((sum, p) => sum + p.amount, 0);
    const remaining = Number(order.purchaseAmount) - paid;

    if (["Ready To Delivery", "Shipped"].includes(order.orderStatus) && remaining > 0) {
      return res.json({
        success: false,
        message: "Stock cannot move — payment pending",
        balance: remaining,
      });
    }

    /* -------- CURRENT STAGE -------- */
    const last = await StyleProgress.findOne({
      where: { barcode },
      order: { createdAt: "DESC" },
    });

    const currentStage = last?.stage || DEFAULT_SCAN_STAGE;
    const targetStage = getScannerRoleTargetStage(
      (req as any).scannerIdentity?.scannerRoleName,
      STOCK_FLOW,
    );

    if (!targetStage) {
      return res.status(403).json({
        success: false,
        code: "SCANNER_STAGE_FORBIDDEN",
        message: "Your scanner login is not mapped to a stage.",
      });
    }

    if (!STOCK_FLOW.includes(targetStage)) {
      return res.status(403).json({
        success: false,
        code: "SCANNER_STAGE_FORBIDDEN",
        message: `${targetStage} cannot be scanned in the stock flow.`,
        currentStage,
        nextStage: targetStage,
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
      /* -------- INSERT LOG -------- */
      const progress = new StyleProgress();
      progress.barcode = barcode;
      progress.stage = targetStage as any;
      progress.qty = 1;
      await progress.save();

      return res.json({
        success: true,
        message: `Stock moved to ${targetStage}`,
        currentStage,
        nextStage: targetStage,
      });
    } catch (error) {
      await releaseReservedBarcodeScan(scanReservation.scanId);
      throw error;
    }

  })
);

export default router;
