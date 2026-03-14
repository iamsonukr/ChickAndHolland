import { Request, Response, Router } from "express";
import Category from "../models/Category";
import asyncHandler from "../middleware/AsyncHandler";
import { dbDelete, dbUpdate, validate } from "../middleware/Validator";
import { categoryValidator, idValidater } from "../lib/Validations";
import { TABLE_NAMES } from "../constants";
import { created, deleted, updated } from "../lib/Responses";
import { Like } from "typeorm";

const router = Router();

const RES_NAME = "Category";

router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const categories = await Category.find({
        select: {
          id: true,
          name: true,
          priority: true,
          subCategories: {
            name: true,
            id: true,
            createdAt: true,
            priority: true,
          },
        },
        relations: ["subCategories"],
      });
      res.json(categories);
    } catch (error) {
      console.log(error)
      
    }
  })
);

router.get(
  "/dropdown",
  asyncHandler(async (req: Request, res: Response) => {
    const categories = await Category.find({
      select: ["name", "id"],
    });
    res.json(categories);
  })
);

router.post(
  "/",
  validate(categoryValidator),
  asyncHandler(async (req: Request, res: Response) => {
    const category = Category.create({ ...req.body }) as Category;
    await category.save();
    res.json({ msg: created(RES_NAME) });
  })
);

router.patch(
  "/:id",
  validate(idValidater), // validate method will validate a set of rules given by the parameter passed to the
  dbUpdate(TABLE_NAMES.CATEGORIES),
  validate(categoryValidator),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await Category.update(id, req.body);
    res.json({ msg: updated(RES_NAME) });
  })
);

router.delete(
  "/:id",
  validate(idValidater),
  dbDelete(TABLE_NAMES.CATEGORIES),
  asyncHandler(async (req: Request, res: Response) => {
    res.json({ success: true, msg: deleted(RES_NAME) });
  })
);

router.post(
  "/new",
  asyncHandler(async (req: Request, res: Response) => {
    const category = Category.create({
      name: req.body.name,
      priority: Number(req.body.priority),
    });
    await category.save();
    res.json({
      success: true,
      message: "Category created successfully",
    });
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
      const categories = await Category.find({});
      const totalCount = await Category.count({});

      return res.json({
        categories,
        totalCount,
      });
    } else {
      const skip = (page ? Number(page) - 1 : 0) * 100;

      const likeQuery = `%${query?.toLowerCase()}%`;

      const whereConditions = [{ name: Like(likeQuery) }];

      const categories = await Category.find({
        where: whereConditions,
        skip,
        take: 100,
      });

      const totalCount = await Category.count({
        where: whereConditions,
      });

      res.json({
        categories,
        totalCount,
      });
    }
  })
);

router.put(
  "/new/",
  asyncHandler(async (req: Request, res: Response) => {
    const { id, name, priority } = req.body;
    const category = await Category.findOne({
      where: {
        id: Number(id),
      },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    category.name = name;
    category.priority = Number(priority);

    await category.save();

    res.json({
      success: true,
      message: "Category updated successfully",
    });
  })
);

export default router;
