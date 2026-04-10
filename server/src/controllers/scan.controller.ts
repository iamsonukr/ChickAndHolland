import { Router, Request, Response } from "express";
import asyncHandler from "../middleware/AsyncHandler";

import OrderStyle from "../models/OrderStyle";
import RetailerOrderStyles from "../models/RetailerOrderStyles";
import StockOrderStyles from "../models/StockOrderStyles";

import StyleProgress from "../models/StyleProgress";
import RetailerOrdersPayment from "../models/RetailerPaymentModal";

import { OrderStatus, ShippingStatus } from "../models/Order";
import {
  releaseReservedBarcodeScan,
  requireScannerIdentity,
  reserveUniqueBarcodeScan,
} from "../lib/scanGuard";

const router = Router();

/* -----------------------------------------
   🔵 FRESH ORDER STATUS FLOW
------------------------------------------ */
const RETAILER_FLOW = [
  "Pattern",
  "Khaka",
  "Issue Beading",
  "Beading",
  "Zarkan",
  "Stitching",
  "Balance Pending",
];

function nextFreshStage(current: string | null): string {
  if (!current) return RETAILER_FLOW[0];

  const index = RETAILER_FLOW.indexOf(current);
  return RETAILER_FLOW[index + 1] || current;
}
/* -----------------------------------------
   ORDER STAGE INDEX FOR LOWEST STAGE LOGIC
------------------------------------------ */
const STAGE_INDEX: any = {
  "Pattern": 1,
  "Khaka": 2,
  "Issue Beading": 3,
  "Beading": 4,
  "Zarkan": 5,
  "Stitching": 6,
  "Balance Pending": 7,
  "Ready To Delivery": 8,
  "Shipped": 9,
};

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

    const currentStage = last?.stage || "Pattern";

    if (STAGE_INDEX[currentStage] < STAGE_INDEX[lowestStage]) {
      lowestStage = currentStage;
    }
  }

  return lowestStage;
}


/* -----------------------------------------
   🔵 STOCK ORDER STATUS FLOW
------------------------------------------ */
const STOCK_FLOW = [
  "Pattern",
  "Beading",
  "Stitching",
  "Ready To Delivery",
  "Shipped",
];

function nextStockStage(current: string | null): string {
  if (!current) return STOCK_FLOW[0];

  const index = STOCK_FLOW.indexOf(current);
  return STOCK_FLOW[index + 1] || current;
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

   /* ------------------------------------
   🔒 BARCODE FLOW CONTROL (FINAL)
------------------------------------- */

if ((order.orderStatus as OrderStatus) === OrderStatus.Balance_Pending) {
  return res.json({
    success: false,
    code: "WAIT_ADMIN",
    message:
      "Balance Pending hai. Admin ne Ready To Delivery nahi kiya.",
  });
}

/* ------------------------------------
   🔒 BARCODE FLOW CONTROL (FINAL)
------------------------------------- */


// 🚚 FINAL BARCODE SCAN → SHIP CONFIRM
if (
  (order.orderStatus as OrderStatus) === OrderStatus.Ready_To_Delivery
 &&
  req.body.confirmShip === true
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
if ((order.orderStatus as OrderStatus) === OrderStatus.Ready_To_Delivery) {
  return res.json({
    success: true,
    code: "READY_FOR_SHIP",
    message:
      "Admin ne Ready To Delivery kar diya hai. Last scan karke Shipped karein.",
    nextAction: "CONFIRM_SHIP",
  });
}






    /* --------- CURRENT STAGE --------- */
    const last = await StyleProgress.findOne({
      where: { barcode },
      order: { createdAt: "DESC" },
    });

    const currentStage = last?.stage || null;
    const nextStage = nextFreshStage(currentStage);

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
      progress.stage = nextStage as any;
      progress.qty = 1;
      await progress.save();

      /* --------- CHECK IF ALL STYLES REACHED NEXT STAGE --------- */
      const allStyles = await RetailerOrderStyles.find({
        where: { retailerOrder: { id: order.id } },
      });

      let allReached = true;

      for (const s of allStyles) {
        const last = await StyleProgress.findOne({
          where: { barcode: s.barcode },
          order: { id: "DESC" },
        });

        if (!last || last.stage !== nextStage) {
          allReached = false;
          break;
        }
      }

      /* --------- UPDATE ORDER ONLY IF ALL STYLES MATCH --------- */
    /* --------- SMART ORDER STATUS UPDATE --------- */

    // 1) Find lowest stage among all styles
    const lowestStage = await getLowestStage(order.id);

    // 2) If lowest stage equals next stage → update order
    if (lowestStage === nextStage) {
      const now = new Date();

      order.orderStatus = nextStage as any;

      const field = nextStage.toLowerCase().replace(/\s+/g, "_");
      (order as any)[field] = now;

      if (nextStage === "Shipped") {
        order.shippingStatus = ShippingStatus.Shipped;
        order.shippingDate = now;
        order.status_id = 1;
      }

      await order.save();

      return res.json({
        success: true,
        message: `Order moved to ${nextStage}`,
        currentStage,
        nextStage,
        orderUpdated: true,
      });
    }

    // 3) Order will NOT update because other styles are behind
    return res.json({
      success: true,
      message: `Style moved to ${nextStage}, waiting for all styles`,
      currentStage,
      nextStage,
      orderUpdated: false,
    });

      /* --------- RETURN RESPONSE --------- */
      return res.json({
        success: true,
        message: `Moved to ${nextStage}`,
        currentStage,
        nextStage,
        orderUpdated: allReached,
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

    const currentStage = last?.stage || null;
    const nextStage = nextStockStage(currentStage);

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
      progress.stage = nextStage as any;
      progress.qty = 1;
      await progress.save();

      return res.json({
        success: true,
        message: `Stock moved to ${nextStage}`,
        currentStage,
        nextStage,
      });
    } catch (error) {
      await releaseReservedBarcodeScan(scanReservation.scanId);
      throw error;
    }

  })
);

export default router;
