"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import JSZip from "jszip";
import * as XLSX from "xlsx-js-style";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { API_URL } from "@/lib/constants";
import { getCookie } from "@/lib/utils";

if (typeof window !== "undefined") {
  (window as any).JSZip = JSZip;
}

type ExportOrdersButtonProps = {
  query?: string;
  orderType?: string;
  stage?: string;
  due?: string;
  beader?: string;
  rows?: Record<string, unknown>[];
  fileName?: string;
  buttonLabel?: string;
  emptyMessage?: string;
  successMessage?: string;
  currentStatus?: string;
};

const ORDER_EXPORT_DEFAULT_TITLE = "All Orders";
const ORDER_EXPORT_TITLE_FILL = "F4CCCC";
const ORDER_EXPORT_TITLE_FONT = "990000";
const ORDER_EXPORT_HEADER_FILL = "1F4E78";
const ORDER_EXPORT_FONT_SIZE = 14;
const ORDER_EXPORT_BLANK_ROWS = new Set([0, 2]);
const ORDER_EXPORT_TITLE_ROW = 1;
const ORDER_EXPORT_HEADER_ROW = 3;
const ORDER_EXPORT_DATA_START_ROW = 4;
const ORDER_EXPORT_COLUMN_PADDING = 8;
const ORDER_EXPORT_WIDTH_SCALE = 1.2;
const ORDER_EXPORT_DATA_ROW_HEIGHT = 24;
const ORDER_EXPORT_LINE_HEIGHT = 18;

const ORDER_EXPORT_COLUMNS = [
  "Style No",
  "Size",
  "Quantity",
  "Color",
  "PO Number",
  "Beader",
  "Product Status",
];

const ORDER_EXPORT_PRINT_MARGINS = {
  left: 0.25,
  right: 0.25,
  top: 0.35,
  bottom: 0.35,
  header: 0.15,
  footer: 0.15,
};

const getExportCellValue = (row: any, column: string) => {
  const value = row?.[column];

  if (column === "Beader") {
    const beader = String(value ?? "").trim();
    return beader && beader.toLowerCase() !== "unknown" ? beader : "NA";
  }

  return value ?? "";
};

const normalizeExportRows = (rows: any[]) =>
  rows.map((row) =>
    ORDER_EXPORT_COLUMNS.reduce<Record<string, unknown>>(
      (exportRow, column) => {
        exportRow[column] = getExportCellValue(row, column);
        return exportRow;
      },
      {},
    ),
  );

const formatExportDate = () => {
  const date = new Date();
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
};

const sanitizeDisplayFilePart = (value: string) =>
  value
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

const sanitizeWorksheetName = (value: string) => {
  const sheetName = sanitizeDisplayFilePart(value)
    .replace(/[\[\]]/g, "-")
    .slice(0, 31)
    .trim();

  return sheetName || "Export";
};

const getDueDisplayLabel = (due?: string) => {
  if (due === "lt14") return "Due Within 14 Days";
  if (due === "lt28") return "Due Within 28 Days";
  if (due === "shipped") return "Shipped";
  return due;
};

const withPendingLabel = (value?: string) => {
  const label = String(value || "").trim();
  if (!label) return "";
  if (/pending/i.test(label) || /shipped/i.test(label)) return label;
  return `${label} Pending`;
};

const buildExportFilterDisplayName = ({
  query,
  orderType,
  stage,
  due,
  beader,
}: {
  query?: string;
  orderType?: string;
  stage?: string;
  due?: string;
  beader?: string;
}) => {
  if (stage) return withPendingLabel(stage).toUpperCase();

  const filterParts = [
    orderType && orderType !== "All" ? orderType : "",
    getDueDisplayLabel(due),
    beader,
    query,
  ].filter(Boolean);

  return filterParts.join(" ").trim().toUpperCase();
};

const buildExportStatusName = (
  filters: {
    query?: string;
    orderType?: string;
    stage?: string;
    due?: string;
    beader?: string;
  },
  currentStatus?: string,
) => {
  const explicitStatus = String(currentStatus || "").trim();
  if (explicitStatus) return explicitStatus.toUpperCase();

  return (
    buildExportFilterDisplayName(filters) || ORDER_EXPORT_DEFAULT_TITLE
  ).toUpperCase();
};

const buildExportTitle = (filters: {
  query?: string;
  orderType?: string;
  stage?: string;
  due?: string;
  beader?: string;
}, currentStatus?: string) =>
  `${buildExportStatusName(filters, currentStatus)}-${formatExportDate()}`;

const buildExportFileName = (filters: {
  query?: string;
  orderType?: string;
  stage?: string;
  due?: string;
  beader?: string;
}, currentStatus?: string) =>
  `${sanitizeDisplayFilePart(
    buildExportTitle(filters, currentStatus),
  )}.xlsx`;

const buildWorksheet = (rows: any[], title: string) => {
  const normalizedRows = normalizeExportRows(rows);
  const titleRow = ORDER_EXPORT_COLUMNS.map((_, index) =>
    index === 0 ? title : "",
  );
  const totalQuantity = normalizedRows.reduce((total, row) => {
    const quantity = Number(row.Quantity);
    return total + (Number.isFinite(quantity) ? quantity : 0);
  }, 0);
  const totalRow = ORDER_EXPORT_COLUMNS.map((column) => {
    if (column === "Style No") return "Total";
    if (column === "Quantity") return totalQuantity;
    return "";
  });
  const worksheet = XLSX.utils.aoa_to_sheet(
    [
      [],
      titleRow,
      [],
      ORDER_EXPORT_COLUMNS,
      ...normalizedRows.map((row) =>
        ORDER_EXPORT_COLUMNS.map((column) => row[column] ?? ""),
      ),
      totalRow,
    ],
    { sheetStubs: true },
  );

  worksheet["!merges"] = [
    {
      s: { r: ORDER_EXPORT_TITLE_ROW, c: 0 },
      e: { r: ORDER_EXPORT_TITLE_ROW, c: ORDER_EXPORT_COLUMNS.length - 1 },
    },
  ];

  return worksheet;
};

const getCellDisplayMetrics = (value: unknown) => {
  const lines = String(value ?? "")
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim());

  return {
    lineCount: Math.max(lines.length, 1),
    maxLineLength: Math.max(...lines.map((line) => line.length), 0),
  };
};

const getPaddedColumnWidth = (contentLength: number) =>
  Math.ceil(contentLength * ORDER_EXPORT_WIDTH_SCALE) +
  ORDER_EXPORT_COLUMN_PADDING;

const getColumnWidths = (worksheet: XLSX.WorkSheet, range: XLSX.Range) =>
  ORDER_EXPORT_COLUMNS.map((columnName, column) => {
    let longestValue = columnName.length;

    for (let row = ORDER_EXPORT_DATA_START_ROW; row <= range.e.r; row += 1) {
      const cell = worksheet[XLSX.utils.encode_cell({ r: row, c: column })];
      longestValue = Math.max(
        longestValue,
        getCellDisplayMetrics(cell?.v).maxLineLength,
      );
    }

    return {
      wch: getPaddedColumnWidth(longestValue),
    };
  });

const getRowHeight = (worksheet: XLSX.WorkSheet, range: XLSX.Range, row: number) => {
  let maxLineCount = 1;

  for (let column = range.s.c; column <= range.e.c; column += 1) {
    const cell = worksheet[XLSX.utils.encode_cell({ r: row, c: column })];
    maxLineCount = Math.max(maxLineCount, getCellDisplayMetrics(cell?.v).lineCount);
  }

  return Math.max(ORDER_EXPORT_DATA_ROW_HEIGHT, maxLineCount * ORDER_EXPORT_LINE_HEIGHT);
};

const styleWorksheet = (worksheet: XLSX.WorkSheet) => {
  const ref = worksheet["!ref"];
  if (!ref) return;

  const range = XLSX.utils.decode_range(ref);

  const titleStyle = {
    font: {
      bold: true,
      color: { rgb: ORDER_EXPORT_TITLE_FONT },
      sz: ORDER_EXPORT_FONT_SIZE,
    },
    fill: { patternType: "solid", fgColor: { rgb: ORDER_EXPORT_TITLE_FILL } },
    alignment: { horizontal: "center", vertical: "center" },
    border: {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    },
  };

  for (let column = range.s.c; column <= range.e.c; column += 1) {
    const titleCell =
      worksheet[
        XLSX.utils.encode_cell({ r: ORDER_EXPORT_TITLE_ROW, c: column })
      ];
    if (!titleCell) continue;
    titleCell.s = titleStyle;
  }

  const titleCell =
    worksheet[XLSX.utils.encode_cell({ r: ORDER_EXPORT_TITLE_ROW, c: 0 })];
  if (titleCell) {
    titleCell.s = {
      ...titleStyle,
      alignment: { horizontal: "center", vertical: "center" },
    };
  }

  for (let column = range.s.c; column <= range.e.c; column += 1) {
    const cell =
      worksheet[
        XLSX.utils.encode_cell({ r: ORDER_EXPORT_HEADER_ROW, c: column })
      ];
    if (!cell) continue;

    cell.s = {
      font: {
        bold: true,
        color: { rgb: "FFFFFF" },
        sz: ORDER_EXPORT_FONT_SIZE,
      },
      fill: {
        patternType: "solid",
        fgColor: { rgb: ORDER_EXPORT_HEADER_FILL },
      },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      },
    };
  }

  for (let row = 0; row <= range.e.r; row += 1) {
    for (let column = range.s.c; column <= range.e.c; column += 1) {
      const cell = worksheet[XLSX.utils.encode_cell({ r: row, c: column })];
      if (!cell) continue;
      if (
        ORDER_EXPORT_BLANK_ROWS.has(row) ||
        row === ORDER_EXPORT_TITLE_ROW ||
        row === ORDER_EXPORT_HEADER_ROW
      ) {
        continue;
      }

      const isTotalRow = row === range.e.r;

      cell.s = {
        font: { sz: ORDER_EXPORT_FONT_SIZE, bold: isTotalRow },
        fill: {
          patternType: "solid",
          fgColor: { rgb: row % 2 === 0 ? "FFFFFF" : "F9FAFB" },
        },
        alignment: { vertical: "center", horizontal: "center" },
        border: {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        },
      };
    }
  }

  const columnWidths = getColumnWidths(worksheet, range);
  worksheet["!cols"] = columnWidths;
  worksheet["!rows"] = Array.from({ length: range.e.r + 1 }, (_, row) => ({
    hpt:
      row === ORDER_EXPORT_TITLE_ROW
        ? 24
        : ORDER_EXPORT_BLANK_ROWS.has(row)
          ? 12
        : row === ORDER_EXPORT_HEADER_ROW
          ? 21
          : getRowHeight(worksheet, range, row),
  }));
  worksheet["!freeze"] = { xSplit: 0, ySplit: ORDER_EXPORT_DATA_START_ROW };
  worksheet["!margins"] = ORDER_EXPORT_PRINT_MARGINS;
  worksheet["!pageSetup"] = {
    orientation: "landscape",
    paperSize: 9,
    fitToWidth: 1,
    fitToHeight: 0,
  };
};

export default function ExportOrdersButton({
  query,
  orderType,
  stage,
  due,
  beader,
  rows: providedRows,
  fileName,
  buttonLabel = "Export Orders",
  emptyMessage = "No products found for the current filters",
  successMessage = "Orders exported successfully",
  currentStatus,
}: ExportOrdersButtonProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);

    try {
      const params = new URLSearchParams();
      if (query) params.set("query", query);
      if (orderType && orderType !== "All") params.set("orderType", orderType);
      if (stage) params.set("stage", stage);
      if (due) params.set("due", due);
      if (beader) params.set("beader", beader);

      let rows = providedRows;

      if (!rows) {
        const response = await fetch(
          `${API_URL}/orders/export-products?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${
                getCookie("token") || localStorage.getItem("token") || ""
              }`,
            },
          },
        );
        const json = await response.json();

        if (!response.ok || !json.success) {
          throw new Error(
            json.message || json.msg || "Failed to export orders",
          );
        }

        rows = Array.isArray(json.data) ? json.data : [];
      }

      const exportRows = Array.isArray(rows) ? rows : [];

      if (!exportRows.length) {
        toast.error(emptyMessage);
        return;
      }

      const exportFilters = {
        query,
        orderType,
        stage,
        due,
        beader,
      };
      const worksheet = buildWorksheet(
        exportRows,
        buildExportTitle(exportFilters, currentStatus),
      );
      styleWorksheet(worksheet);

      const workbook = XLSX.utils.book_new();
      const exportTitle = buildExportTitle(exportFilters, currentStatus);
      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        sanitizeWorksheetName(exportTitle),
      );
      XLSX.writeFile(
        workbook,
        fileName ?? buildExportFileName(exportFilters, currentStatus),
      );
      toast.success(successMessage);
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to export orders");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleExport}
      disabled={exporting}
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      {exporting ? "Exporting..." : buttonLabel}
    </Button>
  );
}
