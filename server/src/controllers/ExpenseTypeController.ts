import { Request, Response, Router } from "express";
import ExpenseType from "../models/ExpenseType";
import asyncHandler from "../middleware/AsyncHandler";
import { dbDelete, dbUpdate, validate } from "../middleware/Validator";
import { idValidater, expenseTypeValidator } from "../lib/Validations";
import { TABLE_NAMES } from "../constants";
import { created, updated, deleted } from "../lib/Responses";

const router = Router();

const RES_NAME = "Expense Type";

router.get(
  "/dropdown",
  asyncHandler(async (req: Request, res: Response) => {
    const expenseTypes = await ExpenseType.find({
      select: ["name", "id"],
    });
    res.json(expenseTypes);
  })
);

router.post(
  "/",
  validate(expenseTypeValidator),
  asyncHandler(async (req: Request, res: Response) => {
    const expensetype = ExpenseType.create({ ...req.body });
    await expensetype.save();
    res.json({ msg: created(RES_NAME) });
  })
);

router.patch(
  "/:id",
  validate(idValidater),
  dbUpdate(TABLE_NAMES.EXPENSETYPES),
  validate(expenseTypeValidator),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await ExpenseType.update(id, req.body);
    res.json({ msg: updated(RES_NAME) });
  })
);

router.delete(
  "/:id",
  validate(idValidater),
  dbDelete(TABLE_NAMES.EXPENSETYPES),
  asyncHandler(async (req: Request, res: Response) => {
    res.json({ msg: deleted(RES_NAME) });
  })
);

export default router;
