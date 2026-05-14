"use client";

import { use, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
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

const formatReportValue = (value: unknown) =>
  String(value ?? "").trim() || "-";

const formatReportSize = (item: any) =>
  formatEuSizeText(item, { includeUnit: false });

const getCommentsSummary = (variants: any[], fallback?: string) => {
  const uniqueComments = Array.from(
    new Set(
      variants
        .map((item) => String(item.comments ?? "").trim())
        .filter(Boolean),
    ),
  );

  return uniqueComments.join("\n") || fallback || "-";
};

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
                className={`absolute -left-[19px] top-1 w-3 h-3 rounded-full border-2 border-white ${i === sorted.length - 1
                    ? "bg-green-500 animate-pulse"
                    : "bg-gray-300"
                  }`}
              />
              <p className="text-xs font-medium text-gray-800 break-words">
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

function PptDownloadButton({
  item,
  orderType,
  className,
}: {
  item: any;
  orderType: ReportType;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    setFailed(false);

    try {
      await downloadStatusLabelPPT(item, orderType);
    } catch (error) {
      console.error("Failed to generate PPT download:", error);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      className={className}
      disabled={loading}
      onClick={handleDownload}
    >
      {loading ? "Generating..." : failed ? "Try again" : "Download PPT"}
    </button>
  );
}

function ItemCard({
  raw,
  type,
  onRefresh,
}: NormalizedItem & { onRefresh: () => void }) {
  const [showProgress, setShowProgress] = useState(false);

  const barcode = normalizeBarcodeValue(raw.barcode);
  const LabelComponent = type === "STORE" ? StatusLabelBox1 : StatusLabelBox;
  const PdfComponent = type === "STORE" ? LabelPdf : LabelPdf;

  const progress: any[] = raw.progress ?? [];
  const sorted = [...progress].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  const currentStage = sorted[sorted.length - 1];

  return (
    <>
      {showProgress && (
        <ProgressPopup
          progress={progress}
          onClose={() => setShowProgress(false)}
        />
      )}

      <div
        className={`rounded-xl border bg-white shadow-sm ring-1 ${TYPE_RING[type]} p-3 sm:p-4 flex flex-col gap-4 min-w-0`}
      >
        <div className="flex flex-col gap-3 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <span
              className={`shrink-0 text-[10px] font-semibold px-2 py-1 rounded-full border ${TYPE_BADGE[type]}`}
            >
              {type}
            </span>

            <div className="min-w-0 text-right">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                Size
              </p>
              <p className="text-xs sm:text-sm font-medium break-words">
                {formatReportSize(raw)}
              </p>
            </div>
          </div>

          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Style No
            </p>
            <p className="font-bold text-sm sm:text-base text-foreground break-words">
              {formatReportValue(raw.styleNo)}
            </p>
          </div>
        </div>

        <button
          onClick={() => progress.length > 0 && setShowProgress(true)}
          className={`w-full flex items-center gap-2 rounded-lg px-3 py-3 text-left transition-colors min-h-[44px] ${progress.length > 0
              ? "bg-gray-50 hover:bg-gray-100 cursor-pointer"
              : "bg-gray-50 cursor-default"
            }`}
        >
          <span
            className={`shrink-0 h-2.5 w-2.5 rounded-full ${currentStage ? TYPE_DOT[type] : "bg-gray-300"
              }`}
          />
          <span className="text-xs sm:text-sm font-medium text-gray-700 flex-1 break-words">
            {currentStage
              ? currentStage.stage || currentStage.status
              : "No stages"}
          </span>
          {progress.length > 1 && (
            <span className="text-[10px] text-gray-400 shrink-0">
              {progress.length} ›
            </span>
          )}
        </button>

        <div className="mt-auto flex flex-col gap-2 pt-3 border-t">
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

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <PdfDownloadButton
              sourceDocument={<PdfComponent item={raw} />}
              fileName={`${raw.styleNo}-label.pdf`}
              className="min-h-[44px] w-full rounded-lg bg-black px-3 py-3 text-xs font-medium text-white hover:bg-gray-900 disabled:opacity-70 sm:text-sm"
              label="Download PDF"
              loadingLabel="Generating..."
            />

            {/* <PptDownloadButton
              item={raw}
              orderType={type}
              className="min-h-[44px] w-full rounded-lg bg-green-600 px-3 py-3 text-xs font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70 sm:text-sm"
            /> */}
          </div>
        </div>
      </div>
    </>
  );
}

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

  const fetchReport = useCallback(async () => {
    setLoading(true);
    const collected: NormalizedItem[] = [];

    const fetchAndCollect = async (url: string, type: ReportType) => {
      try {
        const res = await fetch(url);
        const json = await res.json();

        if (json.success) {
          (json.data || []).forEach((item: any) =>
            collected.push({ raw: item, type })
          );
        }
      } catch { }
    };

    if (orderSource === "regular") {
      await fetchAndCollect(
        `${API_URL}/orders/store-status/report/${id}`,
        "STORE"
      );
    } else if (orderSource === "retailer" && orderType === "Stock") {
      await fetchAndCollect(
        `${API_URL}/report/stock-status/report/${id}`,
        "STOCK"
      );
    } else if (orderSource === "retailer") {
      await fetchAndCollect(
        `${API_URL}/report/status/report/${id}`,
        "RETAILER"
      );
    } else {
      await Promise.all([
        fetchAndCollect(`${API_URL}/report/status/report/${id}`, "RETAILER"),
        fetchAndCollect(
          `${API_URL}/orders/store-status/report/${id}`,
          "STORE"
        ),
        fetchAndCollect(
          `${API_URL}/report/stock-status/report/${id}`,
          "STOCK"
        ),
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

  return (

    <div className="px-3 py-4 sm:p-4 md:p-6">
      <div className="rounded-lg bg-white shadow p-3 sm:p-4 md:p-6">
        <div className="mb-5 sm:mb-6 flex flex-col gap-4">

          {/* Top Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

            {/* Left Section */}
            <div className="min-w-0">
              <GoBackButton className="mb-2" label="Back to Orders" />

              <h1 className="text-xl sm:text-2xl font-bold break-words">
                Order Status Report
              </h1>

              <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                Total items: {filtered.length}
              </p>
            </div>

            {/* Right Section (Search) */}
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


        <div className="mb-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
          {(["RETAILER", "STORE", "STOCK"] as ReportType[]).map((t) => {
            const count = filtered.filter((i) => i.type === t).length;
            if (!count) return null;

            return (
              <span
                key={t}
                className={`px-2.5 py-1 rounded-full border font-medium ${TYPE_BADGE[t]}`}
              >
                {t}: {count}
              </span>
            );
          })}

          {filtered.length === 0 && <span>No results</span>}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map(({ raw, type }, i) => (
            <ItemCard
              key={`${type}-${raw.styleId ?? i}`}
              raw={raw}
              type={type}
              onRefresh={fetchReport}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
