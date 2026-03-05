import { Router, Request, Response } from "express";
import asyncHandler from "../middleware/AsyncHandler";
import StockOrderStyles from "../models/StockOrderStyles";
import StyleProgress from "../models/StyleProgress";
import { ShippingStatus } from "../models/Order";

const router = Router();

const FLOW = [
  "Pattern",
  "Khaka",
  "Issue Beading",
  "Beading",
  "Zarkan",
  "Stitching",
  "Ready To Delivery",
  "Shipped",
];

function nextStage(current: string | null) {
  if (!current) return FLOW[0];
  const index = FLOW.indexOf(current);
  return FLOW[index + 1] || current;
}

router.post(
  "/update",
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
  })
);

export default router;
