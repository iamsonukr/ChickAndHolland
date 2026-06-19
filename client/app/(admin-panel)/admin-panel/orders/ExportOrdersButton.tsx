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
};

const buildExportFileName = () => {
  const date = new Date().toISOString().slice(0, 10);
  return `all-orders-products-${date}.xlsx`;
};

const styleWorksheet = (worksheet: XLSX.WorkSheet) => {
  const ref = worksheet["!ref"];
  if (!ref) return;

  const range = XLSX.utils.decode_range(ref);

  for (let column = range.s.c; column <= range.e.c; column += 1) {
    const cell = worksheet[XLSX.utils.encode_cell({ r: 0, c: column })];
    if (!cell) continue;

    cell.s = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "1F2937" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      },
    };
  }

  for (let row = 1; row <= range.e.r; row += 1) {
    for (let column = range.s.c; column <= range.e.c; column += 1) {
      const cell = worksheet[XLSX.utils.encode_cell({ r: row, c: column })];
      if (!cell) continue;

      cell.s = {
        fill: { fgColor: { rgb: row % 2 === 0 ? "F9FAFB" : "FFFFFF" } },
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
  worksheet["!freeze"] = { xSplit: 0, ySplit: 1 };
};

export default function ExportOrdersButton({
  query,
  orderType,
  stage,
  due,
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

      const rows = Array.isArray(json.data) ? json.data : [];
      if (!rows.length) {
        toast.error("No products found for the current filters");
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(rows);
      styleWorksheet(worksheet);

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Order Products");
      XLSX.writeFile(workbook, buildExportFileName());
      toast.success("Orders exported successfully");
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
      {exporting ? "Exporting..." : "Export Orders"}
    </Button>
  );
}
