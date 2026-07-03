"use client";

import { Button } from "@/components/custom/button";
import { File as FileIcon, Mail, Presentation } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import useHttp from "@/lib/hooks/usePost";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import FreshOrderPdf from "../request/FreshOrderPdf";
import RetailerPdf from "../request/RetailerPdf";
import { API_URL } from "@/lib/constants";
import {
  getProductColorsCheck,
  getProductColours,
  getRetailerAdminFreshOrderDetails,
  getRetailerAdminStockOrderDetails,
} from "@/lib/data";
import { convertWebPToJPG } from "../request/StockAcceptedForm";
import { downloadOrderPPT } from "@/lib/utils/exportPPT";
import PdfPreview from "@/components/pdf/PdfPreview";

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

const getUploadedDocumentSource = (orderSource?: string) =>
  orderSource === "regular" ? "order" : "retailer";

const getUploadedDocumentPreviewUrl = (
  orderId?: number | null,
  source?: string,
) => {
  if (!orderId) return "";
  return appendQueryParams(`${API_URL}/upload-ppt/preview/${orderId}`, {
    source,
  });
};

const TableActions = ({ data }: { data: any }) => {
  const [open, setOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [pdfSearchRequestKey, setPdfSearchRequestKey] = useState(0);

  const { executeAsync: Stock, loading } = useHttp(
    "/stock-email",
    "POST",
    true,
    false,
  );

  const uploadedDocumentUrl = resolveUploadedDocumentUrl(previewData?.ppt_path);
  const uploadedDocumentExt = getUploadedDocumentExtension(
    previewData?.ppt_path,
  );
  const uploadedDocumentSource = getUploadedDocumentSource(data?.orderSource);
  const hasUploadedDocument = Boolean(uploadedDocumentUrl);
  const isUploadedPdf = uploadedDocumentExt === "pdf";
  const uploadedDocumentPreviewUrl =
    hasUploadedDocument && previewData?.id
      ? getUploadedDocumentPreviewUrl(previewData.id, uploadedDocumentSource)
      : uploadedDocumentUrl;
  const uploadedDocumentDownloadUrl =
    isUploadedPdf && uploadedDocumentPreviewUrl
      ? appendQueryParams(uploadedDocumentPreviewUrl, { download: "1" })
      : uploadedDocumentUrl;
  const uploadedDocumentName =
    uploadedDocumentUrl.split("/").pop()?.split("?")[0] || "order-document";
  const generatedPdfDocument = useMemo(() => {
    if (!previewData || hasUploadedDocument) return null;

    return data.orderSource === "retailer" ? (
      <RetailerPdf orderData={previewData} />
    ) : (
      <FreshOrderPdf orderData={previewData} />
    );
  }, [data.orderSource, hasUploadedDocument, previewData]);
  const isPdfSearchDisabled = hasUploadedDocument && !isUploadedPdf;

  const handlePdfSearch = () => {
    const query = searchText.trim();

    if (!query) {
      toast.error("Enter text to search");
      return;
    }

    if (isPdfSearchDisabled) {
      toast.error("Search is available only for PDF previews");
      return;
    }

    setPdfSearchRequestKey((currentKey) => currentKey + 1);
  };

  const fetchPPT = async (id: number) => {
    try {
      const res = await fetch(
        appendQueryParams(`${API_URL}/upload-ppt/${id}`, {
          source: uploadedDocumentSource,
        }),
      );
      const data = await res.json();

      if (data.success && data.ppt_path) {
        setPreviewData((prev: any) => ({
          ...prev,
          ppt_path: data.ppt_path,
        }));
      }
    } catch (error) {
      console.log("Error loading saved PPT:", error);
    }
  };

  /** ********** STORE / ONLINE ORDERS ********** **/
  const fetchData = async () => {
    try {
      const colours = await getProductColours({});
      const res = await fetch(
        API_URL + `/orders/orderDetails?orderId=${data.id}`,
      );
      const resData = await res.json();

      const order = resData.orders[0];
      const colors = colours.productColours;

      const getColorName = (hex?: string | null) =>
        hex && hex !== "SAS"
          ? colors.find((c: any) => c.hexcode === hex)?.name || hex
          : "SAS";

      const normalizeArray = (v: any) => {
        if (Array.isArray(v)) return v;
        if (typeof v === "string" && v.trim()) {
          try {
            const parsed = JSON.parse(v);
            return Array.isArray(parsed) ? parsed : [v];
          } catch {
            return [v];
          }
        }

        return v ? [v] : [];
      };

      const getCustomSizeText = (value: any) => {
        if (typeof value === "string" || typeof value === "number") {
          return String(value).trim();
        }

        if (value && typeof value === "object") {
          return String(value.size ?? value.value ?? value.label ?? "").trim();
        }

        return "";
      };

      const getCustomSizeEntries = (
        customSize: any,
        customSizesQuantity: any[],
      ) => {
        const customSizeEntries = normalizeArray(customSize)
          .map(getCustomSizeText)
          .filter(Boolean);

        return customSizeEntries.length
          ? customSizeEntries
          : customSizesQuantity.map(getCustomSizeText).filter(Boolean);
      };

      const details = order.styles.reduce((acc: any[], item: any) => {
        const sizes = normalizeArray(item.customSizesQuantity);
        const customSizeEntries = getCustomSizeEntries(item.customSize, sizes);
        const isCustomSize =
          String(item.size ?? "")
            .trim()
            .toLowerCase() === "custom";

        const d = {
          quantity:
            sizes.length === 0
              ? Number(item.quantity)
              : sizes.reduce(
                  (s: number, v: any) => s + Number(v.quantity || 0),
                  0,
                ),

          size:
            isCustomSize && customSizeEntries.length
              ? "Custom"
              : sizes.length === 0
                ? `${item.size}/${item.quantity}`
                : sizes.map((v: any) => `${v.size}/${v.quantity}`).join(", "),
          customSize: customSizeEntries,
          customSizesQuantity: sizes,

          styleNo: item.styleNo,
          barcode: item.barcode, // 🔥 सबसे ज़रूरी लाइन

          size_country: item.sizeCountry,
          comments: normalizeArray(item.comments).join(", "),
          color: item.colorType,
          image: item.convertedFirstProductImage,
          meshColor:
            item.mesh_color === "SAS" ? "SAS" : getColorName(item.mesh_color),
          beadingColor:
            item.beading_color === "SAS"
              ? "SAS"
              : getColorName(item.beading_color),
          beader: item.beader || item.product?.beader || "",
          lining: item.lining,
          liningColor:
            item.lining_color === "SAS"
              ? "SAS"
              : getColorName(item.lining_color),
          refImg: normalizeArray(item.photoUrls),
        };

        const exists = acc.find(
          (i) =>
            JSON.stringify({ ...i, refImg: undefined }) ===
            JSON.stringify({ ...d, refImg: undefined }),
        );

        if (exists) {
          exists.quantity += d.quantity;
          if (d.customSize.length) {
            exists.customSize = Array.from(
              new Set([...(exists.customSize ?? []), ...d.customSize]),
            );
          } else {
            exists.size += `, ${d.size}`;
          }
        } else {
          acc.push(d);
        }

        return acc;
      }, []);

      const formatted = {
        id: order.id, // 🔥 add this

        customerId: order.customer.id,
        manufacturingEmailAddress: order.manufacturingEmailAddress,
        orderCancellationDate: order.orderCancellationDate,
        orderReceivedDate: order.orderReceivedDate,
        orderType: order.orderType,
        purchaseOrderNo: order.purchaeOrderNo,
        details,
        ppt_path: order.ppt_path || "", // ➕ IMPORTANT
      };

      setPreviewData(formatted);
      setOrderDetails(resData);
      await fetchPPT(formatted.id);
    } catch (err) {
      toast.error("Failed to load order");
    }
  };

  /** ********** RETAILER ORDERS ********** **/
  /** ********** RETAILER ORDERS ********** **/
  const fetchDetails = async () => {
    try {
      console.log("🚀 FETCH STARTED");

      const colours = await getProductColours({});
      const colors = colours.productColours;

      const getColorName = (hex?: string | null) =>
        hex && hex !== "SAS"
          ? colors.find((c: any) => c.hexcode === hex)?.name || hex
          : "SAS";
      const formatSasColor = (name?: string | null) =>
        name && name !== "SAS" ? `SAS(${name})` : "SAS";

      const standard = async (id: number) =>
        (await getProductColorsCheck(id)).data;

      /** --------------------- FRESH ORDER --------------------- **/
      if (data.orderType === "Fresh") {
        console.log("📌 ORDER TYPE = FRESH");
        console.log("🆔 FAVOURITE ORDER ID =", data.favouriteOrder.id);

        const fresh = await getRetailerAdminFreshOrderDetails(
          data.favouriteOrder.id,
          1,
        );

        console.log("📦 RAW FRESH ORDER DATA →", fresh.data);

        const details = await Promise.all(
          fresh.data.map(async (i: any) => {
            const std = await standard(i.product_id);

            /** 🔥 BARCODE CHECK */
            console.log(
              `🔍 STYLE ${i.styleNo} → BARCODE COMING?`,
              i.barcode ?? "❌ NOT FOUND",
            );

            return {
              quantity: i.quantity,
              size: String(i.size ?? "").trim(),
              styleNo: i.styleNo,

              /** 🔥 BARCODE HERE */
              barcode: i.barcode,

              comments: i.comments,
              color: i.color,
              size_country: i.size_country,
              image: await convertWebPToJPG(i.image),

              refImg: i.reference_image
                ? await Promise.all(
                    JSON.parse(i.reference_image).map((img: any) =>
                      convertWebPToJPG(img),
                    ),
                  )
                : [],

              meshColor:
                i.mesh_color === std.mesh_color
                  ? formatSasColor(getColorName(std.mesh_color))
                  : getColorName(i.mesh_color),

              beadingColor:
                i.beading_color === std.beading_color
                  ? formatSasColor(getColorName(std.beading_color))
                  : getColorName(i.beading_color),
              beader: i.beader || std.beader || "",

              lining: i.lining === std.lining ? `SAS(${std.lining})` : i.lining,

              liningColor:
                i.lining_color === std.lining_color
                  ? formatSasColor(getColorName(std.lining_color))
                  : getColorName(i.lining_color),
            };
          }),
        );

        console.log("🧩 FINAL PARSED DETAILS →", details);

        setPreviewData({
          id: data.id,
          manufacturingEmailAddress: data.manufacturingEmailAddress,
          orderCancellationDate: data.orderCancellationDate,
          orderReceivedDate: data.orderReceivedDate,
          orderType: "Fresh",
          purchaseOrderNo: data.purchaeOrderNo,
          name: data.customerStoreName || data.retailer_name,
          email: data.retailer_email,
          details,
          ppt_path: data.ppt_path || data.favouriteOrder.ppt_path || "",
        });

        await fetchPPT(data.id);

        /** 🔥 PREVIEW LOG */
        console.log("📄 FINAL PREVIEW DATA →", {
          ...previewData,
          details,
        });

        /** ------------------- STOCK ORDER ------------------- **/
        /** ------------------- STOCK ORDER ------------------- **/
        /** ------------------- STOCK ORDER ------------------- **/
      } else {
        console.log("📌 ORDER TYPE = STOCK");
        console.log("🆔 STOCK ORDER ID =", data.Stock_order.id);

        const stock = await getRetailerAdminStockOrderDetails(
          data.Stock_order.id,
          1,
        );

        console.log("📦 RAW STOCK ORDER DATA →", stock);

        // 🔥 ADD THESE 2 LINES
        console.log("📌 STOCK ORDER DETAILS →", stock.details);
        console.log("📌 BARCODE FOUND? →", stock.details?.[0]?.barcode);

        const stockDetails = Array.isArray(stock.details) ? stock.details : [];
        if (!stockDetails.length) {
          throw new Error("Stock order details not found");
        }

        const previewDetails = await Promise.all(
          stockDetails.map(async (d: any) => {
            const std = await standard(d.product_id);

            return {
              quantity: d.quantity,
              size: String(d.size ?? "").trim(),
              styleNo: d.productCode,
              barcode: d.barcode,
              size_country: d.size_country,
              image: await convertWebPToJPG(d.image),
              color: d.color || "Stock",
              meshColor:
                d.mesh_color === std.mesh_color
                  ? formatSasColor(getColorName(std.mesh_color))
                  : getColorName(d.mesh_color),
              beadingColor:
                d.beading_color === std.beading_color
                  ? formatSasColor(getColorName(std.beading_color))
                  : getColorName(d.beading_color),
              beader: d.beader || std.beader || "",
              lining: d.lining === std.lining ? `SAS(${d.lining})` : d.lining,
              liningColor:
                d.lining_color === std.lining_color
                  ? formatSasColor(getColorName(d.lining_color))
                  : getColorName(d.lining_color),
              comments: d.comments || "",
              refImg: [],
            };
          }),
        );

        setPreviewData({
          id: data.id,
          manufacturingEmailAddress: data.manufacturingEmailAddress,
          orderCancellationDate: data.orderCancellationDate,
          orderReceivedDate: data.orderReceivedDate,
          orderType: "Stock",
          purchaseOrderNo: data.purchaeOrderNo,

          details: previewDetails,

          ppt_path: stockDetails[0]?.ppt_path || data.ppt_path || "",
        });

        await fetchPPT(data.id);
      }
    } catch (error) {
      console.error("❌ FAILED TO LOAD RETAILER ORDER", error);
      toast.error("Failed to load retailer order");
    }
  };

  /** ********** SEND EMAIL ********** **/
  const sendMail = async () => {
    if (!previewData) return;
    const res = await Stock({ orderData: previewData });
    res?.success
      ? toast.success("Email sent successfully")
      : toast.error("Failed to send email");
  };

  return (
    <div className="my-2 flex gap-4">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            onClick={data.orderSource === "regular" ? fetchData : fetchDetails}
          >
            Preview <FileIcon className="ml-2" />
          </Button>
        </SheetTrigger>

        <SheetContent className="min-w-full overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Order Details Preview</SheetTitle>
            <SheetDescription>
              This is what will be emailed to the customer.
            </SheetDescription>
          </SheetHeader>

          {!previewData && <p className="mt-8 text-center">Loading...</p>}

          {previewData && (
            <>
              {/* 📌 Upload Custom Document */}
              <div className="mt-6 rounded-lg border bg-gray-50 p-4">
                <h3 className="text-md mb-3 font-semibold">
                  Upload Custom Document
                </h3>

                <input
                  type="file"
                  accept=".pdf,.ppt,.pptx"
                  className="block w-full rounded border p-2 text-sm"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />

                {file && (
                  <p className="mt-2 text-xs text-gray-600">
                    Selected: <strong>{file.name}</strong>
                  </p>
                )}

                <Button
                  disabled={!file || uploading}
                  variant="secondary"
                  className="mt-3 w-full"
                  onClick={async () => {
                    if (!file) return;

                    const orderId = previewData?.id || data?.id;
                    if (!orderId) return toast.error("Order ID Missing!");

                    setUploading(true);

                    try {
                      const formData = new FormData();
                      formData.append("ppt", file);
                      formData.append("orderId", String(orderId));
                      formData.append("source", uploadedDocumentSource);

                      const res = await fetch(API_URL + "/upload-ppt", {
                        method: "POST",
                        body: formData,
                      });
                      const rp = await res.json();
                      if (rp.success) {
                        toast.success("File uploaded successfully!");

                        // UI update (no need to open modal)
                        setPreviewData((prev: any) => ({
                          ...prev,
                          ppt_path: rp.path,
                        }));
                      } else {
                        toast.error(rp.message || "Upload Failed");
                      }
                    } catch (error) {
                      console.error("Upload failed:", error);
                      toast.error("Upload Failed");
                    } finally {
                      setUploading(false);
                    }
                  }}
                >
                  {uploading ? "Uploading..." : "Upload File"}
                </Button>

                {/* 🔥 Always visible section */}
                {previewData?.ppt_path && (
                  <div className="mt-4 rounded-lg border border-green-600 bg-green-100 p-3">
                    <p className="font-semibold text-green-800">
                      Uploaded Document:
                    </p>
                    <a
                      href={
                        isUploadedPdf
                          ? uploadedDocumentPreviewUrl
                          : uploadedDocumentUrl
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-blue-700 underline"
                    >
                      {uploadedDocumentName}
                    </a>
                  </div>
                )}
              </div>
              <Button
                onClick={sendMail}
                loading={loading}
                className="mt-6 w-full"
              >
                Send Mail <Mail className="ml-2" />
              </Button>

              {/* 🔍 PDF Search */}
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  placeholder={
                    isPdfSearchDisabled
                      ? "PDF search is available only for PDF files"
                      : "Search inside PDF..."
                  }
                  value={searchText}
                  disabled={isPdfSearchDisabled}
                  onChange={(e) => setSearchText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handlePdfSearch();
                  }}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />

                <Button
                  type="button"
                  onClick={handlePdfSearch}
                  disabled={isPdfSearchDisabled}
                >
                  Search PDF
                </Button>
              </div>

              {hasUploadedDocument && !isUploadedPdf && (
                <div className="flex justify-end gap-3 py-3">
                  <Button asChild variant="secondary">
                    <a
                      href={uploadedDocumentDownloadUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Download Uploaded File
                    </a>
                  </Button>
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
                    heightClassName="h-[90vh]"
                    searchQuery={searchText}
                    searchRequestKey={pdfSearchRequestKey}
                  />
                ) : (
                  <div className="mt-4 flex h-[50vh] flex-col items-center justify-center gap-3 rounded border border-dashed bg-muted/30 text-center">
                    <Presentation className="h-10 w-10 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {uploadedDocumentName}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        This order uses the uploaded file instead of a generated
                        PDF.
                        <br />
                        PowerPoint files cannot be previewed inline here.
                      </p>
                    </div>
                  </div>
                )
              ) : (
                <PdfPreview
                  sourceDocument={generatedPdfDocument ?? undefined}
                  fileName={`${previewData.purchaseOrderNo}.pdf`}
                  className="mt-4"
                  heightClassName="h-[90vh]"
                  searchQuery={searchText}
                  searchRequestKey={pdfSearchRequestKey}
                  extraActions={
                    <Button
                      type="button"
                      onClick={() => downloadOrderPPT(previewData)}
                      variant="secondary"
                      size="sm"
                      className="min-h-[38px]"
                    >
                      Download PPT
                    </Button>
                  }
                />
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default TableActions;
