import { Request, Response, Router } from "express";
import asyncHandler from "../middleware/AsyncHandler";
import { AdminUserContext, requireAdminUser } from "../middleware/AdminAuth";
import {
  updateResetPassword,
  verifyResetPassword,
} from "../services/resetPassword.service";
import { verifyEditPassword, updateEditPassword } from "../services/resetPassword.service";

const router = Router();

router.put(
  "/reset-password",
  requireAdminUser([
    "/admin-panel/settings",
    "/admin-panel/users",
    "/admin-panel/user-roles",
  ]),
  asyncHandler(async (req: Request, res: Response) => {
    const { currentPassword, newPassword, confirmPassword } = req.body as {
      currentPassword?: string;
      newPassword?: string;
      confirmPassword?: string;
    };

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password, new password, and confirmation are required.",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirmation do not match.",
      });
    }

    const adminUser = (req as any).adminUser as AdminUserContext;
    const isCurrentPasswordValid = await verifyResetPassword(
      currentPassword,
      adminUser?.password,
    );

    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Current reset password is invalid.",
      });
    }

    await updateResetPassword(newPassword);

    return res.json({
      success: true,
      message: "Reset password updated successfully.",
    });
  }),
);

router.post(
  "/verify-edit-password",
  requireAdminUser([
    "/admin-panel/settings",
    "/admin-panel/users",
    "/admin-panel/user-roles",
  ]),
  asyncHandler(async (req: Request, res: Response) => {
    const { password } = req.body as { password?: string };

    if (!password) {
      return res.status(400).json({ success: false, message: "Password is required." });
    }

    const adminUser = (req as any).adminUser as AdminUserContext;
    const isValid = await verifyEditPassword(password, adminUser?.password);

    if (!isValid) {
      return res.status(401).json({ success: false, message: "Invalid edit password." });
    }

    return res.json({ success: true, message: "Password verified." });
  }),
);

router.put(
  "/edit-password",
  requireAdminUser([
    "/admin-panel/settings",
    "/admin-panel/users",
    "/admin-panel/user-roles",
  ]),
  asyncHandler(async (req: Request, res: Response) => {
    const { currentPassword, newPassword, confirmPassword } = req.body as {
      currentPassword?: string;
      newPassword?: string;
      confirmPassword?: string;
    };

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password, new password, and confirmation are required.",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirmation do not match.",
      });
    }

    const adminUser = (req as any).adminUser as AdminUserContext;
    const isCurrentPasswordValid = await verifyEditPassword(currentPassword, adminUser?.password);

    if (!isCurrentPasswordValid) {
      return res.status(401).json({ success: false, message: "Current edit password is invalid." });
    }

    await updateEditPassword(newPassword);

    return res.json({ success: true, message: "Edit password updated successfully." });
  }),
);

export default router;

