import dayjs from "dayjs";

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})/;
const JS_DATE_STRING_PATTERN =
  /^[A-Za-z]{3}\s+([A-Za-z]{3})\s+(\d{1,2})\s+(\d{4})/;

const MONTH_INDEX: Record<string, string> = {
  Jan: "01",
  Feb: "02",
  Mar: "03",
  Apr: "04",
  May: "05",
  Jun: "06",
  Jul: "07",
  Aug: "08",
  Sep: "09",
  Oct: "10",
  Nov: "11",
  Dec: "12",
};

const pad2 = (value: number | string) => String(value).padStart(2, "0");

export function formatDateOnly(value: unknown): string | null {
  if (!value) return null;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;

    return `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(
      value.getDate(),
    )}`;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed || trimmed.toLowerCase() === "null") return null;

    const dateOnlyMatch = trimmed.match(DATE_ONLY_PATTERN);
    if (dateOnlyMatch) {
      return `${dateOnlyMatch[1]}-${dateOnlyMatch[2]}-${dateOnlyMatch[3]}`;
    }

    const jsDateMatch = trimmed.match(JS_DATE_STRING_PATTERN);
    if (jsDateMatch) {
      const month = MONTH_INDEX[jsDateMatch[1]];
      if (month) {
        return `${jsDateMatch[3]}-${month}-${pad2(jsDateMatch[2])}`;
      }
    }

    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : formatDateOnly(parsed);
  }

  return null;
}

export function parseDateOnly(value: unknown): Date | null {
  const dateOnly = formatDateOnly(value);
  if (!dateOnly) return null;

  const [year, month, day] = dateOnly.split("-").map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

export function formatDateOnlyDisplay(
  value: unknown,
  displayFormat = "DD MMM YYYY",
) {
  const dateOnly = formatDateOnly(value);
  return dateOnly ? dayjs(dateOnly).format(displayFormat) : "";
}
