const INVALID_BARCODE_VALUES = new Set(["N/A", "NA", "NULL", "UNDEFINED"]);

export const normalizeBarcodeValue = (barcode?: string | null) => {
  const normalizedBarcode = String(barcode ?? "").trim();

  if (!normalizedBarcode) return "";
  if (INVALID_BARCODE_VALUES.has(normalizedBarcode.toUpperCase())) {
    return "";
  }

  return normalizedBarcode;
};

export const build2dBarcodeUrl = (
  barcode?: string | null,
  size = 160,
) => {
  const normalizedBarcode = normalizeBarcodeValue(barcode);

  if (!normalizedBarcode) return "";

  const params = new URLSearchParams({
    size: `${size}x${size}`,
    data: normalizedBarcode,
    margin: "0",
    format: "png",
  });

  return `https://api.qrserver.com/v1/create-qr-code/?${params.toString()}`;
};
