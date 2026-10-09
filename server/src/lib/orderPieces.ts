import { getRetailerSizeMarkup, parseCustomSizesQuantity } from "./orderPricing";

const pieceCount = (value: unknown) => {
  const count = Number(value);
  if (!Number.isInteger(count) || count <= 0) {
    throw new Error("Quantity must be a positive whole number for every style/size");
  }
  return count;
};

export const expandOrderStylePieces = (style: any): any[] => {
  const sizes = parseCustomSizesQuantity(style.customSizesQuantity);
  if (sizes.length) {
    return sizes.flatMap((row) => {
      const size = String(row.size ?? "").trim();
      if (!size) throw new Error("Size is required for every size/quantity entry");
      return Array.from({ length: pieceCount(row.quantity) }, () => ({
        ...style, size, quantity: 1,
        customSize: JSON.stringify([]), customSizesQuantity: JSON.stringify([]),
      }));
    });
  }
  return Array.from({ length: pieceCount(style.quantity) }, () => ({ ...style, quantity: 1 }));
};

// Allocate stored amounts by the existing size markups, preserving every cent.
const allocateAmount = (value: unknown, weights: number[]): Array<number | null> => {
  if (value == null) return weights.map(() => null);
  const cents = Math.round(Number(value) * 100);
  if (!Number.isFinite(cents)) throw new Error("Invalid stored order price");
  const sum = weights.reduce((a, b) => a + b, 0);
  const exact = weights.map(w => Math.abs(cents) * w / sum);
  const allocated = exact.map(Math.floor);
  const remainder = Math.abs(cents) - allocated.reduce((a, b) => a + b, 0);
  const ranked = exact.map((v, i) => ({ i, fraction: v - allocated[i] }))
    .sort((a, b) => b.fraction - a.fraction || a.i - b.i);
  for (let i = 0; i < remainder; i++) allocated[ranked[i].i]++;
  return allocated.map(v => v * Math.sign(cents) / 100);
};

export const buildPiecePricing = (style: any, pieces: any[]) => {
  const weights = pieces.map(p => getRetailerSizeMarkup(p.size));
  const subtotals = allocateAmount(style.subtotal, weights);
  const discounts = allocateAmount(style.discount ?? 0, weights);
  const totals = allocateAmount(style.totalPrice, weights);
  const consistentTotal = style.subtotal != null && style.totalPrice != null &&
    Math.round(Number(style.subtotal) * 100) - Math.round(Number(style.discount ?? 0) * 100) ===
      Math.round(Number(style.totalPrice) * 100);
  return pieces.map((_, i) => ({
    unitPrice: subtotals[i] ?? (style.unitPrice == null ? null :
      Math.round(Number(style.unitPrice) / weights[0] * weights[i] * 100) / 100),
    subtotal: subtotals[i],
    discount: discounts[i] ?? 0,
    totalPrice: consistentTotal
      ? Math.round((Number(subtotals[i]) - Number(discounts[i])) * 100) / 100
      : totals[i],
  }));
};
