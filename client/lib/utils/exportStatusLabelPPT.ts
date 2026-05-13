import pptxgen from "pptxgenjs";

import { build2dBarcodeUrl } from "@/lib/barcodes";
import { formatEuSizeSummary, PDF_DISPLAY_SIZE_UNIT } from "@/lib/sizeConversion";

const sanitizeFileName = (value: unknown, fallback: string) => {
  const name = String(value ?? "").trim() || fallback;

  return (
    name
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, "-")
      .replace(/\s+/g, " ")
      .slice(0, 120)
      .trim() || fallback
  );
};

const formatText = (value: unknown) => String(value ?? "").trim() || "-";

const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

const loadImageDataUrl = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Image could not be loaded");
  return blobToDataUrl(await response.blob());
};

export async function downloadStatusLabelPPT(item: any, orderType?: string) {
  const ppt = new pptxgen();

  ppt.defineLayout({ name: "StatusLabel", width: 3.2, height: 4 });
  ppt.layout = "StatusLabel";
  ppt.author = "Chic&Holland";
  ppt.subject = "Status label";
  ppt.title = `${formatText(item?.styleNo)} status label`;
  ppt.company = "Chic&Holland";

  const slide = ppt.addSlide();
  const black = "111827";
  const gray = "6B7280";
  const lightGray = "F3F4F6";
  const border = { color: black, pt: 1 };
  const sizeText = `${PDF_DISPLAY_SIZE_UNIT} ${formatEuSizeSummary([item], {
    alwaysShowCount: true,
  })}`;
  const colorText = formatText(item?.meshColor || item?.color);
  const barcodeUrl = build2dBarcodeUrl(item?.barcode, 240);
  const fileName = sanitizeFileName(
    `${formatText(item?.styleNo)}-label`,
    "status-label",
  );

  slide.background = { color: "FFFFFF" };

  slide.addShape(ppt.ShapeType.rect, {
    x: 0.12,
    y: 0.12,
    w: 2.96,
    h: 3.76,
    fill: { color: "FFFFFF" },
    line: border,
  });

  slide.addShape(ppt.ShapeType.rect, {
    x: 0.12,
    y: 0.12,
    w: 2.96,
    h: 0.58,
    fill: { color: black },
    line: { color: black, pt: 0 },
  });

  slide.addText(formatText(item?.styleNo), {
    x: 0.22,
    y: 0.22,
    w: 2.76,
    h: 0.18,
    fontFace: "Arial",
    fontSize: 12,
    bold: true,
    color: "FFFFFF",
    align: "center",
    fit: "shrink",
    margin: 0,
  });

  if (orderType) {
    slide.addText(`${orderType} ORDER`, {
      x: 0.22,
      y: 0.46,
      w: 2.76,
      h: 0.12,
      fontFace: "Arial",
      fontSize: 6.5,
      bold: true,
      color: "E5E7EB",
      align: "center",
      margin: 0,
    });
  }

  slide.addText("SIZE", {
    x: 0.28,
    y: 0.9,
    w: 1.1,
    h: 0.12,
    fontFace: "Arial",
    fontSize: 6.5,
    bold: true,
    color: gray,
    align: "center",
    margin: 0,
  });

  slide.addShape(ppt.ShapeType.rect, {
    x: 0.28,
    y: 1.04,
    w: 1.1,
    h: 0.36,
    fill: { color: lightGray },
    line: { color: "D1D5DB", pt: 0.75 },
  });

  slide.addText(sizeText, {
    x: 0.33,
    y: 1.15,
    w: 1,
    h: 0.1,
    fontFace: "Arial",
    fontSize: 8,
    bold: true,
    color: black,
    align: "center",
    fit: "shrink",
    margin: 0,
  });

  slide.addText("COLOR", {
    x: 1.82,
    y: 0.9,
    w: 1.1,
    h: 0.12,
    fontFace: "Arial",
    fontSize: 6.5,
    bold: true,
    color: gray,
    align: "center",
    margin: 0,
  });

  slide.addShape(ppt.ShapeType.rect, {
    x: 1.82,
    y: 1.04,
    w: 1.1,
    h: 0.36,
    fill: { color: lightGray },
    line: { color: "D1D5DB", pt: 0.75 },
  });

  slide.addText(colorText, {
    x: 1.87,
    y: 1.12,
    w: 1,
    h: 0.16,
    fontFace: "Arial",
    fontSize: 6.5,
    bold: true,
    color: black,
    align: "center",
    valign: "middle",
    fit: "shrink",
    margin: 0,
  });

  slide.addText("PURCHASE ORDER", {
    x: 0.28,
    y: 1.63,
    w: 2.64,
    h: 0.12,
    fontFace: "Arial",
    fontSize: 6.5,
    bold: true,
    color: gray,
    align: "center",
    margin: 0,
  });

  slide.addShape(ppt.ShapeType.rect, {
    x: 0.28,
    y: 1.8,
    w: 2.64,
    h: 0.36,
    fill: { color: "FFFBEB" },
    line: { color: "FBBF24", pt: 1 },
  });

  slide.addText(formatText(item?.purchaseOrderNo), {
    x: 0.36,
    y: 1.91,
    w: 2.48,
    h: 0.1,
    fontFace: "Arial",
    fontSize: 8,
    bold: true,
    color: black,
    align: "center",
    fit: "shrink",
    margin: 0,
  });

  if (barcodeUrl) {
    slide.addText("SCAN TO VERIFY", {
      x: 0.28,
      y: 2.42,
      w: 2.64,
      h: 0.1,
      fontFace: "Arial",
      fontSize: 6,
      bold: true,
      color: gray,
      align: "center",
      margin: 0,
    });

    try {
      const barcodeData = await loadImageDataUrl(barcodeUrl);
      slide.addImage({
        data: barcodeData,
        x: 1.05,
        y: 2.62,
        w: 1.1,
        h: 1.1,
      });
    } catch {
      slide.addImage({
        path: barcodeUrl,
        x: 1.05,
        y: 2.62,
        w: 1.1,
        h: 1.1,
      });
    }
  }

  slide.addShape(ppt.ShapeType.rect, {
    x: 0.12,
    y: 3.63,
    w: 2.96,
    h: 0.25,
    fill: { color: black },
    line: { color: black, pt: 0 },
  });

  slide.addText("Chic&Holland", {
    x: 0.24,
    y: 3.72,
    w: 1.2,
    h: 0.06,
    fontFace: "Arial",
    fontSize: 5.5,
    color: "FFFFFF",
    margin: 0,
  });

  slide.addText(
    new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }),
    {
      x: 1.76,
      y: 3.72,
      w: 1.2,
      h: 0.06,
      fontFace: "Arial",
      fontSize: 5.5,
      color: "FFFFFF",
      align: "right",
      margin: 0,
    },
  );

  await ppt.writeFile({ fileName: `${fileName}.pptx` });
}
