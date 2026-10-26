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
import { In, Like } from "typeorm";
import Product from "../models/Product";
import ProductCurrencyPricing from "../models/ProductCurrencyPricing";
import db from "../db";
import { CacheController } from "./CacheController";

const router = Router();

const RES_NAME = "Sub Category";
const PRICE_ROUNDING_INCREMENT = 5;
const ROUNDING_EPSILON = 1e-9;
const BULK_PRICE_INCREASE_HISTORY_TABLE = "bulk_price_increase_history";

let bulkPriceIncreaseHistoryTableReady = false;

const ensureBulkPriceIncreaseHistoryTable = async () => {
  if (bulkPriceIncreaseHistoryTableReady) return;

  await db.query(`
    CREATE TABLE IF NOT EXISTS \`${BULK_PRICE_INCREASE_HISTORY_TABLE}\` (
      id INT NOT NULL AUTO_INCREMENT,
      subcategoryId INT NOT NULL,
      percentage DECIMAL(10,2) NOT NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_bulk_price_increase_history_subcategory_id (subcategoryId),
      INDEX idx_bulk_price_increase_history_created_at (createdAt)
    )
  `);

  bulkPriceIncreaseHistoryTableReady = true;
};

const roundPriceUpToNearestFive = (price: number): number => {
  if (!Number.isFinite(price)) {
    return 0;
  }

  return (
    Math.ceil((price - ROUNDING_EPSILON) / PRICE_ROUNDING_INCREMENT) *
    PRICE_ROUNDING_INCREMENT
  );
};

const getBulkIncreasedPrice = (
  currentPrice: number | string | null | undefined,
  percentage: number
): number => {
  const numericPrice = Number(currentPrice) || 0;
  return roundPriceUpToNearestFive(numericPrice * (1 + percentage / 100));
};

const appendPriceIncreaseHistory = async (subCategories: SubCategory[]) => {
  if (!subCategories.length) return subCategories;

  await ensureBulkPriceIncreaseHistoryTable();

  const subcategoryIds = subCategories
    .map((subcategory) => Number(subcategory.id))
    .filter(Boolean);

  if (!subcategoryIds.length) return subCategories;

  const historyRows = await db.query(
    `
      SELECT history.id, history.subcategoryId, history.percentage, history.createdAt
      FROM \`${BULK_PRICE_INCREASE_HISTORY_TABLE}\` history
      WHERE history.subcategoryId IN (?)
      ORDER BY history.createdAt DESC, history.id DESC
    `,
    [subcategoryIds]
  );

  const historyBySubcategoryId = new Map<number, any[]>();

  (Array.isArray(historyRows) ? historyRows : []).forEach((row: any) => {
    const subcategoryId = Number(row.subcategoryId);
    const history = {
      id: Number(row.id),
      percentage: Number(row.percentage),
      createdAt: row.createdAt,
    };
    const histories = historyBySubcategoryId.get(subcategoryId) ?? [];
    histories.push(history);
    historyBySubcategoryId.set(subcategoryId, histories);
  });

  return subCategories.map((subcategory) => ({
    ...subcategory,
    priceIncreaseHistory: historyBySubcategoryId.get(Number(subcategory.id)) ?? [],
    lastPriceIncrease:
      historyBySubcategoryId.get(Number(subcategory.id))?.[0] ?? null,
  }));
};

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
        subCategories: await appendPriceIncreaseHistory(subCategories),
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
        subCategories: await appendPriceIncreaseHistory(subCategories),
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

    if (
      !subcategoryIds ||
      !Array.isArray(subcategoryIds) ||
      subcategoryIds.length === 0
    ) {
      res.status(400).json({ msg: "Subcategory IDs are required" });
      return;
    }

    const percentageNumber = Number(percentage);

    if (!Number.isFinite(percentageNumber) || percentageNumber <= 0) {
      res.status(400).json({ msg: "Valid percentage is required" });
      return;
    }

    const parsedSubcategoryIds = subcategoryIds.map((id) => Number(id));

    if (parsedSubcategoryIds.some((id) => !Number.isInteger(id) || id <= 0)) {
      res.status(400).json({ msg: "Valid subcategory IDs are required" });
      return;
    }

    const uniqueSubcategoryIds = [...new Set(parsedSubcategoryIds)];
    const queryRunner = db.createQueryRunner();

    try {
      await ensureBulkPriceIncreaseHistoryTable();

      await queryRunner.connect();
      await queryRunner.startTransaction();

      const productsToUpdate = await queryRunner.manager.find(Product, {
        where: {
          subCategory: {
            id: In(uniqueSubcategoryIds),
          },
        },
        relations: ["currencyPricing"],
      });

      const productPriceUpdates = productsToUpdate.map((product) =>
        queryRunner.manager.create(Product, {
          id: product.id,
          price: getBulkIncreasedPrice(product.price, percentageNumber),
        })
      );

      const currencyPriceUpdates = productsToUpdate.flatMap((product) =>
        (product.currencyPricing || []).map((pricing) =>
          queryRunner.manager.create(ProductCurrencyPricing, {
            id: pricing.id,
            price: getBulkIncreasedPrice(pricing.price, percentageNumber),
          })
        )
      );

      if (productPriceUpdates.length > 0) {
        await queryRunner.manager.save(Product, productPriceUpdates);
      }

      if (currencyPriceUpdates.length > 0) {
        await queryRunner.manager.save(
          ProductCurrencyPricing,
          currencyPriceUpdates
        );
      }

      const historyPlaceholders = uniqueSubcategoryIds
        .map(() => "(?, ?)")
        .join(", ");
      const historyParams = uniqueSubcategoryIds.flatMap((subcategoryId) => [
        subcategoryId,
        percentageNumber,
      ]);

      await queryRunner.query(
        `
          INSERT INTO \`${BULK_PRICE_INCREASE_HISTORY_TABLE}\`
            (subcategoryId, percentage)
          VALUES ${historyPlaceholders}
        `,
        historyParams
      );

      await queryRunner.commitTransaction();

      try {
        CacheController.clearCacheByName("products");
        CacheController.clearCacheByName("search");
      } catch (cacheError) {
        console.error("Error clearing price caches:", cacheError);
      }

      res.json({
        success: true,
        message: `Prices updated successfully for ${uniqueSubcategoryIds.length} subcategories with ${percentageNumber}% increase`,
        updatedProducts: productPriceUpdates.length,
        updatedCurrencyPrices: currencyPriceUpdates.length,
      });
    } catch (error) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }

      console.error("Error updating prices:", error);
      res.status(500).json({ msg: "Error updating prices" });
    } finally {
      if (!queryRunner.isReleased) {
        await queryRunner.release();
      }
    }
  })
);

export default router;
