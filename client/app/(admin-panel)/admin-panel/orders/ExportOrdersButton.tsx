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

const ORDER_EXPORT_TITLE = "Patttern Status";
const ORDER_EXPORT_HEADER_FILL = "1F4E78";

const ORDER_EXPORT_COLUMNS = [
  "Style No",
  "Size",
  "Quantity",
  "Color",
  "PO Number",
  "Product Status",
];

const normalizeExportRows = (rows: any[]) =>
  rows.map((row) =>
    ORDER_EXPORT_COLUMNS.reduce<Record<string, unknown>>((exportRow, column) => {
      exportRow[column] = row?.[column] ?? "";
      return exportRow;
    }, {}),
  );

const buildExportFileName = () => {
  const date = new Date().toISOString().slice(0, 10);
  return `all-orders-products-${date}.xlsx`;
};

const buildWorksheet = (rows: any[]) => {
  const normalizedRows = normalizeExportRows(rows);
  const worksheet = XLSX.utils.aoa_to_sheet([
    [ORDER_EXPORT_TITLE],
    ORDER_EXPORT_COLUMNS,
    ...normalizedRows.map((row) =>
      ORDER_EXPORT_COLUMNS.map((column) => row[column] ?? ""),
    ),
  ]);

  worksheet["!merges"] = [
    {
      s: { r: 0, c: 0 },
      e: { r: 0, c: ORDER_EXPORT_COLUMNS.length - 1 },
    },
  ];

  return worksheet;
};

const styleWorksheet = (worksheet: XLSX.WorkSheet) => {
  const ref = worksheet["!ref"];
  if (!ref) return;

  const range = XLSX.utils.decode_range(ref);

  const titleCell = worksheet[XLSX.utils.encode_cell({ r: 0, c: 0 })];
  if (titleCell) {
    titleCell.s = {
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

  for (let column = range.s.c; column <= range.e.c; column += 1) {
    const cell = worksheet[XLSX.utils.encode_cell({ r: 1, c: column })];
    if (!cell) continue;

    cell.s = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
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

  for (let row = 2; row <= range.e.r; row += 1) {
    for (let column = range.s.c; column <= range.e.c; column += 1) {
      const cell = worksheet[XLSX.utils.encode_cell({ r: row, c: column })];
      if (!cell) continue;

      cell.s = {
        fill: {
          patternType: "solid",
          fgColor: { rgb: row % 2 === 0 ? "F9FAFB" : "FFFFFF" },
        },
        alignment: { vertical: "center" },
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
  worksheet["!freeze"] = { xSplit: 0, ySplit: 2 };
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

      const worksheet = buildWorksheet(rows);
      styleWorksheet(worksheet);

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Order Products");
      XLSX.writeFile(workbook, fileName ?? buildExportFileName());
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
