"use client";

import { pdf } from "@react-pdf/renderer";
import {
  Download,
  ExternalLink,
  FileWarning,
  Loader2,
  RotateCw,
} from "lucide-react";
import type { ReactElement, ReactNode } from "react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  PDFDocumentLoadingTask,
  PDFDocumentProxy,
  PDFPageProxy,
  RenderTask,
} from "pdfjs-dist/types/src/display/api";

import { cn } from "@/lib/utils";

type PdfJsModule = typeof import("pdfjs-dist");

let pdfJsPromise: Promise<PdfJsModule> | null = null;

function loadPdfJs() {
  if (!pdfJsPromise) {
    pdfJsPromise = import("pdfjs-dist").then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.js",
        import.meta.url,
      ).toString();
      return pdfjs;
    });
  }

  return pdfJsPromise;
}

type FileShareData = {
  files?: File[];
  title?: string;
  text?: string;
  url?: string;
};

type NavigatorWithFileShare = Navigator & {
  canShare?: (data: FileShareData) => boolean;
  share?: (data: FileShareData) => Promise<void>;
};

const PDF_MIME_TYPE = "application/pdf";
const AUTO_FALLBACK_DELAY_MS = 12000;
const MAX_CANVAS_PIXELS = 8_000_000;

function getPdfHostFlags() {
  const ua = navigator.userAgent || "";
  const isAndroid = /Android/i.test(ua);
  const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);
  const isGoogleApp = /\bGSA\/|GoogleApp/i.test(ua);
  const isAndroidWebView =
    isAndroid && (/\bwv\b|; wv\)|Version\/[\d.]+ Chrome\//i.test(ua));

  return { isAndroidWebView, isGoogleApp, isMobile };
}

function isRestrictedMobilePdfHost() {
  if (typeof navigator === "undefined") return false;

  const { isAndroidWebView, isGoogleApp, isMobile } = getPdfHostFlags();
  return isMobile || isGoogleApp || isAndroidWebView;
}

function shouldPreferFileShare() {
  if (typeof navigator === "undefined") return false;

  const { isAndroidWebView, isGoogleApp } = getPdfHostFlags();
  return isAndroidWebView || isGoogleApp;
}

function getPdfFileName(fileName?: string) {
  const fallback = "order-document.pdf";
  const cleanName = (fileName || fallback).trim() || fallback;
  return cleanName.toLowerCase().endsWith(".pdf")
    ? cleanName
    : `${cleanName}.pdf`;
}

function clickDownloadLink(href: string, fileName: string) {
  const link = document.createElement("a");
  link.href = href;
  link.download = getPdfFileName(fileName);
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

async function shareOrDownloadBlob(
  blob: Blob,
  fileName: string,
  preferShare = shouldPreferFileShare(),
) {
  const resolvedFileName = getPdfFileName(fileName);
  const nav = navigator as NavigatorWithFileShare;

  if (preferShare && typeof File !== "undefined" && nav.share && nav.canShare) {
    const file = new File([blob], resolvedFileName, { type: PDF_MIME_TYPE });
    const shareData = { files: [file], title: resolvedFileName };

    if (nav.canShare(shareData)) {
      try {
        await nav.share(shareData);
        return;
      } catch (error) {
        if ((error as DOMException)?.name === "AbortError") return;
      }
    }
  }

  const objectUrl = URL.createObjectURL(blob);
  clickDownloadLink(objectUrl, resolvedFileName);
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}

function getExternalHref(...hrefs: Array<string | null | undefined>) {
  return hrefs.find((href) => Boolean(href && href.trim())) || "";
}

interface PdfDownloadButtonProps {
  sourceDocument: ReactElement;
  fileName: string;
  className?: string;
  label?: ReactNode;
  loadingLabel?: ReactNode;
}

export function PdfDownloadButton({
  sourceDocument,
  fileName,
  className,
  label = "Download PDF",
  loadingLabel = "Generating...",
}: PdfDownloadButtonProps) {
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const handleDownload = useCallback(async () => {
    setLoading(true);
    setFailed(false);

    try {
      const blob = await pdf(sourceDocument as any).toBlob();
      const pdfBlob =
        blob.type === PDF_MIME_TYPE ? blob : new Blob([blob], { type: PDF_MIME_TYPE });
      await shareOrDownloadBlob(pdfBlob, fileName);
    } catch (error) {
      console.error("Failed to generate PDF download:", error);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [fileName, sourceDocument]);

  return (
    <button
      type="button"
      className={className}
      disabled={loading}
      onClick={handleDownload}
    >
      {loading ? loadingLabel : failed ? "Try again" : label}
    </button>
  );
}

interface PdfPageCanvasProps {
  pdfDocument: PDFDocumentProxy;
  pageNumber: number;
  containerWidth: number;
  onRendered: (pageNumber: number) => void;
}

function PdfPageCanvas({
  pdfDocument,
  pageNumber,
  containerWidth,
  onRendered,
}: PdfPageCanvasProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [shouldRender, setShouldRender] = useState(pageNumber <= 2);
  const [renderFailed, setRenderFailed] = useState(false);

  useEffect(() => {
    if (shouldRender) return;
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    if (!("IntersectionObserver" in window)) {
      setShouldRender(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldRender(true);
          observer.disconnect();
        }
      },
      { rootMargin: "1200px 0px" },
    );

    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [shouldRender]);

  useEffect(() => {
    if (!shouldRender || !containerWidth) return;

    let cancelled = false;
    let page: PDFPageProxy | null = null;
    let renderTask: RenderTask | null = null;

    const renderPage = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      try {
        setRenderFailed(false);
        page = await pdfDocument.getPage(pageNumber);
        if (cancelled) return;

        const baseViewport = page.getViewport({ scale: 1 });
        const cssScale = Math.max(containerWidth / baseViewport.width, 0.1);
        const viewport = page.getViewport({ scale: cssScale });
        const pixelRatio = Math.max(window.devicePixelRatio || 1, 1);
        const rawOutputScale = Math.min(pixelRatio, 2);
        const pagePixels = viewport.width * viewport.height;
        const outputScale = Math.max(
          1,
          Math.min(rawOutputScale, Math.sqrt(MAX_CANVAS_PIXELS / pagePixels)),
        );
        const context = canvas.getContext("2d", { alpha: false });

        if (!context) throw new Error("Canvas rendering is not available");

        const cssWidth = Math.max(1, Math.floor(viewport.width));
        const cssHeight = Math.max(1, Math.floor(viewport.height));

        canvas.width = Math.max(1, Math.floor(viewport.width * outputScale));
        canvas.height = Math.max(1, Math.floor(viewport.height * outputScale));
        canvas.style.width = `${cssWidth}px`;
        canvas.style.height = "auto";
        canvas.style.aspectRatio = `${cssWidth} / ${cssHeight}`;

        context.setTransform(outputScale, 0, 0, outputScale, 0, 0);
        context.clearRect(0, 0, viewport.width, viewport.height);

        renderTask = page.render({ canvasContext: context, viewport });
        await renderTask.promise;

        if (!cancelled) onRendered(pageNumber);
      } catch (error) {
        if ((error as Error)?.name !== "RenderingCancelledException") {
          console.error(`Failed to render PDF page ${pageNumber}:`, error);
          setRenderFailed(true);
        }
      } finally {
        page?.cleanup();
      }
    };

    renderPage();

    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [containerWidth, onRendered, pageNumber, pdfDocument, shouldRender]);

  return (
    <div ref={wrapperRef} className="flex justify-center px-2 py-3">
      {renderFailed ? (
        <div className="flex min-h-[220px] w-full max-w-[900px] items-center justify-center rounded border border-dashed bg-white text-sm text-muted-foreground">
          Page {pageNumber} could not be rendered.
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          aria-label={`PDF page ${pageNumber}`}
          className="block h-auto max-w-full rounded bg-white shadow-sm"
        />
      )}
    </div>
  );
}

interface PdfPreviewProps {
  sourceDocument?: ReactElement;
  file?: Blob | File | null;
  url?: string;
  openUrl?: string;
  downloadUrl?: string;
  fileName: string;
  className?: string;
  heightClassName?: string;
  showActions?: boolean;
  autoExternalFallback?: boolean;
  extraActions?: ReactNode;
}

export default function PdfPreview({
  sourceDocument,
  file,
  url,
  openUrl,
  downloadUrl,
  fileName,
  className,
  heightClassName = "h-[75vh]",
  showActions = true,
  autoExternalFallback = true,
  extraActions,
}: PdfPreviewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fallbackAttemptedRef = useRef(false);
  const renderedPagesRef = useRef(new Set<number>());
  const [containerWidth, setContainerWidth] = useState(0);
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );
  const [resolvedBlob, setResolvedBlob] = useState<Blob | null>(null);
  const [resolvedUrl, setResolvedUrl] = useState("");
  const [renderedPageCount, setRenderedPageCount] = useState(0);
  const [fallbackTriggered, setFallbackTriggered] = useState(false);

  const resolvedFileName = useMemo(() => getPdfFileName(fileName), [fileName]);
  const externalHref = getExternalHref(openUrl, resolvedUrl, url, downloadUrl);
  const downloadHref = getExternalHref(downloadUrl, resolvedUrl, url, openUrl);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateWidth = () => {
      setContainerWidth(Math.max(container.clientWidth - 16, 240));
    };

    updateWidth();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateWidth);
      return () => window.removeEventListener("resize", updateWidth);
    }

    const observer = new ResizeObserver(updateWidth);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!sourceDocument && !file && !url) {
      setStatus("idle");
      setPdfDocument(null);
      setPageCount(0);
      setResolvedBlob(null);
      setResolvedUrl("");
      return;
    }

    let cancelled = false;
    let objectUrlToRevoke = "";
    let loadingTask: PDFDocumentLoadingTask | null = null;
    let loadedDocument: PDFDocumentProxy | null = null;

    const loadDocument = async () => {
      setStatus("loading");
      setPdfDocument(null);
      setPageCount(0);
      setResolvedBlob(null);
      setResolvedUrl("");
      setRenderedPageCount(0);
      setFallbackTriggered(false);
      fallbackAttemptedRef.current = false;
      renderedPagesRef.current = new Set<number>();

      try {
        const pdfjs = await loadPdfJs();

        if (file || sourceDocument) {
          const blobSource = file ?? (await pdf(sourceDocument as any).toBlob());
          const pdfBlob =
            blobSource.type === PDF_MIME_TYPE
              ? blobSource
              : new Blob([blobSource], { type: PDF_MIME_TYPE });
          const buffer = await pdfBlob.arrayBuffer();

          objectUrlToRevoke = URL.createObjectURL(pdfBlob);
          loadingTask = pdfjs.getDocument({
            data: new Uint8Array(buffer),
            disableAutoFetch: false,
            disableStream: false,
            isEvalSupported: false,
            rangeChunkSize: 65_536,
          });

          if (!cancelled) {
            setResolvedBlob(pdfBlob);
            setResolvedUrl(objectUrlToRevoke);
          }
        } else if (url) {
          loadingTask = pdfjs.getDocument({
            url,
            disableAutoFetch: false,
            disableStream: false,
            isEvalSupported: false,
            rangeChunkSize: 65_536,
          });

          if (!cancelled) setResolvedUrl(url);
        }

        if (!loadingTask) return;

        loadedDocument = await loadingTask.promise;
        if (!loadedDocument || cancelled) return;

        setPdfDocument(loadedDocument);
        setPageCount(loadedDocument.numPages);
        setStatus("ready");
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to load PDF preview:", error);
        setStatus("error");
      }
    };

    loadDocument();

    return () => {
      cancelled = true;
      void loadingTask?.destroy();
      void loadedDocument?.destroy();
      if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
    };
  }, [file, sourceDocument, url]);

  const handlePageRendered = useCallback((pageNumber: number) => {
    if (renderedPagesRef.current.has(pageNumber)) return;
    renderedPagesRef.current.add(pageNumber);
    setRenderedPageCount(renderedPagesRef.current.size);
  }, []);

  const downloadPdf = useCallback(async () => {
    if (resolvedBlob) {
      await shareOrDownloadBlob(resolvedBlob, resolvedFileName);
      return;
    }

    if (downloadHref) clickDownloadLink(downloadHref, resolvedFileName);
  }, [downloadHref, resolvedBlob, resolvedFileName]);

  const openPdfExternally = useCallback(() => {
    const href = externalHref || downloadHref;
    if (!href) return;

    const opened = window.open(href, "_blank", "noopener,noreferrer");
    if (!opened) window.location.assign(href);
  }, [downloadHref, externalHref]);

  useEffect(() => {
    if (!autoExternalFallback) return;
    if (renderedPageCount > 0) return;
    if (fallbackAttemptedRef.current) return;
    if (!isRestrictedMobilePdfHost()) return;
    if (status !== "loading" && status !== "ready" && status !== "error") return;

    const delay = status === "error" ? 0 : AUTO_FALLBACK_DELAY_MS;
    const timeout = window.setTimeout(() => {
      if (fallbackAttemptedRef.current || renderedPagesRef.current.size > 0) {
        return;
      }

      fallbackAttemptedRef.current = true;
      setFallbackTriggered(true);
      if (downloadHref) {
        clickDownloadLink(downloadHref, resolvedFileName);
      } else {
        openPdfExternally();
      }
    }, delay);

    return () => window.clearTimeout(timeout);
  }, [
    autoExternalFallback,
    downloadHref,
    openPdfExternally,
    renderedPageCount,
    resolvedFileName,
    status,
  ]);

  return (
    <div className={cn("overflow-hidden rounded border bg-gray-50", className)}>
      {showActions && (
        <div className="flex flex-col gap-2 border-b bg-white px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">PDF Preview</p>
            <p className="text-xs text-muted-foreground">
              {pageCount > 0
                ? `${pageCount} page${pageCount === 1 ? "" : "s"}`
                : "Preparing document"}
              {fallbackTriggered ? " - opened download fallback" : ""}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={openPdfExternally}
              disabled={!externalHref && !downloadHref}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded border px-3 py-2 text-xs font-medium text-foreground hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open
            </button>
            <button
              type="button"
              onClick={downloadPdf}
              disabled={!downloadHref && !resolvedBlob}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded bg-black px-3 py-2 text-xs font-medium text-white hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              Download PDF
            </button>
            {extraActions}
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className={cn("overflow-y-auto bg-gray-100", heightClassName)}
      >
        {status === "loading" && (
          <div className="flex h-full min-h-[280px] items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading PDF...
          </div>
        )}

        {status === "error" && (
          <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-3 px-4 text-center">
            <FileWarning className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Preview could not be rendered.</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Use Open or Download to continue with the PDF externally.
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded border bg-white px-3 py-2 text-xs font-medium"
            >
              <RotateCw className="h-3.5 w-3.5" />
              Retry page
            </button>
          </div>
        )}

        {status === "ready" && pdfDocument && (
          <div className="mx-auto w-full max-w-[1100px] py-2">
            {Array.from({ length: pageCount }, (_, index) => (
              <PdfPageCanvas
                key={index + 1}
                pdfDocument={pdfDocument}
                pageNumber={index + 1}
                containerWidth={containerWidth}
                onRendered={handlePageRendered}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
