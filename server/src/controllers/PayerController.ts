import { Request, Response, Router } from "express";
import Payer from "../models/Payer";
import asyncHandler from "../middleware/AsyncHandler";
import { dbDelete, dbUpdate, validate } from "../middleware/Validator";
import { payerValidator, idValidater } from "../lib/Validations";
import { TABLE_NAMES } from "../constants";
import { created, updated, deleted } from "../lib/Responses";

const router = Router();

const RES_NAME = "Payer";

router.get(
  "/dropdown",
  asyncHandler(async (req: Request, res: Response) => {
    const payers = await Payer.find({
      select: ["name", "id"],
    });
    res.json(payers);
  })
);

router.post(
  "/",
  validate(payerValidator),
  asyncHandler(async (req: Request, res: Response) => {
    const payer = Payer.create({ ...req.body });
    await payer.save();
    res.json({ msg: created(RES_NAME) });
  })
);

router.patch(
  "/:id",
  validate(idValidater),
  dbUpdate(TABLE_NAMES.PAYERS),
  validate(payerValidator),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await Payer.update(id, req.body);
    res.json({ msg: updated(RES_NAME) });
  })
);

router.delete(
  "/:id",
  validate(idValidater),
  dbDelete(TABLE_NAMES.PAYERS),
  asyncHandler(async (req: Request, res: Response) => {
    res.json({ msg: deleted(RES_NAME) });
  })
);

export default router;
