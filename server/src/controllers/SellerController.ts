import { Request, Response, Router } from "express";
import asyncHandler from "../middleware/AsyncHandler";
import { dbDelete, dbUpdate, validate } from "../middleware/Validator";
import { created, updated, deleted } from "../lib/Responses";
import {
  sellerValidator,
  idValidater,
  loginValidator,
} from "../lib/Validations";
import { TABLE_NAMES } from "../constants";
import Seller from "../models/Seller";
import { NotFound } from "../errors/Errors";
import bcrypt from "bcrypt";
import CONFIG from "../config";
import jwt from "jsonwebtoken";

const router = Router();

const RES_NAME = "Seller";

type LoginDto = {
  userName: string;
  password: string;
};

router.post(
  "/login",
  validate(loginValidator),
  asyncHandler(async (req: Request, res: Response) => {
    const { userName, password } = req.body as LoginDto;

    const seller = await Seller.findOne({
      where: { email: userName },
    });

    if (!seller) {
      throw new NotFound(`Seller with email ${userName} not found`);
    }
    const isPasswordMatch = await bcrypt.compare(password, seller.password);
    if (!isPasswordMatch) {
      throw new NotFound(`Invalid password`);
    }

    const expiresIn = new Date(Date.now() + 1000 * 60 * 60 * 24);

    const token = jwt.sign(
      { id: seller.id, type: "SELLER" },
      CONFIG.JWT_SECRET,
      {
        expiresIn: CONFIG.JWT_EXPIRES_IN,
      }
    );
    res
      .cookie("Authorization", token, {
        httpOnly: true,
        expires: expiresIn, // 24 hrs
      })
      .json({
        id: seller.id,
        token,
      });
  })
);

router.get(
  "/:id",
  validate(idValidater),
  asyncHandler(async (req: Request, res: Response) => {
    const seller = await Seller.findOne({
      where: { id: parseInt(req.params.id) },
      select: ["email", "name", "id"],
    });

    if (!seller) {
      throw new NotFound(`Seller with id ${req.params.id} not found`);
    }

    res.json(seller);
  })
);

router.post(
  "/",
  validate(sellerValidator),
  asyncHandler(async (req: Request, res: Response) => {
    req.body.password = await bcrypt.hash(
      req.body.password,
      CONFIG.SALT_ROUNDS
    );
    const seller = Seller.create({ ...req.body });
    await seller.save();
    res.json({ msg: created(RES_NAME) });
  })
);

router.patch(
  "/:id",
  validate(idValidater),
  validate(sellerValidator),
  asyncHandler(async (req: Request<{ id: number }>, res: Response) => {
    const { id } = req.params;

    const seller = await Seller.findOne({ where: { id } });

    if (!seller) {
      throw new NotFound(`Seller with id ${id} not found`);
    }

    if (req.body.oldPassword && req.body.newPassword) {
      const isPasswordMatch = await bcrypt.compare(
        req.body.oldPassword,
        seller.password
      );

      if (!isPasswordMatch) {
        throw new NotFound(`Invalid password`);
      }

      req.body.password = await bcrypt.hash(
        req.body.newPassword,
        CONFIG.SALT_ROUNDS
      );
      delete req.body.oldPassword;
      delete req.body.newPassword;
    }

    await Seller.update(id, req.body);
    res.json({ msg: updated(RES_NAME) });
  })
);

router.delete(
  "/:id",
  validate(idValidater),
  dbDelete(TABLE_NAMES.SELLERS),
  asyncHandler(async (req: Request, res: Response) => {
    res.json({ msg: deleted(RES_NAME) });
  })
);

export default router;
