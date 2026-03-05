import { Request, Response, Router } from "express";
import asyncHandler from "../middleware/AsyncHandler";
import Page_Actions from "../models/PageActions";
import db from "../db";

const router = Router();
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const data = await db.query("select * from page_actions");

    res.json({
      success: true,
      data: data,
    });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const data = await db.query("select * from page_actions");

    res.json({
      success: true,
      data: data,
    });
  })
);
export default router;
