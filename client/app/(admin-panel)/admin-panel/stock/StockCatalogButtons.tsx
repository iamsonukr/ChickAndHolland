"use client";

import React, { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { Download, Loader2, Printer } from "lucide-react";
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

const StockCatalogButtons = ({ colours, query = "" }: StockCatalogButtonsProps) => {
  const [loadingMode, setLoadingMode] = useState<CatalogMode | null>(null);

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
    </div>
  );
};

export default StockCatalogButtons;
