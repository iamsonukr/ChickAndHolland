
import { Router, Request, Response } from "express";
import asyncHandler from "../middleware/AsyncHandler";
import RetailerOrderStyles from "../models/RetailerOrderStyles";
import StyleProgress from "../models/StyleProgress";
import { ShippingStatus } from "../models/Order"; // ✅ IMPORTANT

const router = Router();

const RETAILER_STATUS_FLOW = [
  "Pattern",
  "Khaka",
  "Issue Beading",
  "Beading",
  "Zarkan",
  "Stitching",
  "Balance Pending",
];


function getNextRetailerStatus(current: string | null): string {
  if (!current) return RETAILER_STATUS_FLOW[0];

  const index = RETAILER_STATUS_FLOW.indexOf(current);
  if (index === -1) return RETAILER_STATUS_FLOW[0];

  return RETAILER_STATUS_FLOW[index + 1] || RETAILER_STATUS_FLOW[index];
}

/**
 * 🔥 Update status of RETAILER barcode (AUTO FLOW)
 */
router.post(
  "/update-status",
  asyncHandler(async (req: Request, res: Response) => {
    const { barcode, qty } = req.body;

    if (!barcode || !qty) {
      return res.status(400).json({
        success: false,
        message: "barcode and qty required",
      });
    }

    // 🔎 Find retailer style
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

    // 🔥 LAST COMPLETED STAGE
    const lastProgress = await StyleProgress.findOne({
      where: { barcode },
      order: { createdAt: "DESC" },
    });

    const currentStage = lastProgress?.stage || null;

    // 🔥 AUTO NEXT STAGE
    const nextStage = getNextRetailerStatus(currentStage);

    // ===============================
    // ✅ SAVE PROGRESS (TYPEORM SAFE)
    // ===============================
    const progress = new StyleProgress();
    progress.barcode = barcode;
    progress.stage = nextStage as any; // enum safe
    progress.qty = qty;
    await progress.save();

    // ===============================
    // ✅ UPDATE RETAILER ORDER
    // ===============================
    const order = style.retailerOrder;
    // ⛔ STOP barcode at Balance Pending (wait for admin)
if (order.orderStatus === "Balance Pending") {
  return res.json({
    success: false,
    message: "Waiting for admin approval (Ready To Delivery)",
  });
}
// ✅ Admin already marked Ready → barcode can SHIP
if (order.orderStatus === "Ready To Delivery") {
  // ⚠️ payment check yahan hona chahiye
  // (agar payment logic yahan available ho to)
  
  const now = new Date();

  order.orderStatus = "Shipped" as any;
  order.shipped = now;
  order.shippingStatus = ShippingStatus.Shipped;
  order.shippingDate = now;
  order.status_id = 1;

  await order.save();

  const progress = new StyleProgress();
  progress.barcode = barcode;
  progress.stage = "Shipped" as any;
  progress.qty = qty;
  await progress.save();

  return res.json({
    success: true,
    message: "Order shipped successfully",
    data: {
      barcode,
      previousStage: "Ready To Delivery",
      currentStage: "Shipped",
    },
  });
}


    const now = new Date();

    order.orderStatus = nextStage as any;
switch (nextStage) {
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
  })
);

export default router;
