import { Request, Response, Router } from "express";
import asyncHandler from "../middleware/AsyncHandler";
import { mail } from "../lib/Utils";
import Contactus from "../models/contactus";
import { contactUsEmailTemplate } from "../lib/contactUsEmailTemplate";

const router = Router();
const RES_NAME = "Contactus";

/**
 * CREATE CONTACT MESSAGE
 */
router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
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

    await mail({
      html: htmlContent,
      to: "ravindrsaw3@gmail.com",
      replyTo: email,
      inReplyTo: email,
      subject: `Contact Us form submission - ${subject}`,
    });

  
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
