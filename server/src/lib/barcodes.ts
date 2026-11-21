const INVALID_BARCODE_VALUES = new Set(["N/A", "NA", "NULL", "UNDEFINED"]);

export const normalizeBarcodeValue = (barcode?: string | null) => {
  let normalizedBarcode = String(barcode ?? "").trim();

  try {
    const url = new URL(normalizedBarcode);
    if ((url.protocol === "https:" || url.protocol === "http:") && url.pathname.replace(/\/+$/, "") === "/qr") {
      normalizedBarcode = (url.searchParams.get("code") ?? "").trim();
    }
  } catch {
    // Existing printed labels contain the raw barcode.
  }

  if (!normalizedBarcode) return "";
  if (INVALID_BARCODE_VALUES.has(normalizedBarcode.toUpperCase())) {
    return "";
  }

  return normalizedBarcode;
};

export const buildBarcodeScanUrl = (barcode?: string | null) => {
  const code = normalizeBarcodeValue(barcode);
  if (!code) return "";
  const url = new URL("/qr", process.env.NEXT_PUBLIC_BASE_URL || process.env.CLIENT_URL || "https://chicandholland.com");
  url.searchParams.set("code", code);
  return url.toString();
};

export const build2dBarcodeUrl = (
  barcode?: string | null,
  size = 160,
) => {
  const normalizedBarcode = normalizeBarcodeValue(barcode);

  if (!normalizedBarcode) return "";

  const params = new URLSearchParams({
    size: `${size}x${size}`,
    data: buildBarcodeScanUrl(normalizedBarcode),
    margin: "0",
    format: "png",
  });

  return `https://api.qrserver.com/v1/create-qr-code/?${params.toString()}`;
};

export const buildPdf2dBarcodeUrl = (barcode?: string | null) =>
  build2dBarcodeUrl(barcode, 1000);
