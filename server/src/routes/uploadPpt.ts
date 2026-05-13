import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import axios from "axios";
import Order from "../models/Order";
import { RetailerOrder } from "../models/RetailerOrder";
import { storeFileInS3, getFullUrl } from "../lib/s3"; // 👈 tumhara existing helper

const router = Router();

const getDocumentContentType = (fileName: string) => {
  const cleanFileName = fileName.split("?")[0];

  switch (path.extname(cleanFileName).toLowerCase()) {
    case ".pdf":
      return "application/pdf";
    case ".ppt":
      return "application/vnd.ms-powerpoint";
    case ".pptx":
      return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    default:
      return "application/octet-stream";
  }
};

const resolveStoredFileUrl = (filePath: string, req: Request) => {
  if (/^https?:\/\//i.test(filePath)) {
    return filePath;
  }

  const normalizedPath = filePath.startsWith("/") ? filePath : `/${filePath}`;
  return `${req.protocol}://${req.get("host")}${normalizedPath}`;
};

const getSafeFileName = (filePath: string) => {
  const fileName = path.basename(filePath.split("?")[0] || "order-document");
  return fileName.replace(/"/g, "");
};

const findOrderWithDocument = async (orderId: number) => {
  return (
    (await RetailerOrder.findOne({ where: { id: orderId } })) ||
    (await Order.findOne({ where: { id: orderId } }))
  );
};

// 🔥 MEMORY storage (NO DISK)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 75 * 1024 * 1024 }, // 75MB
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
    const contentType = getDocumentContentType(req.file.originalname);
    const safeFileName = getSafeFileName(req.file.originalname);

    // 🚀 Upload to S3
    const uploaded = await storeFileInS3(req.file.buffer, s3Key, {
      contentType,
      contentDisposition: `inline; filename="${safeFileName}"`,
    });

    if (!uploaded)
      return res.status(500).json({
        success: false,
        message: "Failed to upload to S3",
      });

    const fileUrl = getFullUrl(uploaded.fileName);

    // 🗄️ Save URL in DB
    let updated = await RetailerOrder.update(
      { id: orderId },
      { ppt_path: fileUrl },
    );

    if (!updated.affected) {
      updated = await Order.update({ id: orderId }, { ppt_path: fileUrl });
    }

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

router.get("/preview/:orderId", async (req: Request, res: Response) => {
  try {
    const orderId = Number(req.params.orderId);

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID missing",
      });
    }

    const record = await findOrderWithDocument(orderId);

    if (!record?.ppt_path) {
      return res.status(404).json({
        success: false,
        message: "Uploaded document not found",
      });
    }

    const fileUrl = resolveStoredFileUrl(record.ppt_path, req);
    const range = req.headers.range;
    const upstreamResponse = await axios.get(fileUrl, {
      responseType: "stream",
      headers: {
        "Cache-Control": "no-cache",
        ...(range ? { Range: range } : {}),
      },
      maxRedirects: 5,
      validateStatus: (status) =>
        (status >= 200 && status < 300) || status === 304,
    });

    if (upstreamResponse.status < 200 || upstreamResponse.status >= 300) {
      return res.status(502).json({
        success: false,
        message: "Failed to fetch uploaded document",
      });
    }

    const safeFileName = getSafeFileName(record.ppt_path);
    const upstreamContentType = upstreamResponse.headers["content-type"];
    const contentType =
      !upstreamContentType ||
      upstreamContentType.includes("application/octet-stream")
        ? getDocumentContentType(record.ppt_path)
        : upstreamContentType;
    const dispositionType = req.query.download === "1" ? "attachment" : "inline";

    res.status(upstreamResponse.status === 206 ? 206 : 200);
    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      `${dispositionType}; filename="${safeFileName}"`,
    );
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Cache-Control", "private, no-store, max-age=0, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("X-Content-Type-Options", "nosniff");

    ["content-length", "content-range", "etag", "last-modified"].forEach(
      (header) => {
        const value = upstreamResponse.headers[header];
        if (value) res.setHeader(header, value);
      },
    );

    upstreamResponse.data.on("error", (streamError: Error) => {
      console.error("Uploaded document stream failed:", streamError);
      if (!res.headersSent) {
        res.status(502).json({
          success: false,
          message: "Failed to stream uploaded document",
        });
      } else {
        res.destroy(streamError);
      }
    });

    return upstreamResponse.data.pipe(res);
  } catch (error) {
    console.error("Failed to preview uploaded PPT/PDF:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while loading uploaded document",
    });
  }
});

// 🔍 Get existing PPT
router.get("/:orderId", async (req: Request, res: Response) => {
  try {
    const orderId = Number(req.params.orderId);
    const record = await findOrderWithDocument(orderId);

    res.json({
      success: true,
      ppt_path: record?.ppt_path || null,
    });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

export default router;
