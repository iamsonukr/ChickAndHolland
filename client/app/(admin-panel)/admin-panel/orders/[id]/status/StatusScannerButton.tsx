"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, ScanLine, X, Zap } from "lucide-react";
import { toast } from "sonner";
import { API_URL } from "@/lib/constants";
import { useQrCodeScanner } from "@/lib/hooks/useQrCodeScanner";
import { getScannerRequestHeaders } from "@/lib/scannerHeaders";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import ScanSuccessScreen from "@/components/ScanSuccessScreen";
import ScanFailScreen from "@/components/ScanFailScreen";

type StatusScanOrderType = "RETAILER" | "STORE" | "STOCK";

const SUCCESS_SCREEN_MS = 2200;
const FAIL_SCREEN_MS = 2200;

interface StatusScannerButtonProps {
  barcode?: string | null;
  orderType: StatusScanOrderType;
  onScanned?: () => void | Promise<void>;
}

const getScannerTitle = (orderType: StatusScanOrderType) => {
  if (orderType === "STORE") return "Store QR Scanner";
  if (orderType === "STOCK") return "Stock QR Scanner";
  return "Retailer QR Scanner";
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
  const [cameraActive, setCameraActive] = useState(false); // ← add this
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [successStage, setSuccessStage] = useState("");
  const [failOpen, setFailOpen] = useState(false);
  const [failMessage, setFailMessage] = useState("");
  const [failStage, setFailStage] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const scanLockRef = useRef(false); // mirrors scanLock for use inside ZXing callback closure
  const successTimerRef = useRef<number | null>(null);
  const failTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (successTimerRef.current) {
        window.clearTimeout(successTimerRef.current);
      }
      if (failTimerRef.current) {
        window.clearTimeout(failTimerRef.current);
      }
    };
  }, []);

  const { cameraError, toggleTorch, torchOn, videoRef } = useQrCodeScanner({
    active: cameraActive,
    onScan: (text) => {
      if (scanLockRef.current) return;
      void processBarcode(text);
    },
    delayBetweenScanAttempts: 100,
    delayBetweenScanSuccess: 1500,
  });



  // ── Helpers ──────────────────────────────────────────────────────────────
  const unlockScannerSoon = (delay = 1500) => {
    window.setTimeout(() => {
      setScanLock(false);
      scanLockRef.current = false;
    }, delay);
  };

  const showSuccessScreen = (
    message: string,
    stage?: string,
    onComplete?: () => void | Promise<void>,
  ) => {
    if (successTimerRef.current) {
      window.clearTimeout(successTimerRef.current);
    }

    if (failTimerRef.current) {
      window.clearTimeout(failTimerRef.current);
      failTimerRef.current = null;
    }

    setFailOpen(false);
    setSuccessMessage(message);
    setSuccessStage(stage || "");
    setSuccessOpen(true);

    successTimerRef.current = window.setTimeout(() => {
      setSuccessOpen(false);
      successTimerRef.current = null;
      if (onComplete) {
        void Promise.resolve(onComplete()).catch(() => {
          toast.error("Failed to refresh scan report");
        });
      }
    }, SUCCESS_SCREEN_MS);
  };

  const showFailScreen = (message?: string, stage?: string | null) => {
    if (failTimerRef.current) {
      window.clearTimeout(failTimerRef.current);
    }

    setSuccessOpen(false);
    setFailMessage(message || "Stage transition not allowed");
    setFailStage(stage || "");
    setFailOpen(true);

    failTimerRef.current = window.setTimeout(() => {
      setFailOpen(false);
      failTimerRef.current = null;
    }, FAIL_SCREEN_MS);
  };

  const resetDialogState = () => {
    if (successTimerRef.current) {
      window.clearTimeout(successTimerRef.current);
      successTimerRef.current = null;
    }
    if (failTimerRef.current) {
      window.clearTimeout(failTimerRef.current);
      failTimerRef.current = null;
    }

    setBarcode("");
    setScanLock(false);
    scanLockRef.current = false;
    setReadyForShip(false);
    setSuccessOpen(false);
    setSuccessMessage("");
    setSuccessStage("");
    setFailOpen(false);
    setFailMessage("");
    setFailStage("");
  };


  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      // Delay activating the camera by one frame so DialogContent
      // has time to mount the <video> element into the DOM first
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setCameraActive(true);
        });
      });
    } else {
      setCameraActive(false);
      resetDialogState();
    }
  };

  const handleSuccessfulScan = (message = "Scan successful", stage?: string) => {
    toast.success(message);
    setCameraActive(false);
    showSuccessScreen(message, stage, async () => {
      handleOpenChange(false);
      await onScanned?.();
    });
  };

  // ── API calls ────────────────────────────────────────────────────────────
  const processStoreBarcode = async (code: string) => {
    const response = await fetch(`${API_URL}/orders/store-scan-update`, {
      method: "POST",
      headers: getScannerRequestHeaders(),
      body: JSON.stringify({ barcode: code }),
    });
    const json = await response.json();
    if (!json.success) {
      showFailScreen(json.message || "Stage transition not allowed", json.nextStage || json.currentStage);
      return "failure";
    }
    const message = json.nextStage
      ? `Store status updated to ${json.nextStage}`
      : json.message || "Store scan successful";
    handleSuccessfulScan(message, json.nextStage);
    return "success";
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
      showFailScreen(json.message || "Stage transition not allowed", json.nextStage || json.currentStage || "Balance Pending");
      return "failure";
    }
    if (isRetailer && json.code === "READY_FOR_SHIP") {
      setReadyForShip(true);
      toast.info(json.message || "Scan the same QR code once more to ship it");
      return "pending";
    }
    if (isRetailer && json.code === "SHIPPED") {
      handleSuccessfulScan(json.message || "Order shipped successfully", "Shipped");
      return "success";
    }
    if (!json.success) {
      showFailScreen(json.message || "Stage transition not allowed", json.nextStage || json.currentStage);
      return "failure";
    }
    const message = json.nextStage
      ? `Status updated to ${json.nextStage}`
      : json.message || "Scan successful";
    handleSuccessfulScan(message, json.nextStage);
    return "success";
  };

  // ── Main scan handler ────────────────────────────────────────────────────
  const processBarcode = async (rawCode: string | null | undefined) => {
    const code = String(rawCode ?? "").trim();
    if (!code || scanLockRef.current) return;

    setScanLock(true);
    scanLockRef.current = true;
    setBarcode(code);
    let unlockDelay = 1500;

    try {
      if (expectedBarcode && code !== String(expectedBarcode).trim()) {
        showFailScreen("Scanned QR code does not match this item");
        unlockDelay = FAIL_SCREEN_MS + 100;
        return;
      }
      if (orderType === "STORE") {
        const outcome = await processStoreBarcode(code);
        if (outcome === "failure") unlockDelay = FAIL_SCREEN_MS + 100;
        return;
      }
      const outcome = await processRetailerOrStockBarcode(code);
      if (outcome === "failure") unlockDelay = FAIL_SCREEN_MS + 100;
    } catch {
      showFailScreen("Process failed");
      unlockDelay = FAIL_SCREEN_MS + 100;
    } finally {
      unlockScannerSoon(unlockDelay);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="w-full gap-2">
          <Camera className="h-4 w-4" />
          Scan QR
        </Button>
      </DialogTrigger>

      <DialogContent
        className={cn(
          "left-0 top-0 h-[100dvh] w-screen max-w-none translate-x-0 translate-y-0 gap-0 overflow-hidden border-0 bg-transparent p-0 shadow-none",
          "data-[state=closed]:slide-out-to-left-0 data-[state=closed]:slide-out-to-top-0",
          "data-[state=open]:slide-in-from-left-0 data-[state=open]:slide-in-from-top-0",
          "sm:left-1/2 sm:top-1/2 sm:h-auto sm:w-full sm:max-w-xl sm:-translate-x-1/2 sm:-translate-y-1/2",
          "sm:overflow-hidden sm:rounded-lg sm:border sm:bg-background sm:shadow-lg",
          "[&>button]:hidden"
        )}
      >
        <div className="relative flex h-full w-full flex-col sm:h-auto">

          {/* ── Camera area ─────────────────────────────────────────────── */}
          <div className="relative min-h-0 flex-1 overflow-hidden bg-black sm:flex-none sm:aspect-video">
            <video
              ref={videoRef}
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Scan overlay: darkened edges + targeting reticle */}
            <div className="absolute inset-0 pointer-events-none">
              <svg
                className="absolute inset-0 w-full h-full"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <mask id="scan-mask">
                    <rect width="100%" height="100%" fill="white" />
                    <rect x="24%" y="18%" width="52%" height="64%" rx="12" fill="black" />
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
                "top-[16%] left-[22%] border-t-2 border-l-2 rounded-tl-lg",
                "top-[16%] right-[22%] border-t-2 border-r-2 rounded-tr-lg",
                "top-[80%] left-[22%] border-b-2 border-l-2 rounded-bl-lg",
                "top-[80%] right-[22%] border-b-2 border-r-2 rounded-br-lg",
              ].map((cls, i) => (
                <div key={i} className={`absolute w-8 h-8 border-white ${cls}`} />
              ))}

              {/* Animated scan line */}
              <div
                className="absolute left-[24%] w-[52%] h-0.5 bg-green-400/80"
                style={{ top: "18%", animation: "scanline 2s ease-in-out infinite" }}
              />
              <style>{`
                @keyframes scanline {
                  0%   { transform: translateY(0);    opacity: 1;   }
                  50%  { transform: translateY(150px); opacity: 0.6; }
                  100% { transform: translateY(0);    opacity: 1;   }
                }
              `}</style>

              <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-white/60 whitespace-nowrap">
                Hold the QR code inside the frame
              </p>
            </div>

            {/* Top bar: title + close */}
            <div className="absolute top-0 inset-x-0 flex items-center justify-between px-4 pt-4 pb-2 bg-gradient-to-b from-black/60 to-transparent">
              <span className="text-white font-semibold text-base">
                {getScannerTitle(orderType)}
              </span>
              <button
                type="button"
                onClick={() => handleOpenChange(false)}
                className="text-white/80 hover:text-white p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Torch button */}
            <button
              type="button"
              onClick={async () => {
                try {
                  await toggleTorch();
                } catch (error) {
                  toast.error(
                    error instanceof Error
                      ? error.message
                      : "Torch not supported on this device"
                  );
                }
              }}
              className={cn(
                "absolute bottom-4 right-4 p-2 rounded-full border transition-colors",
                torchOn
                  ? "bg-yellow-400 border-yellow-300 text-black"
                  : "bg-black/40 border-white/30 text-white"
              )}
            >
              {/* Flashlight doesn't exist in lucide-react; Zap is the closest */}
              <Zap className="h-5 w-5" />
            </button>

            {/* Camera error overlay */}
            {cameraError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 px-6">
                <p className="text-white text-sm text-center">{cameraError}</p>
              </div>
            )}
          </div>

          {/* ── Bottom sheet: manual entry ───────────────────────────────── */}
          <div className="space-y-3 bg-background px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pb-6">
            {expectedBarcode && (
              <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                Expected QR:{" "}
                <span className="font-mono text-foreground">{expectedBarcode}</span>
              </div>
            )}

            {readyForShip && (
              <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Ready To Deliver — scan the same QR code once more to ship.
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                ref={inputRef}
                placeholder="Enter QR code manually"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && processBarcode(barcode)}
              />
              <Button
                type="button"
                onClick={() => processBarcode(barcode)}
                disabled={scanLock}
                className="w-full gap-2 sm:w-auto sm:shrink-0"
              >
                <ScanLine className="h-4 w-4" />
                Process QR
              </Button>
            </div>
          </div>
          <ScanSuccessScreen
            open={successOpen}
            title="Success"
            subtitle={successMessage}
            stage={successStage}
          />

          <ScanFailScreen
            open={failOpen}
            title="Scan Failed"
            subtitle={failMessage}
            stage={failStage}
          />

        </div>
      </DialogContent>
    </Dialog>
  );
}
