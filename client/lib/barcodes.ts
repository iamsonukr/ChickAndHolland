const INVALID_BARCODE_VALUES = new Set(["N/A", "NA", "NULL", "UNDEFINED"]);

export const normalizeBarcodeValue = (barcode?: string | null) => {
  let normalizedBarcode = String(barcode ?? "").trim();

  // Staff scanners extract the item code without navigating to the public image.
  try {
    const url = new URL(normalizedBarcode);
    if (url.protocol === "https:" || url.protocol === "http:") {
      const pathname = url.pathname.replace(/\/+$/, "");
      if (pathname === "/chic-default-qr.png") {
        normalizedBarcode = (new URLSearchParams(url.hash.slice(1)).get("code") ?? url.searchParams.get("code") ?? "").trim();
      } else if (pathname === "/qr") {
        normalizedBarcode = (url.searchParams.get("code") ?? "").trim();
      }
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
  // Printed labels must never inherit a localhost or another app's base URL.
  const url = new URL("https://chicandholland.com/chic-default-qr.png");
  url.hash = new URLSearchParams({ code }).toString();
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
