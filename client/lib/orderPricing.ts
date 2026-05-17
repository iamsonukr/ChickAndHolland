"use client";

export type CustomSizeQuantity = {
  size?: string | number | null;
  quantity?: string | number | null;
};

export type PriceCurrency = {
  currencyId?: string | number | null;
  currencyCode?: string | null;
  currencyName?: string | null;
  currencySymbol?: string | null;
};

export type StylePricing = {
  baseUnitPrice: number;
  unitPrice: number;
  subtotal: number;
  discount: number;
  total: number;
  quantity: number;
  markupPercent: number;
};

const toNumber = (value: unknown) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
};

export const getRetailerSizeMarkup = (size: unknown) => {
  const numericSize = toNumber(size);

  if (numericSize >= 58) return 1.6;
  if (numericSize >= 54) return 1.4;
  if (numericSize >= 50) return 1.2;

  return 1;
};

export const calculateRetailerStylePricing = ({
  basePrice,
  size,
  quantity,
  customSizesQuantity,
}: {
  basePrice: unknown;
  size?: unknown;
  quantity?: unknown;
  customSizesQuantity?: CustomSizeQuantity[];
}): StylePricing => {
  const baseUnitPrice = toNumber(basePrice);
  const customItems = Array.isArray(customSizesQuantity)
    ? customSizesQuantity.filter((item) => toNumber(item?.quantity) > 0)
    : [];

  const variants =
    customItems.length > 0
      ? customItems.map((item) => {
          const itemQuantity = toNumber(item.quantity);
          const markup = getRetailerSizeMarkup(item.size);
          const unitPrice = baseUnitPrice * markup;

          return {
            quantity: itemQuantity,
            markup,
            unitPrice,
            lineTotal: unitPrice * itemQuantity,
          };
        })
      : [
          {
            quantity: toNumber(quantity),
            markup: getRetailerSizeMarkup(size),
            unitPrice: baseUnitPrice * getRetailerSizeMarkup(size),
            lineTotal:
              baseUnitPrice * getRetailerSizeMarkup(size) * toNumber(quantity),
          },
        ];

  const subtotal = variants.reduce((sum, item) => sum + item.lineTotal, 0);
  const quantityTotal = variants.reduce((sum, item) => sum + item.quantity, 0);
  const largestMarkup = variants.reduce(
    (max, item) => Math.max(max, item.markup),
    1,
  );
  const discount = 0;

  return {
    baseUnitPrice,
    unitPrice: variants[0]?.unitPrice ?? baseUnitPrice,
    subtotal,
    discount,
    total: subtotal - discount,
    quantity: quantityTotal,
    markupPercent: Math.round((largestMarkup - 1) * 100),
  };
};

export const resolveProductCurrencyPrice = (
  product: any,
  currencyId?: string | number | null,
) => {
  const pricing = Array.isArray(product?.currencyPricing)
    ? product.currencyPricing.find((item: any) => {
        const itemCurrencyId = item?.currency?.id ?? item?.currencyId;
        return (
          currencyId != null && String(itemCurrencyId) === String(currencyId)
        );
      })
    : null;

  const currency = pricing?.currency ?? product?.currencyPricing?.currency;

  return {
    amount: toNumber(pricing?.price ?? product?.regionPrice ?? product?.price),
    currencyId: currency?.id ?? pricing?.currencyId ?? currencyId ?? null,
    currencyCode:
      currency?.code ?? pricing?.currencyCode ?? product?.currencyCode ?? "EUR",
    currencyName: currency?.name ?? pricing?.currencyName ?? null,
    currencySymbol:
      currency?.symbol ??
      pricing?.currencySymbol ??
      product?.currencySymbol ??
      "\u20ac",
  };
};

export const formatOrderCurrency = (
  value: unknown,
  currencyCode?: string | null,
  currencySymbol?: string | null,
) => {
  const amount = toNumber(value);

  try {
    return Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode || "EUR",
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currencySymbol || currencyCode || "\u20ac"} ${Intl.NumberFormat(
      "en-US",
      {
        maximumFractionDigits: 2,
      },
    ).format(amount)}`;
  }
};
