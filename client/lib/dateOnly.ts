import dayjs from "dayjs";

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})/;
const ORDER_DATE_FIELD_NAMES = new Set([
  "orderReceivedDate",
  "orderCancellationDate",
  "received_date",
]);

const pad2 = (value: number) => String(value).padStart(2, "0");

export function formatDateOnly(value: unknown): string {
  if (!value) return "";

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "";

    return `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(
      value.getDate(),
    )}`;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    const dateOnlyMatch = trimmed.match(DATE_ONLY_PATTERN);
    if (dateOnlyMatch) {
      return `${dateOnlyMatch[1]}-${dateOnlyMatch[2]}-${dateOnlyMatch[3]}`;
    }

    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? "" : formatDateOnly(parsed);
  }

  return "";
}

export function parseDateOnly(value: unknown): Date | undefined {
  if (!value) return undefined;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    const dateOnlyMatch = trimmed.match(DATE_ONLY_PATTERN);
    if (dateOnlyMatch) {
      return new Date(
        Number(dateOnlyMatch[1]),
        Number(dateOnlyMatch[2]) - 1,
        Number(dateOnlyMatch[3]),
      );
    }
  }

  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export function formatDateOnlyDisplay(
  value: unknown,
  displayFormat = "DD MMM YYYY",
) {
  const dateOnly = formatDateOnly(value);
  return dateOnly ? dayjs(dateOnly).format(displayFormat) : "";
}

export function normalizeOrderDatePayload<T>(value: T, key = ""): T {
  if (ORDER_DATE_FIELD_NAMES.has(key)) {
    const dateOnly = formatDateOnly(value);
    return (dateOnly || value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeOrderDatePayload(item)) as T;
  }

  if (
    value &&
    typeof value === "object" &&
    !(value instanceof Date) &&
    !(typeof File !== "undefined" && value instanceof File) &&
    !(typeof Blob !== "undefined" && value instanceof Blob)
  ) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([entryKey, entryValue]) => [
        entryKey,
        normalizeOrderDatePayload(entryValue, entryKey),
      ]),
    ) as T;
  }

  return value;
}
