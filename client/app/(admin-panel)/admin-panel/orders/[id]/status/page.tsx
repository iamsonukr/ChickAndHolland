"use client";

import {
  FormEvent,
  use,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { API_URL } from "@/lib/constants";

import StatusLabelBox from "@/components/StatusLabelBox";
import StatusLabelBox1 from "@/components/StoreLable";
import StatusScannerButton from "./StatusScannerButton";
import ExportOrdersButton from "../../ExportOrdersButton";

import LabelPdf from "@/components/LabelPdf";
import LabelSheetPdf from "@/components/LabelSheetPdf";
import LabelPdf1 from "@/components/LabelBox";
import AdminLoaderScreen from "@/components/custom/admin-panel/AdminLoaderScreen";
import StageCountDropdown from "@/components/custom/admin-panel/StageCountDropdown";
import { normalizeBarcodeValue } from "@/lib/barcodes";
import GoBackButton from "@/components/GoBackButton";
import { formatEuSizeText } from "@/lib/sizeConversion";
import { PdfDownloadButton } from "@/components/pdf/PdfPreview";
import { downloadStatusLabelPPT } from "@/lib/utils/exportStatusLabelPPT";
import { pdf } from "@react-pdf/renderer";
import useHttp from "@/lib/hooks/usePost";
import { Button } from "@/components/custom/button";
import { PasswordInput } from "@/components/custom/password-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DEFAULT_ORDER_STAGE, ORDER_STAGE_FLOW } from "@/lib/stageFlow";

const formatReportValue = (value: unknown) => String(value ?? "").trim() || "-";

const getCurrentStageLabel = (progress: any[]) => {
  const sorted = [...progress].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  const currentStage = sorted[sorted.length - 1];

  return String(
    currentStage?.stage || currentStage?.status || DEFAULT_ORDER_STAGE,
  );
};

const formatReportSize = (item: any) =>
  formatEuSizeText(item, { includeUnit: false });

const getReportQrBoxColor = (item: any) =>
  String(
    item?.meshColor ||
      item?.meshColorRaw ||
      item?.qrBoxColor ||
      item?.color ||
      item?.mesh_color ||
      "",
  );

type ReportType = "RETAILER" | "STORE" | "STOCK";

interface NormalizedItem {
  raw: any;
  type: ReportType;
}

const TYPE_BADGE: Record<ReportType, string> = {
  RETAILER: "bg-blue-100 text-blue-700 border-blue-200",
  STORE: "bg-green-100 text-green-700 border-green-200",
  STOCK: "bg-purple-100 text-purple-700 border-purple-200",
};

const TYPE_RING: Record<ReportType, string> = {
  RETAILER: "ring-blue-400",
  STORE: "ring-green-400",
  STOCK: "ring-purple-400",
};

const TYPE_DOT: Record<ReportType, string> = {
  RETAILER: "bg-blue-500",
  STORE: "bg-green-500",
  STOCK: "bg-purple-500",
};

/* ─────────────────────────────────────────────
   Bulk label sheet PDF helpers
───────────────────────────────────────────── */
async function mergeAndDownloadPdfs(items: NormalizedItem[], fileName: string) {
  const blob = await pdf(
    <LabelSheetPdf items={items.map(({ raw }) => raw)} />,
  ).toBlob();
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

async function mergeAndPrintPdfs(items: NormalizedItem[]) {
  const blob = await pdf(
    <LabelSheetPdf items={items.map(({ raw }) => raw)} />,
  ).toBlob();
  const url = URL.createObjectURL(blob);

  const printTab = window.open(url, "_blank");
  if (!printTab) {
    const a = document.createElement("a");
    a.href = url;
    a.download = "selected-labels.pdf";
    a.click();
  } else {
    printTab.addEventListener("load", () => {
      try {
        printTab.print();
      } catch {}
    });
  }

  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/* ─────────────────────────────────────────────
   Bulk Action Bar
───────────────────────────────────────────── */
function BulkActionBar({
  selected,
  total,
  allSelected,
  onSelectAll,
  onClearAll,
  onDownloadAll,
  onPrintAll,
  onResetSelected,
  downloading,
  printing,
  resetting,
}: {
  selected: number;
  total: number;
  allSelected: boolean;
  onSelectAll: () => void;
  onClearAll: () => void;
  onDownloadAll: () => void;
  onPrintAll: () => void;
  onResetSelected: () => void;
  downloading: boolean;
  printing: boolean;
  resetting: boolean;
}) {
  if (selected === 0) return null;

  return (
    <div className="sticky top-0 z-30 mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white/95 px-3 py-2 shadow-md backdrop-blur">
      {/* Count */}
      <span className="text-xs font-semibold text-gray-700">
        {selected} of {total} selected
      </span>

      <div className="ml-auto flex flex-wrap gap-1.5">
        {/* Select / Deselect all */}
        <button
          onClick={allSelected ? onClearAll : onSelectAll}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          {allSelected ? "Deselect all" : "Select all"}
        </button>

        {/* Clear selection */}
        <button
          onClick={onClearAll}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-50"
        >
          Clear
        </button>

        {/* Download all selected */}
        <button
          onClick={onDownloadAll}
          disabled={downloading || resetting}
          className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-gray-700 disabled:opacity-60"
        >
          {downloading ? "Generating…" : `Download PDF (${selected})`}
        </button>

        {/* Print all selected */}
        <button
          onClick={onPrintAll}
          disabled={printing || resetting}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-60"
        >
          {printing ? "Preparing…" : `Print (${selected})`}
        </button>

        <button
          onClick={onResetSelected}
          disabled={resetting}
          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-60"
        >
          {resetting ? "Resetting..." : `Reset QR (${selected})`}
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   ProgressPopup (unchanged)
───────────────────────────────────────────── */
function ProgressPopup({
  progress,
  onClose,
}: {
  progress: any[];
  onClose: () => void;
}) {
  const sorted = [...progress].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[80vh] w-full max-w-sm space-y-4 overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl sm:p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">Stage History</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-11 w-11 items-center justify-center rounded-full text-xl leading-none text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            ×
          </button>
        </div>
        <ol className="relative space-y-4 border-l border-gray-200 pl-4">
          {sorted.map((p, i) => (
            <li key={p.id ?? i} className="relative">
              <span
                className={`absolute -left-[19px] top-1 h-3 w-3 rounded-full border-2 border-white ${
                  i === sorted.length - 1
                    ? "animate-pulse bg-green-500"
                    : "bg-gray-300"
                }`}
              />
              <p className="break-words text-xs font-medium text-gray-800">
                {p.stage || p.status}
              </p>
              <p className="mt-0.5 text-[10px] text-gray-400">
                {new Date(p.createdAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
                {" · "}
                {new Date(p.createdAt).toLocaleTimeString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Single-item Print button
───────────────────────────────────────────── */
function PrintPdfButton({
  item,
  className,
}: {
  item: any;
  className?: string;
}) {
  const [printing, setPrinting] = useState(false);

  const handlePrint = async () => {
    setPrinting(true);
    try {
      const blob = await pdf(<LabelPdf item={item} />).toBlob();
      const blobUrl = URL.createObjectURL(blob);
      const printTab = window.open(blobUrl, "_blank");
      if (!printTab) {
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = `${item.styleNo ?? "label"}-print.pdf`;
        a.click();
        URL.revokeObjectURL(blobUrl);
        return;
      }
      printTab.addEventListener("load", () => {
        try {
          printTab.print();
        } catch {}
      });
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } catch (err) {
      console.error("Print failed:", err);
    } finally {
      setPrinting(false);
    }
  };

  return (
    <button
      type="button"
      className={className}
      disabled={printing}
      onClick={handlePrint}
    >
      {printing ? "Preparing…" : "Print"}
    </button>
  );
}

/* ─────────────────────────────────────────────
   ItemCard — now accepts isSelected + onToggle
───────────────────────────────────────────── */
function ItemCard({
  raw,
  type,
  onRefresh,
  isSelected,
  onToggle,
  onResetOne,
}: NormalizedItem & {
  onRefresh: () => void;
  isSelected: boolean;
  onToggle: () => void;
  onResetOne: () => void;
}) {
  const [showProgress, setShowProgress] = useState(false);
  const [comment, setComment] = useState(String(raw.comment ?? ""));

  const barcode = normalizeBarcodeValue(raw.barcode);
  const LabelComponent = type === "STORE" ? StatusLabelBox1 : StatusLabelBox;
  const { executeAsync: saveQrComment, loading: savingComment } = useHttp(
    "/admin-scan/barcodes/comment",
    "POST",
  );

  const progress: any[] = raw.progress ?? [];
  const currentStageLabel = getCurrentStageLabel(progress);

  useEffect(() => {
    setComment(String(raw.comment ?? ""));
  }, [raw.comment, raw.barcode]);

  const handleSaveComment = async () => {
    if (!barcode) {
      toast.error("This QR item does not have a valid barcode");
      return;
    }

    try {
      await saveQrComment(
        {
          barcode,
          orderType: type,
          comment,
        },
        {},
        (error) => toast.error(error?.message ?? "Failed to save comment"),
      );
      toast.success("QR comment saved");
      await onRefresh();
    } catch (error: any) {
      if (!error?.message) {
        toast.error("Failed to save comment");
      }
    }
  };

  return (
    <>
      {showProgress && (
        <ProgressPopup
          progress={progress}
          onClose={() => setShowProgress(false)}
        />
      )}

      <div
        className={`relative flex w-[240px] flex-shrink-0 flex-col gap-2.5 rounded-lg border bg-white p-2.5 shadow-sm ring-1 transition-all sm:p-3 ${isSelected ? `${TYPE_RING[type]} ring-2` : "ring-gray-200"}`}
      >
        {/* ── Checkbox (top-left) ── */}
        <button
          onClick={onToggle}
          aria-label={isSelected ? "Deselect item" : "Select item"}
          className={`absolute left-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
            isSelected
              ? "border-blue-500 bg-blue-500"
              : "border-gray-300 bg-white hover:border-blue-400"
          }`}
        >
          {isSelected && (
            <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
              <path
                d="M2 6l3 3 5-5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>

        {/* Header row: badge + size (offset for checkbox) */}
        <div className="flex items-center justify-between gap-2 pl-6">
          <span
            className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold ${TYPE_BADGE[type]}`}
          >
            {type}
          </span>
          <div className="min-w-0 text-right">
            <p className="mb-0.5 text-[9px] uppercase leading-none tracking-wide text-muted-foreground">
              Size
            </p>
            <p className="break-words text-xs font-medium leading-none">
              {formatReportSize(raw)}
            </p>
          </div>
        </div>

        {/* Style No */}
        <div className="min-w-0">
          <p className="mb-0.5 text-[9px] uppercase leading-none tracking-wide text-muted-foreground">
            Style No
          </p>
          <p className="break-words text-xs font-bold leading-tight text-foreground sm:text-sm">
            {formatReportValue(raw.styleNo)}
          </p>
        </div>

        {/* Stage button */}
        <button
          onClick={() => progress.length > 0 && setShowProgress(true)}
          className={`flex min-h-[36px] w-full items-center gap-1.5 rounded-md px-2 py-2 text-left transition-colors ${
            progress.length > 0
              ? "cursor-pointer bg-gray-50 hover:bg-gray-100"
              : "cursor-default bg-gray-50"
          }`}
        >
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${progress.length ? TYPE_DOT[type] : "bg-gray-300"}`}
          />
          <span className="flex-1 break-words text-[11px] font-medium text-gray-700">
            {currentStageLabel}
          </span>
          {progress.length > 1 && (
            <span className="shrink-0 text-[9px] text-gray-400">
              {progress.length} ›
            </span>
          )}
        </button>

        {/* Actions */}
        <div className="mt-auto flex flex-col gap-1.5 border-t pt-2">
          <div className="space-y-1.5">
            <Label
              htmlFor={`qr-comment-${type}-${raw.styleId ?? raw.id ?? barcode}`}
              className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Comment
            </Label>
            <Textarea
              id={`qr-comment-${type}-${raw.styleId ?? raw.id ?? barcode}`}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              maxLength={1000}
              rows={3}
              placeholder="Add comment..."
              className="min-h-[64px] resize-none text-xs"
            />
            <Button
              type="button"
              onClick={handleSaveComment}
              loading={savingComment}
              disabled={savingComment}
              className="min-h-[32px] w-full rounded-md px-2 py-1.5 text-[11px]"
            >
              Save Comment
            </Button>
          </div>
          <div className="w-full">
            <StatusScannerButton
              barcode={barcode}
              orderType={type}
              onScanned={onRefresh}
            />
          </div>
          <div className="w-full">
            <LabelComponent item={raw} orderType={type} />
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <PdfDownloadButton
              sourceDocument={<LabelPdf item={raw} />}
              fileName={`${raw.styleNo}-label.pdf`}
              className="min-h-[36px] w-full rounded-md bg-black px-2 py-2 text-[11px] font-medium text-white hover:bg-gray-900 disabled:opacity-70"
              label="Download PDF"
              loadingLabel="Generating..."
            />
            <PrintPdfButton
              item={raw}
              className="min-h-[36px] w-full rounded-md bg-gray-700 px-2 py-2 text-[11px] font-medium text-white hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-70"
            />
          </div>
          <button
            type="button"
            onClick={onResetOne}
            className="min-h-[36px] w-full rounded-md border border-red-200 bg-red-50 px-2 py-2 text-[11px] font-medium text-red-700 hover:bg-red-100"
          >
            Reset QR
          </button>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────
   Page
───────────────────────────────────────────── */
export default function OrderStatusPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const orderSource = searchParams?.get("source");
  const orderType = searchParams?.get("type");

  const [allItems, setAllItems] = useState<NormalizedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // ── Selection state ──
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [bulkDownloading, setBulkDownloading] = useState(false);
  const [bulkPrinting, setBulkPrinting] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetPassword, setResetPassword] = useState("");

  const { executeAsync: resetSelectedQrItems, loading: resettingQrItems } =
    useHttp("/admin-scan/barcodes/reset", "POST");

  const getItemKey = (raw: any, type: ReportType, i: number) =>
    `${type}-${raw.styleId ?? raw.id ?? i}`;

  const fetchReport = useCallback(async () => {
    setLoading(true);
    const collected: NormalizedItem[] = [];

    const fetchAndCollect = async (url: string, type: ReportType) => {
      try {
        const res = await fetch(url);
        const json = await res.json();
        if (json.success) {
          (json.data || []).forEach((item: any) =>
            collected.push({ raw: item, type }),
          );
        }
      } catch {}
    };

    if (orderSource === "regular") {
      await fetchAndCollect(
        `${API_URL}/orders/store-status/report/${id}`,
        "STORE",
      );
    } else if (orderSource === "retailer" && orderType === "Stock") {
      await fetchAndCollect(
        `${API_URL}/report/stock-status/report/${id}`,
        "STOCK",
      );
    } else if (orderSource === "retailer") {
      await fetchAndCollect(
        `${API_URL}/report/status/report/${id}`,
        "RETAILER",
      );
    } else {
      await Promise.all([
        fetchAndCollect(`${API_URL}/report/status/report/${id}`, "RETAILER"),
        fetchAndCollect(`${API_URL}/orders/store-status/report/${id}`, "STORE"),
        fetchAndCollect(`${API_URL}/report/stock-status/report/${id}`, "STOCK"),
      ]);
    }

    setAllItems(collected);
    setLoading(false);
  }, [id, orderSource, orderType]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  if (loading) {
    return (
      <AdminLoaderScreen
        className="min-h-[70vh]"
        title="Loading order status"
        description="Fetching barcode progress, status labels, and scan history."
      />
    );
  }

  if (!allItems.length) return <p className="p-4 sm:p-6">No report found</p>;

  const q = search.toLowerCase();
  const filtered = allItems.filter(({ raw }) => {
    const styleNo = String(raw.styleNo ?? "").toLowerCase();
    const size = formatReportSize(raw).toLowerCase();
    return styleNo.includes(q) || size.includes(q);
  });
  const stageCounts = ORDER_STAGE_FLOW.reduce<Record<string, number>>(
    (counts, stage) => {
      counts[stage] = 0;
      return counts;
    },
    {},
  );
  filtered.forEach(({ raw }) => {
    const progress: any[] = raw.progress ?? [];
    const itemStatus = getCurrentStageLabel(progress);
    stageCounts[itemStatus] = (stageCounts[itemStatus] ?? 0) + 1;
  });
  const statusOptions = [
    {
      value: "ALL",
      label: "All Status",
      count: filtered.length,
    },
    ...ORDER_STAGE_FLOW.map((stage) => ({
      value: stage,
      label: stage,
      count: stageCounts[stage] ?? 0,
    })),
  ];

  // Apply status filter
  const statusFiltered =
    selectedStatus === "ALL"
      ? filtered
      : filtered.filter(({ raw }) => {
          const progress: any[] = raw.progress ?? [];
          const itemStatus = getCurrentStageLabel(progress).toLowerCase();
          return itemStatus === selectedStatus.toLowerCase();
        });

  // ── Helpers ──
  const filteredKeys = statusFiltered.map(({ raw, type }, i) =>
    getItemKey(raw, type, i),
  );
  const allSelected =
    filteredKeys.length > 0 && filteredKeys.every((k) => selectedKeys.has(k));

  const toggleItem = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const selectAll = () => setSelectedKeys(new Set(filteredKeys));
  const clearAll = () => setSelectedKeys(new Set());

  const selectedItems = statusFiltered.filter((_, i) =>
    selectedKeys.has(filteredKeys[i]),
  );
  const statusExportRows = statusFiltered.map(({ raw }) => {
    const progress: any[] = raw.progress ?? [];

    return {
      "Style No": raw.styleNo ?? "",
      Size: formatReportSize(raw),
      Quantity: raw.quantity ?? raw.totalQty ?? 1,
      Color: getReportQrBoxColor(raw),
      "PO Number": raw.purchaseOrderNo ?? raw.purchaeOrderNo ?? "",
      Beader: raw.beader ?? "",
      "Product Status": getCurrentStageLabel(progress),
    };
  });

  const handleBulkDownload = async () => {
    if (!selectedItems.length) return;
    setBulkDownloading(true);
    try {
      await mergeAndDownloadPdfs(selectedItems, "selected-labels.pdf");
    } finally {
      setBulkDownloading(false);
    }
  };

  const handleBulkPrint = async () => {
    if (!selectedItems.length) return;
    setBulkPrinting(true);
    try {
      await mergeAndPrintPdfs(selectedItems);
    } finally {
      setBulkPrinting(false);
    }
  };

  const openResetDialog = () => {
    if (!selectedItems.length) {
      toast.error("Select at least one QR item to reset");
      return;
    }

    setResetDialogOpen(true);
  };

  const openSingleResetDialog = (key: string) => {
    setSelectedKeys(new Set([key]));
    setResetDialogOpen(true);
  };

  const handleResetSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const items = selectedItems
      .map(({ raw, type }) => ({
        barcode: normalizeBarcodeValue(raw.barcode),
        orderType: type,
      }))
      .filter((item) => item.barcode);

    if (!items.length) {
      toast.error("Selected QR items do not have valid barcodes");
      return;
    }

    if (!resetPassword.trim()) {
      toast.error("Reset password is required");
      return;
    }

    try {
      const response = await resetSelectedQrItems(
        {
          password: resetPassword,
          items,
        },
        {},
        (error) => toast.error(error?.message ?? "Reset failed"),
      );

      toast.success(response?.message ?? "Selected QR reset successfully");
      setResetPassword("");
      setResetDialogOpen(false);
      clearAll();
      await fetchReport();
    } catch (error: any) {
      if (!error?.message) {
        toast.error("Reset failed");
      }
    }
  };

  return (
    <div className="px-3 py-4 sm:p-4 md:p-6">
      <div className="rounded-lg bg-white p-3 shadow sm:p-4 md:p-6">
        <div className="mb-4 flex flex-col gap-3 sm:mb-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <GoBackButton className="mb-2" label="Back to Orders" />
              <h1 className="break-words text-xl font-bold sm:text-2xl">
                Order Status Report
              </h1>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                Total items: {filtered.length}
              </p>
            </div>
              <div className="flex w-full flex-col gap-2 lg:w-auto lg:flex-row lg:items-center">
                <input
                  type="text"
                  placeholder="Search by style no or size..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 sm:w-72 md:w-80"
                />

                <StageCountDropdown
                  options={statusOptions}
                  value={selectedStatus}
                  onChange={setSelectedStatus}
                />
                <ExportOrdersButton
                  rows={statusExportRows}
                  fileName={`order-${id}-status-products-${new Date()
                    .toISOString()
                    .slice(0, 10)}.xlsx`}
                  emptyMessage="No products found for the current status filters"
                  successMessage="Status products exported successfully"
                />
              </div>
          </div>
        </div>

        {/* Type badges */}
        <div className="mb-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
          {(["RETAILER", "STORE", "STOCK"] as ReportType[]).map((t) => {
            const count = filtered.filter((i) => i.type === t).length;
            if (!count) return null;
            return (
              <span
                key={t}
                className={`rounded-full border px-2.5 py-1 font-medium ${TYPE_BADGE[t]}`}
              >
                {t}: {count}
              </span>
            );
          })}
          {filtered.length === 0 && <span>No results</span>}
        </div>

        {/* ── Sticky Bulk Action Bar ── */}
          <BulkActionBar
          selected={selectedItems.length}
          total={statusFiltered.length}
          allSelected={allSelected}
          onSelectAll={selectAll}
          onClearAll={clearAll}
          onDownloadAll={handleBulkDownload}
          onPrintAll={handleBulkPrint}
          onResetSelected={openResetDialog}
          downloading={bulkDownloading}
          printing={bulkPrinting}
          resetting={resettingQrItems}
        />

        <Dialog
          open={resetDialogOpen}
          onOpenChange={(nextOpen) => {
            setResetDialogOpen(nextOpen);
            if (!nextOpen) setResetPassword("");
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset QR Progress</DialogTitle>
              <DialogDescription>
                {selectedItems.length} selected QR
                {selectedItems.length === 1 ? "" : "s"} will be reset to
                Pattern.
              </DialogDescription>
            </DialogHeader>

            <form className="space-y-4" onSubmit={handleResetSubmit}>
              <div className="space-y-2">
                <Label htmlFor={`reset-selected-qr-password-${id}`}>
                  Reset Password
                </Label>
                <PasswordInput
                  id={`reset-selected-qr-password-${id}`}
                  value={resetPassword}
                  onChange={(event) => setResetPassword(event.target.value)}
                  autoComplete="current-password"
                  autoFocus
                />
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  type="submit"
                  variant="destructive"
                  loading={resettingQrItems}
                  disabled={!resetPassword.trim() || !selectedItems.length}
                >
                  Reset
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 3xl:grid-cols-6 4xl:grid-cols-8  ">
          {statusFiltered.map(({ raw, type }, i) => {
            const key = getItemKey(raw, type, i);
            return (
              <ItemCard
                key={key}
                raw={raw}
                type={type}
                onRefresh={fetchReport}
                isSelected={selectedKeys.has(key)}
                onToggle={() => toggleItem(key)}
                onResetOne={() => openSingleResetDialog(key)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
