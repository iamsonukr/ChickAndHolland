"use client";

import { FormEvent, use, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { API_URL } from "@/lib/constants";

import StatusLabelBox from "@/components/StatusLabelBox";
import StatusLabelBox1 from "@/components/StoreLable";
import StatusScannerButton from "./StatusScannerButton";

import LabelPdf from "@/components/LabelPdf";
import LabelPdf1 from "@/components/LabelBox";
import AdminLoaderScreen from "@/components/custom/admin-panel/AdminLoaderScreen";
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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const formatReportValue = (value: unknown) =>
  String(value ?? "").trim() || "-";

const formatReportSize = (item: any) =>
  formatEuSizeText(item, { includeUnit: false });

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
   Merge multiple PDF blobs into one using
   pdf-lib (no extra dep needed if you already
   have it; otherwise install pdf-lib).
   Falls back to sequential individual downloads
   if pdf-lib isn't available.
───────────────────────────────────────────── */
async function mergeAndDownloadPdfs(items: NormalizedItem[], fileName: string) {
  // Generate all blobs in parallel
  const blobs = await Promise.all(
    items.map(({ raw }) => pdf(<LabelPdf item={raw} />).toBlob())
  );

  try {
    // Try to merge with pdf-lib
    // @ts-expect-error pdf-lib is optional; the fallback below handles missing installs.
    const { PDFDocument } = await import("pdf-lib");
    const merged = await PDFDocument.create();

    for (const blob of blobs) {
      const arrayBuffer = await blob.arrayBuffer();
      const doc = await PDFDocument.load(arrayBuffer);
      const pages = await merged.copyPages(doc, doc.getPageIndices());
      pages.forEach((p: any) => merged.addPage(p));
    }

    const mergedBytes = await merged.save();
    const mergedBlob = new Blob([mergedBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(mergedBlob);

    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  } catch {
    // pdf-lib not available — download individually
    for (let i = 0; i < blobs.length; i++) {
      const url = URL.createObjectURL(blobs[i]);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${items[i].raw.styleNo ?? i}-label.pdf`;
      a.click();
      await new Promise((r) => setTimeout(r, 300)); // stagger downloads
      URL.revokeObjectURL(url);
    }
  }
}

async function mergeAndPrintPdfs(items: NormalizedItem[]) {
  const blobs = await Promise.all(
    items.map(({ raw }) => pdf(<LabelPdf item={raw} />).toBlob())
  );

  try {
    // @ts-expect-error pdf-lib is optional; the fallback below handles missing installs.
    const { PDFDocument } = await import("pdf-lib");
    const merged = await PDFDocument.create();

    for (const blob of blobs) {
      const arrayBuffer = await blob.arrayBuffer();
      const doc = await PDFDocument.load(arrayBuffer);
      const pages = await merged.copyPages(doc, doc.getPageIndices());
      pages.forEach((p: any) => merged.addPage(p));
    }

    const mergedBytes = await merged.save();
    const mergedBlob = new Blob([mergedBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(mergedBlob);

    const printTab = window.open(url, "_blank");
    if (!printTab) {
      // Pop-up blocked — download instead
      const a = document.createElement("a");
      a.href = url;
      a.download = "selected-labels.pdf";
      a.click();
    } else {
      printTab.addEventListener("load", () => {
        try { printTab.print(); } catch {}
      });
    }
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch {
    // Fallback: open each PDF in a new tab
    for (const blob of blobs) {
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      await new Promise((r) => setTimeout(r, 400));
    }
  }
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
    <div className="sticky top-0 z-30 mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white/95 backdrop-blur px-3 py-2 shadow-md">
      {/* Count */}
      <span className="text-xs font-semibold text-gray-700">
        {selected} of {total} selected
      </span>

      <div className="flex flex-wrap gap-1.5 ml-auto">
        {/* Select / Deselect all */}
        <button
          onClick={allSelected ? onClearAll : onSelectAll}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          {allSelected ? "Deselect all" : "Select all"}
        </button>

        {/* Clear selection */}
        <button
          onClick={onClearAll}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors"
        >
          Clear
        </button>

        {/* Download all selected */}
        <button
          onClick={onDownloadAll}
          disabled={downloading || resetting}
          className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-60 transition-colors"
        >
          {downloading ? "Generating…" : `Download PDF (${selected})`}
        </button>

        {/* Print all selected */}
        <button
          onClick={onPrintAll}
          disabled={printing || resetting}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-60 transition-colors"
        >
          {printing ? "Preparing…" : `Print (${selected})`}
        </button>

        <button
          onClick={onResetSelected}
          disabled={resetting}
          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500 disabled:opacity-60 transition-colors"
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
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-4 sm:p-5 shadow-2xl space-y-4 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">Stage History</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="h-11 w-11 flex items-center justify-center rounded-full text-xl leading-none text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            ×
          </button>
        </div>
        <ol className="relative border-l border-gray-200 space-y-4 pl-4">
          {sorted.map((p, i) => (
            <li key={p.id ?? i} className="relative">
              <span
                className={`absolute -left-[19px] top-1 w-3 h-3 rounded-full border-2 border-white ${
                  i === sorted.length - 1 ? "bg-green-500 animate-pulse" : "bg-gray-300"
                }`}
              />
              <p className="text-xs font-medium text-gray-800 break-words">
                {p.stage || p.status}
              </p>
              <p className="mt-0.5 text-[10px] text-gray-400">
                {new Date(p.createdAt).toLocaleDateString("en-GB", {
                  day: "2-digit", month: "short", year: "numeric",
                })}
                {" · "}
                {new Date(p.createdAt).toLocaleTimeString("en-GB", {
                  hour: "2-digit", minute: "2-digit",
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
function PrintPdfButton({ item, className }: { item: any; className?: string }) {
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
        try { printTab.print(); } catch {}
      });
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } catch (err) {
      console.error("Print failed:", err);
    } finally {
      setPrinting(false);
    }
  };

  return (
    <button type="button" className={className} disabled={printing} onClick={handlePrint}>
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

  const barcode = normalizeBarcodeValue(raw.barcode);
  const LabelComponent = type === "STORE" ? StatusLabelBox1 : StatusLabelBox;

  const progress: any[] = raw.progress ?? [];
  const sorted = [...progress].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  const currentStage = sorted[sorted.length - 1];

  return (
    <>
      {showProgress && (
        <ProgressPopup progress={progress} onClose={() => setShowProgress(false)} />
      )}

      <div
  className={`rounded-lg border bg-white shadow-sm ring-1 transition-all p-2.5 sm:p-3 flex flex-col gap-2.5 relative
    w-[240px] flex-shrink-0
    ${isSelected ? `${TYPE_RING[type]} ring-2` : "ring-gray-200"}`}
>
        {/* ── Checkbox (top-left) ── */}
        <button
          onClick={onToggle}
          aria-label={isSelected ? "Deselect item" : "Select item"}
          className={`absolute top-2 left-2 z-10 h-5 w-5 rounded border-2 flex items-center justify-center transition-colors
            ${isSelected
              ? "border-blue-500 bg-blue-500"
              : "border-gray-300 bg-white hover:border-blue-400"
            }`}
        >
          {isSelected && (
            <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        {/* Header row: badge + size (offset for checkbox) */}
        <div className="flex items-center justify-between gap-2 pl-6">
          <span className={`shrink-0 text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${TYPE_BADGE[type]}`}>
            {type}
          </span>
          <div className="min-w-0 text-right">
            <p className="text-[9px] text-muted-foreground uppercase tracking-wide leading-none mb-0.5">Size</p>
            <p className="text-xs font-medium break-words leading-none">{formatReportSize(raw)}</p>
          </div>
        </div>

        {/* Style No */}
        <div className="min-w-0">
          <p className="text-[9px] text-muted-foreground uppercase tracking-wide leading-none mb-0.5">Style No</p>
          <p className="font-bold text-xs sm:text-sm text-foreground break-words leading-tight">
            {formatReportValue(raw.styleNo)}
          </p>
        </div>

        {/* Stage button */}
        <button
          onClick={() => progress.length > 0 && setShowProgress(true)}
          className={`w-full flex items-center gap-1.5 rounded-md px-2 py-2 text-left transition-colors min-h-[36px] ${
            progress.length > 0 ? "bg-gray-50 hover:bg-gray-100 cursor-pointer" : "bg-gray-50 cursor-default"
          }`}
        >
          <span className={`shrink-0 h-2 w-2 rounded-full ${currentStage ? TYPE_DOT[type] : "bg-gray-300"}`} />
          <span className="text-[11px] font-medium text-gray-700 flex-1 break-words">
            {currentStage ? currentStage.stage || currentStage.status : "No stages"}
          </span>
          {progress.length > 1 && (
            <span className="text-[9px] text-gray-400 shrink-0">{progress.length} ›</span>
          )}
        </button>

        {/* Actions */}
        <div className="mt-auto flex flex-col gap-1.5 pt-2 border-t">
          <div className="w-full">
            <StatusScannerButton barcode={barcode} orderType={type} onScanned={onRefresh} />
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
              className="min-h-[36px] w-full rounded-md bg-gray-700 px-2 py-2 text-[11px] font-medium text-white hover:bg-gray-600 disabled:opacity-70 disabled:cursor-not-allowed"
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
          (json.data || []).forEach((item: any) => collected.push({ raw: item, type }));
        }
      } catch {}
    };

    if (orderSource === "regular") {
      await fetchAndCollect(`${API_URL}/orders/store-status/report/${id}`, "STORE");
    } else if (orderSource === "retailer" && orderType === "Stock") {
      await fetchAndCollect(`${API_URL}/report/stock-status/report/${id}`, "STOCK");
    } else if (orderSource === "retailer") {
      await fetchAndCollect(`${API_URL}/report/status/report/${id}`, "RETAILER");
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

  useEffect(() => { fetchReport(); }, [fetchReport]);

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

  // ── Helpers ──
  const filteredKeys = filtered.map(({ raw, type }, i) => getItemKey(raw, type, i));
  const allSelected = filteredKeys.length > 0 && filteredKeys.every((k) => selectedKeys.has(k));

  const toggleItem = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const selectAll = () => setSelectedKeys(new Set(filteredKeys));
  const clearAll = () => setSelectedKeys(new Set());

  const selectedItems = filtered.filter((_, i) => selectedKeys.has(filteredKeys[i]));

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
      <div className="rounded-lg bg-white shadow p-3 sm:p-4 md:p-6">
        <div className="mb-4 sm:mb-5 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="min-w-0">
              <GoBackButton className="mb-2" label="Back to Orders" />
              <h1 className="text-xl sm:text-2xl font-bold break-words">Order Status Report</h1>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                Total items: {filtered.length}
              </p>
            </div>
            <div className="w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search by style no or size..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-72 md:w-80 rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
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
              <span key={t} className={`px-2.5 py-1 rounded-full border font-medium ${TYPE_BADGE[t]}`}>
                {t}: {count}
              </span>
            );
          })}
          {filtered.length === 0 && <span>No results</span>}
        </div>

        {/* ── Sticky Bulk Action Bar ── */}
        <BulkActionBar
          selected={selectedItems.length}
          total={filtered.length}
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
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {filtered.map(({ raw, type }, i) => {
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
