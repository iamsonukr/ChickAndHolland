const getTextLength = (text?: string | null) => String(text ?? "").length;

export const getStyleNoBannerFontSize = (text?: string | null): number => {
  const length = getTextLength(text);
  if (length <= 10) return 25;
  if (length <= 14) return 22;
  if (length <= 18) return 19;
  if (length <= 24) return 16;
  if (length <= 32) return 12;
  if (length <= 44) return 9;
  return 7;
};

export const getStyleNoCardFontSize = (text?: string | null): number => {
  const length = getTextLength(text);
  if (length <= 14) return 9.5;
  if (length <= 20) return 8;
  if (length <= 28) return 6.5;
  return 5.5;
};

export const getQrBoxSizeFontSize = (text?: string | null): number => {
  const length = getTextLength(text);
  if (length <= 8) return 7;
  if (length <= 14) return 6.2;
  if (length <= 20) return 5.4;
  if (length <= 28) return 4.6;
  return 4;
};
