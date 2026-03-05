import { Router } from "express";
import { sendStockEmail } from "../controllers/StockEmailController.";

const router = Router();

router.post("/stock-email", sendStockEmail);

export default router;
