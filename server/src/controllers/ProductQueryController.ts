import { Request, Response, Router } from "express";
import asyncHandler from "../middleware/AsyncHandler";
import ProductQuery from "../models/ProductQuery";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    console.log("Dashboard Fetch API Request: Product Queries", {
      query: req.query,
      path: req.originalUrl,
    });

    try {
      const queries = await ProductQuery.find({
        order: { createdAt: "DESC" },
      });

      console.log("Dashboard Fetch API Response: Product Queries", {
        status: 200,
        count: queries.length,
      });

      res.json(queries);
    } catch (error: any) {
      console.error("Product Query Dashboard Fetch Error:", error);
      res.status(500).json({
        success: false,
        message: error?.message || "Unable to load product queries",
      });
    }
  })
);

router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const query = await ProductQuery.findOne({
      where: { id: Number(req.params.id) },
    });

    if (!query) {
      return res.status(404).json({
        success: false,
        message: "Product query not found",
      });
    }

    res.json(query);
  })
);

router.patch(
  "/:id/read",
  asyncHandler(async (req: Request, res: Response) => {
    console.log("Product Query Mark As Read Request:", {
      id: req.params.id,
    });

    try {
      const result = await ProductQuery.createQueryBuilder()
        .update(ProductQuery)
        .set({ isRead: true })
        .where("id = :id", { id: req.params.id })
        .execute();

      console.log("Product Query Mark As Read Result:", result);

      if (result.affected && result.affected > 0) {
        return res.json({
          success: true,
          message: "Product query marked as read",
        });
      }

      res.status(404).json({
        success: false,
        message: "Product query not found",
      });
    } catch (error: any) {
      console.error("Product Query Mark As Read Error:", error);
      res.status(500).json({
        success: false,
        message: error?.message || "Unable to mark product query as read",
      });
    }
  })
);

router.patch(
  "/mark-read/all",
  asyncHandler(async (_req: Request, res: Response) => {
    await ProductQuery.createQueryBuilder()
      .update(ProductQuery)
      .set({ isRead: true })
      .where("isRead = :read", { read: false })
      .execute();

    res.json({
      success: true,
      message: "All product queries marked as read",
    });
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await ProductQuery.delete({ id: Number(req.params.id) });

    if (result.affected && result.affected > 0) {
      return res.json({
        success: true,
        message: "Product query deleted",
      });
    }

    res.status(404).json({
      success: false,
      message: "Product query not found",
    });
  })
);

export default router;
