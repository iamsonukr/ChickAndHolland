export type SupportedSizeUnit = "EU" | "IT" | "UK" | "US";

type SizeChartRow = Record<SupportedSizeUnit, number>;

type EuSizeEntry = {
  size: string;
  count: number | null;
};

type CustomSizeCapableItem = {
  customSize?: unknown;
  customSizesQuantity?: unknown;
  quantity?: unknown;
  size?: unknown;
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
  const normalizedValue = value.trim();

  if (!/^\d+$/.test(normalizedValue)) {
    return null;
  }

  const parsedNumber = Number.parseInt(normalizedValue, 10);
  return Number.isFinite(parsedNumber) ? parsedNumber : null;
};

const sortEuSizes = (
  [leftSize]: [string, number],
  [rightSize]: [string, number],
) => {
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

const parseMaybeArray = (value: unknown): unknown[] => {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];

  const trimmedValue = value.trim();
  if (!trimmedValue) return [];

  try {
    const parsedValue = JSON.parse(trimmedValue);
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [trimmedValue];
  }
};

const getCustomSizeText = (value: unknown) => {
  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim();
  }

  if (value && typeof value === "object") {
    const item = value as Record<string, unknown>;
    return String(item.size ?? item.value ?? item.label ?? "").trim();
  }

  return "";
};

const getPositiveCount = (value: unknown) => {
  const parsedCount = Math.trunc(Number(value));
  return Number.isFinite(parsedCount) && parsedCount > 0 ? parsedCount : null;
};

const mergeSizeEntries = (entries: EuSizeEntry[]) => {
  const mergedEntries = new Map<string, EuSizeEntry>();

  entries.forEach((entry) => {
    const existingEntry = mergedEntries.get(entry.size);

    if (!existingEntry) {
      mergedEntries.set(entry.size, { ...entry });
      return;
    }

    if (existingEntry.count != null || entry.count != null) {
      existingEntry.count = (existingEntry.count ?? 0) + (entry.count ?? 0);
    }
  });

  return Array.from(mergedEntries.values());
};

const isCustomSizeMarker = (value: unknown) => {
  const normalizedValue = String(value ?? "").trim();
  return /^custom(?:\s*\/\s*\d+)?$/i.test(
    stripKnownSizeDecorators(normalizedValue),
  );
};

const uniqueValues = (values: string[]) => Array.from(new Set(values));

const getCustomSizeQuantityEntries = (
  item: CustomSizeCapableItem = {},
): EuSizeEntry[] => {
  if (!isCustomSizeMarker(item.size)) {
    return [];
  }

  const customSizeQuantityEntries = parseMaybeArray(item.customSizesQuantity)
    .map((entry) => ({
      size: getCustomSizeText(entry),
      count:
        entry && typeof entry === "object"
          ? getPositiveCount((entry as Record<string, unknown>).quantity)
          : null,
    }))
    .filter((entry): entry is EuSizeEntry => Boolean(entry.size));

  if (customSizeQuantityEntries.length) {
    return mergeSizeEntries(customSizeQuantityEntries);
  }

  return mergeSizeEntries(
    parseMaybeArray(item.customSize)
      .map((entry): EuSizeEntry => ({
        size: getCustomSizeText(entry),
        count: null,
      }))
      .filter((entry): entry is EuSizeEntry => Boolean(entry.size)),
  );
};

export const getCustomSizeEntries = (item: CustomSizeCapableItem = {}) =>
  uniqueValues(getCustomSizeQuantityEntries(item).map((entry) => entry.size));

const formatCustomSizeEntry = (entry: EuSizeEntry) =>
  entry.count == null
    ? `\u2022 ${entry.size}`
    : `\u2022 ${entry.size}/${entry.count}`;

export const formatCustomSizeBulletList = (
  item: CustomSizeCapableItem = {},
) => {
  const customSizeEntries = getCustomSizeQuantityEntries(item);

  return customSizeEntries.map(formatCustomSizeEntry).join("\n");
};

const getFallbackEuSizeEntries = (item: {
  admin_us_size?: unknown;
  size?: unknown;
  size_country?: unknown;
}) => {
  const adminEuSize = convertToEuSize(
    item.admin_us_size,
    PDF_DISPLAY_SIZE_UNIT,
  );

  if (adminEuSize && adminEuSize.toUpperCase() !== "N/A") {
    return [{ size: adminEuSize, count: null }];
  }

  const convertedSize = convertToEuSize(item.size, item.size_country);
  return convertedSize ? [{ size: convertedSize, count: null }] : [];
};

const parseSizeToken = (
  token: string,
  fallbackUnit?: unknown,
): EuSizeEntry | null => {
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
  const normalizedValue = String(value ?? "")
    .trim()
    .toUpperCase();

  return SUPPORTED_SIZE_UNITS.includes(normalizedValue as SupportedSizeUnit)
    ? (normalizedValue as SupportedSizeUnit)
    : null;
};

export const convertToEuSize = (sizeValue: unknown, unit?: unknown): string => {
  return convertSizeUnit(sizeValue, unit, PDF_DISPLAY_SIZE_UNIT);
};

export const convertSizeUnit = (
  sizeValue: unknown,
  fromUnit?: unknown,
  toUnit?: unknown,
): string => {
  const rawValue = String(sizeValue ?? "").trim();

  if (!rawValue) {
    return "";
  }

  const resolvedFromUnit =
    normalizeSizeUnit(fromUnit) ??
    detectSizeUnitFromText(rawValue) ??
    PDF_DISPLAY_SIZE_UNIT;
  const resolvedToUnit = normalizeSizeUnit(toUnit) ?? PDF_DISPLAY_SIZE_UNIT;
  const normalizedValue = stripKnownSizeDecorators(rawValue);
  const parsedSize = parseSizeNumber(normalizedValue);

  if (parsedSize == null) {
    return normalizedValue;
  }

  if (resolvedFromUnit === resolvedToUnit) {
    return String(parsedSize);
  }

  const matchedRow = SIZE_CHART.find(
    (entry) =>
      entry[resolvedFromUnit] === parsedSize ||
      entry[PDF_DISPLAY_SIZE_UNIT] === parsedSize,
  );
  return matchedRow ? String(matchedRow[resolvedToUnit]) : String(parsedSize);
};

const parseDisplaySizeToken = (
  token: string,
  fromUnit: unknown,
  toUnit: unknown,
) => {
  const trimmedToken = token.trim();

  if (!trimmedToken) {
    return "";
  }

  const quantityMatch = trimmedToken.match(/^(.*?)(?:\s*\/\s*(\d+))$/);
  const rawSizeValue = quantityMatch?.[1]?.trim() ?? trimmedToken;
  const countText = quantityMatch?.[2];
  const size =
    convertSizeUnit(rawSizeValue, fromUnit, toUnit) ||
    stripKnownSizeDecorators(rawSizeValue) ||
    rawSizeValue;

  return countText ? `${size}/${countText}` : size;
};

export const formatSizeTextForUnit = (
  item: {
    customSize?: unknown;
    customSizesQuantity?: unknown;
    size?: unknown;
    size_country?: unknown;
  },
  targetUnit?: unknown,
  options?: { includeUnit?: boolean },
) => {
  const customSizeText = formatCustomSizeBulletList(item);

  if (customSizeText) {
    return customSizeText;
  }

  const rawSize = String(item.size ?? "").trim();

  if (!rawSize) {
    return "-";
  }

  const resolvedTargetUnit =
    normalizeSizeUnit(targetUnit) ??
    normalizeSizeUnit(item.size_country) ??
    PDF_DISPLAY_SIZE_UNIT;
  const sizeText = rawSize
    .split(",")
    .map((token) =>
      parseDisplaySizeToken(token, item.size_country, resolvedTargetUnit),
    )
    .filter(Boolean)
    .join(", ");

  if (!sizeText) {
    return "-";
  }

  if (options?.includeUnit === false) {
    return sizeText;
  }

  return `${resolvedTargetUnit} ${sizeText}`;
};

export const formatSizeWithCountryLabel = (
  item: {
    customSize?: unknown;
    customSizesQuantity?: unknown;
    size?: unknown;
    size_country?: unknown;
  },
  targetUnit?: unknown,
) => {
  const resolvedTargetUnit =
    normalizeSizeUnit(targetUnit) ??
    normalizeSizeUnit(item.size_country) ??
    PDF_DISPLAY_SIZE_UNIT;
  const sizeText = formatSizeTextForUnit(item, resolvedTargetUnit, {
    includeUnit: false,
  });

  return sizeText === "-" ? "-" : `${sizeText} (${resolvedTargetUnit})`;
};

export const formatSizeWithEuAndCountryLabel = (
  item: {
    customSize?: unknown;
    customSizesQuantity?: unknown;
    size?: unknown;
    size_country?: unknown;
  },
  targetUnit?: unknown,
) => {
  const resolvedTargetUnit =
    normalizeSizeUnit(targetUnit) ??
    normalizeSizeUnit(item.size_country) ??
    PDF_DISPLAY_SIZE_UNIT;
  const euSizeText = formatSizeTextForUnit(item, PDF_DISPLAY_SIZE_UNIT, {
    includeUnit: false,
  });

  if (euSizeText === "-") {
    return "-";
  }

  const selectedSizeText = formatSizeTextForUnit(item, resolvedTargetUnit, {
    includeUnit: false,
  });

  if (
    resolvedTargetUnit === PDF_DISPLAY_SIZE_UNIT ||
    selectedSizeText === euSizeText
  ) {
    return `${PDF_DISPLAY_SIZE_UNIT} ${euSizeText}`;
  }

  return `${resolvedTargetUnit} ${selectedSizeText}, ${PDF_DISPLAY_SIZE_UNIT} ${euSizeText}`;
};

export const getEuSizeEntries = (
  item: {
    admin_us_size?: unknown;
    customSize?: unknown;
    customSizesQuantity?: unknown;
    size?: unknown;
    size_country?: unknown;
  } = {},
) => {
  if (getCustomSizeEntries(item).length) {
    return [];
  }

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
    customSize?: unknown;
    customSizesQuantity?: unknown;
    size?: unknown;
    size_country?: unknown;
  },
  options?: { includeUnit?: boolean },
) => {
  const customSizeText = formatCustomSizeBulletList(item);

  if (customSizeText) {
    return customSizeText;
  }

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
    customSize?: unknown;
    customSizesQuantity?: unknown;
    quantity?: unknown;
    size?: unknown;
    size_country?: unknown;
  }> = [],
  options?: { alwaysShowCount?: boolean },
) => {
  const sizeCounts = new Map<string, number>();
  const customSizeEntries = mergeSizeEntries(
    items.flatMap((item) => getCustomSizeQuantityEntries(item)),
  );

  items.forEach((item) => {
    if (getCustomSizeEntries(item).length) {
      return;
    }

    const entries = getEuSizeEntries(item);

    if (!entries.length) {
      return;
    }

    if (entries.length === 1 && entries[0].count == null) {
      const quantity = Number(item.quantity);
      const pieceCount =
        Number.isFinite(quantity) && quantity > 0 ? quantity : 1;

      sizeCounts.set(
        entries[0].size,
        (sizeCounts.get(entries[0].size) ?? 0) + pieceCount,
      );
      return;
    }

    entries.forEach((entry) => {
      const pieceCount = entry.count ?? 1;
      sizeCounts.set(
        entry.size,
        (sizeCounts.get(entry.size) ?? 0) + pieceCount,
      );
    });
  });

  const regularSizeSummary = Array.from(sizeCounts.entries())
    .sort(sortEuSizes)
    .map(([size, count]) =>
      options?.alwaysShowCount || count > 1 ? `${size}/${count}` : size,
    )
    .join(", ");
  const customSizeSummary = customSizeEntries
    .map(formatCustomSizeEntry)
    .join("\n");

  return (
    [regularSizeSummary, customSizeSummary].filter(Boolean).join("\n") || "-"
  );
};
