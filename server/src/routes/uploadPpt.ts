import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import Order from "../models/Order";
import { RetailerOrder } from "../models/RetailerOrder";
import { storeFileInS3, getFullUrl } from "../lib/s3"; // 👈 tumhara existing helper

const router = Router();

// 🔥 MEMORY storage (NO DISK)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

// 📌 Upload PPT → S3 → Save URL in DB
router.post("/", upload.single("ppt"), async (req: any, res: Response) => {
  try {
    const orderId = Number(req.body.orderId);

    if (!orderId)
      return res.status(400).json({
        success: false,
        message: "Order ID missing",
      });

    if (!req.file)
      return res.status(400).json({
        success: false,
        message: "PPT file missing",
      });

    // 🔑 S3 key
    const ext = path.extname(req.file.originalname);
    const s3Key = `ppt/orders/${orderId}-${Date.now()}${ext}`;

    // 🚀 Upload to S3
    const uploaded = await storeFileInS3(req.file.buffer, s3Key);

    if (!uploaded)
      return res.status(500).json({
        success: false,
        message: "Failed to upload to S3",
      });

    const fileUrl = getFullUrl(uploaded.fileName);

    // 🗄️ Save URL in DB
    let updated =
      (await RetailerOrder.update(
        { id: orderId },
        { ppt_path: fileUrl },
      )) ||
      (await Order.update({ id: orderId }, { ppt_path: fileUrl }));

    if (!updated.affected)
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });

    return res.json({
      success: true,
      path: fileUrl,
      message: "PPT uploaded successfully!",
    });
  } catch (error) {
    console.error("❌ PPT Upload Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while uploading PPT",
    });
  }
});

// 🔍 Get existing PPT
router.get("/:orderId", async (req: Request, res: Response) => {
  try {
    const orderId = Number(req.params.orderId);

    const record =
      (await RetailerOrder.findOne({ where: { id: orderId } })) ||
      (await Order.findOne({ where: { id: orderId } }));

    res.json({
      success: true,
      ppt_path: record?.ppt_path || null,
    });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

export default router;
