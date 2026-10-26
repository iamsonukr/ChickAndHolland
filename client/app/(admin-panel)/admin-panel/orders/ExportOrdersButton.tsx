"use client";

import { useState } from "react";
import { Download, Filter } from "lucide-react";
import JSZip from "jszip";
import * as XLSX from "xlsx-js-style";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { API_URL } from "@/lib/constants";
import { getCookie } from "@/lib/utils";
import { useItems } from "./Delete";
import { formatDateOnly, formatDateOnlyDisplay } from "@/lib/dateOnly";

if (typeof window !== "undefined") {
  (window as any).JSZip = JSZip;
}

type ExportOrdersButtonProps = {
  query?: string;
  orderType?: string;
  stage?: string;
  due?: string;
  beader?: string;
  dateFrom?: string;
  dateTo?: string;
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
const ORDER_EXPORT_FONT_SIZE = 16;
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
  "Order Received Date",
  "Order Cancellation Date",
];

const FILTERED_EXPORT_COLUMNS = [
  "Store Name",
  "PO#",
  "Order Status",
  "Order Date",
  "Cancellation Date",
  "Total Quantity",
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
  const sourceColumn =
    column === "Order Date" ? "Order Received Date" :
    column === "Cancellation Date" ? "Order Cancellation Date" :
    column === "PO#" ? "PO Number" : column;
  const value = column === "Order Status"
    ? row?.["Order Status"] ?? row?.["Product Status"]
    : row?.[sourceColumn];

  if (
    sourceColumn === "Order Received Date" ||
    sourceColumn === "Order Cancellation Date"
  ) {
    return formatDateOnlyDisplay(value, "DD-MM-YYYY");
  }

  if (column === "Beader") {
    const beader = String(value ?? "").trim();
    return beader && beader.toLowerCase() !== "unknown" ? beader : "NA";
  }

  return value ?? "";
};

const normalizeExportRows = (rows: any[], columns = ORDER_EXPORT_COLUMNS) =>
  rows.map((row) =>
    columns.reduce<Record<string, unknown>>(
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

const buildExportTitle = (
  filters: {
    query?: string;
    orderType?: string;
    stage?: string;
    due?: string;
    beader?: string;
  },
  currentStatus?: string,
) => `${buildExportStatusName(filters, currentStatus)}-${formatExportDate()}`;

const buildExportFileName = (
  filters: {
    query?: string;
    orderType?: string;
    stage?: string;
    due?: string;
    beader?: string;
  },
  currentStatus?: string,
) =>
  `${sanitizeDisplayFilePart(buildExportTitle(filters, currentStatus))}.xlsx`;

const buildWorksheet = (rows: any[], title: string, columns = ORDER_EXPORT_COLUMNS) => {
  const normalizedRows = normalizeExportRows(rows, columns);
  const titleRow = columns.map((_, index) =>
    index === 0 ? title : "",
  );
  const totalQuantity = normalizedRows.reduce((total, row) => {
    const quantity = Number(row.Quantity);
    return total + (Number.isFinite(quantity) ? quantity : 0);
  }, 0);
  const totalRow = columns.map((column) => {
    if (column === "Style No") return "Total";
    if (column === "Quantity") return totalQuantity;
    return "";
  });
  const worksheet = XLSX.utils.aoa_to_sheet(
    [
      [],
      titleRow,
      [],
      columns,
      ...normalizedRows.map((row) =>
        columns.map((column) => row[column] ?? ""),
      ),
      ...(columns.includes("Quantity") ? [totalRow] : []),
    ],
    { sheetStubs: true },
  );

  worksheet["!merges"] = [
    {
      s: { r: ORDER_EXPORT_TITLE_ROW, c: 0 },
      e: { r: ORDER_EXPORT_TITLE_ROW, c: columns.length - 1 },
    },
  ];
  worksheet["!autofilter"] = {
    ref: XLSX.utils.encode_range({
      s: { r: ORDER_EXPORT_HEADER_ROW, c: 0 },
      e: {
        r: ORDER_EXPORT_HEADER_ROW + normalizedRows.length,
        c: columns.length - 1,
      },
    }),
  };

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

const getColumnWidths = (worksheet: XLSX.WorkSheet, range: XLSX.Range, columns = ORDER_EXPORT_COLUMNS) =>
  columns.map((columnName, column) => {
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

const getRowHeight = (
  worksheet: XLSX.WorkSheet,
  range: XLSX.Range,
  row: number,
) => {
  let maxLineCount = 1;

  for (let column = range.s.c; column <= range.e.c; column += 1) {
    const cell = worksheet[XLSX.utils.encode_cell({ r: row, c: column })];
    maxLineCount = Math.max(
      maxLineCount,
      getCellDisplayMetrics(cell?.v).lineCount,
    );
  }

  return Math.max(
    ORDER_EXPORT_DATA_ROW_HEIGHT,
    maxLineCount * ORDER_EXPORT_LINE_HEIGHT,
  );
};

const styleWorksheet = (worksheet: XLSX.WorkSheet, columns = ORDER_EXPORT_COLUMNS) => {
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

      const isTotalRow = columns.includes("Quantity") && row === range.e.r;

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

  const columnWidths = getColumnWidths(worksheet, range, columns);
  worksheet["!cols"] = columnWidths;
  worksheet["!rows"] = Array.from({ length: range.e.r + 1 }, (_, row) => ({
    hpt:
      row === ORDER_EXPORT_TITLE_ROW
        ? 24
        : ORDER_EXPORT_BLANK_ROWS.has(row)
          ? 12
          : row === ORDER_EXPORT_HEADER_ROW
            ? 26
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
  dateFrom,
  dateTo,
  rows: providedRows,
  fileName,
  buttonLabel = "Export Orders",
  emptyMessage = "No products found for the current filters",
  successMessage = "Orders exported successfully",
  currentStatus,
}: ExportOrdersButtonProps) {
  const [exporting, setExporting] = useState(false);
  const [open, setOpen] = useState(false);
  const emptyFilters = {
    store: "",
    customer: "",
    po: "",
    orderFrom: "",
    orderTo: "",
    cancellationFrom: "",
    cancellationTo: "",
  };
  const [filters, setFilters] = useState(emptyFilters);
  const { items: selectedOrders } = useItems();
  const shouldExportSelectedOrders = !providedRows && selectedOrders.length > 0;

  const handleExport = async (useFilters = false) => {
    const activeFilters = useFilters ? filters : emptyFilters;
    if (
      (activeFilters.orderFrom &&
        activeFilters.orderTo &&
        activeFilters.orderFrom > activeFilters.orderTo) ||
      (activeFilters.cancellationFrom &&
        activeFilters.cancellationTo &&
        activeFilters.cancellationFrom > activeFilters.cancellationTo)
    ) {
      toast.error("From date must be on or before the To date");
      return;
    }
    setExporting(true);

    try {
      const params = new URLSearchParams();
      if (query) params.set("query", query);
      if (orderType && orderType !== "All") params.set("orderType", orderType);
      if (stage) params.set("stage", stage);
      if (due) params.set("due", due);
      if (beader) params.set("beader", beader);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      if (useFilters) params.set("summary", "true");

      let rows = providedRows;

      if (!rows) {
        const response = await fetch(
          `${API_URL}/orders/export-products?${params.toString()}`,
          {
            method: "POST",
            body: JSON.stringify({
              selectedOrders: shouldExportSelectedOrders
                ? selectedOrders
                : undefined,
            }),
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${
                getCookie("token") || localStorage.getItem("token") || ""
              }`,
            },
          },
        );
        const responseText = await response.text();
        let json;
        try {
          json = JSON.parse(responseText);
        } catch {
          throw new Error(
            `Unable to export orders (HTTP ${response.status}). Please try again.`,
          );
        }

        if (!response.ok || !json.success) {
          throw new Error(
            json.message || json.msg || "Failed to export orders",
          );
        }

        rows = Array.isArray(json.data) ? json.data : [];
      }

      const contains = (value: unknown, search: string) =>
        String(value ?? "")
          .toLowerCase()
          .includes(search.trim().toLowerCase());
      const inRange = (value: unknown, from: string, to: string) => {
        if (!from && !to) return true;
        const date = formatDateOnly(value);
        return Boolean(date) && (!from || date >= from) && (!to || date <= to);
      };
      const exportRows = (Array.isArray(rows) ? rows : []).filter(
        (row) =>
          contains(row["Store Name"], activeFilters.store) &&
          contains(row["Customer Name"], activeFilters.customer) &&
          contains(row["PO Number"], activeFilters.po) &&
          inRange(
            row["Order Received Date"],
            activeFilters.orderFrom,
            activeFilters.orderTo,
          ) &&
          inRange(
            row["Order Cancellation Date"],
            activeFilters.cancellationFrom,
            activeFilters.cancellationTo,
          ),
      );

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
      const columns = useFilters ? FILTERED_EXPORT_COLUMNS : ORDER_EXPORT_COLUMNS;
      const worksheet = buildWorksheet(
        exportRows,
        buildExportTitle(exportFilters, currentStatus),
        columns,
      );
      styleWorksheet(worksheet, columns);

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
      setOpen(false);
      toast.success(
        shouldExportSelectedOrders
          ? `Selected orders exported successfully`
          : successMessage,
      );
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to export orders");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={exporting}
          className="gap-2"
          onClick={() => void handleExport()}
        >
          <Download className="h-4 w-4" />
          {exporting
            ? "Exporting..."
            : shouldExportSelectedOrders
              ? `Export Selected (${selectedOrders.length})`
              : buttonLabel}
        </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button type="button" variant="outline" disabled={exporting} className="gap-2">
            <Filter className="h-4 w-4" />
            Filter & Export Excel
          </Button>
        </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Export orders to Excel</DialogTitle>
          <DialogDescription>
            Filter by store, customer, PO number, or date range. Blank fields
            include all matches. Current order filters and selection also apply.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            void handleExport(true);
          }}
        >
          {(
            [
              ["store", "Store Name", "text"],
              ["customer", "Customer Name", "text"],
              ["po", "PO#", "text"],
              ["orderFrom", "Order Date From", "date"],
              ["orderTo", "Order Date To", "date"],
              ["cancellationFrom", "Cancellation Date From", "date"],
              ["cancellationTo", "Cancellation Date To", "date"],
            ] as const
          ).map(([key, label, type]) => (
            <div key={key} className="grid gap-2">
              <Label htmlFor={`export-${key}`}>{label}</Label>
              <Input
                id={`export-${key}`}
                type={type}
                value={filters[key]}
                disabled={exporting}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    [key]: event.target.value,
                  }))
                }
              />
            </div>
          ))}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={exporting}
              onClick={() => setFilters(emptyFilters)}
            >
              Clear filters
            </Button>
            <Button type="submit" disabled={exporting}>
              {exporting ? "Exporting..." : "Download Excel"}
            </Button>
          </div>
        </form>
      </DialogContent>
      </Dialog>
    </div>
  );
}
