const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const getStatusLabelPurchaseOrderNo = (item: any) =>
  String(item?.purchaseOrderNo ?? item?.purchaeOrderNo ?? "").trim() || "-";

export const getResponsiveStatusLabelFontSize = (
  value: unknown,
  {
    availableWidth,
    maxFontSize,
    minFontSize,
    averageCharWidth = 0.56,
  }: {
    availableWidth: number;
    maxFontSize: number;
    minFontSize: number;
    averageCharWidth?: number;
  },
) => {
  const text = String(value ?? "").trim();
  if (!text) return maxFontSize;

  const estimatedFontSize = availableWidth / (text.length * averageCharWidth);
  return Number(clamp(estimatedFontSize, minFontSize, maxFontSize).toFixed(1));
};
