import { NextFunction, Request, Response } from "express";
import CONFIG from "../config";

/**
 * This is the error handler it will catch all the errors in the application
 * and sends it as a response along with appropriate error code
 */
export default (err: any, req: Request, res: Response, next: NextFunction) => {
  // if (!CONFIG.PRODUCTION) {
    console.log("error is ", err);
  // }
  const mysqlErrno = Number(err?.errno ?? err?.driverError?.errno) || 0;
  const mysqlMessage =
    err?.sqlMessage ?? err?.driverError?.sqlMessage ?? err?.message;

  if (mysqlErrno === 1932) {
    return res.status(503).json({
      msg:
        `${mysqlMessage}. ` +
        "Run `npm run repair:catalog -- --apply` inside `server` to rebuild the broken catalog tables from `chicnewDB.sql`.",
    });
  }

  if (mysqlErrno === 1146) {
    return res.status(503).json({
      msg:
        `${mysqlMessage}. ` +
        "Run `npm run repair:catalog -- --apply` inside `server` if the catalog tables have not been created in this database yet.",
    });
  }

  switch (err.code) {
    case "ER_DUP_ENTRY":
      res
        .status(400)
        .json({ msg: `${err.message.split(" ")[2]} is already present` });
      break;
    case 400:
      res.status(400).json({ msg: err.message });
      break;
    case 401:
      res.status(401).json({ msg: err.message });
      break;
    case 403:
      res.status(403).json({ msg: err.message });
      break;
    case 404:
      res.status(404).json({ msg: err.message });
      break;
    default:
      res.status(500).json({
        msg:
          err.message ||
          "Something went wrong , please try again after some time",
      });
      break;
  }
};
