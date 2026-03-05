import PptxGenJS from "pptxgenjs";

export async function generateFreshOrderPPT(orderData: any) {
  const pptx = new PptxGenJS();

  orderData.details.forEach((item: any, index: number) => {
    const slide = pptx.addSlide();

    // Banner
    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: "100%",
      h: 0.8,
      fill: { color: "FF5698" },
    });
    slide.addText(orderData.purchaseOrderNo, {
      x: 4.5,
      y: 0.2,
      fontSize: 24,
      bold: true,
      color: "000000",
    });
    slide.addText(`Order Received: ${orderData.orderReceivedDate}`, {
      x: 9,
      y: 0.2,
      fontSize: 12,
    });

    // Table
    const tableData = [
      ["Color", item.color, "Mesh Color", item.meshColor],
      ["Quantity", item.quantity, "Beading Color", item.beadingColor],
      [
        `Size (${item.size_country})`,
        item.size,
        "Lining Color",
        item.liningColor,
      ],
      ["Lining", item.lining, "", ""],
    ];

    slide.addTable(tableData, {
      x: 0.2,
      y: 1,
      w: 8,
      fontSize: 12,
      border: { color: "000000" },
      fill: [
        { color: "FF5698" },
        { color: "FFFFFF" },
        { color: "FF5698" },
        { color: "FFFFFF" },
      ],
    });

    // Product Image
    if (item.image) {
      slide.addImage({
        data: item.image,
        x: 8.6,
        y: 1,
        w: 4,
        h: 6,
      });
    }

    // Comments Section
    slide.addText("Customization Details", {
      x: 0.2,
      y: 4.8,
      fontSize: 14,
      bold: true,
      color: "FF5698",
    });

    slide.addText(item.comments || "No customization", {
      x: 0.2,
      y: 5.2,
      w: 8,
      h: 1.6,
      fontSize: 11,
      align: "left",
      valign: "top",
      border: { color: "#000" },
    });
  });

  const fileName = `${orderData.purchaseOrderNo}.pptx`;
  await pptx.writeFile({ fileName });

  return fileName;
}
