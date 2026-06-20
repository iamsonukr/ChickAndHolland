"use client";

import React, { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { Download, FileSpreadsheet, Loader2, Printer } from "lucide-react";
import * as XLSX from "xlsx-js-style";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getApiUrl } from "@/lib/constants";
import { getCookie } from "@/lib/utils";
import StockCatalogPdf from "./StockCatalogPdf";

type StockCatalogButtonsProps = {
  colours: any[];
  query?: string;
};

type CatalogMode = "with-price" | "without-price";
type ExportMode = CatalogMode | "excel-with-price" | "excel-without-price";

const isPdfFriendlyImage = (imageUrl: string) =>
  /\.(jpe?g|png)(?:$|\?)/i.test(imageUrl);

const getFirstImageUrl = (item: any) => {
  const stockImages = Array.isArray(item?.images) ? item.images : [];
  const productImages = Array.isArray(item?.product?.images)
    ? item.product.images
    : [];

  return (
    [...stockImages, ...productImages].find((image: any) => image?.name)?.name ||
    item?.image ||
    ""
  );
};

const convertImageForPdf = async (
  imageUrl: string,
  objectUrls: string[],
) => {
  if (!imageUrl || isPdfFriendlyImage(imageUrl)) return imageUrl;

  try {
    const response = await fetch(
      `${getApiUrl("image-to-jpeg")}?imageUrl=${encodeURIComponent(
        imageUrl,
      )}&convertToJpeg=true`,
    );

    if (!response.ok) return imageUrl;

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    objectUrls.push(objectUrl);

    return objectUrl;
  } catch {
    return imageUrl;
  }
};

const downloadBlob = (blob: Blob, fileName: string) => {
  const downloadUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = downloadUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 3000);
};

const buildExcelFileName = (showPrice: boolean) => {
  const date = new Date().toISOString().slice(0, 10);
  return showPrice
    ? `stock-data-with-price-${date}.xlsx`
    : `stock-data-without-price-${date}.xlsx`;
};

const getColourName = (colours: any[] = [], colourValue?: string | null) => {
  if (!colourValue) return "-";
  return (
    colours.find((colour: any) => colour.hexcode === colourValue)?.name ||
    colourValue
  );
};

const getColourLabel = (
  colours: any[] = [],
  colourValue?: string | null,
  defaultColourValue?: string | null,
) => {
  const resolvedName = getColourName(colours, colourValue);

  if (
    colourValue &&
    defaultColourValue &&
    colourValue === defaultColourValue &&
    resolvedName !== "No Color"
  ) {
    return `SAS(${resolvedName})`;
  }

  return resolvedName;
};

const getLiningLabel = (item: any) => {
  const lining = item?.lining || "-";

  if (
    item?.product?.lining &&
    item.product.lining === item.lining &&
    lining !== "No Lining"
  ) {
    return `SAS(${lining})`;
  }

  return lining;
};

const formatPrice = (value: unknown, item: any) => {
  const price = Number(value);
  if (!Number.isFinite(price)) return "";

  const currency =
    item?.currencyCode ||
    (String(item?.currencySymbol ?? "").trim() || "EUR");

  return `${currency} ${price.toFixed(2)}`;
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

  worksheet["!cols"] = [
    { wch: 18 },
    { wch: 12 },
    { wch: 16 },
    { wch: 18 },
    { wch: 24 },
    { wch: 24 },
    { wch: 18 },
    { wch: 24 },
    { wch: 18 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
  ];
  worksheet["!freeze"] = { xSplit: 0, ySplit: 1 };
};

const StockCatalogButtons = ({ colours, query = "" }: StockCatalogButtonsProps) => {
  const [loadingMode, setLoadingMode] = useState<ExportMode | null>(null);

  const fetchStockCatalog = async () => {
    const token = getCookie("token") || localStorage.getItem("token");
    const params = new URLSearchParams();
    if (query) params.set("query", query);

    const response = await fetch(
      `${getApiUrl("stock")}${params.toString() ? `?${params.toString()}` : ""}`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        cache: "no-store",
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.message || data?.error || "Failed to load stock");
    }

    return Array.isArray(data?.stock) ? data.stock : [];
  };

  const handleDownload = async (mode: CatalogMode) => {
    const objectUrls: string[] = [];
    setLoadingMode(mode);

    try {
      const stock = await fetchStockCatalog();

      if (!stock.length) {
        toast.error("No stock products found");
        return;
      }

      const preparedStock = await Promise.all(
        stock.map(async (item: any) => ({
          ...item,
          catalogImage: await convertImageForPdf(
            getFirstImageUrl(item),
            objectUrls,
          ),
        })),
      );

      const showPrice = mode === "with-price";
      const blob = await pdf(
        <StockCatalogPdf
          stock={preparedStock}
          colours={colours}
          showPrice={showPrice}
        /> as any,
      ).toBlob();

      downloadBlob(
        blob,
        showPrice
          ? "stock-catalog-with-price.pdf"
          : "stock-catalog-without-price.pdf",
      );

      toast.success("Stock catalog downloaded");
    } catch (error: any) {
      toast.error("Failed to print stock catalog", {
        description: error?.message || "Please try again",
      });
    } finally {
      objectUrls.forEach((objectUrl) => URL.revokeObjectURL(objectUrl));
      setLoadingMode(null);
    }
  };

  const handleExcelExport = async (showPrice: boolean) => {
    setLoadingMode(showPrice ? "excel-with-price" : "excel-without-price");

    try {
      const stock = await fetchStockCatalog();

      if (!stock.length) {
        toast.error("No stock products found");
        return;
      }

      const rows = stock
        .filter((item: any) => item?.product)
        .map((item: any) => {
          const price = Number(item?.price ?? 0);
          const discountedPrice = Number(item?.discountedPrice ?? price);
          const hasDiscount =
            price > 0 && discountedPrice > 0 && discountedPrice < price;
          const baseRow = {
            "Stock ID": item?.id ?? "",
            "Style No": item?.product?.productCode || item?.productCode || item?.styleNo || "",
            Quantity: item?.quantity ?? "",
            Size: `${item?.size ?? "-"} (${item?.size_country ?? "-"})`,
            Source: item?.sourceLocation || "-",
            Mesh: getColourLabel(colours, item?.mesh_color, item?.product?.mesh_color),
            Beading: getColourLabel(
              colours,
              item?.beading_color,
              item?.product?.beading_color,
            ),
            Lining: getLiningLabel(item),
            "Lining Color": getColourLabel(
              colours,
              item?.lining_color,
              item?.product?.lining_color,
            ),
          };

          if (!showPrice) return baseRow;

          return {
            ...baseRow,
            Price: formatPrice(item?.price, item),
            Discount: `${Number(item?.discount ?? 0)}%`,
            "Final Price": hasDiscount
              ? formatPrice(item?.discountedPrice, item)
              : formatPrice(item?.price, item),
          };
        });

      const worksheet = XLSX.utils.json_to_sheet(rows);
      styleWorksheet(worksheet);

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Stock");
      XLSX.writeFile(workbook, buildExcelFileName(showPrice));
      toast.success("Stock data exported successfully");
    } catch (error: any) {
      toast.error("Failed to export stock data", {
        description: error?.message || "Please try again",
      });
    } finally {
      setLoadingMode(null);
    }
  };

  const isLoading = Boolean(loadingMode);

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Button
        type="button"
        variant="outline"
        onClick={() => handleDownload("with-price")}
        disabled={isLoading}
      >
        {loadingMode === "with-price" ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Printer className="mr-2 h-4 w-4" />
        )}
        Print Catalog with price
      </Button>

      <Button
        type="button"
        variant="outline"
        onClick={() => handleDownload("without-price")}
        disabled={isLoading}
      >
        {loadingMode === "without-price" ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        Print catalog without price
      </Button>

      <Button
        type="button"
        variant="outline"
        onClick={() => handleExcelExport(true)}
        disabled={isLoading}
      >
        {loadingMode === "excel-with-price" ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FileSpreadsheet className="mr-2 h-4 w-4" />
        )}
        Export Excel with price
      </Button>

      <Button
        type="button"
        variant="outline"
        onClick={() => handleExcelExport(false)}
        disabled={isLoading}
      >
        {loadingMode === "excel-without-price" ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FileSpreadsheet className="mr-2 h-4 w-4" />
        )}
        Export Excel without price
      </Button>
    </div>
  );
};

export default StockCatalogButtons;
