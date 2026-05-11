import { Request, Response, Router } from "express";
import asyncHandler from "../middleware/AsyncHandler";
import { mail } from "../lib/Utils";
import Contactus from "../models/contactus";
import ProductQuery from "../models/ProductQuery";

type QueryType = "contact" | "product";

const router = Router();

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const getOriginalSubject = (query: Contactus | ProductQuery, queryType: QueryType) => {
  if (queryType === "contact") {
    return (query as Contactus).subject || "Contact page query";
  }

  const productCodes = (query as ProductQuery).productCodes;
  return productCodes ? `Product query: ${productCodes}` : "Product query";
};

const getCustomerName = (query: Contactus | ProductQuery, queryType: QueryType) => {
  if (queryType === "contact") return (query as Contactus).name || "Customer";

  const productQuery = query as ProductQuery;
  return [productQuery.firstName, productQuery.lastName].filter(Boolean).join(" ") || "Customer";
};

router.post(
  "/reply/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const queryType = req.body?.queryType as QueryType;

    if (!id || !["contact", "product"].includes(queryType)) {
      return res.status(400).json({
        success: false,
        message: "Valid query id and query type are required",
      });
    }

    const query =
      queryType === "product"
        ? await ProductQuery.findOne({ where: { id } })
        : await Contactus.findOne({ where: { id } });

    if (!query) {
      return res.status(404).json({
        success: false,
        message: "Query not found",
      });
    }

    const originalSubject = getOriginalSubject(query, queryType);
    const to = String(req.body?.to || query.email || "").trim();
    const subject = String(req.body?.subject || `Re: ${originalSubject}`).trim();
    const message = String(req.body?.message || "").trim();

    if (!to || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "Recipient, subject and message are required",
      });
    }

    const escapedMessage = escapeHtml(message).replace(/\n/g, "<br />");

    await mail({
      to,
      subject,
      text: message,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
          <p>${escapedMessage}</p>
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="font-size: 12px; color: #6b7280;">
            Reply sent to ${escapeHtml(getCustomerName(query, queryType))} for ${escapeHtml(originalSubject)}.
          </p>
        </div>
      `,
    });

    res.json({
      success: true,
      message: "Reply sent successfully",
    });
  })
);

export default router;
