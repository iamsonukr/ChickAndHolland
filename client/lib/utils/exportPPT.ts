import pptxgen from "pptxgenjs";
import dayjs from "dayjs";

export async function downloadOrderPPT(orderData: any) {
  const ppt = new pptxgen();

  // Landscape A4
  ppt.defineLayout({ name: "A4-Landscape", width: 13.6, height: 7.6 });
  ppt.layout = "A4-Landscape";

  const pink = "#FF5698";
  const lightPink = "#FFE6F2";
  const border = { color: "000000", pt: 1 };

  orderData.details.forEach((item: any) => {
    const slide = ppt.addSlide();

    const defaultText = {
      fontFace: "Arial",
      color: "000000",
    };

    // ===== HEADER BANNER =====
    slide.addShape(ppt.ShapeType.rect, {
      x: 0,
      y: 0,
      w: "100%",
      h: 0.85,
      fill: { color: pink },
      line: "none",
    });

    slide.addText(item.styleNo, {
      ...defaultText,
      x: 0.3,
      y: 0.18,
      fontSize: 20,
      bold: true,
    });

    slide.addText(orderData.purchaseOrderNo, {
      ...defaultText,
      x: 4.7,
      y: 0.12,
      fontSize: 30,
      bold: true,
    });

    let shippingText =
      `Order Received Date: ` +
      dayjs(orderData.orderReceivedDate).format("DD MMM YYYY");

    if (orderData.orderCancellationDate) {
      shippingText +=
        `\nOrder Shipping Date: ` +
        dayjs(orderData.orderCancellationDate).format("DD MMM YYYY");
    }

slide.addText(shippingText, {
  ...defaultText,
  x: 9,
  y: 0.10,
  w: 4.2,
  h: 0.9,
  fontSize: 14,
  bold: true,
  align: "right",
  valign: "middle",
  lineSpacing: 10,
  wrap: true,
});


    // ===== TABLE TITLE ROW =====
    slide.addShape(ppt.ShapeType.rect, {
      x: 0.3,
      y: 1.1,
      w: 7.4,
      h: 0.6,
      fill: { color: "#FFD1E6" },
      line: border,
    });

    slide.addText("Product Specifications", {
      ...defaultText,
      x: 0.35,
      y: 1.15,
      fontSize: 14,
      bold: true,
    });

    slide.addText(
      orderData.orderType === "Fresh" ? "Fresh" : orderData.orderType,
      {
        ...defaultText,
        x: 6.8,
        y: 1.18,
        fontSize: 14,
        bold: true,
        color: "0000FF",
      }
    );

    // ===== PRODUCT TABLE (with merged Size cell) =====
    const tableY = 1.7;

    const sizeText = item.admin_us_size
      ? `US ${item.admin_us_size} (${item.size_country} ${item.size})`
      : `${item.size_country} ${item.size}`;

    // Using cell objects with rowSpan to merge Size over 2 rows
    const tableRows: any[][] = [
      [
        {
          text: "Color",
          options: {
            fill: pink,
            bold: true,
            color: "FFFFFF",
            fontFace: "Arial",
          },
        },
        {
          text: item.color,
          options: {
            fill: lightPink,
            fontFace: "Arial",
          },
        },
        {
          text: "Mesh Color",
          options: {
            fill: pink,
            bold: true,
            color: "FFFFFF",
            fontFace: "Arial",
          },
        },
        {
          text: item.meshColor,
          options: {
            fill: lightPink,
            fontFace: "Arial",
          },
        },
      ],
      [
        {
          text: "Quantity",
          options: {
            fill: pink,
            bold: true,
            color: "FFFFFF",
            fontFace: "Arial",
          },
        },
        {
          text: `${item.quantity}`,
          options: {
            fill: lightPink,
            fontFace: "Arial",
          },
        },
        {
          text: "Beading Color",
          options: {
            fill: pink,
            bold: true,
            color: "FFFFFF",
            fontFace: "Arial",
          },
        },
        {
          text: item.beadingColor,
          options: {
            fill: lightPink,
            fontFace: "Arial",
          },
        },
      ],
      // Row 3 – Size (header + value) with rowSpan: 2
      [
        {
          text: `Size (${item.size_country})`,
          options: {
            fill: pink,
            bold: true,
            color: "FFFFFF",
            fontFace: "Arial",
            rowSpan: 2, // MERGE DOWN
          },
        },
        {
          text: sizeText,
          options: {
            fill: lightPink,
            fontFace: "Arial",
            rowSpan: 2, // MERGE DOWN
          },
        },
        {
          text: "Lining Color",
          options: {
            fill: pink,
            bold: true,
            color: "FFFFFF",
            fontFace: "Arial",
          },
        },
        {
          text: item.liningColor,
          options: {
            fill: lightPink,
            fontFace: "Arial",
          },
        },
      ],
      // Row 4 – empty placeholders on left because of rowSpan, right side Lining
      [
        {
          text: "",
          options: {
            fill: pink,
            fontFace: "Arial",
          },
        },
        {
          text: "",
          options: {
            fill: lightPink,
            fontFace: "Arial",
          },
        },
        {
          text: "Lining",
          options: {
            fill: pink,
            bold: true,
            color: "FFFFFF",
            fontFace: "Arial",
          },
        },
        {
          text: item.lining,
          options: {
            fill: lightPink,
            fontFace: "Arial",
          },
        },
      ],
    ];

    slide.addTable(tableRows, {
      x: 0.3,
      y: tableY,
      w: 7.4,
      colW: [1.8, 2.2, 1.8, 1.6],
      rowH: [0.55, 0.55, 0.55, 0.55],
      border,
      fontSize: 13,
      align: "left",
    });

    // ===== CUSTOMIZATION DETAILS =====
    slide.addText("Customization Details", {
      x: 0.3,
      y: tableY + 2.3,
      fontSize: 14,
      bold: true,
      underline: true,
      color: pink,
      fontFace: "Arial",
    });

    slide.addText(item.comments || "-", {
      x: 0.3,
      y: tableY + 2.6,
      w: 7.4,
      h: 1.1,
      fontSize: 12,
      fontFace: "Arial",
      fill: { color: "#f9f9f9" },
      line: border,
      valign: "top",
      wrap: true,
    });

    // ===== EXTRA REFERENCE IMAGES =====
    if (item.refImg?.length > 0) {
      let refX = 0.3;
      let refY = tableY + 3.9;

      item.refImg.slice(0, 3).forEach((img: string) => {
        slide.addImage({
          data: img,
          x: refX,
          y: refY,
          w: 2.3,
          h: 2.2,
          line: border,
        });

        refX += 2.4;
      });
    }

    // ===== MAIN IMAGE (RIGHT SIDE) =====
    if (item.image) {
      slide.addImage({
        data: item.image,
        x: 8,
        y: 1.5,
        w: 5,
        h: 5.5,
        line: border,
      });
    }
  });

  ppt.writeFile(`${orderData.purchaseOrderNo}.pptx`);
}
