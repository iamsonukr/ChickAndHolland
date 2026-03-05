import { Router, Request, Response } from "express";
import asyncHandler from "../middleware/AsyncHandler";
import RetailerOrderStyles from "../models/RetailerOrderStyles";
import StyleProgress from "../models/StyleProgress";

const router = Router();

router.get(
  "/:barcode",
  asyncHandler(async (req: Request, res: Response) => {
    const { barcode } = req.params;

    // Find style by barcode
    const style = await RetailerOrderStyles.findOne({
      where: { barcode },
      relations: ["retailerOrder", "retailerOrder.retailer"],
    });

    if (!style) {
      return res.status(404).json({
        success: false,
        message: "Invalid Barcode",
      });
    }

    // Fetch progress for this barcode
    const progress = await StyleProgress.find({
      where: { barcode },
      order: { id: "ASC" },
    });

    return res.json({
      success: true,
      style: {
        id: style.id,
        styleNo: style.styleNo,
        quantity: style.quantity,
        size: style.size,
        size_country: style.size_country,
        barcode: style.barcode,
        order: {
          id: style.retailerOrder.id,
          purchaeOrderNo: style.retailerOrder.purchaeOrderNo,
          retailerId: style.retailerOrder.retailer?.id || null,
          orderReceivedDate: style.retailerOrder.orderReceivedDate,
          orderStatus: style.retailerOrder.orderStatus,
        },
      },
      progress, // 👈 NOW RETURNING PROGRESS
    });
  })
);

export default router;
