import pptxgen from "pptxgenjs";

export async function createFreshOrderPpt(orderData: any): Promise<ArrayBuffer> {
  const pptx = new pptxgen();

  (orderData.details || []).forEach((item: any) => {
    const slide = pptx.addSlide();

    // 🔹 Top banner (style no + PO + dates)
    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: "100%",
      h: 0.6,
      fill: { color: "FF5698" },
    });

    slide.addText(item.styleNo ?? "", {
      x: 0.3,
      y: 0.15,
      fontSize: 20,
      bold: true,
      color: "000000",
    });

    slide.addText(orderData.purchaseOrderNo ?? "", {
      x: 4.5,
      y: 0.1,
      fontSize: 30,
      bold: true,
      color: "000000",
    });

    const receivedText = orderData.orderReceivedDate
      ? `Order Received: ${orderData.orderReceivedDate}`
      : "";
    const shippingText = orderData.orderCancellationDate
      ? `Order Shipping: ${orderData.orderCancellationDate}`
      : "";

    slide.addText(`${receivedText}\n${shippingText}`.trim(), {
      x: 7,
      y: 0.15,
      fontSize: 12,
      color: "000000",
    });

    // 🔹 Product spec table (mirrors your PDF layout)
    const tableRows = [
      [
        "Color",
        item.color || "",
        "Mesh Color",
        item.meshColor || "",
      ],
      [
        "Quantity",
        String(item.quantity ?? ""),
        "Beading Color",
        item.beadingColor || "",
      ],
      [
        `Size (${item.size_country || ""})`,
        item.size || "",
        "Lining Color",
        item.liningColor || "",
      ],
      [
        "Lining",
        item.lining || "",
        "",
        "",
      ],
    ];

    slide.addTable(tableRows, {
      x: 0.3,
      y: 1,
      w: 6.8,
      border: { color: "000000", pt: 1 },
      fontSize: 14,
      fill: "FFE6F2",
      colW: [1.5, 2.0, 1.8, 1.5],
    });

    // 🔹 Customization comments
    slide.addText("Customization Details", {
      x: 0.3,
      y: 3.6,
      fontSize: 16,
      bold: true,
      color: "FF5698",
    });

    slide.addText(item.comments || "—", {
      x: 0.3,
      y: 4.0,
      w: 6.8,
      h: 1.2,
      fontSize: 12,
      color: "000000",
      wrap: true,
    });

    // 🔹 Main product image (right side)
    if (item.image) {
      slide.addImage({
        data: item.image, // should be data URL or base64
        x: 7.4,
        y: 1,
        w: 2.8,
        h: 4.2,
      });
    }

    // 🔹 Reference images (bottom left grid)
    if (item.refImg?.length) {
      const maxPerRow = 3;
      item.refImg.forEach((img: string, idx: number) => {
        const row = Math.floor(idx / maxPerRow);
        const col = idx % maxPerRow;

        slide.addImage({
          data: img,
          x: 0.3 + col * 2.2,
          y: 5.4 + row * 2.3,
          w: 2.0,
          h: 2.0,
        });
      });
    }
  });

  const buf = await pptx.write("arraybuffer");
  return buf as ArrayBuffer;
}