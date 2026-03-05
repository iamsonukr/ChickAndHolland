import { NextFunction, Request, Response } from "express";
import { ValidationChain, validationResult } from "express-validator";
import db from "../db";

export const validate = (validationChain: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await Promise.all(
        validationChain.map((validation) => validation.run(req))
      );
      const errors = validationResult(req);

      if (errors.isEmpty()) {
        next();
        return;
      }
      return res.status(400).json({
        msg: errors.array().map((err: any) => {
          return {
            path: err.path,
            msg: err.msg,
          };
        }),
      });
    } catch (error: any) {
      res.status(500).json({ msg: error.message });
    }
  };
};

export const dbDelete = (name: string) => {
  return async (req: any, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await db.query(`select id from ${name} where id = ${id};`);
      if (result && result.length > 0) {
        req.prevObject = result;
        await db.query(`DELETE FROM ${name} WHERE id = ${id}`);
        next();
        return;
      }
      return res.status(404).json({ msg: `${name} with id : ${id} not found` });
    } catch (error: any) {
      res.status(500).json({ msg: error.message });
    }
  };
};
export const dbUpdate = (name: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await db.query(`select id from ${name} where id = ${id};`);

      if (result && result.length > 0) {
        next();
        return;
      }
      return res.status(404).json({ msg: `${name} with id : ${id} not found` });
    } catch (error: any) {
      res.status(500).json({ msg: error.message });
    }
  };
};

/**
 * @description - checks the row with given id exists in the given table
 * @param objectName - the name of the key should be passed from  the frontend
 * @param tableName  - the name of the table to check
 */
export const relationValidator = (objectName: string, tableName: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.body[objectName]; // taking the id from the object in the body
      if (!id) {
        return res.status(404).json({ msg: "Please Add Id in " + objectName });
      }
      const isExists = await db.query(
        `SELECT id FROM ${tableName} WHERE id = ${id}`
      );
      if (isExists && isExists.length > 0) {
        next();
        return;
      }
      return res
        .status(404)
        .json({ msg: `${tableName} with id : ${id} not found` });
    } catch (error: any) {
      res.status(500).json({ msg: error.message });
    }
  };
};

/**
 * @description - checks the row with given id exists in the given table
 * @param keyName - the name of the key should be passed from  the frontend
 * @param tableName  - the name of the table to check
 */
export const relationIdValidator = (keyName: string, tableName: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.body[keyName]; // taking the id from the object in the body

      const isExists = await db.query(
        `SELECT id FROM ${tableName} WHERE id = ${id}`
      );
      if (isExists && isExists.length > 0) {
        next();
        return;
      }
      return res
        .status(404)
        .json({ msg: `${tableName} with id : ${id} not found` });
    } catch (error: any) {
      res.status(500).json({ msg: error.message });
    }
  };
};
