import { Request, Response, Router } from "express";
import asyncHandler from "../middleware/AsyncHandler";
import ProductColour from "../models/ProductColours";
import { Like } from "typeorm";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const {
      page,
      query,
    }: {
      page?: string;
      query?: string;
    } = req.query;

    if (!page) {
      const productColours = await ProductColour.find({
        order: {
          name: "ASC",
        },
      });
      const totalCount = await ProductColour.count({});

      return res.json({
        productColours: productColours,
        totalCount,
      });
    } else {
      const skip = (page ? Number(page) - 1 : 0) * 10;

      const likeQuery = `%${query?.toLowerCase()}%`;

      const whereConditions = [{ name: Like(likeQuery) }];

      const productColours = await ProductColour.find({
        where: whereConditions,
        skip,
        take: 10,
        order: {
          name: "ASC",
        },
      });

      const totalCount = await ProductColour.count({
        where: whereConditions,
      });

      res.json({
        productColours,
        totalCount,
      });
    }
  })
);

router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const { colours } = req.body;

    // Check for duplicate hexcode
    for (const colour of colours) {
      const existingColour = await ProductColour.findOne({
        where: { hexcode: colour.hexcode },
      });

      if (existingColour) {
        return res.status(400).json({
          success: false,
          message: `Duplicate hexcode found: ${colour.hexcode}, with name: ${existingColour.name}`,
        });
      }
    }

    // Save new colours
    await ProductColour.save(colours);

    res.json({
      success: true,
    });
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Colour ID is required",
      });
    }

    const productColour = await ProductColour.findOne({
      where: { id: Number(id) },
    });

    if (!productColour) {
      return res.status(404).json({
        success: false,
        message: "Colour not found",
      });
    }

    await ProductColour.remove(productColour);

    res.json({
      success: true,
    });
  })
);

export default router;
