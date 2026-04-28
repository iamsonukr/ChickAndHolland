import { Request, Response, Router } from "express";
import asyncHandler from "../middleware/AsyncHandler";
import { mail } from "../lib/Utils";
import Contactus from "../models/contactus";
import { contactUsEmailTemplate } from "../lib/contactUsEmailTemplate";

const router = Router();
const RES_NAME = "Contactus";
const CONTACT_US_RATE_LIMITS = {
  minute: { windowMs: 60 * 1000, max: 3, label: "minute" },
  hour: { windowMs: 60 * 60 * 1000, max: 10, label: "hour" },
  day: { windowMs: 24 * 60 * 60 * 1000, max: 20, label: "day" },
} as const;
const contactUsRequestLog = new Map<string, number[]>();

const getClientIp = (req: Request) => {
  const forwardedFor = req.headers["x-forwarded-for"];
  const forwardedIp = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : forwardedFor?.split(",")[0];
  const rawIp =
    forwardedIp?.trim() || req.ip || req.socket.remoteAddress || "unknown";

  return rawIp.replace(/^::ffff:/, "");
};

const getRateLimitViolation = (ip: string, now: number) => {
  const timestamps = contactUsRequestLog.get(ip) ?? [];
  const activeTimestamps = timestamps.filter(
    (timestamp) => now - timestamp < CONTACT_US_RATE_LIMITS.day.windowMs,
  );

  contactUsRequestLog.set(ip, activeTimestamps);

  for (const limit of Object.values(CONTACT_US_RATE_LIMITS)) {
    const matchingRequests = activeTimestamps.filter(
      (timestamp) => now - timestamp < limit.windowMs,
    );

    if (matchingRequests.length >= limit.max) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((matchingRequests[0] + limit.windowMs - now) / 1000),
      );

      return {
        retryAfterSeconds,
        message: `Too many contact requests from this IP. Limit is ${CONTACT_US_RATE_LIMITS.minute.max} per minute, ${CONTACT_US_RATE_LIMITS.hour.max} per hour, and ${CONTACT_US_RATE_LIMITS.day.max} per day. Please try again later.`,
      };
    }
  }

  activeTimestamps.push(now);
  contactUsRequestLog.set(ip, activeTimestamps);

  return null;
};

/**
 * CREATE CONTACT MESSAGE
 */
router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const now = Date.now();
    const clientIp = getClientIp(req);
    const rateLimitViolation = getRateLimitViolation(clientIp, now);

    if (rateLimitViolation) {
      return res.status(429).json({
        success: false,
        message: rateLimitViolation.message,
        retryAfterSeconds: rateLimitViolation.retryAfterSeconds,
      });
    }

    const isHumanCheckValid =
      req.body?.humanCheck === true || req.body?.humanCheck === "true";

    if (!isHumanCheckValid) {
      return res.status(400).json({
        success: false,
        message: "Please confirm you are not a robot",
      });
    }

    const { name, email, phoneNumber, subject, message, state, country } =
      req.body;

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
