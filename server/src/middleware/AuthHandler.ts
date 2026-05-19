import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import CONFIG from "../config";
import Employee from "../models/Employee";
import Seller from "../models/Seller";
import db from "../db";
import { TABLE_NAMES } from "../constants";
import { verifyEditPassword } from "../services/resetPassword.service";

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
  const isPublicContactSubmission =
    (req.path === "/api/contactus" || req.path === "/api/contactus/") &&
    req.method === "POST";

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
    isPublicContactSubmission ||
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

  // Allow order edit requests to reach route-level role/password validation.
  const editPassword = req.get("x-edit-password");
  const normalizedPath = req.path.replace(/\/$/, "");
  const isRegularOrderEditRequest =
    req.method === "PATCH" &&
    (/^\/api\/orders\/[^/]+$/.test(normalizedPath) ||
      /^\/orders\/[^/]+$/.test(normalizedPath));

  if (editPassword && isRegularOrderEditRequest) {
    try {
      const isValid = await verifyEditPassword(editPassword);
      if (!isValid) {
        console.warn("[AuthHandler] Edit password validation failed", {
          reason: "invalid_edit_password",
          path: req.originalUrl || req.path,
          method: req.method,
        });
        return res.status(401).json({
          success: false,
          message: "Invalid edit password.",
        });
      }

      // Mark request as authenticated via password (minimal user context)
      (req as any).user = { id: 0, type: "PASSWORD" };
      return next();
    } catch (err: any) {
      console.error("[AuthHandler] Edit password validation error", {
        path: req.originalUrl || req.path,
        method: req.method,
        error: err?.message,
      });
      return res.status(401).json({
        success: false,
        message: "Invalid edit password.",
      });
    }
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
