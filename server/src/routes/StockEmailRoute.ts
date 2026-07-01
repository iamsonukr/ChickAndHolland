import { NextFunction, Request, Response, Router } from "express";
import multer from "multer";
import {
  sendStockEmail,
  sendStockExportEmail,
} from "../controllers/StockEmailController.";

const router = Router();
const stockExportUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

const stockExportAttachmentUpload = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  stockExportUpload.single("attachment")(req, res, (error: any) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      res.status(413).json({
        success: false,
        message: "Stock export attachment is too large. Please reduce the stock list size and try again.",
      });
      return;
    }

    next(error);
  });
};

router.post("/stock-email", sendStockEmail);
router.post("/stock-export-email", stockExportAttachmentUpload, sendStockExportEmail);

export default router;
