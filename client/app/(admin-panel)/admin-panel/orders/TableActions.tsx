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
import { loadRegularOrderPreview, loadRetailerOrderPreview } from "./orderPdfData";
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
  const { executeAsync: normalizePieces } = useHttp(
    `/orders/${data.id}/normalize-pieces`,
  );
  const [open, setOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [preferGeneratedPdf, setPreferGeneratedPdf] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

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
  const hasUploadedDocument =
    Boolean(uploadedDocumentUrl) && !preferGeneratedPdf;
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
    setPreviewData(null);
    setPreferGeneratedPdf(false);
    try {
      const result = await loadRegularOrderPreview(data, normalizePieces);
      setPreviewData(result.previewData);
      setOrderDetails(result.orderDetails);
      setPreferGeneratedPdf(result.repaired);
      await fetchPPT(result.previewData.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load order");
    }
  };

  const fetchDetails = async () => {
    setPreviewData(null);
    setPreferGeneratedPdf(false);
    try {
      const result = await loadRetailerOrderPreview(data);
      setPreviewData(result);
      await fetchPPT(data.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load retailer order");
    }
  };

  /** ********** SEND EMAIL ********** **/
  const sendMail = async () => {
    if (!previewData) return;
    try {
      const res = await Stock({
        orderData: { ...previewData, preferGeneratedPdf },
      });
      res?.success
        ? toast.success("Email sent successfully")
        : toast.error(res?.message || "Failed to send email");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send email",
      );
    }
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
                    {previewData.orderSource === "regular" && (
                      <Button
                        variant="secondary"
                        className="mt-3 w-full"
                        onClick={() =>
                          setPreferGeneratedPdf((current) => !current)
                        }
                      >
                        {preferGeneratedPdf
                          ? "View uploaded document"
                          : "Generate PDF from current order"}
                      </Button>
                    )}
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
