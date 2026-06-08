import pptxgen from "pptxgenjs";
import { build2dBarcodeUrl, normalizeBarcodeValue } from "@/lib/barcodes";
import { formatDateOnlyDisplay } from "@/lib/dateOnly";
import {
  formatEuSizeSummary,
  formatEuSizeText,
  PDF_DISPLAY_SIZE_UNIT,
} from "@/lib/sizeConversion";
import { fresh } from "@/lib/utils";

type DownloadOrderPPTOptions = {
  showShippingDate?: boolean;
};

const COLORS = {
  pink: "FF5698",
  titlePink: "FFD1E6",
  lightPink: "FFE6F2",
  white: "FFFFFF",
  black: "000000",
  blue: "0000FF",
  comments: "F9F9F9",
  grayText: "444444",
  lightBorder: "D4D4D8",
};

const SLIDE = {
  w: 11.69,
  h: 8.27,
  padX: 0.28,
  padY: 0.14,
};

const CONTENT = {
  x: SLIDE.padX,
  y: SLIDE.padY,
  w: SLIDE.w - SLIDE.padX * 2,
  h: SLIDE.h - SLIDE.padY * 2,
};

const BANNER = {
  x: CONTENT.x,
  y: CONTENT.y,
  w: CONTENT.w,
  h: 0.78,
};

const COLUMN = {
  contentY: BANNER.y + BANNER.h + 0.14,
  leftW: CONTENT.w * 0.62,
  rightW: CONTENT.w * 0.38,
};

const LEFT = {
  x: CONTENT.x,
  y: COLUMN.contentY + 0.14,
  w: COLUMN.leftW - 0.11,
};

const RIGHT = {
  x: CONTENT.x + COLUMN.leftW + 0.11,
  y: COLUMN.contentY + 0.14,
  w: COLUMN.rightW - 0.11,
  imageH: 5.83,
};

const VARIANT = {
  x: CONTENT.x + COLUMN.leftW + 0.22,
  y: CONTENT.y + 50 / 72 + 4 / 72 + 7 / 72,
  w: COLUMN.rightW - 0.33,
  cardH: 156 / 72,
};

const DEFAULT_TEXT = {
  fontFace: "Arial",
  color: COLORS.black,
  margin: 0,
};

const formatText = (value: unknown) => String(value ?? "").trim() || "-";

const chunkItems = <T,>(items: T[], size: number) => {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
};

const normalizeImages = (images: unknown) => {
  if (!Array.isArray(images)) return [];
  return images.filter(Boolean) as string[];
};

const buildGroupKey = (item: any) =>
  JSON.stringify([
    item.styleNo ?? "",
    item.color ?? "",
    item.meshColor ?? "",
    item.beadingColor ?? "",
    item.lining ?? "",
    item.liningColor ?? "",
    item.comments ?? "",
    item.image ?? "",
    PDF_DISPLAY_SIZE_UNIT,
    normalizeImages(item.refImg).join("|"),
  ]);

const buildGroupedPages = (details: any[] = []) => {
  const groupedDetails = new Map<string, any[]>();

  details.forEach((item) => {
    const groupKey = buildGroupKey(item);
    const existingItems = groupedDetails.get(groupKey) ?? [];
    existingItems.push(item);
    groupedDetails.set(groupKey, existingItems);
  });

  return Array.from(groupedDetails.values()).flatMap((groupItems) => {
    const pages = chunkItems(groupItems, 4);

    return pages.map((variants) => ({
      baseItem: groupItems[0],
      groupItems,
      variants,
    }));
  });
};

const getGroupQuantity = (items: any[]) =>
  items.reduce((total, item) => {
    const quantity = Number(item.quantity);
    return total + (Number.isFinite(quantity) ? quantity : 0);
  }, 0);

const getSizeSummary = (items: any[]) =>
  formatEuSizeSummary(items, { alwaysShowCount: true });

const parseCommentItems = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.flatMap(parseCommentItems);
  }

  const text = String(value ?? "").trim();
  if (!text) return [];

  const items: string[] = [];
  let current = "";

  for (let index = 0; index < text.length; index += 1) {
    if (text[index] !== ",") {
      current += text[index];
      continue;
    }

    if (text[index + 1] === ",") {
      current += ",";
      index += 1;
      continue;
    }

    const trimmed = current.trim();
    if (trimmed) items.push(trimmed);
    current = "";
  }

  const trimmed = current.trim();
  if (trimmed) items.push(trimmed);

  return items;
};

const getCommentItems = (variants: any[], fallback?: string) => {
  const uniqueComments = Array.from(
    new Set(
      variants
        .flatMap((item) => parseCommentItems(item.comments))
        .filter(Boolean),
    ),
  );

  return uniqueComments.length ? uniqueComments : parseCommentItems(fallback);
};

const getDynamicFontSize = (text: string): number => {
  const length = text?.length ?? 0;
  if (length <= 10) return 26;
  if (length <= 15) return 24;
  if (length <= 20) return 22;
  if (length <= 28) return 20;
  if (length <= 36) return 18;
  return 7;
};

const getReferenceImages = (variants: any[]) =>
  Array.from(new Set(variants.flatMap((item) => normalizeImages(item.refImg))));

const getBarcodeDisplayText = (barcode: string) => {
  const [firstPart, ...remainingParts] = barcode.split("-");

  if (!remainingParts.length) return barcode;

  return `${firstPart}\n-${remainingParts.join("-")}`;
};

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

const noLine = (color: string) => ({ color, pt: 0 });

const addRect = (
  slide: any,
  ppt: any,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  line = noLine(fill),
) => {
  slide.addShape(ppt.ShapeType.rect, {
    x,
    y,
    w,
    h,
    fill: { color: fill },
    line,
  });
};

const addText = (slide: any, text: unknown, options: Record<string, unknown>) => {
  slide.addText(formatText(text), {
    ...DEFAULT_TEXT,
    fit: "shrink",
    ...options,
  });
};

const addCell = (
  slide: any,
  ppt: any,
  text: unknown,
  {
    x,
    y,
    w,
    h,
    fill,
    color = COLORS.black,
    bold = false,
    fontSize = 13,
    align = "left",
    valign = "middle",
    paddingX = 0.06,
  }: {
    x: number;
    y: number;
    w: number;
    h: number;
    fill: string;
    color?: string;
    bold?: boolean;
    fontSize?: number;
    align?: string;
    valign?: string;
    paddingX?: number;
  },
) => {
  addRect(slide, ppt, x, y, w, h, fill);
  addText(slide, text, {
    x: x + paddingX,
    y: y + 0.04,
    w: Math.max(w - paddingX * 2, 0.1),
    h: Math.max(h - 0.08, 0.1),
    fontSize,
    bold,
    color,
    align,
    valign,
    wrap: true,
  });
};

const addHeader = (
  slide: any,
  ppt: any,
  orderData: any,
  baseItem: any,
  showShippingDate: boolean,
) => {
  addRect(slide, ppt, BANNER.x, BANNER.y, BANNER.w, BANNER.h, COLORS.pink);

  addText(slide, baseItem?.styleNo, {
    x: BANNER.x + 0.14,
    y: BANNER.y + 0.25,
    w: 2.7,
    h: 0.26,
    fontSize: 25,
    bold: true,
  });

  addText(slide, orderData?.purchaseOrderNo, {
    x: BANNER.x + 3.1,
    y: BANNER.y + 0.21,
    w: 4.1,
    h: 0.34,
    fontSize: getDynamicFontSize(String(orderData?.purchaseOrderNo ?? "")),
    bold: true,
    align: "center",
  });

  let dateText =
    `Order Received Date: ` +
    formatDateOnlyDisplay(orderData?.orderReceivedDate);

  if (showShippingDate && orderData?.orderCancellationDate) {
    dateText +=
      `\nOrder Shipping Date: ` +
      formatDateOnlyDisplay(orderData.orderCancellationDate);
  }

  slide.addText(dateText, {
    ...DEFAULT_TEXT,
    x: BANNER.x + 7.35,
    y: BANNER.y + 0.16,
    w: 3.55,
    h: 0.52,
    fontSize: 14,
    bold: true,
    align: "right",
    valign: "middle",
    fit: "shrink",
    breakLine: false,
    margin: 0,
  });
};

const addProductTable = (
  slide: any,
  ppt: any,
  orderData: any,
  baseItem: any,
  variants: any[],
) => {
  const tableX = LEFT.x;
  const tableY = LEFT.y;
  const tableW = LEFT.w;
  const titleH = 0.34;
  const rowH = 0.36;
  const leftSectionW = tableW * 0.4;
  const rightSectionW = tableW * 0.6;
  const leftHeaderW = leftSectionW * 0.4;
  const leftDataW = leftSectionW * 0.6;
  const rightHeaderW = rightSectionW * 0.4;
  const rightDataW = rightSectionW * 0.6;

  addRect(slide, ppt, tableX, tableY, tableW, titleH, COLORS.titlePink);
  addText(slide, "Product Specifications", {
    x: tableX + 0.06,
    y: tableY + 0.08,
    w: tableW - 1.6,
    h: 0.16,
    fontSize: 14,
    bold: true,
  });
  addText(
    slide,
    orderData?.orderType === "Fresh" ? fresh : orderData?.orderType,
    {
      x: tableX + tableW - 1.55,
      y: tableY + 0.08,
      w: 1.45,
      h: 0.16,
      fontSize: 14,
      bold: true,
      color: COLORS.blue,
      align: "center",
    },
  );

  const row1Y = tableY + titleH;
  addCell(slide, ppt, "Color", {
    x: tableX,
    y: row1Y,
    w: leftHeaderW,
    h: rowH,
    fill: COLORS.pink,
    color: COLORS.white,
    bold: true,
    fontSize: 15,
  });
  addCell(slide, ppt, baseItem?.color, {
    x: tableX + leftHeaderW,
    y: row1Y,
    w: leftDataW,
    h: rowH,
    fill: COLORS.lightPink,
  });
  addCell(slide, ppt, "Mesh Color", {
    x: tableX + leftSectionW,
    y: row1Y,
    w: rightHeaderW,
    h: rowH,
    fill: COLORS.pink,
    color: COLORS.white,
    bold: true,
    fontSize: 15,
  });
  addCell(slide, ppt, baseItem?.meshColor, {
    x: tableX + leftSectionW + rightHeaderW,
    y: row1Y,
    w: rightDataW,
    h: rowH,
    fill: COLORS.lightPink,
  });

  const row2Y = row1Y + rowH;
  addCell(slide, ppt, "Quantity", {
    x: tableX,
    y: row2Y,
    w: leftHeaderW,
    h: rowH,
    fill: COLORS.pink,
    color: COLORS.white,
    bold: true,
    fontSize: 15,
  });
  addCell(slide, ppt, getGroupQuantity(variants), {
    x: tableX + leftHeaderW,
    y: row2Y,
    w: leftDataW,
    h: rowH,
    fill: COLORS.lightPink,
  });
  addCell(slide, ppt, "Beading Color", {
    x: tableX + leftSectionW,
    y: row2Y,
    w: rightHeaderW,
    h: rowH,
    fill: COLORS.pink,
    color: COLORS.white,
    bold: true,
    fontSize: 15,
  });
  addCell(slide, ppt, baseItem?.beadingColor, {
    x: tableX + leftSectionW + rightHeaderW,
    y: row2Y,
    w: rightDataW,
    h: rowH,
    fill: COLORS.lightPink,
  });

  const mergedY = row2Y + rowH;
  addCell(slide, ppt, `Size (${PDF_DISPLAY_SIZE_UNIT})`, {
    x: tableX,
    y: mergedY,
    w: leftHeaderW,
    h: rowH * 2,
    fill: COLORS.pink,
    color: COLORS.white,
    bold: true,
    fontSize: 15,
  });
  addCell(slide, ppt, getSizeSummary(variants), {
    x: tableX + leftHeaderW,
    y: mergedY,
    w: leftDataW,
    h: rowH * 2,
    fill: COLORS.lightPink,
  });
  addCell(slide, ppt, "Lining Color", {
    x: tableX + leftSectionW,
    y: mergedY,
    w: rightHeaderW,
    h: rowH,
    fill: COLORS.pink,
    color: COLORS.white,
    bold: true,
    fontSize: 15,
  });
  addCell(slide, ppt, baseItem?.liningColor, {
    x: tableX + leftSectionW + rightHeaderW,
    y: mergedY,
    w: rightDataW,
    h: rowH,
    fill: COLORS.lightPink,
  });
  addCell(slide, ppt, "Lining", {
    x: tableX + leftSectionW,
    y: mergedY + rowH,
    w: rightHeaderW,
    h: rowH,
    fill: COLORS.pink,
    color: COLORS.white,
    bold: true,
    fontSize: 15,
  });
  addCell(slide, ppt, baseItem?.lining, {
    x: tableX + leftSectionW + rightHeaderW,
    y: mergedY + rowH,
    w: rightDataW,
    h: rowH,
    fill: COLORS.lightPink,
  });

  return {
    bottomY: mergedY + rowH * 2,
  };
};

const addComments = (
  slide: any,
  ppt: any,
  baseItem: any,
  variants: any[],
  startY: number,
) => {
  const comments = getCommentItems(variants, baseItem?.comments);
  const commentsText = comments.length
    ? comments.map((comment) => `\u2022 ${comment}`).join("\n")
    : "-";
  const titleY = startY + 0.28;
  const boxY = titleY + 0.33;

  addText(slide, "Customization Details", {
    x: LEFT.x,
    y: titleY,
    w: LEFT.w,
    h: 0.2,
    fontSize: 14,
    bold: true,
    underline: true,
    color: COLORS.pink,
  });

  addRect(slide, ppt, LEFT.x, boxY, LEFT.w, 0.9, COLORS.comments);
  slide.addText(commentsText, {
    ...DEFAULT_TEXT,
    x: LEFT.x + 0.11,
    y: boxY + 0.11,
    w: LEFT.w - 0.22,
    h: 0.68,
    fontSize: 12,
    color: COLORS.black,
    wrap: true,
    fit: "shrink",
    breakLine: false,
    margin: 0,
  });
};

const addReferenceImages = (slide: any, images: string[]) => {
  const imageW = LEFT.w * 0.48;
  const imageH = 145 / 72;
  const imageY = SLIDE.h - SLIDE.padY - imageH;
  const imageGap = LEFT.w * 0.02;

  images.slice(0, 2).forEach((imgSrc, imgIndex) => {
    slide.addImage({
      data: imgSrc,
      x: LEFT.x + imgIndex * (imageW + imageGap),
      y: imageY,
      w: imageW,
      h: imageH,
    });
  });
};

const addMainImage = (slide: any, ppt: any, baseItem: any) => {
  if (baseItem?.image) {
    slide.addImage({
      data: baseItem.image,
      x: RIGHT.x,
      y: RIGHT.y,
      w: RIGHT.w,
      h: RIGHT.imageH,
    });
    return;
  }

  addRect(slide, ppt, RIGHT.x, RIGHT.y, RIGHT.w, RIGHT.imageH, COLORS.white);
  addText(slide, "Product image unavailable", {
    x: RIGHT.x + 0.35,
    y: RIGHT.y + RIGHT.imageH / 2 - 0.12,
    w: RIGHT.w - 0.7,
    h: 0.24,
    fontSize: 11,
    color: "666666",
    align: "center",
  });
};

const addBarcodeImage = async (
  slide: any,
  barcodeUrl: string,
  x: number,
  y: number,
  size: number,
) => {
  try {
    const barcodeData = await loadImageDataUrl(barcodeUrl);
    slide.addImage({ data: barcodeData, x, y, w: size, h: size });
  } catch {
    slide.addImage({ path: barcodeUrl, x, y, w: size, h: size });
  }
};

const addVariantCards = async (slide: any, ppt: any, variants: any[]) => {
  const cardGap = VARIANT.w * 0.01333;
  const cardW = VARIANT.w * 0.24;

  for (const [variantIndex, variant] of variants.entries()) {
    const cardX = VARIANT.x + variantIndex * (cardW + cardGap);
    const cardY = VARIANT.y;
    const normalizedBarcode = normalizeBarcodeValue(variant?.barcode);
    const barcodeUrl = build2dBarcodeUrl(normalizedBarcode, 80);
    const infoX = cardX + 0.07;
    const infoY = cardY + 0.36;
    const infoW = cardW - 0.14;
    const qrSize = 36 / 72;
    const qrX = cardX + (cardW - qrSize) / 2;
    const qrY = cardY + 1.42;
    const shapeType = ppt.ShapeType.roundRect ?? ppt.ShapeType.rect;

    slide.addShape(shapeType, {
      x: cardX,
      y: cardY,
      w: cardW,
      h: VARIANT.cardH,
      fill: { color: COLORS.white },
      line: { color: COLORS.black, pt: 1 },
      radius: 0.06,
    });

    addText(slide, variant?.styleNo, {
      x: cardX + 0.05,
      y: cardY + 0.1,
      w: cardW - 0.1,
      h: 0.13,
      fontSize: 9.5,
      bold: true,
      align: "center",
    });

    slide.addShape(shapeType, {
      x: infoX,
      y: infoY,
      w: infoW,
      h: 0.88,
      fill: { color: COLORS.white },
      line: { color: COLORS.lightBorder, pt: 1 },
      radius: 0.04,
    });

    addText(slide, `Size: ${formatEuSizeText(variant)}`, {
      x: infoX + 0.03,
      y: infoY + 0.04,
      w: infoW - 0.06,
      h: 0.16,
      fontSize: 7,
      bold: true,
      color: COLORS.grayText,
      wrap: true,
    });

    addRect(
      slide,
      ppt,
      infoX,
      infoY + 0.24,
      infoW,
      0.01,
      COLORS.lightBorder,
      noLine(COLORS.lightBorder),
    );
    addText(slide, "QTY:", {
      x: infoX + 0.03,
      y: infoY + 0.29,
      w: 0.27,
      h: 0.1,
      fontSize: 7,
      bold: true,
      color: COLORS.grayText,
    });
    addText(slide, variant?.quantity, {
      x: infoX + 0.34,
      y: infoY + 0.29,
      w: infoW - 0.37,
      h: 0.1,
      fontSize: 7,
      color: COLORS.grayText,
    });

    addRect(
      slide,
      ppt,
      infoX,
      infoY + 0.48,
      infoW,
      0.01,
      COLORS.lightBorder,
      noLine(COLORS.lightBorder),
    );
    addText(slide, "Color:", {
      x: infoX + 0.03,
      y: infoY + 0.53,
      w: infoW - 0.06,
      h: 0.1,
      fontSize: 7,
      bold: true,
      color: COLORS.grayText,
    });

    addRect(
      slide,
      ppt,
      infoX,
      infoY + 0.68,
      infoW,
      0.01,
      COLORS.lightBorder,
      noLine(COLORS.lightBorder),
    );
    slide.addText(
      [variant?.color, variant?.meshColor]
        .map((value) => String(value ?? "").trim())
        .filter(Boolean)
        .join("\n") || "-",
      {
        ...DEFAULT_TEXT,
        x: infoX + 0.03,
        y: infoY + 0.72,
        w: infoW - 0.06,
        h: 0.2,
        fontSize: 7,
        color: COLORS.grayText,
        fit: "shrink",
        breakLine: false,
        margin: 0,
      },
    );

    addRect(
      slide,
      ppt,
      cardX,
      cardY + 1.33,
      cardW,
      0.01,
      COLORS.lightBorder,
      noLine(COLORS.lightBorder),
    );

    if (normalizedBarcode && barcodeUrl) {
      await addBarcodeImage(slide, barcodeUrl, qrX, qrY, qrSize);
      slide.addText(getBarcodeDisplayText(normalizedBarcode), {
        ...DEFAULT_TEXT,
        x: cardX + 0.04,
        y: cardY + 1.95,
        w: cardW - 0.08,
        h: 0.14,
        fontSize: 6.5,
        color: COLORS.black,
        align: "center",
        fit: "shrink",
        breakLine: false,
        margin: 0,
      });
    } else {
      addText(slide, "Barcode unavailable", {
        x: cardX + 0.06,
        y: cardY + 1.62,
        w: cardW - 0.12,
        h: 0.18,
        fontSize: 6.5,
        align: "center",
      });
    }
  }
};

export async function downloadOrderPPT(
  orderData: any,
  options: DownloadOrderPPTOptions = {},
) {
  const ppt = new pptxgen();
  const showShippingDate = options.showShippingDate ?? true;
  const groupedPages = buildGroupedPages(orderData?.details ?? []);

  ppt.defineLayout({ name: "A4-Landscape", width: SLIDE.w, height: SLIDE.h });
  ppt.layout = "A4-Landscape";
  ppt.author = "Chic&Holland";
  ppt.subject = "Order preview";
  ppt.title = `${formatText(orderData?.purchaseOrderNo)} order preview`;
  ppt.company = "Chic&Holland";

  for (const { baseItem, groupItems, variants } of groupedPages) {
    const slide = ppt.addSlide();
    const referenceImages = getReferenceImages(groupItems);

    slide.background = { color: COLORS.white };

    addHeader(slide, ppt, orderData, baseItem, showShippingDate);
    const table = addProductTable(slide, ppt, orderData, baseItem, variants);
    addComments(slide, ppt, baseItem, variants, table.bottomY);
    addReferenceImages(slide, referenceImages);
    addMainImage(slide, ppt, baseItem);
    await addVariantCards(slide, ppt, variants);
  }

  await ppt.writeFile({
    fileName: `${formatText(orderData?.purchaseOrderNo)}.pptx`,
  });
}
