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
  rows?: Record<string, unknown>[];
  fileName?: string;
  buttonLabel?: string;
  emptyMessage?: string;
  successMessage?: string;
};

const ORDER_EXPORT_DEFAULT_TITLE = "Pattern Status";
const ORDER_EXPORT_TITLE_FILL = "F4CCCC";
const ORDER_EXPORT_TITLE_FONT = "990000";
const ORDER_EXPORT_HEADER_FILL = "1F4E78";
const ORDER_EXPORT_FONT_SIZE = 14;
const ORDER_EXPORT_TITLE_ROW = 0;
const ORDER_EXPORT_HEADER_ROW = 1;
const ORDER_EXPORT_DATA_START_ROW = 2;

const ORDER_EXPORT_COLUMNS = [
  "Style No",
  "Size",
  "Quantity",
  "Color",
  "PO Number",
  "Beader",
  "Product Status",
];

const ORDER_EXPORT_COLUMN_LAYOUT: Record<
  string,
  { min: number; max: number; align: "left" | "center" }
> = {
  "Style No": { min: 11, max: 14, align: "left" },
  Size: { min: 5, max: 10, align: "center" },
  Quantity: { min: 5, max: 10, align: "center" },
  Color: { min: 11, max: 26, align: "left" },
  "PO Number": { min: 18, max: 30, align: "left" },
  Beader: { min: 12, max: 17, align: "left" },
  "Product Status": { min: 14, max: 20, align: "left" },
};

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
}: {
  query?: string;
  orderType?: string;
  stage?: string;
  due?: string;
}) => {
  if (stage) return withPendingLabel(stage).toUpperCase();

  const filterParts = [
    orderType && orderType !== "All" ? orderType : "",
    getDueDisplayLabel(due),
    query,
  ].filter(Boolean);

  return filterParts.join(" ").trim().toUpperCase();
};

const buildExportTitle = (filters: {
  query?: string;
  orderType?: string;
  stage?: string;
  due?: string;
}) => {
  const filterName = buildExportFilterDisplayName(filters);
  return filterName ? `${filterName} - Status` : ORDER_EXPORT_DEFAULT_TITLE;
};

const buildExportFileName = (filters: {
  query?: string;
  orderType?: string;
  stage?: string;
  due?: string;
}) => {
  const filterName =
    sanitizeDisplayFilePart(buildExportFilterDisplayName(filters)) ||
    "all-orders";

  return `${filterName}-${formatExportDate()}.xlsx`;
};

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
      titleRow,
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

const getCellDisplayLength = (value: unknown) =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim().length;

const getColumnWidths = (worksheet: XLSX.WorkSheet, range: XLSX.Range) =>
  ORDER_EXPORT_COLUMNS.map((columnName, column) => {
    const layout = ORDER_EXPORT_COLUMN_LAYOUT[columnName];
    let longestValue = columnName.length;

    for (let row = ORDER_EXPORT_DATA_START_ROW; row <= range.e.r; row += 1) {
      const cell = worksheet[XLSX.utils.encode_cell({ r: row, c: column })];
      longestValue = Math.max(longestValue, getCellDisplayLength(cell?.v));
    }

    return {
      wch: Math.min(Math.max(longestValue + 1, layout.min), layout.max),
    };
  });

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
      if (row === ORDER_EXPORT_TITLE_ROW || row === ORDER_EXPORT_HEADER_ROW) {
        continue;
      }

      const columnName = ORDER_EXPORT_COLUMNS[column];
      const isTotalRow = row === range.e.r;
      const horizontal =
        isTotalRow && columnName !== "Style No"
          ? "center"
          : (ORDER_EXPORT_COLUMN_LAYOUT[columnName]?.align ?? "left");

      cell.s = {
        font: { sz: ORDER_EXPORT_FONT_SIZE, bold: isTotalRow },
        fill: {
          patternType: "solid",
          fgColor: { rgb: row % 2 === 0 ? "FFFFFF" : "F9FAFB" },
        },
        alignment: { vertical: "center", horizontal },
        border: {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        },
      };
    }
  }

  worksheet["!cols"] = getColumnWidths(worksheet, range);
  worksheet["!rows"] = Array.from({ length: range.e.r + 1 }, (_, row) => ({
    hpt:
      row === ORDER_EXPORT_TITLE_ROW
        ? 24
        : row === ORDER_EXPORT_HEADER_ROW
          ? 21
          : 21,
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
  rows: providedRows,
  fileName,
  buttonLabel = "Export Orders",
  emptyMessage = "No products found for the current filters",
  successMessage = "Orders exported successfully",
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
      };
      const worksheet = buildWorksheet(
        exportRows,
        buildExportTitle(exportFilters),
      );
      styleWorksheet(worksheet);

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Order Products");
      XLSX.writeFile(workbook, fileName ?? buildExportFileName(exportFilters));
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
