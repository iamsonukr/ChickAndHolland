import { Request, Response, Router } from "express";
import asyncHandler from "../middleware/AsyncHandler";
import {
  dbDelete,
  dbUpdate,
  relationValidator,
  validate,
} from "../middleware/Validator";
import { idValidater, inventoryValidator } from "../lib/Validations";
import { CLIENT_OBJ_NAMES, TABLE_NAMES } from "../constants";
import { created, updated, deleted } from "../lib/Responses";
import Inventory from "../models/Inventory";

const router = Router();

const RES_NAME = "Inventory Item";

router.get(
  "/dropdown",
  asyncHandler(async (req: Request, res: Response) => {
    const inventoryItems = await Inventory.find({
      relations: ["category", "subCategory", "product"],
    });
    res.json(inventoryItems);
  })
);

router.post(
  "/",
  validate(inventoryValidator),
  relationValidator(CLIENT_OBJ_NAMES.CATEGORY, TABLE_NAMES.CATEGORIES),
  relationValidator(CLIENT_OBJ_NAMES.SUBCATEGORY, TABLE_NAMES.SUBCATEGORY),
  relationValidator(CLIENT_OBJ_NAMES.PRODUCT, TABLE_NAMES.PRODUCTS),
  asyncHandler(async (req: Request, res: Response) => {
    const inventoryItem = Inventory.create({ ...req.body });
    await inventoryItem.save();
    res.json({ msg: created(RES_NAME) });
  })
);

router.patch(
  "/:id",
  validate(idValidater),
  dbUpdate(TABLE_NAMES.INVENTORY),
  validate(inventoryValidator),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await Inventory.update(id, req.body);
    res.json({ msg: updated(RES_NAME) });
  })
);

router.delete(
  "/:id",
  validate(idValidater),
  dbDelete(TABLE_NAMES.INVENTORY),
  asyncHandler(async (req: Request, res: Response) => {
    res.json({ msg: deleted(RES_NAME) });
  })
);

export default router;
