"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { ArrowLeft, Camera, Loader2, ScanLine } from "lucide-react";
import { QrReader } from "react-qr-reader";
import { toast } from "sonner";

import { API_URL } from "@/lib/constants";
import { getScannerRequestHeaders } from "@/lib/scannerHeaders";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type ScanOrderType = "RETAILER" | "STOCK" | "STORE";

type ScanOutcome = {
  success: boolean;
  orderType: ScanOrderType | "UNKNOWN";
  barcode: string;
  message: string;
  currentStage?: string | null;
  nextStage?: string | null;
  statusTone?: "success" | "warning" | "error";
  details?: {
    styleNo?: string;
    purchaseOrderNo?: string;
    size?: string;
    color?: string;
    quantity?: number;
    completedQty?: number;
    remainingQty?: number;
  };
};

/**
 * Filter errors so that common "no QR found in frame" noise 
 * doesn't trigger the "Unable to start camera" UI message.
 */
const getReadableCameraError = (error: any) => {
  const errorName = error?.name || "";
  const errorMessage = error?.message || "";

  // These are standard "no barcode found in this frame" exceptions.
  // We return null so the UI doesn't show an error.
  if (
    errorName === "NotFoundException" ||
    errorName === "ChecksumException" ||
    errorName === "FormatException" ||
    errorMessage.includes("No multi-format reader")
  ) {
    return null;
  }

  if (errorName === "NotAllowedError" || errorName === "PermissionDeniedError") {
    return "Camera permission was denied. Please allow camera access in your browser.";
  }

  if (errorName === "NotFoundError" || errorName === "DevicesNotFoundError") {
    return "No camera was found on this device.";
  }

  if (errorName === "NotReadableError" || errorName === "TrackStartError") {
    return "The camera is already in use by another app or tab.";
  }

  if (errorName === "OverconstrainedError" || errorName === "ConstraintNotSatisfiedError") {
    return "The preferred camera is not available on this device.";
  }

  if (errorName === "SecurityError" || !window.isSecureContext) {
    return "Camera access needs a secure site. Open this page on HTTPS or localhost.";
  }

  // Only return a default error if it's a fatal start-up error
  // Otherwise, return null to avoid "false positive" error messages.
  return null;
};

const getBadgeVariant = (statusTone?: ScanOutcome["statusTone"]) => {
  if (statusTone === "error") return "destructive";
  if (statusTone === "warning") return "outline";
  return "default";
};

const getOrderTypeLabel = (orderType: ScanOutcome["orderType"]) => {
  if (orderType === "RETAILER") return "Retailer";
  if (orderType === "STOCK") return "Stock";
  if (orderType === "STORE") return "Store";
  return "Unknown";
};

const isInvalidRetailerBarcode = (json: any) =>
  !json?.success && !json?.code && String(json?.message || "").trim() === "Invalid barcode";

const isInvalidStockBarcode = (json: any) =>
  !json?.success &&
  String(json?.message || "").trim() === "Invalid stock barcode";

const isInvalidStoreBarcode = (json: any) =>
  !json?.success && String(json?.message || "").trim() === "Invalid barcode";

export default function GlobalQrScanPage() {
  const videoId = useId().replace(/:/g, "");
  const [barcode, setBarcode] = useState("");
  const [scanLock, setScanLock] = useState(false);
  const [pendingRetailerShipBarcode, setPendingRetailerShipBarcode] = useState<string | null>(null);
  const [result, setResult] = useState<ScanOutcome | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannerKey, setScannerKey] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastCameraErrorRef = useRef<string | null>(null);

  useEffect(() => {
    setScannerKey((current) => current + 1);
    const timeout = window.setTimeout(() => inputRef.current?.focus(), 150);
    return () => window.clearTimeout(timeout);
  }, []);

  const unlockScannerSoon = () => {
    window.setTimeout(() => setScanLock(false), 1200);
  };

  const loadStoreDetails = async (code: string) => {
    const response = await fetch(`${API_URL}/orders/store-scan/${encodeURIComponent(code)}`);
    const json = await response.json();

    if (!json?.success) return null;

    const data = json.data || {};
    return {
      styleNo: data.styleNo,
      purchaseOrderNo: data.purchaeOrderNo,
      size: data.size,
      color: data.meshColor || data.mesh_color || data.color || "-",
      quantity: data.quantity,
      completedQty: data.completedQty,
      remainingQty: data.remainingQty,
    };
  };

  const tryRetailerFlow = async (code: string): Promise<ScanOutcome | null> => {
    const isConfirmShip = pendingRetailerShipBarcode === code;
    const response = await fetch(`${API_URL}/scan/scan`, {
      method: "POST",
      headers: getScannerRequestHeaders(),
      body: JSON.stringify(
        isConfirmShip
          ? {
            barcode: code,
            confirmShip: true,
          }
          : { barcode: code },
      ),
    });
    const json = await response.json();

    if (isInvalidRetailerBarcode(json)) return null;

    if (json?.code === "WAIT_ADMIN") {
      setPendingRetailerShipBarcode(null);
      return {
        success: false,
        orderType: "RETAILER",
        barcode: code,
        message: json.message || "Admin approval is still pending.",
        currentStage: "Balance Pending",
        statusTone: "warning",
      };
    }

    if (json?.code === "READY_FOR_SHIP") {
      setPendingRetailerShipBarcode(code);
      return {
        success: true,
        orderType: "RETAILER",
        barcode: code,
        message:
          json.message || "Ready To Delivery is done. Scan the same barcode once more to ship it.",
        currentStage: "Ready To Delivery",
        nextStage: "Ready To Delivery",
        statusTone: "warning",
      };
    }

    if (json?.code === "SHIPPED") {
      setPendingRetailerShipBarcode(null);
      return {
        success: true,
        orderType: "RETAILER",
        barcode: code,
        message: json.message || "Order shipped successfully.",
        currentStage: "Ready To Delivery",
        nextStage: "Shipped",
        statusTone: "success",
      };
    }

    setPendingRetailerShipBarcode(null);

    if (!json?.success) {
      return {
        success: false,
        orderType: "RETAILER",
        barcode: code,
        message: json?.message || "Retailer scan failed.",
        currentStage: json?.currentStage,
        nextStage: json?.nextStage,
        statusTone: "error",
      };
    }

    return {
      success: true,
      orderType: "RETAILER",
      barcode: code,
      message: json.message || `Status updated to ${json.nextStage}`,
      currentStage: json.currentStage,
      nextStage: json.nextStage,
      statusTone: "success",
    };
  };

  const tryStockFlow = async (code: string): Promise<ScanOutcome | null> => {
    const response = await fetch(`${API_URL}/scan/stock/scan`, {
      method: "POST",
      headers: getScannerRequestHeaders(),
      body: JSON.stringify({ barcode: code }),
    });
    const json = await response.json();

    if (isInvalidStockBarcode(json)) return null;

    if (!json?.success) {
      return {
        success: false,
        orderType: "STOCK",
        barcode: code,
        message: json?.message || "Stock scan failed.",
        currentStage: json?.currentStage,
        nextStage: json?.nextStage,
        statusTone: "error",
      };
    }

    return {
      success: true,
      orderType: "STOCK",
      barcode: code,
      message: json.message || `Status updated to ${json.nextStage}`,
      currentStage: json.currentStage,
      nextStage: json.nextStage,
      statusTone: "success",
    };
  };

  const tryStoreFlow = async (code: string): Promise<ScanOutcome | null> => {
    const response = await fetch(`${API_URL}/orders/store-scan-update`, {
      method: "POST",
      headers: getScannerRequestHeaders(),
      body: JSON.stringify({ barcode: code }),
    });
    const json = await response.json();

    if (isInvalidStoreBarcode(json)) return null;

    const details = await loadStoreDetails(code);

    if (!json?.success) {
      return {
        success: false,
        orderType: "STORE",
        barcode: code,
        message: json?.message || "Store scan failed.",
        currentStage: json?.currentStage,
        nextStage: json?.nextStage,
        statusTone: "error",
        details: details || undefined,
      };
    }

    return {
      success: true,
      orderType: "STORE",
      barcode: code,
      message: json.nextStage
        ? `Store status updated to ${json.nextStage}`
        : json.message || "Store scan successful.",
      currentStage: json.currentStage,
      nextStage: json.nextStage,
      statusTone: "success",
      details: details || undefined,
    };
  };

  const processBarcode = async (rawCode: string | null | undefined) => {
    const code = String(rawCode ?? "").trim();
    if (!code || scanLock) return;

    setScanLock(true);
    setBarcode(code);

    try {
      if (pendingRetailerShipBarcode && pendingRetailerShipBarcode !== code) {
        setPendingRetailerShipBarcode(null);
      }

      const retailerResult = await tryRetailerFlow(code);
      const stockResult = retailerResult ? null : await tryStockFlow(code);
      const storeResult =
        retailerResult || stockResult ? null : await tryStoreFlow(code);

      const nextResult =
        retailerResult ||
        stockResult ||
        storeResult || {
          success: false,
          orderType: "UNKNOWN" as const,
          barcode: code,
          message: "This barcode was not found in retailer, stock, or store orders.",
          statusTone: "error" as const,
        };

      setResult(nextResult);

      if (nextResult.statusTone === "warning") {
        toast.warning(nextResult.message);
      } else if (nextResult.success) {
        toast.success(nextResult.message);
      } else {
        toast.error(nextResult.message);
      }
    } catch {
      const errorResult: ScanOutcome = {
        success: false,
        orderType: "UNKNOWN",
        barcode: code,
        message: "Something went wrong while scanning this barcode.",
        statusTone: "error",
      };
      setResult(errorResult);
      toast.error(errorResult.message);
    } finally {
      setBarcode("");
      inputRef.current?.focus();
      unlockScannerSoon();
    }
  };

  const handleReaderResult = (scanResult: any, error?: Error | null) => {
    if (scanResult?.text) {
      setCameraError(null);
      lastCameraErrorRef.current = null;
      processBarcode(scanResult.text);
      return;
    }

    if (!error) return;

    const readableError = getReadableCameraError(error);

    // If readableError is null, it means it's a minor scan error we should ignore
    if (!readableError) return;

    setCameraError(readableError);

    if (lastCameraErrorRef.current !== readableError) {
      lastCameraErrorRef.current = readableError;
      toast.error(readableError);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link
              href="/admin-panel/orders"
              className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Orders
            </Link>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">Global QR Scanner</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Scan any retailer, stock, or store barcode from one place.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Retailer</Badge>
            <Badge variant="outline">Stock</Badge>
            <Badge variant="outline">Store</Badge>
          </div>
        </div>

        <Link href="/admin-panel/orders">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Orders
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden border-2">
          <div className="border-b bg-muted/30 px-5 py-4">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <Camera className="h-5 w-5" />
              Camera Scan
            </div>
          </div>

          <div className="space-y-4 p-5">
            <div className="overflow-hidden rounded-xl border bg-black/5">
              <QrReader
                key={scannerKey}
                onResult={handleReaderResult}
                constraints={{
                  facingMode: "environment",
                  // Adding explicit width/height hints for better 1D detection
                  width: { ideal: 1920 },
                  height: { ideal: 1080 },
                  aspectRatio: { ideal: 1.7777777778 } // 16:9 is better for horizontal bars
                }}
                scanDelay={300}
                videoId={`${videoId}-${scannerKey}`}
                containerStyle={{ width: "100%" }}
                videoContainerStyle={{ width: "100%", paddingTop: "56.25%" }}
                videoStyle={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain", // Do NOT use 'cover' for horizontal barcodes
                }}
                className="w-full"
              />
            </div>

            {cameraError && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {cameraError}
              </div>
            )}

            {pendingRetailerShipBarcode && (
              <div className="flex flex-col gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-medium">Retailer shipment confirmation pending</div>
                  <div className="text-xs sm:text-sm">
                    Scan <span className="font-mono">{pendingRetailerShipBarcode}</span> once
                    more to mark it as shipped.
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPendingRetailerShipBarcode(null)}
                >
                  Clear
                </Button>
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="border-2">
            <div className="border-b bg-muted/30 px-5 py-4">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <ScanLine className="h-5 w-5" />
                Manual Scan
              </div>
            </div>

            <div className="space-y-4 p-5">
              <Input
                ref={inputRef}
                placeholder="Enter barcode manually"
                value={barcode}
                onChange={(event) => setBarcode(event.target.value)}
              />

              <Button
                type="button"
                onClick={() => processBarcode(barcode)}
                disabled={scanLock}
                className="w-full gap-2"
              >
                {scanLock ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanLine className="h-4 w-4" />}
                Process Barcode
              </Button>
            </div>
          </Card>

          <Card className="border-2">
            <div className="border-b bg-muted/30 px-5 py-4">
              <div className="text-lg font-semibold">Last Scan Result</div>
            </div>

            <div className="p-5">
              {!result ? (
                <div className="rounded-lg border border-dashed px-4 py-6 text-sm text-muted-foreground">
                  No barcode scanned yet.
                </div>
              ) : (
                <div
                  className={cn(
                    "space-y-4 rounded-xl border px-4 py-4",
                    result.statusTone === "success" &&
                    "border-emerald-200 bg-emerald-50/70",
                    result.statusTone === "warning" &&
                    "border-amber-200 bg-amber-50/80",
                    result.statusTone === "error" &&
                    "border-red-200 bg-red-50/70",
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={getBadgeVariant(result.statusTone)}>
                      {getOrderTypeLabel(result.orderType)}
                    </Badge>
                    <span className="font-mono text-xs text-muted-foreground">
                      {result.barcode}
                    </span>
                  </div>

                  <div className="text-base font-medium">{result.message}</div>

                  <div className="grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">
                        Previous Stage
                      </div>
                      <div className="font-medium">{result.currentStage || "-"}</div>
                    </div>

                    <div>
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">
                        Next Stage
                      </div>
                      <div className="font-medium">{result.nextStage || "-"}</div>
                    </div>
                  </div>

                  {result.details && (
                    <div className="grid gap-3 border-t pt-4 text-sm sm:grid-cols-2">
                      <div>
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">Style No</div>
                        <div className="font-medium">{result.details.styleNo || "-"}</div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">Purchase Order</div>
                        <div className="font-medium">{result.details.purchaseOrderNo || "-"}</div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">Size</div>
                        <div className="font-medium">{result.details.size || "-"}</div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">Mesh Color</div>
                        <div className="font-medium">{result.details.color || "-"}</div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">Qty</div>
                        <div className="font-medium">{result.details.quantity ?? "-"}</div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">Remaining</div>
                        <div className="font-medium">{result.details.remainingQty ?? "-"}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}