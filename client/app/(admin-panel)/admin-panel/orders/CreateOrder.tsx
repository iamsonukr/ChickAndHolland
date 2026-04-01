"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Plus, Download, Presentation, FileText } from "lucide-react";
import { PDFDownloadLink, PDFViewer } from "@react-pdf/renderer";

import { useCreateOrder } from "@/hooks/useCreateOrder";
import { CreateOrderFormFields } from "@/components/CreateOrder/CreateOrderFormFields";
import FreshOrderPdf from "../request/FreshOrderPdf";
import { downloadOrderPPT } from "@/lib/utils/exportPPT";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CreateOrderProps {
  customers: any[];
  ordersTotalCount: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

const CreateOrder = ({ customers, ordersTotalCount }: CreateOrderProps) => {
  const {
    // form
    form,
    fields,
    remove,
    fullComponentWatch,
    // state
    open,
    setOpen,
    previewData,
    colors,
    customOrderType,
    setCustomOrderType,
    orderTypeArrayState,
    setOrderTypeArrayState,
    // upload
    uploadedFile,
    uploadedFileType,
    uploadedFileObjectUrl,
    setUploadedFile,
    clearUploadedFile,
    // derived
    colorTypeArray,
    sizeCountryArray,
    formattedCustomers,
    // helpers
    getColourBasedOnId,
    getColourBasedOnhex,
    // actions
    onSubmit,
    onPreviewSubmit,
    onErrors,
    addStyle,
    // loading
    loading,
    previewLoading,
  } = useCreateOrder({ customers, ordersTotalCount });

  // ── Decide what to show in the preview panel ────────────────────────────────
  //
  //   uploadedFile present  → show the uploaded file (PDF iframe or PPT badge)
  //   previewData present   → show the auto-generated PDF viewer
  //   neither               → show nothing
  //
  const showUploadedPreview = !!uploadedFile;
  const showGeneratedPreview = !uploadedFile && !!previewData;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>
          Add New Order <Plus className="ml-1 h-4 w-4" />
        </Button>
      </SheetTrigger>

      <SheetContent className="min-w-[100%] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add New Order</SheetTitle>
          <SheetDescription>Fill in the form below to add an order</SheetDescription>
        </SheetHeader>

        {/* ── Form ── */}
        <CreateOrderFormFields
          form={form}
          fields={fields}
          fullComponentWatch={fullComponentWatch}
          colors={colors}
          colorTypeArray={colorTypeArray}
          sizeCountryArray={sizeCountryArray}
          formattedCustomers={formattedCustomers}
          customOrderType={customOrderType}
          setCustomOrderType={setCustomOrderType}
          orderTypeArrayState={orderTypeArrayState}
          setOrderTypeArrayState={setOrderTypeArrayState}
          loading={loading}
          previewLoading={previewLoading}
          uploadedFile={uploadedFile}
          uploadedFileType={uploadedFileType}
          setUploadedFile={setUploadedFile}
          onSubmit={onSubmit}
          onPreviewSubmit={onPreviewSubmit}
          onErrors={onErrors}
          addStyle={addStyle}
          onRemove={remove}
          getColourBasedOnId={getColourBasedOnId}
          getColourBasedOnhex={getColourBasedOnhex}
        />

        {/* ── Preview panel — uploaded file ── */}
        {showUploadedPreview && (
          <div className="mt-4 flex w-full gap-4">
            <div className="flex-1 rounded-lg border p-2">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="font-semibold">Preview</h2>
                <div className="flex items-center gap-2">
                  {/* Direct download of the file the user uploaded */}
                  <a
                    href={uploadedFileObjectUrl ?? "#"}
                    download={uploadedFile?.name ?? "order-document"}
                    className="inline-flex"
                  >
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Download className="h-3.5 w-3.5" />
                      Download {uploadedFileType?.toUpperCase()}
                    </Button>
                  </a>
                </div>
              </div>

              {/* PDF — render inline */}
              {uploadedFileType === "pdf" && uploadedFileObjectUrl && (
                <iframe
                  src={uploadedFileObjectUrl}
                  className="h-[75vh] w-full rounded border-0"
                  title="Uploaded PDF preview"
                />
              )}

              {/* PPT — browsers can't render .pptx inline; show a placeholder */}
              {uploadedFileType === "ppt" && (
                <div className="flex h-[75vh] flex-col items-center justify-center gap-3 rounded border border-dashed bg-muted/30 text-center">
                  <Presentation className="h-10 w-10 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{uploadedFile?.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      PowerPoint files cannot be previewed in the browser.
                      <br />
                      Use the download button above to open it locally.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Preview panel — auto-generated PDF ── */}
        {showGeneratedPreview && (
          <div className="mt-4 flex w-full gap-4">
            <div className="flex-1 rounded-lg border p-2">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="font-semibold">Preview</h2>
                <div className="flex items-center gap-3">
                  <PDFDownloadLink
                    document={<FreshOrderPdf orderData={previewData} />}
                    fileName={`${previewData.purchaseOrderNo}.pdf`}
                  >
                    {({ loading: pdfLoading }) =>
                      pdfLoading ? (
                        <Button disabled>Preparing PDF...</Button>
                      ) : (
                        <Button className="bg-green-600 text-white">Download PDF</Button>
                      )
                    }
                  </PDFDownloadLink>

                  <Button
                    className="bg-blue-600 text-white"
                    onClick={() => downloadOrderPPT(previewData)}
                  >
                    Download PPT
                  </Button>
                </div>
              </div>

              <PDFViewer className="h-[75vh] w-full" showToolbar={false}>
                <FreshOrderPdf orderData={previewData} />
              </PDFViewer>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CreateOrder;