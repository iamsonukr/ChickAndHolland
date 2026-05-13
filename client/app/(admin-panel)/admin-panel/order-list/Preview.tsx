"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  getProductColorsCheck,
  getProductColours,
  getRetailerAdminFreshOrderDetails,
  getRetailerAdminStockOrderDetails,
} from "@/lib/data";
import { convertWebPToJPG } from "../request/StockAcceptedForm";
import useHttp from "@/lib/hooks/usePost";
import { toast } from "sonner";
import RetailerPdf from "../request/RetailerPdf";
import { Presentation } from "lucide-react";
import { API_URL } from "@/lib/constants";
import PdfPreview from "@/components/pdf/PdfPreview";
import { downloadOrderPPT } from "@/lib/utils/exportPPT";

const resolveUploadedDocumentUrl = (filePath?: string | null) => {
  if (!filePath) return "";
  if (/^https?:\/\//i.test(filePath)) return filePath;
  return `${API_URL.replace("/api", "")}${filePath}`;
};

const getUploadedDocumentExtension = (filePath?: string | null) => {
  if (!filePath) return "";
  const cleanPath = filePath.split("?")[0];
  const ext = cleanPath.split(".").pop();
  return ext ? ext.toLowerCase() : "";
};

type PreviewOrderSource = "retailer" | "regular";
type UploadedDocumentSource = "retailer" | "order";

const PREVIEW_LOG_PREFIX = "[RetailerMyOrdersPreview]";

const logPreview = (stage: string, details?: Record<string, unknown>) => {
  console.info(PREVIEW_LOG_PREFIX, stage, details ?? {});
};

const logPreviewFailure = (
  stage: string,
  error: unknown,
  details?: Record<string, unknown>,
) => {
  console.error(PREVIEW_LOG_PREFIX, stage, {
    ...details,
    error,
  });
};

const appendQueryParams = (
  url: string,
  params: Record<string, string | undefined>,
) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) searchParams.set(key, value);
  });

  const query = searchParams.toString();
  if (!query) return url;

  return `${url}${url.includes("?") ? "&" : "?"}${query}`;
};

const getUploadedDocumentSource = (
  orderSource: PreviewOrderSource,
): UploadedDocumentSource => (orderSource === "regular" ? "order" : "retailer");

const getUploadedDocumentPreviewUrl = (
  orderId?: number | null,
  source?: UploadedDocumentSource,
) => {
  if (!orderId) return "";
  return appendQueryParams(`${API_URL}/upload-ppt/preview/${orderId}`, {
    source,
  });
};

const normalizeArray = (value: any) => {
  if (Array.isArray(value)) return value;
  if (!value) return [];

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : value ? [value] : [];
    } catch {
      return value ? [value] : [];
    }
  }

  return [value];
};

const buildRegularOrderDetails = (order: any, colors: any[]) => {
  const getColorName = (hex?: string | null) =>
    hex && hex !== "SAS"
      ? colors.find((c: any) => c.hexcode === hex)?.name || hex
      : "SAS";

  return (order.styles ?? []).reduce((acc: any[], item: any) => {
    const sizes = Array.isArray(item.customSizesQuantity)
      ? item.customSizesQuantity
      : normalizeArray(item.customSizesQuantity);

    const detail = {
      quantity:
        sizes.length === 0
          ? Number(item.quantity || 0)
          : sizes.reduce((sum: number, sizeItem: any) => {
              return sum + Number(sizeItem?.quantity || 0);
            }, 0),
      size:
        sizes.length === 0
          ? `${item.size ?? ""}/${item.quantity ?? ""}`.trim()
          : sizes
              .map((sizeItem: any) => `${sizeItem.size}/${sizeItem.quantity}`)
              .join(", "),
      styleNo: item.styleNo,
      barcode: item.barcode,
      size_country: item.sizeCountry ?? item.size_country,
      comments: normalizeArray(item.comments).join(", "),
      color: item.colorType || item.color,
      image: item.convertedFirstProductImage || item.image,
      meshColor:
        item.mesh_color === "SAS" ? "SAS" : getColorName(item.mesh_color),
      beadingColor:
        item.beading_color === "SAS"
          ? "SAS"
          : getColorName(item.beading_color),
      lining: item.lining,
      liningColor:
        item.lining_color === "SAS"
          ? "SAS"
          : getColorName(item.lining_color),
      refImg: normalizeArray(item.photoUrls),
    };

    const existing = acc.find(
      (existingItem) =>
        JSON.stringify({ ...existingItem, refImg: undefined }) ===
        JSON.stringify({ ...detail, refImg: undefined }),
    );

    if (existing) {
      existing.quantity += detail.quantity;
      existing.size += `, ${detail.size}`;
    } else {
      acc.push(detail);
    }

    return acc;
  }, []);
};

const Preview = ({
  id,
  type,
  order,
  showShippingDate = true,
  orderSource = "retailer",
}: {
  id: number;
  type: string;
  order: any;
  showShippingDate?: boolean;
  orderSource?: PreviewOrderSource;
}) => {
  const [data, setData] = useState<any>(null);
  const [previewError, setPreviewError] = useState("");

  const { executeAsync: stockMail, loading: stockLoading } = useHttp(
    "/stock-email",
    "POST",
    true,
    false,
  );

  const { executeAsync: freshMail, loading: freshLoading } = useHttp(
    "/fresh-email",
    "POST",
    true,
    false,
  );

  const loading = stockLoading || freshLoading;

  const productColorSAS = async (productId: number) => {
    const res = await getProductColorsCheck(productId);
    return res.data;
  };

  const getUploadedDocumentPath = async (
    orderId: number,
    source: UploadedDocumentSource,
  ) => {
    const url = appendQueryParams(`${API_URL}/upload-ppt/${orderId}`, {
      source,
    });

    try {
      logPreview("uploaded-document:request", { orderId, source, url });

      const response = await fetch(url);
      const responseJson = await response.json();

      logPreview("uploaded-document:response", {
        orderId,
        source,
        status: response.status,
        success: responseJson.success,
        hasPath: Boolean(responseJson.ppt_path),
      });

      return responseJson.success ? responseJson.ppt_path || "" : "";
    } catch (error) {
      logPreviewFailure("uploaded-document:error", error, { orderId, source });
      return "";
    }
  };

  const fetchRegularOrderPreview = async (
    colors: any[],
    uploadedDocumentPath: string,
  ) => {
    const detailUrl = `${API_URL}/orders/orderDetails?orderId=${order.id}`;

    logPreview("regular-order:details-request", {
      orderId: order.id,
      type,
      detailUrl,
    });

    const response = await fetch(detailUrl, { cache: "no-store" });
    const responseJson = await response.json();

    logPreview("regular-order:details-response", {
      orderId: order.id,
      status: response.status,
      success: responseJson.success,
      orderCount: responseJson.orders?.length ?? 0,
    });

    if (!response.ok || !responseJson.success) {
      throw new Error(
        responseJson.message ||
          `Admin order details failed with status ${response.status}`,
      );
    }

    const regularOrder = responseJson.orders?.[0];

    if (!regularOrder) {
      throw new Error("Admin order details response did not include an order");
    }

    const details = buildRegularOrderDetails(regularOrder, colors);

    logPreview("regular-order:details-normalized", {
      orderId: order.id,
      styleCount: regularOrder.styles?.length ?? 0,
      detailCount: details.length,
      hasUploadedDocument: Boolean(uploadedDocumentPath || regularOrder.ppt_path),
    });

    if (!details.length) {
      throw new Error("Admin order has no styles available for PDF preview");
    }

    setData({
      id: regularOrder.id,
      customerId: regularOrder.customer?.id,
      manufacturingEmailAddress:
        regularOrder.manufacturingEmailAddress || order.email,
      orderCancellationDate: regularOrder.orderCancellationDate,
      orderReceivedDate: regularOrder.orderReceivedDate,
      orderType: regularOrder.orderType || type,
      purchaseOrderNo: regularOrder.purchaeOrderNo || order.order_id,
      ppt_path: uploadedDocumentPath || regularOrder.ppt_path || order.ppt_path || "",
      details,
    });
  };

  const fetchDetails = async () => {
    try {
      const uploadedDocumentSource = getUploadedDocumentSource(orderSource);

      setData(null);
      setPreviewError("");

      logPreview("preview:start", {
        id,
        orderId: order?.id,
        type,
        orderSource,
        uploadedDocumentSource,
        purchaseOrderNo: order?.order_id,
      });

      const colourRes = await getProductColours({});
      const colors = colourRes.productColours;
      const getColorName = (hex?: string | null) =>
        hex && hex !== "SAS"
          ? colors.find((c: any) => c.hexcode === hex)?.name || hex
          : "SAS";
      const formatSasColor = (name?: string | null) =>
        name && name !== "SAS" ? `SAS(${name})` : "SAS";
      const uploadedDocumentPath =
        order.ppt_path ||
        (await getUploadedDocumentPath(order.id, uploadedDocumentSource));

      if (orderSource === "regular") {
        await fetchRegularOrderPreview(colors, uploadedDocumentPath);
        return;
      }

      if (type === "Fresh") {
        logPreview("retailer-fresh:details-request", { id, orderId: order.id });
        const fresh = await getRetailerAdminFreshOrderDetails(id, 1);

        const details = await Promise.all(
          fresh.data.map(async (item: any) => {
            const std = await productColorSAS(item.product_id);

            return {
              quantity: item.quantity,
              size: String(item.size ?? "").trim(),
              styleNo: item.styleNo ?? item.productCode,
              barcode: item.barcode,
              comments: item.comments || "",
              color: item.color,
              size_country: item.size_country,
              image: await convertWebPToJPG(item.image),
              refImg: item.reference_image
                ? await Promise.all(
                    JSON.parse(item.reference_image).map((img: any) =>
                      convertWebPToJPG(img),
                    ),
                  )
                : [],
              meshColor:
                item.mesh_color === std.mesh_color
                  ? formatSasColor(getColorName(std.mesh_color))
                  : getColorName(item.mesh_color),
              beadingColor:
                item.beading_color === std.beading_color
                  ? formatSasColor(getColorName(std.beading_color))
                  : getColorName(item.beading_color),
              lining: item.lining,
              liningColor:
                item.lining_color === std.lining_color
                  ? formatSasColor(getColorName(std.lining_color))
                  : getColorName(item.lining_color),
            };
          }),
        );

        setData({
          id: order.id,
          purchaseOrderNo: order.order_id,
          manufacturingEmailAddress: order.email,
          orderCancellationDate: order.orderCancellationDate,
          orderReceivedDate: order.orderReceivedDate,
          orderType: "Fresh",
          ppt_path: uploadedDocumentPath,
          details,
        });
        return;
      }

      logPreview("retailer-stock:details-request", { id, orderId: order.id });
      const stock = await getRetailerAdminStockOrderDetails(id, 1);
      const stockDetails = Array.isArray(stock.details) ? stock.details : [];

      if (!stockDetails.length) {
        throw new Error("Stock order details not found");
      }

      setData({
        id: order.id,
        purchaseOrderNo: order.order_id,
        manufacturingEmailAddress: order.email,
        orderCancellationDate: order.orderCancellationDate,
        orderReceivedDate: order.received_date,
        orderType: "Stock",
        ppt_path: uploadedDocumentPath,
        details: await Promise.all(
          stockDetails.map(async (item: any) => {
            const std = await productColorSAS(item.product_id);

            return {
              quantity: item.quantity,
              size: String(item.size ?? "").trim(),
              styleNo: item.productCode,
              barcode: item.barcode,
              color: "Stock",
              meshColor:
                item.mesh_color === std.mesh_color
                  ? formatSasColor(getColorName(std.mesh_color))
                  : getColorName(item.mesh_color),
              beadingColor:
                item.beading_color === std.beading_color
                  ? formatSasColor(getColorName(std.beading_color))
                  : getColorName(item.beading_color),
              lining:
                item.lining === std.lining
                  ? `SAS(${item.lining})`
                  : item.lining,
              liningColor:
                item.lining_color === std.lining_color
                  ? formatSasColor(getColorName(std.lining_color))
                  : getColorName(item.lining_color),
              size_country: item.size_country,
              comments: item.comments || "",
              image: await convertWebPToJPG(item.image),
            };
          }),
        ),
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load order preview";

      setPreviewError(message);
      logPreviewFailure("preview:failed", err, {
        id,
        orderId: order?.id,
        type,
        orderSource,
      });
      toast.error("Failed to load order");
    }
  };

  const sendMail = async () => {
    const res =
      data.orderType === "Fresh"
        ? await freshMail({ orderData: data })
        : await stockMail({ orderData: data });

    if (res?.success) {
      toast.success("Email sent successfully");
    } else {
      toast.error("Something went wrong");
    }
  };

  const uploadedDocumentUrl = resolveUploadedDocumentUrl(data?.ppt_path);
  const uploadedDocumentExt = getUploadedDocumentExtension(data?.ppt_path);
  const uploadedDocumentSource = getUploadedDocumentSource(orderSource);
  const uploadedDocumentPreviewUrl =
    getUploadedDocumentPreviewUrl(data?.id, uploadedDocumentSource) ||
    uploadedDocumentUrl;
  const hasUploadedDocument = Boolean(uploadedDocumentUrl);
  const isUploadedPdf = uploadedDocumentExt === "pdf";
  const uploadedDocumentDownloadUrl =
    isUploadedPdf && uploadedDocumentPreviewUrl
      ? appendQueryParams(uploadedDocumentPreviewUrl, { download: "1" })
      : uploadedDocumentUrl;
  const uploadedDocumentName =
    uploadedDocumentUrl.split("/").pop()?.split("?")[0] || "order-document";

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button onClick={fetchDetails}>Preview</Button>
      </SheetTrigger>

      <SheetContent className="!min-w-[95%] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Order Preview</SheetTitle>
        </SheetHeader>

        {!data && (
          <div className="mt-8 text-center">
            {previewError ? (
              <div className="mx-auto max-w-lg rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <p className="font-medium">Preview could not be loaded.</p>
                <p className="mt-1">{previewError}</p>
              </div>
            ) : (
              <p>Loading...</p>
            )}
          </div>
        )}

        {data && (
          <>
            <Button className="mt-4 w-full" onClick={sendMail} disabled={loading}>
              {loading ? "Sending..." : "Send Mail"}
            </Button>

            {(!hasUploadedDocument || !isUploadedPdf) && (
              <div className="flex justify-end py-3">
                {hasUploadedDocument ? (
                <a
                  href={uploadedDocumentDownloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded bg-green-600 px-4 py-2 text-white"
                >
                  Download Uploaded File
                </a>
                ) : null}
              </div>
            )}

            {hasUploadedDocument ? (
              isUploadedPdf ? (
                <PdfPreview
                  url={uploadedDocumentPreviewUrl}
                  openUrl={uploadedDocumentPreviewUrl}
                  downloadUrl={uploadedDocumentDownloadUrl}
                  fileName={uploadedDocumentName}
                  className="mt-4"
                  heightClassName="h-[75vh]"
                />
              ) : (
                <div className="mt-4 flex h-[50vh] flex-col items-center justify-center gap-3 rounded border border-dashed bg-muted/30 text-center">
                  <Presentation className="h-10 w-10 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{uploadedDocumentName}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      This order uses the uploaded file instead of a generated PDF.
                      <br />
                      PowerPoint files cannot be previewed inline here.
                    </p>
                  </div>
                </div>
              )
            ) : (
              <PdfPreview
                sourceDocument={
                  <RetailerPdf
                    orderData={data}
                    showShippingDate={showShippingDate}
                  />
                }
                fileName={`${data.purchaseOrderNo}.pdf`}
                className="mt-4"
                heightClassName="h-[75vh]"
                extraActions={
                  <button
                    type="button"
                    onClick={() => downloadOrderPPT(data)}
                    className="inline-flex min-h-[38px] items-center rounded bg-green-600 px-3 py-2 text-xs font-medium text-white hover:bg-green-700"
                  >
                    Download PPT
                  </button>
                }
              />
            )}
          </>
        )}

        <SheetFooter>
          <SheetClose />
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default Preview;
