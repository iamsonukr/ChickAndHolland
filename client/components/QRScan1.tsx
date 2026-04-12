"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { API_URL } from "@/lib/constants";
import { useQrCodeScanner } from "@/lib/hooks/useQrCodeScanner";
import { getScannerRequestHeaders } from "@/lib/scannerHeaders";
import WebLabelBox from "@/components/WebLabelBox";

export default function QRScanPage() {
  const [barcode, setBarcode] = useState("");
  const [result, setResult] = useState<any>(null);
  const [readyForShip, setReadyForShip] = useState(false);
  const [scanLock, setScanLock] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { cameraError, videoRef } = useQrCodeScanner({
    active: true,
    onScan: (text) => {
      if (scanLock) {
        return;
      }

      void handleScan(text);
    },
  });

  // Autofocus
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // 📷 CAMERA SCAN
  const handleScan = async (data: string | null) => {
    if (data && data !== barcode) {
      setBarcode(data);
      await processBarcode(data);
    }
  };

  // 🔥 MAIN BARCODE PROCESSOR
  const processBarcode = async (code: string) => {
    const trimmedCode = String(code || "").trim();
    if (!trimmedCode || scanLock) {
      return;
    }

    setScanLock(true);

    try {
      /* =========================================
         🚚 FINAL CONFIRM SHIP (LAST SCAN)
      ========================================= */
      if (readyForShip) {
        const res = await fetch(`${API_URL}/scan/scan`, {
          method: "POST",
          headers: getScannerRequestHeaders(),
          body: JSON.stringify({
            barcode: trimmedCode,
            confirmShip: true,
          }),
        });

        const json = await res.json();

        if (json.code === "SHIPPED") {
          toast.success("🚚 Order Shipped Successfully");

          setResult({
            success: true,
            barcode: trimmedCode,
            currentStage: "Ready To Delivery",
            nextStage: "Shipped",
          });

          setReadyForShip(false);
          return;
        }

        toast.error(json.message || "Unable to ship order");
        return;
      }

      /* =========================================
         🔄 NORMAL SCAN
      ========================================= */
      let res = await fetch(`${API_URL}/scan/scan`, {
        method: "POST",
        headers: getScannerRequestHeaders(),
        body: JSON.stringify({ barcode: trimmedCode }),
      });

      let json = await res.json();

      // Try stock if fresh failed
      if (!json.success && !json.code) {
        res = await fetch(`${API_URL}/scan/stock/scan`, {
          method: "POST",
          headers: getScannerRequestHeaders(),
          body: JSON.stringify({ barcode: trimmedCode }),
        });
        json = await res.json();
      }

      /* =========================================
         ⛔ BALANCE PENDING
      ========================================= */
      if (json.code === "WAIT_ADMIN") {
        toast.warning("⏳ Admin Have Not Now Ready To Delivery ");
        setResult({
          success: false,
          message: json.message,
        });
        return;
      }

      /* =========================================
         🟡 READY TO DELIVERY (ADMIN APPROVED)
      ========================================= */
      if (json.code === "READY_FOR_SHIP") {
        toast.info("✅ Admin Have Ready To Delivery Done");
        setReadyForShip(true);

        setResult({
          success: true,
          barcode: trimmedCode,
          currentStage: "Ready To Delivery",
          nextStage: "Ready To Delivery",
          message: json.message,
        });
        return;
      }

      /* =========================================
         ✅ NORMAL SUCCESS
      ========================================= */
      if (json.success) {
        toast.success(`Stage Updated: ${json.nextStage}`);
        setResult(json);
        return;
      }

      toast.error(json.message || "Invalid QR code");
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setBarcode("");
      inputRef.current?.focus();
      window.setTimeout(() => {
        setScanLock(false);
      }, 1200);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">
        QR Scan (Auto Stage Update)
      </h1>

      {/* CAMERA */}
      <div className="w-full max-w-md">
        <div className="relative aspect-square overflow-hidden rounded-xl border bg-black">
          <video
            ref={videoRef}
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          />

          <div className="pointer-events-none absolute inset-0">
            <svg
              className="absolute inset-0 h-full w-full"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <mask id="legacy-qr-mask">
                  <rect width="100%" height="100%" fill="white" />
                  <rect
                    x="20%"
                    y="20%"
                    width="60%"
                    height="60%"
                    rx="12"
                    fill="black"
                  />
                </mask>
              </defs>
              <rect
                width="100%"
                height="100%"
                fill="rgba(0,0,0,0.55)"
                mask="url(#legacy-qr-mask)"
              />
            </svg>

            {[
              "top-[18%] left-[18%] border-t-2 border-l-2 rounded-tl-lg",
              "top-[18%] right-[18%] border-t-2 border-r-2 rounded-tr-lg",
              "top-[78%] left-[18%] border-b-2 border-l-2 rounded-bl-lg",
              "top-[78%] right-[18%] border-b-2 border-r-2 rounded-br-lg",
            ].map((cls, index) => (
              <div
                key={index}
                className={`absolute h-8 w-8 border-white ${cls}`}
              />
            ))}
          </div>

          {cameraError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 px-6">
              <p className="text-center text-sm text-white">{cameraError}</p>
            </div>
          )}
        </div>
      </div>

      {/* MANUAL INPUT */}
      <div className="mt-4">
        <Input
          ref={inputRef}
          placeholder="Enter QR code manually"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          className="mb-3"
        />
        <Button onClick={() => processBarcode(barcode)} disabled={scanLock}>
          Process QR
        </Button>
      </div>

      {/* RESULT */}
      {result && (
        <Card className="mt-6 p-4 border-2">
          <h2 className="text-lg font-semibold">
            {result.success ? "✔ Success" : "❌ Failed"}
          </h2>

          {result.success ? (
            <>
              <p className="mt-2 text-sm">QR Code: {result.barcode}</p>
              <p>Previous Stage: {result.currentStage || "---"}</p>
              <p className="font-bold text-green-600 text-lg">
                Updated To: {result.nextStage || result.currentStage}
              </p>
            </>
          ) : (
            <p className="text-red-600 mt-2">{result.message}</p>
          )}

          {result.success && (
            <div className="mt-6 flex justify-center">
              <WebLabelBox
                quantity={1}
                styleNo={result.styleNo || "N/A"}
                size={result.size || "N/A"}
                po={result.po || "N/A"}
                color={result.color || "N/A"}
                barcode={result.barcode}
              />
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
