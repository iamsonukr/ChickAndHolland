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
import { PDFDownloadLink, PDFViewer } from "@react-pdf/renderer";
import RetailerPdf from "../request/RetailerPdf";
import { Presentation } from "lucide-react";
import { API_URL } from "@/lib/constants";
import AdminLoaderScreen from "@/components/custom/admin-panel/AdminLoaderScreen";

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

const getUploadedDocumentPreviewUrl = (orderId?: number | null) => {
  if (!orderId) return "";
  return `${API_URL}/upload-ppt/preview/${orderId}`;
};

const Preview = ({
  id,
  type,
  order,
}: {
  id: number;
  type: string;
  order: any;
}) => {
  const [data, setData] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

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

  const getUploadedDocumentPath = async (orderId: number) => {
    try {
      const response = await fetch(`${API_URL}/upload-ppt/${orderId}`);
      const responseJson = await response.json();
      return responseJson.success ? responseJson.ppt_path || "" : "";
    } catch (error) {
      console.error("Failed to load uploaded document", error);
      return "";
    }
  };

  const fetchDetails = async () => {
    setPreviewLoading(true);
    try {
      setData(null);
      const colourRes = await getProductColours({});
      const colors = colourRes.productColours;
      const getColorName = (hex?: string | null) =>
        hex && hex !== "SAS"
          ? colors.find((c: any) => c.hexcode === hex)?.name || hex
          : "SAS";
      const formatSasColor = (name?: string | null) =>
        name && name !== "SAS" ? `SAS(${name})` : "SAS";
      const uploadedDocumentPath = await getUploadedDocumentPath(order.id);

      if (type === "Fresh") {
        const fresh = await getRetailerAdminFreshOrderDetails(id, 1);

        const details = await Promise.all(
          fresh.data.map(async (item: any) => {
            const std = await productColorSAS(item.product_id);

            return {
              quantity: item.quantity,
              size: `${item.size}/${item.quantity}`,
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

      const stock = await getRetailerAdminStockOrderDetails(id, 1);
      const stockDetails = stock.details?.[0];

      if (!stockDetails) {
        throw new Error("Stock order details not found");
      }

      const std = await productColorSAS(stockDetails.product_id);

      setData({
        id: order.id,
        purchaseOrderNo: order.order_id,
        manufacturingEmailAddress: order.email,
        orderCancellationDate: order.orderCancellationDate,
        orderReceivedDate: order.received_date,
        orderType: "Stock",
        ppt_path: uploadedDocumentPath,
        details: [
          {
            quantity: stockDetails.quantity,
            size: `${stockDetails.size}/${stockDetails.quantity}`,
            styleNo: stockDetails.productCode,
            barcode: stockDetails.barcode,
            color: "Stock",
            meshColor:
              stockDetails.mesh_color === std.mesh_color
                ? formatSasColor(getColorName(std.mesh_color))
                : getColorName(stockDetails.mesh_color),
            beadingColor:
              stockDetails.beading_color === std.beading_color
                ? formatSasColor(getColorName(std.beading_color))
                : getColorName(stockDetails.beading_color),
            lining:
              stockDetails.lining === std.lining
                ? `SAS(${stockDetails.lining})`
                : stockDetails.lining,
            liningColor:
              stockDetails.lining_color === std.lining_color
                ? formatSasColor(getColorName(std.lining_color))
                : getColorName(stockDetails.lining_color),
            size_country: stockDetails.size_country,
            comments: stockDetails.comments || "",
            image: await convertWebPToJPG(stockDetails.image),
          },
        ],
      });
    } catch (err) {
      console.error("Failed to load order preview", err);
      toast.error("Failed to load order");
    } finally {
      setPreviewLoading(false);
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
  const uploadedDocumentPreviewUrl =
    getUploadedDocumentPreviewUrl(data?.id) || uploadedDocumentUrl;
  const hasUploadedDocument = Boolean(uploadedDocumentUrl);
  const isUploadedPdf = uploadedDocumentExt === "pdf";
  const uploadedDocumentName =
    uploadedDocumentUrl.split("/").pop()?.split("?")[0] || "order-document";

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button onClick={fetchDetails}>Preview</Button>
      </SheetTrigger>

      <SheetContent className="relative !min-w-[95%] overflow-y-auto">
        {previewLoading && (
          <AdminLoaderScreen
            className="absolute inset-0 z-50 bg-background/95 backdrop-blur-sm"
            title="Loading order preview"
            description="Preparing the latest retailer order details and preview document."
          />
        )}
        <SheetHeader>
          <SheetTitle>Order Preview</SheetTitle>
        </SheetHeader>

        {!data && !previewLoading && (
          <p className="mt-8 text-center text-muted-foreground">
            Preview unavailable.
          </p>
        )}

        {data && (
          <>
            <Button className="mt-4 w-full" onClick={sendMail} disabled={loading}>
              {loading ? "Sending..." : "Send Mail"}
            </Button>

            <div className="flex justify-end py-3">
              {hasUploadedDocument ? (
                <a
                  href={isUploadedPdf ? uploadedDocumentPreviewUrl : uploadedDocumentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded bg-green-600 px-4 py-2 text-white"
                >
                  Download Uploaded File
                </a>
              ) : (
                <PDFDownloadLink
                  document={<RetailerPdf orderData={data} />}
                  fileName={`${data.purchaseOrderNo}.pdf`}
                >
                  <Button className="bg-blue-600 text-white">Download PDF</Button>
                </PDFDownloadLink>
              )}
            </div>

            {hasUploadedDocument ? (
              isUploadedPdf ? (
                <iframe
                  src={uploadedDocumentPreviewUrl}
                  className="mt-4 h-[75vh] w-full rounded border-0"
                  title="Uploaded order document preview"
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
              <PDFViewer className="mt-4 h-[75vh] w-full" showToolbar={false}>
                <RetailerPdf orderData={data} />
              </PDFViewer>
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
