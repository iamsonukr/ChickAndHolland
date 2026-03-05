import { Request, Response, Router } from "express";
import SubCategory from "../models/SubCategory";
import asyncHandler from "../middleware/AsyncHandler";
import {
  dbDelete,
  dbUpdate,
  relationValidator,
  validate,
} from "../middleware/Validator";
import { created, deleted, updated } from "../lib/Responses";

import {
  categoryValidator,
  idValidater,
  subcategoryValidator,
} from "../lib/Validations";
import { CLIENT_OBJ_NAMES, TABLE_NAMES } from "../constants";
import Category from "../models/Category";
import { Like } from "typeorm";
import Product from "../models/Product";

const router = Router();

const RES_NAME = "Sub Category";

router.get(
  "/dropdown",
  asyncHandler(async (req: Request, res: Response) => {
    const subcategories = await SubCategory.find({
      select: {
        name: true,
        id: true,
        createdAt: true,
        category: {
          name: true,
          id: true,
        },
      },
      relations: ["category"],
    });
    res.json(subcategories);
  })
);

router.post(
  "/",
  validate(subcategoryValidator),
  relationValidator(CLIENT_OBJ_NAMES.CATEGORY, TABLE_NAMES.CATEGORIES),
  asyncHandler(async (req: Request, res: Response) => {
    const subcategory = SubCategory.create({ ...req.body });
    await subcategory.save();
    res.json({ msg: created(RES_NAME) });
  })
);

router.patch(
  "/:id",
  validate(idValidater),
  dbUpdate(TABLE_NAMES.SUBCATEGORY),
  validate(categoryValidator),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await SubCategory.update(id, req.body);
    res.json({ msg: updated(RES_NAME) });
  })
);

router.delete(
  "/:id",
  validate(idValidater),
  dbDelete(TABLE_NAMES.SUBCATEGORY),
  asyncHandler(async (req: Request, res: Response) => {
    res.json({ success: true, msg: deleted(RES_NAME) });
  })
);

router.get(
  "/new",
  asyncHandler(async (req: Request, res: Response) => {
    const {
      page,
      query,
    }: {
      page?: string;
      query?: string;
    } = req.query;

    if (!page) {
      const subCategories = await SubCategory.find({
        relations: ["category"],
      });
      const totalCount = await SubCategory.count({});

      return res.json({
        subCategories,
        totalCount,
      });
    } else {
      const skip = (page ? Number(page) - 1 : 0) * 100;

      const likeQuery = `%${query?.toLowerCase()}%`;

      const whereConditions = [
        {
          name: Like(likeQuery),
        },
        {
          category: {
            name: Like(likeQuery),
          },
        },
      ];

      const subCategories = await SubCategory.find({
        where: whereConditions,
        skip,
        take: 100,
        relations: ["category"],
        order: {
          id: "DESC",
        },
      });

      const totalCount = await SubCategory.count({
        where: whereConditions,
      });

      res.json({
        subCategories,
        totalCount,
      });
    }
  })
);

router.put(
  "/new/",
  asyncHandler(async (req: Request, res: Response) => {
    const { name, categoryId, id, priority } = req.body;

    const category = await Category.findOne({
      where: {
        id: categoryId,
      },
    });

    if (!category) {
      res.status(400).json({ msg: "Category not found" });
      return;
    }

    const subcategory = await SubCategory.findOne({
      where: {
        id,
      },
    });

    if (!subcategory) {
      res.status(400).json({ msg: "Sub Category not found" });
      return;
    }

    subcategory.name = name;
    subcategory.category = category;
    subcategory.priority = Number(priority) || 0;

    await subcategory.save();

    res.json({
      success: true,
      message: "Collection updated successfully",
    });
  })
);
router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const subcategory = await SubCategory.findOne({
      where: { id: Number(id) },
      relations: ["category"], // ⭐ IMPORTANT
    });

    if (!subcategory) {
      return res.json({
        success: false,
        message: "Subcategory not found",
        data: null,
      });
    }

    return res.json({
      success: true,
      data: subcategory,
    });
  })
);

router.post(
  "/new",
  asyncHandler(async (req: Request, res: Response) => {
    const { name, categoryId, priority } = req.body;

    const category = await Category.findOne({
      where: {
        id: categoryId,
      },
    });

    if (!category) {
      res.status(400).json({ msg: "Category not found" });
      return;
    }

    const subcategory = new SubCategory();

    subcategory.name = name;
    subcategory.category = category;
    subcategory.priority = Number(priority) || 0;

    await subcategory.save();

    res.json({
      success: true,
      message: "Sub Category created successfully",
    });
  })
);

// Bulk price increase endpoint
router.post(
  "/bulk-price-increase",
  asyncHandler(async (req: Request, res: Response) => {
    const { subcategoryIds, percentage } = req.body;

    if (!subcategoryIds || !Array.isArray(subcategoryIds) || subcategoryIds.length === 0) {
      res.status(400).json({ msg: "Subcategory IDs are required" });
      return;
    }

    if (!percentage || percentage <= 0) {
      res.status(400).json({ msg: "Valid percentage is required" });
      return;
    }

    try {
      // Helper function to round to nearest 5 or 10
      const roundPrice = (price: number): number => {
        const rounded = Math.round(price);
        const lastDigit = rounded % 10;
        
        if (lastDigit <= 2) {
          return rounded - lastDigit;
        } else if (lastDigit <= 7) {
          return rounded - lastDigit + 5;
        } else {
          return rounded - lastDigit + 10;
        }
      };

      // Update prices for each subcategory
      for (const subcategoryId of subcategoryIds) {
        const productsToUpdate = await Product.find({
          where: {
            subCategory: {
              id: subcategoryId
            }
          }
        });

        for (const product of productsToUpdate) {
          const currentPrice = product.price || 0;
          const newPrice = currentPrice * (1 + percentage / 100);
          const roundedPrice = roundPrice(newPrice);
          
          await Product.update(product.id, { price: roundedPrice });
        }
      }

      res.json({
        success: true,
        message: `Prices updated successfully for ${subcategoryIds.length} subcategories with ${percentage}% increase`,
      });
    } catch (error) {
      console.error("Error updating prices:", error);
      res.status(500).json({ msg: "Error updating prices" });
    }
  })
);

export default router;
