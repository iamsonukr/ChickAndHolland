import { Router } from "express";
import {
  sendStockEmail,
  sendStockExportEmail,
} from "../controllers/StockEmailController.";

const router = Router();

router.post("/stock-email", sendStockEmail);
router.post("/stock-export-email", sendStockExportEmail);

export default router;
