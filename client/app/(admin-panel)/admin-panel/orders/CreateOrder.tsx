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
import { Plus, Download } from "lucide-react";
import { useMemo } from "react";

import { useCreateOrder } from "@/hooks/useCreateOrder";
import { CreateOrderFormFields } from "@/components/CreateOrder/CreateOrderFormFields";
import RetailerPdf from "../request/RetailerPdf";
import { downloadOrderPPT } from "@/lib/utils/exportPPT";
import PdfPreview from "@/components/pdf/PdfPreview";
import PptPreview from "@/components/ppt/PptPreview";
import AdminLoaderScreen from "@/components/custom/admin-panel/AdminLoaderScreen";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CreateOrderProps {
  customers: any[];
  ordersTotalCount: number;
  productCategories?: any[];
  productSubCategories?: any[];
  currencies?: any[];
  editOrder?: any;
  triggerLabel?: string;
  onSuccess?: () => void;
  editPassword?: string;
}

const formatPreviewComments = (comments: unknown) => {
  if (Array.isArray(comments)) {
    return comments
      .map((comment) => String(comment).trim())
      .filter(Boolean)
      .join(", ");
  }

  return typeof comments === "string" ? comments.trim() : "";
};

// ─── Component ────────────────────────────────────────────────────────────────

const CreateOrder = ({
  customers,
  ordersTotalCount,
  productCategories = [],
  productSubCategories = [],
  currencies = [],
  editOrder,
  triggerLabel,
  onSuccess,
  editPassword,
}: CreateOrderProps) => {
  const isEditMode = Boolean(editOrder?.id);
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
    savingDraftOnClose,
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
    selectedCustomer,
    productDetailsByStyleNo,
    // helpers
    getColourBasedOnId,
    getColourBasedOnhex,
    // actions
    onSubmit,
    onSaveDraft,
    onPreviewSubmit,
    onErrors,
    addStyle,
    // loading
    loading,
    previewLoading,
  } = useCreateOrder({
    customers,
    ordersTotalCount,
    editOrder,
    onSuccess,
    editPassword,
  });

  // ── Decide what to show in the preview panel ────────────────────────────────
  //
  //   uploadedFile present  → show the uploaded file (PDF iframe or PPT badge)
  //   previewData present   → show the auto-generated PDF viewer
  //   neither               → show nothing
  //
  const showUploadedPreview = !!uploadedFile;
  const showGeneratedPreview = !uploadedFile && !!previewData;
  const syncedPreviewData = useMemo(() => {
    if (!previewData) return null;

    return {
      ...previewData,
      details: previewData.details?.map((detail: any, index: number) => ({
        ...detail,
        comments: formatPreviewComments(fullComponentWatch[index]?.comments),
      })),
    };
  }, [fullComponentWatch, previewData]);

  const previewDocumentKey = syncedPreviewData
    ? JSON.stringify(syncedPreviewData)
    : "create-order-preview-empty";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>
          {triggerLabel ?? "Add New Order"}
          {!isEditMode && <Plus className="ml-1 h-4 w-4" />}
        </Button>
      </SheetTrigger>

      <SheetContent className="min-w-[100%] overflow-y-auto">
        {savingDraftOnClose && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-background/95 backdrop-blur-sm">
            <AdminLoaderScreen
              title="Saving order in draft"
              description="Please wait. You will return to the orders page after the draft is saved."
              className="min-h-screen bg-transparent"
            />
          </div>
        )}

        <SheetHeader>
          <SheetTitle>{isEditMode ? "Edit Order" : "Add New Order"}</SheetTitle>
          <SheetDescription>
            {isEditMode
              ? "Update the fields that need to change"
              : "Fill in the form below to add an order"}
          </SheetDescription>
        </SheetHeader>

        {/* ── Form ── */}
        <CreateOrderFormFields
          form={form}
          fields={fields}
          fullComponentWatch={fullComponentWatch}
          colors={colors}
          productCategories={productCategories}
          productSubCategories={productSubCategories}
          currencies={currencies}
          colorTypeArray={colorTypeArray}
          sizeCountryArray={sizeCountryArray}
          formattedCustomers={formattedCustomers}
          selectedCustomer={selectedCustomer}
          productDetailsByStyleNo={productDetailsByStyleNo}
          customOrderType={customOrderType}
          setCustomOrderType={setCustomOrderType}
          orderTypeArrayState={orderTypeArrayState}
          setOrderTypeArrayState={setOrderTypeArrayState}
          loading={loading}
          previewLoading={previewLoading}
          submitLabel={isEditMode ? "Update Order" : "Create Order"}
          uploadedFile={uploadedFile}
          uploadedFileType={uploadedFileType}
          setUploadedFile={setUploadedFile}
          onSubmit={onSubmit}
          onSaveDraft={onSaveDraft}
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
                  {uploadedFileType === "ppt" && (
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
                  )}
                </div>
              </div>

              {/* PDF — render inline */}
              {uploadedFileType === "pdf" && uploadedFileObjectUrl && (
                <PdfPreview
                  file={uploadedFile}
                  fileName={uploadedFile?.name ?? "order-document.pdf"}
                  heightClassName="h-[75vh]"
                />
              )}

              {uploadedFileType === "ppt" && (
                <PptPreview
                  url={uploadedFileObjectUrl}
                  file={uploadedFile}
                  fileName={uploadedFile?.name ?? "order-presentation.pptx"}
                  heightClassName="h-[75vh]"
                />
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
              </div>

              <PdfPreview
                key={`viewer-${previewDocumentKey}`}
                sourceDocument={
                  <RetailerPdf
                    key={`viewer-document-${previewDocumentKey}`}
                    orderData={syncedPreviewData}
                  />
                }
                fileName={`${syncedPreviewData.purchaseOrderNo}.pdf`}
                heightClassName="h-[75vh]"
                extraActions={
                  <Button
                    type="button"
                    className="inline-flex min-h-[38px] items-center rounded bg-green-600 px-3 py-2 text-xs font-medium text-white hover:bg-green-700"
                    onClick={() => downloadOrderPPT(syncedPreviewData)}
                  >
                    Download PPT
                  </Button>
                }
              />
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CreateOrder;
