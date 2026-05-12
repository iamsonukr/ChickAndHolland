import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import CONFIG from "../config";
import db from "../db";
import { TABLE_NAMES } from "../constants";

export type AdminUserContext = {
  id: number;
  username: string;
  password: string;
  rolePermissions: string[];
};

const normalizePermission = (permission: string) =>
  String(permission ?? "").trim().replace(/\/$/, "");

const parsePermissions = (rawPermissions: unknown) => {
  if (Array.isArray(rawPermissions)) {
    return rawPermissions.map(String);
  }

  if (typeof rawPermissions !== "string" || !rawPermissions.trim()) {
    return [] as string[];
  }

  try {
    const parsed = JSON.parse(rawPermissions);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
};

const getAuthorizationHeader = (req: Request) =>
  (req.headers.authorization || req.headers.Authorization) as
    | string
    | undefined;

export const requireAdminUser =
  (requiredPermissions: string[] = []) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const authorization = getAuthorizationHeader(req);

    if (!authorization?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Admin login required.",
      });
    }

    try {
      const token = authorization.split(" ")[1];
      const decoded = jwt.verify(token, CONFIG.JWT_SECRET) as {
        id?: number;
        type?: string;
      };

      if (decoded?.type !== "USER" || !decoded.id) {
        return res.status(403).json({
          success: false,
          message: "Only admin users can perform this action.",
        });
      }

      const [user] = await db.query(
        `
          SELECT u.id, u.username, u.password, r.permissions AS rolePermissions
          FROM ${TABLE_NAMES.USERS} u
          LEFT JOIN ${TABLE_NAMES.USER_ROLES} r ON u.roleId = r.id
          WHERE u.id = ?
          LIMIT 1
        `,
        [decoded.id],
      );

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Admin user not found.",
        });
      }

      const rolePermissions = parsePermissions(user.rolePermissions);
      const hasAllAccess = rolePermissions.includes("ALL");
      const normalizedUserPermissions = new Set(
        rolePermissions.map(normalizePermission),
      );
      const hasRequiredPermission =
        !requiredPermissions.length ||
        hasAllAccess ||
        requiredPermissions.some((permission) =>
          normalizedUserPermissions.has(normalizePermission(permission)),
        );

      if (!hasRequiredPermission) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to perform this action.",
        });
      }

      (req as any).adminUser = {
        id: Number(user.id),
        username: String(user.username),
        password: String(user.password),
        rolePermissions,
      } satisfies AdminUserContext;

      return next();
    } catch (error: any) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin session.",
        error: error?.message,
      });
    }
  };
