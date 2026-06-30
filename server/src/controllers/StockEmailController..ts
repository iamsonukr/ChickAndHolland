
import { Request, Response } from "express";
import PPTXGenJS from "pptxgenjs";
import { mail } from "../lib/Utils";
import fetch from "node-fetch";
import path from "path";
import { generateOrderPdf } from "../pdf/generateOrderPdf";
import { formatDateOnlyDisplay } from "../lib/dateOnly";

const buildUploadedDocumentUrl = (req: Request, rawUrl: string) => {
  if (/^https?:\/\//i.test(rawUrl)) return rawUrl;
  return `${req.protocol}://${req.get("host")}${rawUrl.startsWith("/") ? "" : "/"}${rawUrl}`;
};

const getAttachmentFilename = (fileUrl: string, fallbackBaseName: string) => {
  try {
    const parsed = new URL(fileUrl);
    const baseName = path.basename(parsed.pathname);
    if (baseName) return decodeURIComponent(baseName);
  } catch {
    // Fall back to using the raw string below.
  }

  const ext = path.extname(fileUrl) || "";
  return `${fallbackBaseName}${ext}`;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeEmailList = (value: unknown) => {
  const rawEmails = Array.isArray(value) ? value : [value];

  return Array.from(
    new Set(
      rawEmails
        .map((email) => String(email || "").trim().toLowerCase())
        .filter((email) => emailPattern.test(email)),
    ),
  );
};

export const sendStockExportEmail = async (req: Request, res: Response) => {
  try {
    const {
      attachmentBase64,
      exportKind,
      fileName,
      recipients,
      showPrice,
      to,
    } = req.body;
    const recipientEmails = normalizeEmailList(recipients || to);

    if (!recipientEmails.length) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least one valid email address",
      });
    }

    if (!attachmentBase64) {
      return res.status(400).json({
        success: false,
        message: "Export attachment is required",
      });
    }

    const requestedKind = String(exportKind || "").toLowerCase();
    const includePrice =
      showPrice === true || String(showPrice).toLowerCase() === "true";
    const safeFileName = String(
      fileName ||
        (requestedKind === "catalog"
          ? includePrice
            ? "stock-catalog-with-price.pdf"
            : "stock-catalog-without-price.pdf"
          : includePrice
            ? "stock-data-with-price.xlsx"
            : "stock-data-without-price.xlsx"),
    ).replace(/[\\/:*?"<>|]/g, "-");
    const isCatalog =
      requestedKind === "catalog" || safeFileName.toLowerCase().endsWith(".pdf");
    const exportLabel = isCatalog ? "stock list" : "stock data";
    const priceLabel = includePrice ? "with price" : "without price";
    const emailSubject = isCatalog
      ? "Requested stock list attached"
      : "Requested stock data attached";
    const attachmentFileName = isCatalog
      ? `Requested Stock List${includePrice ? "" : " - No Price"}.pdf`
      : `Requested Stock Data${includePrice ? "" : " - No Price"}.xlsx`;
    const cleanBase64 = String(attachmentBase64).replace(
      /^data:.*;base64,/,
      "",
    );
    const attachmentBuffer = Buffer.from(cleanBase64, "base64");

    if (!attachmentBuffer.length) {
      return res.status(400).json({
        success: false,
        message: "Export attachment is empty",
      });
    }

    const text = `Hello,

Please find the requested ${exportLabel} ${priceLabel} attached.

Best regards,
Chic & Holland`;

    const html = `
      <div style="font-family: Arial, sans-serif; font-size:14px; color:#111; line-height:1.5;">
        <p>Hello,</p>
        <p>Please find the requested ${exportLabel} ${priceLabel} attached.</p>
        <p>Best regards,<br/>Chic &amp; Holland</p>
      </div>
    `;

    for (const recipientEmail of recipientEmails) {
      await mail({
        to: recipientEmail,
        subject: emailSubject,
        text,
        html,
        replyTo: process.env.RESEND_FROM_EMAIL,
        attachments: [
          {
            filename: attachmentFileName || safeFileName,
            content: attachmentBuffer,
          },
        ],
      });
    }

    return res.json({
      success: true,
      message: "Stock export email sent successfully",
    });
  } catch (error: any) {
    console.error("Stock export email failed:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to send stock export email",
    });
  }
};

export const sendStockEmail = async (req: Request, res: Response) => {
  try {
    const { orderData } = req.body;

    if (!orderData) {
      return res.status(400).json({
        success: false,
        message: "orderData required",
      });
    }

    const uploadedFileUrlCandidate =
      orderData.ppt_path ||
      orderData.uploadedOrderFileUrl ||
      orderData.uploadedOrderFilePath ||
      orderData.uploadedDocumentUrl ||
      null;

    if (uploadedFileUrlCandidate) {
      try {
        const uploadedFileUrl = buildUploadedDocumentUrl(req, uploadedFileUrlCandidate);
        const uploadedFileResponse = await fetch(uploadedFileUrl);

        if (!uploadedFileResponse.ok) {
          throw new Error(
            `Failed to fetch uploaded file (${uploadedFileResponse.status})`
          );
        }

        const uploadedFileBuffer = Buffer.from(
          await uploadedFileResponse.arrayBuffer()
        );
        const attachmentName = getAttachmentFilename(
          uploadedFileUrl,
          orderData.purchaseOrderNo || "order-document"
        );

        await mail({
          to: orderData.manufacturingEmailAddress,
          subject: orderData.purchaseOrderNo,
          html: `
    <div style="font-family: Arial, sans-serif; font-size:14px; color:#000;">
      <p>Hello,</p>

      <p>Please find the order details attached with this email.</p>

      <br/>

      <p>
        Best Regards,<br/>
        Chic & Holland Team
      </p>

      <br/>

      <hr style="border:none;border-top:1px solid #ddd;" />

      <p style="font-size:12px; color:#666;">
        © 2025 Chic & Holland. All rights reserved.
      </p>
    </div>
  `,
          attachments: [
            {
              filename: attachmentName,
              content: uploadedFileBuffer,
            },
          ],
        });

        return res.json({
          success: true,
          message: "Email sent with uploaded attachment",
        });
      } catch (mailErr: any) {
        console.error("❌ UPLOADED ATTACHMENT MAIL FAILED →", mailErr);
        return res.status(500).json({
          success: false,
          message: mailErr.message || "Failed to send uploaded attachment",
        });
      }
    }

    const ppt = new PPTXGenJS();

    // ===== A4 LANDSCAPE =====
    ppt.defineLayout({ name: "A4-Landscape", width: 13.6, height: 7.6 });
    ppt.layout = "A4-Landscape";

    const pink = "FF5698";
    const lightPink = "FFE6F2";
    const border = { color: "000000", pt: 1 };

    for (const item of orderData.details) {
      const slide = ppt.addSlide();

      /* ================= HEADER ================= */
      slide.addShape(ppt.ShapeType.rect, {
        x: 0,
        y: 0,
        w: "100%",
        h: 0.85,
        fill: { color: pink },
      });

      slide.addText(item.styleNo, {
        x: 0.3,
        y: 0.18,
        fontSize: 20,
        bold: true,
      });

      slide.addText(orderData.purchaseOrderNo, {
        x: 4.7,
        y: 0.12,
        fontSize: 30,
        bold: true,
      });

      let dateText =
        `Order Received Date: ${formatDateOnlyDisplay(orderData.orderReceivedDate)}`;

      if (orderData.orderCancellationDate) {
        dateText +=
          `\nOrder Shipping Date: ${formatDateOnlyDisplay(orderData.orderCancellationDate)}`;
      }

      slide.addText(dateText, {
        x: 9,
        y: 0.1,
        w: 4.2,
        h: 0.9,
        fontSize: 14,
        align: "right",
        valign: "middle",
      });

      /* ================= TABLE TITLE ================= */
      slide.addShape(ppt.ShapeType.rect, {
        x: 0.3,
        y: 1.1,
        w: 7.4,
        h: 0.6,
        fill: { color: "FFD1E6" },
        line: border,
      });

      slide.addText("Product Specifications", {
        x: 0.35,
        y: 1.15,
        fontSize: 14,
        bold: true,
      });

      slide.addText(
        orderData.orderType === "Fresh" ? "Fresh" : orderData.orderType,
        {
          x: 6.8,
          y: 1.18,
          fontSize: 14,
          bold: true,
          color: "0000FF",
        }
      );

      /* ================= PRODUCT TABLE ================= */
      const sizeText = item.admin_us_size
        ? `US ${item.admin_us_size} (${item.size_country} ${item.size})`
        : `${item.size_country} ${item.size}`;

      const tableRows: any[][] = [
        [
          { text: "Color", options: { fill: pink, color: "FFFFFF", bold: true } },
          { text: item.color, options: { fill: lightPink } },
          { text: "Mesh Color", options: { fill: pink, color: "FFFFFF", bold: true } },
          { text: item.meshColor, options: { fill: lightPink } },
        ],
        [
          { text: "Quantity", options: { fill: pink, color: "FFFFFF", bold: true } },
          { text: `${item.quantity}`, options: { fill: lightPink } },
          { text: "Beading Color", options: { fill: pink, color: "FFFFFF", bold: true } },
          { text: item.beadingColor, options: { fill: lightPink } },
        ],
        [
          {
            text: `Size (${item.size_country})`,
            options: { fill: pink, color: "FFFFFF", bold: true, rowSpan: 2 },
          },
          {
            text: sizeText,
            options: { fill: lightPink, rowSpan: 2 },
          },
          { text: "Lining Color", options: { fill: pink, color: "FFFFFF", bold: true } },
          { text: item.liningColor, options: { fill: lightPink } },
        ],
        [
          { text: "", options: { fill: pink } },
          { text: "", options: { fill: lightPink } },
          { text: "Lining", options: { fill: pink, color: "FFFFFF", bold: true } },
          { text: item.lining || "-", options: { fill: lightPink } },
        ],
      ];

      slide.addTable(tableRows, {
        x: 0.3,
        y: 1.7,
        w: 7.4,
        colW: [1.8, 2.2, 1.8, 1.6],
        rowH: [0.55, 0.55, 0.55, 0.55],
        border,
        fontSize: 13,
      });

      /* ================= CUSTOMIZATION ================= */
      slide.addText("Customization Details", {
        x: 0.3,
        y: 4.1,
        fontSize: 14,
        bold: true,
underline: { style: "sng" },
        color: pink,
      });

      slide.addText(item.comments || "-", {
        x: 0.3,
        y: 4.4,
        w: 7.4,
        h: 1.1,
        fontSize: 12,
        fill: { color: "F9F9F9" },
        line: border,
        wrap: true,
        valign: "top",
      });

      /* ================= MAIN IMAGE ================= */
      if (item.image) {
        // IMAGE BORDER
slide.addShape(ppt.ShapeType.rect, {
  x: 8,
  y: 1.5,
  w: 5,
  h: 5.5,
  line: border,
  fill: { color: "FFFFFF" },
});

// IMAGE
slide.addImage({
  data: item.image,
  x: 8,
  y: 1.5,
  w: 5,
  h: 5.5,
});

      }
      
    }

    /* ================= EXPORT PPT FOR EMAIL ================= */
    const base64ppt = (await ppt.write({ outputType: "base64" })) as string;
    const buffer = Buffer.from(base64ppt, "base64");
    // ===== GENERATE PDF (same as frontend FreshOrderPdf) =====
    const pdfBuffer = await generateOrderPdf(orderData);


  try {
  await mail({
    to: orderData.manufacturingEmailAddress,
    subject: orderData.purchaseOrderNo,
    html: `
    <div style="font-family: Arial, sans-serif; font-size:14px; color:#000;">
      <p>Hello,</p>

      <p>Please find the order details attached with this email.</p>

      <br/>

      <p>
        Best Regards,<br/>
        Chic & Holland Team
      </p>

      <br/>

      <hr style="border:none;border-top:1px solid #ddd;" />

      <p style="font-size:12px; color:#666;">
        © 2025 Chic & Holland. All rights reserved.
      </p>
    </div>
  `,
  attachments: [
      {
        filename: `${orderData.purchaseOrderNo}.pdf`,
        content: pdfBuffer,
      },
    ],
  });

  console.log("✅ MAIL SENT TO →", orderData.manufacturingEmailAddress);
} catch (mailErr) {
  console.error("❌ SMTP MAIL FAILED →", mailErr);

  return res.status(500).json({
    success: false,
    message: "SMTP mail failed",
  });
}

    return res.json({ success: true, message: "Email sent with PPT" });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
