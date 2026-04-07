"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Camera, ScanLine } from "lucide-react";
import { QrReader } from "react-qr-reader";
import { toast } from "sonner";

import { API_URL } from "@/lib/constants";
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

const getReadableCameraError = (error: Error) => {
  const errorName = error?.name || "";
  const errorMessage = error?.message || "";

  if (
    errorName === "NotFoundException" ||
    errorName === "ChecksumException" ||
    errorName === "FormatException"
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

  return errorMessage || "Unable to start the camera.";
};

export default function StatusScannerButton({
  barcode: expectedBarcode,
  orderType,
  onScanned,
}: StatusScannerButtonProps) {
  const videoId = useId().replace(/:/g, "");
  const [open, setOpen] = useState(false);
  const [barcode, setBarcode] = useState("");
  const [scanLock, setScanLock] = useState(false);
  const [readyForShip, setReadyForShip] = useState(false);
  const [scannerKey, setScannerKey] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastCameraErrorRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open) {
      setBarcode("");
      setScanLock(false);
      setReadyForShip(false);
      setCameraError(null);
      lastCameraErrorRef.current = null;
      return;
    }

    setScannerKey((current) => current + 1);
    setCameraError(null);
    lastCameraErrorRef.current = null;
    const timeout = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(timeout);
  }, [open]);

  const unlockScannerSoon = () => {
    window.setTimeout(() => setScanLock(false), 1200);
  };

  const handleSuccessfulScan = async (message?: string) => {
    if (message) {
      toast.success(message);
    }

    await onScanned?.();
    setOpen(false);
    setBarcode("");
    setReadyForShip(false);
  };

  const processStoreBarcode = async (code: string) => {
    const response = await fetch(`${API_URL}/orders/store-scan-update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ barcode: code }),
    });
    const json = await response.json();

    if (!json.success) {
      toast.error(json.message || "Store scan failed");
      return;
    }

    await handleSuccessfulScan(
      json.nextStage
        ? `Store status updated to ${json.nextStage}`
        : json.message || "Store scan successful",
    );
  };

  const processRetailerOrStockBarcode = async (code: string) => {
    const isRetailer = orderType === "RETAILER";
    const response = await fetch(
      `${API_URL}/scan/${isRetailer ? "scan" : "stock/scan"}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isRetailer && readyForShip
            ? { barcode: code, confirmShip: true }
            : { barcode: code },
        ),
      },
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
      json.nextStage
        ? `Status updated to ${json.nextStage}`
        : json.message || "Scan successful",
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
      toast.error("Camera scan failed");
    } finally {
      unlockScannerSoon();
    }
  };

  const handleReaderResult = (result: any, error?: Error | null) => {
    if (result?.text) {
      setCameraError(null);
      lastCameraErrorRef.current = null;
      processBarcode(result.text);
      return;
    }

    if (!error) return;

    const readableError = getReadableCameraError(error);
    if (!readableError) return;

    setCameraError(readableError);

    if (lastCameraErrorRef.current !== readableError) {
      lastCameraErrorRef.current = readableError;
      toast.error(readableError);
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

      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{getScannerTitle(orderType)}</DialogTitle>
          <DialogDescription>
            Open the camera and scan this item barcode to move it to the next stage.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {expectedBarcode && (
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              Expected barcode: <span className="font-mono text-foreground">{expectedBarcode}</span>
            </div>
          )}

          <div className="overflow-hidden rounded-lg border">
            {open ? (
              <QrReader
                key={scannerKey}
                onResult={handleReaderResult}
                constraints={{ facingMode: { ideal: "environment" } }}
                scanDelay={300}
                videoId={`${videoId}-${scannerKey}`}
                containerStyle={{ width: "100%" }}
                videoContainerStyle={{ width: "100%", paddingTop: "56.25%" }}
                videoStyle={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
                className="w-full"
              />
            ) : null}
          </div>

          {cameraError && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {cameraError}
            </div>
          )}

          <div className="flex gap-2">
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
              className="gap-2"
            >
              <ScanLine className="h-4 w-4" />
              Process
            </Button>
          </div>

          {readyForShip && (
            <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Ready To Delivery is already done. Scan the same barcode once more to ship it.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
