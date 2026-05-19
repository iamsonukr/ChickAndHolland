import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import CONFIG from "../config";
import db from "../db";
import { TABLE_NAMES } from "../constants";
import { verifyEditPassword } from "../services/resetPassword.service";

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

const logAdminRoleValidationFailure = (
  req: Request,
  reason: string,
  details: Record<string, unknown> = {},
) => {
  console.warn("[AdminAuth] Role validation failed", {
    reason,
    path: req.originalUrl || req.path,
    method: req.method,
    ...details,
  });
};

export const requireAdminUser =
  (requiredPermissions: string[] = []) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const authorization = getAuthorizationHeader(req);

    if (!authorization?.startsWith("Bearer ")) {
      logAdminRoleValidationFailure(req, "missing_admin_authorization");

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
        logAdminRoleValidationFailure(req, "invalid_admin_token_type", {
          decodedType: decoded?.type,
          decodedId: decoded?.id,
        });

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
        logAdminRoleValidationFailure(req, "admin_user_not_found", {
          userId: decoded.id,
        });

        return res.status(401).json({
          success: false,
          message: "Admin user not found.",
        });
      }

      const rolePermissions = parsePermissions(user.rolePermissions);
      const normalizedRolePermissions =
        rolePermissions.map(normalizePermission);
      const hasAllAccess = normalizedRolePermissions.includes("ALL");
      const normalizedUserPermissions = new Set(normalizedRolePermissions);
      const hasRequiredPermission =
        !requiredPermissions.length ||
        hasAllAccess ||
        requiredPermissions.some((permission) =>
          normalizedUserPermissions.has(normalizePermission(permission)),
        );

      if (!hasRequiredPermission) {
        logAdminRoleValidationFailure(req, "missing_required_permission", {
          userId: decoded.id,
          requiredPermissions,
          rolePermissions,
        });

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
      logAdminRoleValidationFailure(req, "invalid_admin_session", {
        error: error?.message,
      });

      return res.status(401).json({
        success: false,
        message: "Invalid admin session.",
        error: error?.message,
      });
    }
  };

export const requireEditPasswordHeader = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const editPassword = req.get("x-edit-password");

  if (!editPassword) {
    console.warn("[AdminAuth] Edit password validation failed", {
      reason: "missing_edit_password_header",
      path: req.originalUrl || req.path,
      method: req.method,
      adminUserId: (req as any).adminUser?.id,
    });

    return res.status(401).json({
      success: false,
      message: "Edit password verification is required.",
    });
  }

  try {
    const isValid = await verifyEditPassword(editPassword);

    if (!isValid) {
      console.warn("[AdminAuth] Edit password validation failed", {
        reason: "invalid_edit_password",
        path: req.originalUrl || req.path,
        method: req.method,
        adminUserId: (req as any).adminUser?.id,
      });

      return res.status(401).json({
        success: false,
        message: "Invalid edit password.",
      });
    }

    return next();
  } catch (error: any) {
    console.error("[AdminAuth] Edit password validation error", {
      path: req.originalUrl || req.path,
      method: req.method,
      adminUserId: (req as any).adminUser?.id,
      error: error?.message,
    });

    return res.status(401).json({
      success: false,
      message: "Invalid edit password.",
    });
  }
};
