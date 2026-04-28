import { Request, Response, Router } from "express";
import asyncHandler from "../middleware/AsyncHandler";
import { mail } from "../lib/Utils";
import Contactus from "../models/contactus";
import { contactUsEmailTemplate } from "../lib/contactUsEmailTemplate";
import {
  getClientIp,
  getRateLimitViolation,
  isDisposableEmail,
} from "../lib/spamProtection";
import { verifyRecaptchaToken } from "../lib/recaptcha";

const router = Router();
const CONTACT_US_RATE_LIMITS = {
  minute: { windowMs: 60 * 1000, max: 3 },
  hour: { windowMs: 60 * 60 * 1000, max: 10 },
  day: { windowMs: 24 * 60 * 60 * 1000, max: 20 },
} as const;

/**
 * CREATE CONTACT MESSAGE
 */
router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const now = Date.now();
    const clientIp = getClientIp(req);
    const rateLimitViolation = getRateLimitViolation({
      bucket: "contactus",
      ip: clientIp,
      now,
      limits: CONTACT_US_RATE_LIMITS,
      resourceLabel: "contact",
    });

    if (rateLimitViolation) {
      return res.status(429).json({
        success: false,
        message: rateLimitViolation.message,
        retryAfterSeconds: rateLimitViolation.retryAfterSeconds,
      });
    }

    const recaptchaResult = await verifyRecaptchaToken({
      token: String(req.body?.recaptchaToken ?? ""),
    });

    if (!recaptchaResult.success) {
      return res.status(400).json({
        success: false,
        message: "reCAPTCHA verification failed. Please try again.",
        errorCodes: recaptchaResult.errorCodes,
      });
    }

    const { name, email, phoneNumber, subject, message, state, country } =
      req.body;

    if (isDisposableEmail(email)) {
      return res.status(400).json({
        success: false,
        message:
          "Please use a business or personal email address. Temporary email services are not allowed.",
      });
    }

    const contact = Contactus.create({
      name,
      email,
      phoneNumber,
      subject,
      message,
      state,
      country,
    });

    await contact.save();

    const htmlContent = contactUsEmailTemplate({
      name,
      email,
      phoneNumber,
      subject,
      message,
      state,
      country,
    });

    // ✅ Don't let email failure crash the response
    try {
      await mail({
        html: htmlContent,
        to: "info@chicandholland.com",
        replyTo: email,
        subject: `Contact Us form submission - ${subject}`,
      });
    } catch (emailError: any) {
      console.error("❌ Email failed but contact was saved:", emailError.message);
      // Don't rethrow — contact is saved, just notify in logs
    }

    res.json({
      success: true,
      message: "Your message has been sent successfully",
    });
  })
);


/**
 * GET ALL CONTACT ENTRIES
 */
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const entries = await Contactus.find({
      order: { createdAt: "DESC" },
    });

    res.json(entries);
  })
);

/**
 * MARK SINGLE MESSAGE AS READ
 */
router.patch(
  "/:id/read",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await Contactus.createQueryBuilder()
      .update(Contactus)
      .set({ isRead: true })
      .where("id = :id", { id })
      .execute();

    if (result.affected && result.affected > 0) {
      res.json({
        success: true,
        message: "Message marked as read",
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }
  })
);

/**
 * MARK ALL MESSAGES AS READ
 */
router.patch(
  "/mark-read/all",
  asyncHandler(async (req: Request, res: Response) => {
    await Contactus.createQueryBuilder()
      .update(Contactus)
      .set({ isRead: true })
      .where("isRead = :read", { read: false })
      .execute();

    res.json({
      success: true,
      message: "All messages marked as read",
    });
  })
);

export default router;
