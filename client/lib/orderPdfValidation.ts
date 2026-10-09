import { normalizeBarcodeValue } from "./barcodes";

export const assertPdfPieceDetails = (details: any[]) => {
  if (!Array.isArray(details) || details.length === 0) {
    throw new Error("No order pieces available for PDF generation");
  }
  const barcodes = new Set<string>();
  for (const detail of details) {
    const barcode = normalizeBarcodeValue(detail?.barcode);
    let sizes = detail?.customSizesQuantity ?? [];
    if (typeof sizes === "string") {
      try { sizes = JSON.parse(sizes); } catch { sizes = []; }
    }
    if (Number(detail?.quantity) !== 1 ||
        Array.isArray(sizes) && (sizes.length > 1 || sizes.some(s => Number(s.quantity) !== 1))) {
      throw new Error("PDF requires one detail per piece. Reload the order to regenerate its QR codes.");
    }
    if (!barcode || barcodes.has(barcode)) {
      throw new Error("PDF requires a unique saved barcode for every piece. Reload the order before sending.");
    }
    barcodes.add(barcode);
  }
};
