import { Request, Response, Router } from "express";
import asyncHandler from "../middleware/AsyncHandler";
import {
  dbUpdate,
  relationIdValidator,
  validate,
} from "../middleware/Validator";
import {
  idValidater,
  employeeValidator,
  loginValidator,
} from "../lib/Validations";
import { CLIENT_OBJ_NAMES, FOLDER_NAMES, TABLE_NAMES } from "../constants";
import { created, updated, deleted } from "../lib/Responses";
import { employeeUpload } from "../lib/upload";
import fs from "fs";
import path from "path";
import CONFIG from "../config";
import Employee from "../models/Employee";
import { BadRequest, NotFound } from "../errors/Errors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = Router();

const RES_NAME = "Employee";

router.post(
  "/login",
  validate(loginValidator),
  asyncHandler(async (req: Request, res: Response) => {
    const { userName, password } = req.body as {
      userName: string;
      password: string;
    };

    const employee = await Employee.findOne({
      where: { userName },
      relations: ["role", "role.permissions"],
    });

    if (!employee) {
      throw new NotFound(`Employee with userName : ${userName} Not Found`);
    }

    const isPasswordMatch = await bcrypt.compare(password, employee.password);

    if (!isPasswordMatch) {
      throw new BadRequest(`Invalid Password`);
    }

    const expiresIn = new Date(Date.now() + 1000 * 60 * 60 * 24);

    const token = jwt.sign(
      { id: employee.id, type: "EMPLOYEE" },
      CONFIG.JWT_SECRET,
      {
        expiresIn: CONFIG.JWT_EXPIRES_IN,
      }
    );

    res
      // .cookie("Authorization", token, {
      //   httpOnly: true,
      //   expires: expiresIn, // 24 hrs
      // })
      .json({
        id: employee.id,
        role: employee.role,
        token
      });
  })
);

router.get(
  "/dropdown",
  asyncHandler(async (req: Request, res: Response) => {
    const employees = await Employee.query(
      `SELECT id , CONCAT(firstName , ' ' , lastName) as name , userName ,image ,state ,city ,address1 ,address2 ,zipCode ,mobileNumber ,roleId FROM employees`
    );
    res.json(employees);
  })
);

router.get(
  "/:id",
  validate(idValidater),
  asyncHandler(async (req: Request, res: Response) => {
    const employee = await Employee.findOneOrFail({
      where: { id: parseInt(req.params.id) },
      select: ["id", "firstName", "lastName", "image", "mobileNumber"],
    });

    res.json(employee);
  })
);

router.post(
  "/",
  employeeUpload.single("image"),
  validate(employeeValidator),
  relationIdValidator(`${CLIENT_OBJ_NAMES.ROLE}Id`, TABLE_NAMES.ROLES),
  asyncHandler(async (req: Request, res: Response) => {
    const { roleId, reportingManagerId } = req.body;
    req.body.role = { id: roleId };
    if (reportingManagerId) {
      const employee = await Employee.findOneBy({
        id: parseInt(reportingManagerId),
      });
      if (!employee) {
        throw new NotFound(
          `Employee with id : ${reportingManagerId} Not Found`
        );
      }
      req.body.reportingManager = { id: reportingManagerId };
    }
    if (!req.file) {
      return res
        .status(400)
        .json({ msg: "File is not uploaded correctly, please try again" });
    }
    req.body.password = await bcrypt.hash(
      req.body.password,
      CONFIG.SALT_ROUNDS
    );
    req.body.image = `${CONFIG.HOST}/${FOLDER_NAMES.STATIC_PATH}/${FOLDER_NAMES.EMPLOYEES}/${req.file.filename}`;
    const employee = Employee.create({ ...req.body });
    await employee.save();
    res.json({ msg: created(RES_NAME) });
  })
);

router.patch(
  "/:id",
  validate(idValidater),
  employeeUpload.single("image"),
  // validate(employeeValidator),
  dbUpdate(TABLE_NAMES.EMPLOYEES),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reportingManagerId, roleId } = req.body;

    if (reportingManagerId) {
      const employee = await Employee.findOneBy({
        id: parseInt(reportingManagerId),
      });
      if (!employee) {
        throw new NotFound(
          `Employee with id : ${reportingManagerId} Not Found`
        );
      }
      req.body.reportingManager = { id: reportingManagerId };
      delete req.body.reportingManagerId;
    }

    if (roleId) {
      req.body.role = { id: roleId };
      delete req.body.roleId;
    }

    // if there is any uploaded image we will get that image and update it
    if (req.file) {
      const employee = await Employee.findOneByOrFail({ id: parseInt(id) });
      const image = employee.image.split("/");

      fs.unlinkSync(
        path.join(
          process.cwd(),
          FOLDER_NAMES.STATIC,
          FOLDER_NAMES.EMPLOYEES,
          image[image.length - 1]
        )
      );
      req.body.image = `${CONFIG.HOST}/${FOLDER_NAMES.STATIC_PATH}/${FOLDER_NAMES.EMPLOYEES}/${req.file.filename}`;
    }

    await Employee.update(id, req.body);
    res.json({ msg: updated(RES_NAME) });
  })
);

router.delete(
  "/:id",
  validate(idValidater),
  asyncHandler(async (req: any, res: Response) => {
    const employee = await Employee.findOne({
      where: { id: parseInt(req.params.id) },
    });
    if (!employee) {
      throw new NotFound(`Employee with id : ${req.params.id} Not Found`);
    }
    if (employee.image) {
      const image = employee.image.split("/");
      fs.unlinkSync(
        path.join(
          process.cwd(),
          FOLDER_NAMES.STATIC,
          FOLDER_NAMES.EMPLOYEES,
          image[image.length - 1]
        )
      );
    }
    await Employee.delete(req.params.id);
    res.json({ msg: deleted(RES_NAME) });
  })
);

export default router;
