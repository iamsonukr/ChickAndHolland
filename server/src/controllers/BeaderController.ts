import { Request, Response, Router } from "express";
import { Like, Not } from "typeorm";
import asyncHandler from "../middleware/AsyncHandler";
import Beader from "../models/Beader";

const router = Router();

const normalizeBeaderName = (value: unknown) => String(value ?? "").trim();

router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const { page, query } = req.query as {
      page?: string;
      query?: string;
    };

    const search = normalizeBeaderName(query);
    const where = search ? { name: Like(`%${search}%`) } : {};

    if (!page) {
      const beaders = await Beader.find({
        where,
        order: { name: "ASC" },
      });
      const totalCount = await Beader.count({ where });

      return res.json({
        success: true,
        beaders,
        totalCount,
      });
    }

    const currentPage = Math.max(Number(page) || 1, 1);
    const take = 10;
    const skip = (currentPage - 1) * take;

    const [beaders, totalCount] = await Beader.findAndCount({
      where,
      skip,
      take,
      order: { name: "ASC" },
    });

    res.json({
      success: true,
      beaders,
      totalCount,
    });
  }),
);

router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const name = normalizeBeaderName(req.body?.name);

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Beader name is required",
      });
    }

    const existingBeader = await Beader.findOne({ where: { name } });
    if (existingBeader) {
      return res.status(400).json({
        success: false,
        message: "Beader already exists",
      });
    }

    const beader = new Beader();
    beader.name = name;
    await beader.save();

    res.json({
      success: true,
      message: "Beader created successfully",
      beader,
    });
  }),
);

router.put(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const name = normalizeBeaderName(req.body?.name);

    if (!id || Number.isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Valid beader id is required",
      });
    }

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Beader name is required",
      });
    }

    const beader = await Beader.findOne({ where: { id } });
    if (!beader) {
      return res.status(404).json({
        success: false,
        message: "Beader not found",
      });
    }

    const duplicate = await Beader.findOne({
      where: {
        id: Not(id),
        name,
      },
    });

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: "Beader already exists",
      });
    }

    beader.name = name;
    await beader.save();

    res.json({
      success: true,
      message: "Beader updated successfully",
      beader,
    });
  }),
);

router.delete(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);

    if (!id || Number.isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Valid beader id is required",
      });
    }

    const beader = await Beader.findOne({ where: { id } });
    if (!beader) {
      return res.status(404).json({
        success: false,
        message: "Beader not found",
      });
    }

    await Beader.remove(beader);

    res.json({
      success: true,
      message: "Beader deleted successfully",
    });
  }),
);

export default router;
