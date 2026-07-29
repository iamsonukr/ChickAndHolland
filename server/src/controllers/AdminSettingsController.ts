import { Request, Response, Router } from "express";
import asyncHandler from "../middleware/AsyncHandler";
import { AdminUserContext, requireAdminUser } from "../middleware/AdminAuth";
import {
  updateResetPassword,
  verifyResetPassword,
} from "../services/resetPassword.service";
import { verifyEditPassword, updateEditPassword } from "../services/resetPassword.service";
import {
  peekNextSampleOrderStyleNo,
  setSampleOrderSequence,
} from "../utils/generatePO";

const router = Router();

const SETTINGS_PERMISSION_ROUTES = [
  "/admin-panel/settings",
  "/admin-panel/users",
  "/admin-panel/user-roles",
];

router.put(
  "/reset-password",
  requireAdminUser(SETTINGS_PERMISSION_ROUTES),
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
  requireAdminUser(["/admin-panel/orders"]),
  asyncHandler(async (req: Request, res: Response) => {
    const { password } = req.body as { password?: string };
    const adminUser = (req as any).adminUser as AdminUserContext | undefined;

    if (!password) {
      return res.status(400).json({ success: false, message: "Password is required." });
    }

    // Verify against stored edit password hash; if not set, there is no fallback here
    const isValid = await verifyEditPassword(password);

    if (!isValid) {
      console.warn("[AdminSettings] Edit password verification failed", {
        reason: "invalid_edit_password",
        adminUserId: adminUser?.id,
        path: req.originalUrl || req.path,
      });

      return res.status(401).json({ success: false, message: "Invalid edit password." });
    }

    return res.json({ success: true, message: "Password verified." });
  }),
);

router.put(
  "/edit-password",
  requireAdminUser(SETTINGS_PERMISSION_ROUTES),
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

router.get(
  "/sample-order-sequence",
  requireAdminUser(SETTINGS_PERMISSION_ROUTES),
  asyncHandler(async (_req: Request, res: Response) => {
    const sequence = await peekNextSampleOrderStyleNo();

    return res.json({
      success: true,
      nextNumber: sequence.nextNumber,
      nextStyleNo: sequence.styleNo,
    });
  }),
);

router.put(
  "/sample-order-sequence",
  requireAdminUser(SETTINGS_PERMISSION_ROUTES),
  asyncHandler(async (req: Request, res: Response) => {
    const nextNumber = Number(req.body?.nextNumber);

    if (!Number.isInteger(nextNumber) || nextNumber < 1) {
      return res.status(400).json({
        success: false,
        message: "Next sample order number must be a positive whole number.",
      });
    }

    const sequence = await setSampleOrderSequence(nextNumber);

    return res.json({
      success: true,
      message: `Next sample order style number set to ${sequence.styleNo}.`,
      nextNumber: sequence.nextNumber,
      nextStyleNo: sequence.styleNo,
    });
  }),
);

export default router;

