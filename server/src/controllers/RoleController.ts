import { Request, Response, Router } from "express";
import Role from "../models/Role";
import asyncHandler from "../middleware/AsyncHandler";
import { dbDelete, dbUpdate, validate } from "../middleware/Validator";
import { roleValidator, idValidater } from "../lib/Validations";
import { TABLE_NAMES } from "../constants";
import { created, updated, deleted } from "../lib/Responses";
import Permission from "../models/Permission";
import { In } from "typeorm";

const router = Router();

const RES_NAME = "Role";

router.get(
  "/permissions",
  asyncHandler(async (req: Request, res: Response) => {
    const permissions = await Permission.find({
      select: ["name", "id"],
      order: {
        id: "ASC",
      },
    });
    res.json(permissions);
  })
);


router.get(
  "/dropdown",
  asyncHandler(async (req: Request, res: Response) => {
    const roles = await Role.find({
      select: ["name", "id","description"],
    });
    res.json(roles);
  })
);

router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const roles = await Role.find({
      select: { name: true, permissions: { name: true } },
      relations: ["permissions"],
    });
    res.json(roles);
  })
);

router.post(
  "/",
  validate(roleValidator),
  asyncHandler(async (req: Request, res: Response) => {
    const { permissions } = req.body;
    const role: Role = Role.create({ ...req.body });
    role.permissions = await Permission.findBy({ id: In(permissions) });
    await role.save();
    res.json({ msg: created(RES_NAME) });
  })
);

router.patch(
  "/:id",
  validate(idValidater),
  dbUpdate(TABLE_NAMES.ROLES),
  validate(roleValidator),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { permissions, name } = req.body;
    const role = await Role.findOneByOrFail({ id: parseInt(id) });
    role.permissions = await Permission.findBy({ id: In(permissions) });
    role.name = name;
    await role.save(); // saving the database
    res.json({ msg: updated(RES_NAME) });
  })
);

router.delete(
  "/:id",
  validate(idValidater),
  dbDelete(TABLE_NAMES.ROLES),
  asyncHandler(async (req: Request, res: Response) => {
    res.json({
      success: true,
      message: "Role deleted successfully"
    });
  })
);


export default router;
