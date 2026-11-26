"use client";

import { pdf } from "@react-pdf/renderer";
import FreshOrderPdf from "../request/FreshOrderPdf";
import RetailerPdf from "../request/RetailerPdf";
import {
  loadRegularOrderPreview,
  loadRetailerOrderPreview,
} from "./orderPdfData";
import {
  PdfOrderSelection,
  selectedOrderPdfSource,
} from "@/lib/selectedOrderPdf";

export async function generateSelectedOrderPdf(
  order: PdfOrderSelection,
  apiUrl: string,
  token: string,
  signal: AbortSignal,
): Promise<File> {
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
  signal.throwIfAborted();
  let document;
  let purchaseOrderNo: string;
  if (selectedOrderPdfSource(order) === "order") {
    const result = await loadRegularOrderPreview(order, async () => {
      signal.throwIfAborted();
      const response = await fetch(
        `${apiUrl}/orders/${order.id}/normalize-pieces`,
        {
          method: "POST",
          headers,
          signal,
        },
      );
      if (!response.ok)
        throw new Error(`Unable to prepare pieces for order #${order.id}.`);
    });
    purchaseOrderNo = result.previewData.purchaseOrderNo;
    document = <FreshOrderPdf orderData={result.previewData} />;
  } else {
    const response = await fetch(`${apiUrl}/retailer-orders/${order.id}`, {
      headers,
      signal,
      cache: "no-store",
    });
    const result = await response.json();
    if (!response.ok || !result.success || !result.data) {
      throw new Error(result.message || `Unable to load order #${order.id}.`);
    }
    const data = result.data;
    const preview = await loadRetailerOrderPreview({
      ...data,
      orderType: data.is_stock_order ? "Stock" : "Fresh",
      favouriteOrder: data.favourite_order,
    });
    purchaseOrderNo = preview.purchaseOrderNo;
    document = <RetailerPdf orderData={preview} />;
  }
  signal.throwIfAborted();
  const blob = await pdf(document).toBlob();
  signal.throwIfAborted();
  return new File([blob], `${purchaseOrderNo}.pdf`, {
    type: "application/pdf",
  });
}
