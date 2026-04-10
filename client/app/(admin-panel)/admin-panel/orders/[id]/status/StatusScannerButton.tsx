"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, ScanLine, X, Flashlight } from "lucide-react";
import { toast } from "sonner";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { DecodeHintType, BarcodeFormat } from "@zxing/library";
import { API_URL } from "@/lib/constants";
import { getScannerRequestHeaders } from "@/lib/scannerHeaders";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type StatusScanOrderType = "RETAILER" | "STORE" | "STOCK";

interface StatusScannerButtonProps {
  barcode?: string | null;
  orderType: StatusScanOrderType;
  onScanned?: () => void | Promise<void>;
}

const getScannerTitle = (orderType: StatusScanOrderType) => {
  if (orderType === "STORE") return "Store Scanner";
  if (orderType === "STOCK") return "Stock Scanner";
  return "Retailer Scanner";
};

export default function StatusScannerButton({
  barcode: expectedBarcode,
  orderType,
  onScanned,
}: StatusScannerButtonProps) {
  const [open, setOpen] = useState(false);
  const [barcode, setBarcode] = useState("");
  const [scanLock, setScanLock] = useState(false);
  const [readyForShip, setReadyForShip] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);

  // ── Start camera with ZXing ──────────────────────────────────────────────
  const startCamera = async () => {
    if (!videoRef.current) return;
    setCameraError(null);

    try {
      // Hints: enable ALL formats including 1D barcodes
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.QR_CODE,
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.CODE_93,
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
        BarcodeFormat.ITF,
        BarcodeFormat.DATA_MATRIX,
        BarcodeFormat.PDF_417,
        BarcodeFormat.AZTEC,
      ]);
      hints.set(DecodeHintType.TRY_HARDER, true);

      const reader = new BrowserMultiFormatReader(hints, {
        delayBetweenScanAttempts: 100,
        delayBetweenScanSuccess: 1500,
      });
      readerRef.current = reader;

      // Request back camera with highest resolution for better 1D scan accuracy
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      // Decode continuously
      const controls = await reader.decodeFromStream(
        stream,
        videoRef.current,
        (result, error) => {
          if (result) {
            const text = result.getText();
            if (text && text !== lastScanned) {
              setLastScanned(text);
              processBarcode(text);
            }
          }
        }
      );
      controlsRef.current = controls;
    } catch (err: any) {
      const name = err?.name || "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setCameraError("Camera permission denied. Please allow access in settings.");
      } else if (name === "NotFoundError") {
        setCameraError("No camera found on this device.");
      } else if (name === "NotReadableError") {
        setCameraError("Camera is already in use by another app.");
      } else {
        setCameraError("Unable to start camera. Use manual entry below.");
      }
    }
  };

  const stopCamera = () => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    readerRef.current = null;
  };

  // ── Torch toggle ────────────────────────────────────────────────────────
  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      await (track as any).applyConstraints({
        advanced: [{ torch: !torchOn }],
      });
      setTorchOn((v) => !v);
    } catch {
      toast.error("Torch not supported on this device");
    }
  };

  // ── Dialog lifecycle ────────────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      setBarcode("");
      setScanLock(false);
      setReadyForShip(false);
      setCameraError(null);
      setLastScanned(null);
      setTorchOn(false);
      // Small delay so the video element is mounted
      const t = setTimeout(() => {
        startCamera();
        inputRef.current?.focus();
      }, 200);
      return () => clearTimeout(t);
    } else {
      stopCamera();
    }
  }, [open]);

  // ── Scan processing ─────────────────────────────────────────────────────
  const unlockScannerSoon = () => {
    window.setTimeout(() => setScanLock(false), 1500);
  };

  const handleSuccessfulScan = async (message?: string) => {
    if (message) toast.success(message);
    await onScanned?.();
    setOpen(false);
    setBarcode("");
    setReadyForShip(false);
  };

  const processStoreBarcode = async (code: string) => {
    const response = await fetch(`${API_URL}/orders/store-scan-update`, {
      method: "POST",
      headers: getScannerRequestHeaders(),
      body: JSON.stringify({ barcode: code }),
    });
    const json = await response.json();
    if (!json.success) {
      toast.error(json.message || "Store scan failed");
      return;
    }
    await handleSuccessfulScan(
      json.nextStage ? `Store status updated to ${json.nextStage}` : json.message || "Store scan successful"
    );
  };

  const processRetailerOrStockBarcode = async (code: string) => {
    const isRetailer = orderType === "RETAILER";
    const response = await fetch(
      `${API_URL}/scan/${isRetailer ? "scan" : "stock/scan"}`,
      {
        method: "POST",
        headers: getScannerRequestHeaders(),
        body: JSON.stringify(
          isRetailer && readyForShip
            ? { barcode: code, confirmShip: true }
            : { barcode: code }
        ),
      }
    );
    const json = await response.json();

    if (isRetailer && json.code === "WAIT_ADMIN") {
      toast.warning(json.message || "Admin approval is still pending");
      return;
    }
    if (isRetailer && json.code === "READY_FOR_SHIP") {
      setReadyForShip(true);
      toast.info(json.message || "Scan the barcode once more to ship it");
      return;
    }
    if (isRetailer && json.code === "SHIPPED") {
      await handleSuccessfulScan(json.message || "Order shipped successfully");
      return;
    }
    if (!json.success) {
      toast.error(json.message || "Scan failed");
      return;
    }
    await handleSuccessfulScan(
      json.nextStage ? `Status updated to ${json.nextStage}` : json.message || "Scan successful"
    );
  };

  const processBarcode = async (rawCode: string | null | undefined) => {
    const code = String(rawCode ?? "").trim();
    if (!code || scanLock) return;

    setScanLock(true);
    setBarcode(code);

    try {
      if (expectedBarcode && code !== String(expectedBarcode).trim()) {
        toast.error("Scanned barcode does not match this item");
        return;
      }
      if (orderType === "STORE") {
        await processStoreBarcode(code);
        return;
      }
      await processRetailerOrStockBarcode(code);
    } catch {
      toast.error("Process failed");
    } finally {
      unlockScannerSoon();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="w-full gap-2">
          <Camera className="h-4 w-4" />
          Scan
        </Button>
      </DialogTrigger>

      {/*
        DialogContent is overridden to be fullscreen on mobile.
        sm:max-w-xl keeps desktop sensible.
      */}
      <DialogContent
        className={`
          p-0 gap-0 overflow-hidden
          /* Mobile: true fullscreen */
          fixed inset-0 w-screen h-[100dvh] max-w-none rounded-none
          /* Desktop: centered modal */
          sm:inset-auto sm:top-[50%] sm:left-[50%] sm:-translate-x-1/2 sm:-translate-y-1/2
          sm:w-full sm:max-w-xl sm:h-auto sm:rounded-lg
        `}
      >
        {/* ── Camera fullscreen layer ── */}
        <div className="relative w-full h-full sm:h-auto flex flex-col">

          {/* Video fills the top portion */}
          <div className="relative flex-1 bg-black sm:flex-none sm:aspect-video overflow-hidden">
            <video
              ref={videoRef}
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Scan overlay: darkened edges + bright targeting reticle */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Dark overlay with a transparent center cutout */}
              <svg
                className="absolute inset-0 w-full h-full"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <mask id="scan-mask">
                    <rect width="100%" height="100%" fill="white" />
                    {/* Center cutout — wider rectangle for 1D barcodes */}
                    <rect
                      x="10%"
                      y="35%"
                      width="80%"
                      height="30%"
                      rx="8"
                      fill="black"
                    />
                  </mask>
                </defs>
                <rect
                  width="100%"
                  height="100%"
                  fill="rgba(0,0,0,0.55)"
                  mask="url(#scan-mask)"
                />
              </svg>

              {/* Corner brackets */}
              {[
                "top-[33%] left-[8%] border-t-2 border-l-2 rounded-tl-lg",
                "top-[33%] right-[8%] border-t-2 border-r-2 rounded-tr-lg",
                "top-[63%] left-[8%] border-b-2 border-l-2 rounded-bl-lg",
                "top-[63%] right-[8%] border-b-2 border-r-2 rounded-br-lg",
              ].map((cls, i) => (
                <div
                  key={i}
                  className={`absolute w-8 h-8 border-white ${cls}`}
                />
              ))}

              {/* Animated scan line */}
              <div
                className="absolute left-[10%] w-[80%] h-0.5 bg-green-400/80"
                style={{
                  top: "35%",
                  animation: "scanline 2s ease-in-out infinite",
                }}
              />
              <style>{`
                @keyframes scanline {
                  0%   { transform: translateY(0); opacity: 1; }
                  50%  { transform: translateY(calc(30vh - 2px)); opacity: 0.6; }
                  100% { transform: translateY(0); opacity: 1; }
                }
                @media (min-width: 640px) {
                  @keyframes scanline {
                    0%   { transform: translateY(0); opacity: 1; }
                    50%  { transform: translateY(80px); opacity: 0.6; }
                    100% { transform: translateY(0); opacity: 1; }
                  }
                }
              `}</style>
            </div>

            {/* Top bar: title + close */}
            <div className="absolute top-0 inset-x-0 flex items-center justify-between px-4 pt-4 pb-2 bg-gradient-to-b from-black/60 to-transparent">
              <span className="text-white font-semibold text-base">
                {getScannerTitle(orderType)}
              </span>
              <button
                onClick={() => setOpen(false)}
                className="text-white/80 hover:text-white p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Torch button */}
            <button
              onClick={toggleTorch}
              className={`absolute bottom-4 right-4 p-2 rounded-full border ${
                torchOn
                  ? "bg-yellow-400 border-yellow-300 text-black"
                  : "bg-black/40 border-white/30 text-white"
              }`}
            >
              {/* Flashlight icon fallback using emoji since lucide may not have it */}
              <span className="text-lg leading-none">🔦</span>
            </button>

            {/* Hint label */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-xs whitespace-nowrap">
              Hold barcode inside the frame
            </div>

            {/* Camera error overlay */}
            {cameraError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 px-6">
                <p className="text-white text-sm text-center">{cameraError}</p>
              </div>
            )}
          </div>

          {/* ── Bottom sheet: manual entry ── */}
          <div className="bg-background px-4 pt-4 pb-6 space-y-3 sm:px-6 sm:pb-6">
            {expectedBarcode && (
              <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                Expected:{" "}
                <span className="font-mono text-foreground">{expectedBarcode}</span>
              </div>
            )}

            {readyForShip && (
              <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Ready To Deliver. Scan the same barcode once more to ship.
              </div>
            )}

            <div className="flex gap-2">
              <Input
                ref={inputRef}
                placeholder="Enter barcode manually"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && processBarcode(barcode)}
              />
              <Button
                type="button"
                onClick={() => processBarcode(barcode)}
                disabled={scanLock}
                className="gap-2 shrink-0"
              >
                <ScanLine className="h-4 w-4" />
                Process
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}