export type SupportedSizeUnit = "EU" | "IT" | "UK" | "US";

type SizeChartRow = Record<SupportedSizeUnit, number>;

type EuSizeEntry = {
  size: string;
  count: number | null;
};

const SIZE_CHART: SizeChartRow[] = [
  { EU: 32, IT: 36, UK: 4, US: 0 },
  { EU: 34, IT: 38, UK: 6, US: 2 },
  { EU: 36, IT: 40, UK: 8, US: 4 },
  { EU: 38, IT: 42, UK: 10, US: 6 },
  { EU: 40, IT: 44, UK: 12, US: 8 },
  { EU: 42, IT: 46, UK: 14, US: 10 },
  { EU: 44, IT: 48, UK: 16, US: 12 },
  { EU: 46, IT: 50, UK: 18, US: 14 },
  { EU: 48, IT: 52, UK: 20, US: 16 },
  { EU: 50, IT: 54, UK: 22, US: 18 },
  { EU: 52, IT: 56, UK: 24, US: 20 },
  { EU: 54, IT: 58, UK: 26, US: 22 },
  { EU: 56, IT: 60, UK: 28, US: 24 },
  { EU: 58, IT: 62, UK: 30, US: 26 },
  { EU: 60, IT: 64, UK: 32, US: 28 },
];

const SUPPORTED_SIZE_UNITS: SupportedSizeUnit[] = ["EU", "IT", "UK", "US"];

export const PDF_DISPLAY_SIZE_UNIT: SupportedSizeUnit = "EU";

const stripKnownSizeDecorators = (value: string) =>
  value
    .replace(/^(EU|IT|UK|US)\s*/i, "")
    .replace(/\((EU|IT|UK|US)\)/gi, "")
    .trim();

const detectSizeUnitFromText = (value: string): SupportedSizeUnit | null => {
  const prefixUnit = value.match(/^(EU|IT|UK|US)\b/i)?.[1];

  if (prefixUnit) {
    return normalizeSizeUnit(prefixUnit);
  }

  const parentheticalUnit = value.match(/\((EU|IT|UK|US)\)/i)?.[1];
  return normalizeSizeUnit(parentheticalUnit);
};

const parseSizeNumber = (value: string) => {
  const matchedNumber = value.match(/\d+/)?.[0];

  if (!matchedNumber) {
    return null;
  }

  const parsedNumber = Number.parseInt(matchedNumber, 10);
  return Number.isFinite(parsedNumber) ? parsedNumber : null;
};

const sortEuSizes = ([leftSize]: [string, number], [rightSize]: [string, number]) => {
  const leftNumeric = Number.parseInt(leftSize, 10);
  const rightNumeric = Number.parseInt(rightSize, 10);
  const hasLeftNumeric = Number.isFinite(leftNumeric);
  const hasRightNumeric = Number.isFinite(rightNumeric);

  if (hasLeftNumeric && hasRightNumeric) {
    return leftNumeric - rightNumeric;
  }

  if (hasLeftNumeric) {
    return -1;
  }

  if (hasRightNumeric) {
    return 1;
  }

  return leftSize.localeCompare(rightSize);
};

const formatEuSizeEntry = (entry: EuSizeEntry) =>
  entry.count == null ? entry.size : `${entry.size}/${entry.count}`;

const getFallbackEuSizeEntries = (item: {
  admin_us_size?: unknown;
  size?: unknown;
  size_country?: unknown;
}) => {
  const adminEuSize = convertToEuSize(item.admin_us_size, PDF_DISPLAY_SIZE_UNIT);

  if (adminEuSize && adminEuSize.toUpperCase() !== "N/A") {
    return [{ size: adminEuSize, count: null }];
  }

  const convertedSize = convertToEuSize(item.size, item.size_country);
  return convertedSize ? [{ size: convertedSize, count: null }] : [];
};

const parseSizeToken = (token: string, fallbackUnit?: unknown): EuSizeEntry | null => {
  const trimmedToken = token.trim();

  if (!trimmedToken) {
    return null;
  }

  const quantityMatch = trimmedToken.match(/^(.*?)(?:\s*\/\s*(\d+))$/);
  const rawSizeValue = quantityMatch?.[1]?.trim() ?? trimmedToken;
  const countText = quantityMatch?.[2];
  const euSize = convertToEuSize(rawSizeValue, fallbackUnit);
  const size = euSize || stripKnownSizeDecorators(rawSizeValue) || rawSizeValue;

  if (!size) {
    return null;
  }

  const count = countText ? Number.parseInt(countText, 10) : null;

  return {
    size,
    count: count != null && Number.isFinite(count) ? count : null,
  };
};

export const normalizeSizeUnit = (value: unknown): SupportedSizeUnit | null => {
  const normalizedValue = String(value ?? "").trim().toUpperCase();

  return SUPPORTED_SIZE_UNITS.includes(normalizedValue as SupportedSizeUnit)
    ? (normalizedValue as SupportedSizeUnit)
    : null;
};

export const convertToEuSize = (sizeValue: unknown, unit?: unknown): string => {
  const rawValue = String(sizeValue ?? "").trim();

  if (!rawValue) {
    return "";
  }

  const resolvedUnit = normalizeSizeUnit(unit) ?? detectSizeUnitFromText(rawValue);
  const normalizedValue = stripKnownSizeDecorators(rawValue);
  const parsedSize = parseSizeNumber(normalizedValue);

  if (parsedSize == null) {
    return normalizedValue;
  }

  if (!resolvedUnit || resolvedUnit === PDF_DISPLAY_SIZE_UNIT) {
    return String(parsedSize);
  }

  const matchedRow = SIZE_CHART.find((entry) => entry[resolvedUnit] === parsedSize);
  return matchedRow ? String(matchedRow.EU) : String(parsedSize);
};

export const getEuSizeEntries = (item: {
  admin_us_size?: unknown;
  size?: unknown;
  size_country?: unknown;
} = {}) => {
  const rawSize = String(item.size ?? "").trim();

  if (!rawSize) {
    return getFallbackEuSizeEntries(item);
  }

  const tokens = rawSize
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);

  if (!tokens.length) {
    return getFallbackEuSizeEntries(item);
  }

  const entries = tokens
    .map((token) => parseSizeToken(token, item.size_country))
    .filter((entry): entry is EuSizeEntry => Boolean(entry?.size));

  return entries.length ? entries : getFallbackEuSizeEntries(item);
};

export const formatEuSizeText = (
  item: {
    admin_us_size?: unknown;
    size?: unknown;
    size_country?: unknown;
  },
  options?: { includeUnit?: boolean },
) => {
  const entries = getEuSizeEntries(item);

  if (!entries.length) {
    return "-";
  }

  const sizeText = entries.map(formatEuSizeEntry).join(", ");

  if (options?.includeUnit === false) {
    return sizeText;
  }

  return `${PDF_DISPLAY_SIZE_UNIT} ${sizeText}`;
};

export const formatEuSizeSummary = (
  items: Array<{
    admin_us_size?: unknown;
    quantity?: unknown;
    size?: unknown;
    size_country?: unknown;
  }> = [],
  options?: { alwaysShowCount?: boolean },
) => {
  const sizeCounts = new Map<string, number>();

  items.forEach((item) => {
    const entries = getEuSizeEntries(item);

    if (!entries.length) {
      return;
    }

    if (entries.length === 1 && entries[0].count == null) {
      const quantity = Number(item.quantity);
      const pieceCount = Number.isFinite(quantity) && quantity > 0 ? quantity : 1;

      sizeCounts.set(entries[0].size, (sizeCounts.get(entries[0].size) ?? 0) + pieceCount);
      return;
    }

    entries.forEach((entry) => {
      const pieceCount = entry.count ?? 1;
      sizeCounts.set(entry.size, (sizeCounts.get(entry.size) ?? 0) + pieceCount);
    });
  });

  return Array.from(sizeCounts.entries())
    .sort(sortEuSizes)
    .map(([size, count]) =>
      options?.alwaysShowCount || count > 1 ? `${size}/${count}` : size,
    )
    .join(", ") || "-";
};

export function convertToUSSize(size: any, country: string): string {
  return convertToEuSize(size, country) || "N/A";
}
