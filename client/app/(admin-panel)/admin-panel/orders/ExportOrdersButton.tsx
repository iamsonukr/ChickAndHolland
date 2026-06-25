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

const ORDER_EXPORT_COLUMNS = [
  "Style No",
  "Size",
  "Quantity",
  "Color",
  "PO Number",
  "Beader",
  "Product Status",
];

const normalizeExportRows = (rows: any[]) =>
  rows.map((row) =>
    ORDER_EXPORT_COLUMNS.reduce<Record<string, unknown>>((exportRow, column) => {
      exportRow[column] = row?.[column] ?? "";
      return exportRow;
    }, {}),
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
  const blankRow = Array.from({ length: ORDER_EXPORT_COLUMNS.length }, () => "");
  const titleRow = [title, ...blankRow.slice(1)];
  const totalQuantity = normalizedRows.reduce((total, row) => {
    const quantity = Number(row.Quantity);
    return total + (Number.isFinite(quantity) ? quantity : 0);
  }, 0);
  const totalRow = ORDER_EXPORT_COLUMNS.map((column) => {
    if (column === "Style No") return "Total";
    if (column === "Quantity") return totalQuantity;
    return "";
  });
  const worksheet = XLSX.utils.aoa_to_sheet([
    blankRow,
    titleRow,
    blankRow,
    ORDER_EXPORT_COLUMNS,
    ...normalizedRows.map((row) =>
      ORDER_EXPORT_COLUMNS.map((column) => row[column] ?? ""),
    ),
    totalRow,
  ], { sheetStubs: true });

  worksheet["!merges"] = [
    {
      s: { r: 1, c: 0 },
      e: { r: 1, c: ORDER_EXPORT_COLUMNS.length - 1 },
    },
  ];

  return worksheet;
};

const styleWorksheet = (worksheet: XLSX.WorkSheet) => {
  const ref = worksheet["!ref"];
  if (!ref) return;

  const range = XLSX.utils.decode_range(ref);

  const titleStyle = {
    font: { bold: true, color: { rgb: ORDER_EXPORT_TITLE_FONT }, sz: 14 },
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
    const titleCell = worksheet[XLSX.utils.encode_cell({ r: 1, c: column })];
    if (!titleCell) continue;
    titleCell.s = titleStyle;
  }

  const titleCell = worksheet[XLSX.utils.encode_cell({ r: 1, c: 0 })];
  if (titleCell) {
    titleCell.s = {
      ...titleStyle,
      alignment: { horizontal: "center", vertical: "center" },
    };
  }

  for (let column = range.s.c; column <= range.e.c; column += 1) {
    const cell = worksheet[XLSX.utils.encode_cell({ r: 3, c: column })];
    if (!cell) continue;

    cell.s = {
      font: { bold: true, color: { rgb: "FFFFFF" }, sz: 14 },
      fill: { patternType: "solid", fgColor: { rgb: ORDER_EXPORT_HEADER_FILL } },
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
      if (row === 0 || row === 1 || row === 2 || row === 3) continue;

      cell.s = {
        font: { sz: 14, bold: row === range.e.r },
        fill: {
          patternType: "solid",
          fgColor: { rgb: row % 2 === 0 ? "FFFFFF" : "F9FAFB" },
        },
        alignment: { vertical: "center", horizontal: row === range.e.r ? "center" : "left" },
        border: {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        },
      };
    }
  }

  worksheet["!cols"] = Array.from({ length: range.e.c + 1 }, (_, column) => ({
    wch: column < 8 ? 18 : 22,
  }));
  worksheet["!rows"] = Array.from({ length: range.e.r + 1 }, (_, row) => ({
    hpt: row === 1 ? 24 : 21,
  }));
  worksheet["!freeze"] = { xSplit: 0, ySplit: 4 };
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
          throw new Error(json.message || json.msg || "Failed to export orders");
        }

        rows = Array.isArray(json.data) ? json.data : [];
      }

      if (!rows.length) {
        toast.error(emptyMessage);
        return;
      }

      const exportFilters = {
        query,
        orderType,
        stage,
        due,
      };
      const worksheet = buildWorksheet(rows, buildExportTitle(exportFilters));
      styleWorksheet(worksheet);

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Order Products");
      XLSX.writeFile(
        workbook,
        fileName ?? buildExportFileName(exportFilters),
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
