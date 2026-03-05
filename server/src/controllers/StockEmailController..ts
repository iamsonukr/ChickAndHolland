
import { Request, Response } from "express";
import PPTXGenJS from "pptxgenjs";
import dayjs from "dayjs";
import { mail } from "../lib/Utils";
import { renderToBuffer } from "@react-pdf/renderer";
import { generateOrderPdf } from "../pdf/generateOrderPdf";


export const sendStockEmail = async (req: Request, res: Response) => {
  try {
    const { orderData } = req.body;

    if (!orderData) {
      return res.status(400).json({
        success: false,
        message: "orderData required",
      });
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
        `Order Received Date: ${dayjs(orderData.orderReceivedDate).format("DD MMM YYYY")}`;

      if (orderData.orderCancellationDate) {
        dateText +=
          `\nOrder Shipping Date: ${dayjs(orderData.orderCancellationDate).format("DD MMM YYYY")}`;
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
