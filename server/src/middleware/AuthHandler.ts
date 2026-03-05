import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import CONFIG from "../config";
import Employee from "../models/Employee";
import Seller from "../models/Seller";
import db from "../db";
import { TABLE_NAMES } from "../constants";

/**
 * @description This middleware is used to authenticate the member
 * @overview - this will check for bearer token in the authorization header
 * and will check if the token is valid or not and will add the member details
 * to the request object if the token is valid and will pass the request to the next middleware
 */
export const memberAuthHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.path.includes("login")) {
    return next();
  }
  if (req.path.includes("seller") && req.method === "POST") {
    return next();
  }
  if (req.path.includes("employee") && req.method === "POST") {
    return next();
  }
  if (req.path.includes("users") && req.method === "POST") {
    return next();
  }

  if (
    req.path.includes("categories") ||
    req.path.includes("subcategories") ||
    req.path.includes("products/filter") ||
    req.path.includes("products") ||
    req.path.includes("contactus") ||
    // this is temporary
    req.path.includes("retailers") ||
    req.path.includes("stock-details") ||
    req.path.includes("jpeg") ||
    req.path.includes("cache") ||
    req.path.includes("orderDetails") ||
    req.path.includes("clients/new") ||
    req.path.includes("quickbook") ||
    req.path.includes("sponsors") ||
    req.path.includes("product-colours")||
    req.path.includes("pieces") // ✅ ADD THIS LINE

  ) {
    return next();
  }

  const authorization = (req.headers.authorization ||
    req.headers.Authorization) as string;

  if (!authorization) {
    return res.status(401).json({ msg: `Authorization header is required` });
  }
  try {
    const token = authorization.split(" ")[1];

    if (!token) {
      return res.status(401).json({ msg: `Token is required` });
    }

    const decodedUser = jwt.verify(token, CONFIG.JWT_SECRET) as {
      id: number;
      type: string;
    };

    if (!decodedUser) {
      return res.status(401).json({ msg: `Invalid token` });
    }

    let user = {} as Seller | Employee;
    if (decodedUser.type === "EMPLOYEE") {
      user = await Employee.findOneOrFail({
        where: { id: decodedUser.id },
      });
    } else if (decodedUser.type === "SELLER") {
      user = await Seller.findOneOrFail({
        where: { id: decodedUser.id },
      });
    } else if (decodedUser.type === "USER") {
      [user] = await db.query(
        `SELECT * FROM ${TABLE_NAMES.USERS} WHERE id = ?`,
        [decodedUser.id]
      );
    }

    if (!user) {
      return res.status(401).json({
        msg: `No ${decodedUser.type} found with this token , please check`,
      });
    }

    (req as any).user = user;

    next();
  } catch (error: any) {
    return res.status(401).json({ msg: `Invalid token`, error: error.message });
  }
};

/**
 * @description This middleware is used to authenticate the member
 * @overview - this will check for bearer token in the authorization header
 * and will check if the token is valid or not and will add the member details
 * to the request object if the token is valid and will pass the request to the next middleware
 */
// export const memberAuthHandler = async (
//   req: any,
//   res: Response,
//   next: NextFunction
// ) => {
//   // next()
//   // return;
//   // if path contains login or register then skip auth
//   if (req.path.includes("login")) {
//     return next();
//   }
//   if (req.path.includes("seller") && req.method === "POST") {
//     return next();
//   }
//   if (req.path.includes("employee") && req.method === "POST") {
//     return next();
//   }
//   if (
//     req.path.includes("categories") ||
//     req.path.includes("subcategories") ||
//     req.path.includes("products/filter")
//   ) {
//     return next();
//   }

//   const token = req.cookies.authorization || req.cookies.Authorization;

//   if (!token) {
//     return res.status(401).json({ msg: `Token is required` });
//   }

//   const decodedUser = jwt.verify(token, CONFIG.JWT_SECRET) as {
//     id: number;
//     type: string;
//   };

//   if (!decodedUser) {
//     return res.status(401).json({ msg: `Invalid token` });
//   }

//   let user = {} as Seller | Employee;
//   if (decodedUser.type === "EMPLOYEE") {
//     user = await Employee.findOneOrFail({
//       where: { id: decodedUser.id },
//     });
//   } else if (decodedUser.type === "SELLER") {
//     user = await Seller.findOneOrFail({
//       where: { id: decodedUser.id },
//     });
//   }

//   if (!user) {
//     return res.status(401).json({
//       msg: `No ${decodedUser.type} found with this token , please check`,
//     });
//   }

//   req.user = user;

//   next();
// };
