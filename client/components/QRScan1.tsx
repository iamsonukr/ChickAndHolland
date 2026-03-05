"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { QrReader } from "react-qr-reader";
import { API_URL } from "@/lib/constants";
import WebLabelBox from "@/components/WebLabelBox";

export default function QRScanPage() {
  const [barcode, setBarcode] = useState("");
  const [result, setResult] = useState<any>(null);
  const [readyForShip, setReadyForShip] = useState(false);
  const inputRef = useRef<any>(null);

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
    try {
      /* =========================================
         🚚 FINAL CONFIRM SHIP (LAST SCAN)
      ========================================= */
      if (readyForShip) {
        const res = await fetch(`${API_URL}/scan/scan`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            barcode: code,
            confirmShip: true,
          }),
        });

        const json = await res.json();

        if (json.code === "SHIPPED") {
          toast.success("🚚 Order Shipped Successfully");

          setResult({
            success: true,
            barcode: code,
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barcode: code }),
      });

      let json = await res.json();

      // Try stock if fresh failed
      if (!json.success && !json.code) {
        res = await fetch(`${API_URL}/scan/stock/scan`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ barcode: code }),
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
          barcode: code,
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

      toast.error(json.message || "Invalid Barcode");
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setBarcode("");
      inputRef.current?.focus();
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">
        📦 Barcode Scan (Auto Stage Update)
      </h1>

      {/* CAMERA */}
      <div className="w-full max-w-md">
        <QrReader
          onResult={(res) => res?.text && handleScan(res.text)}
          constraints={{ facingMode: "environment" }}
          containerStyle={{ width: "100%" }}
        />
      </div>

      {/* MANUAL INPUT */}
      <div className="mt-4">
        <Input
          ref={inputRef}
          placeholder="Enter barcode manually"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          className="mb-3"
        />
        <Button onClick={() => processBarcode(barcode)}>Process</Button>
      </div>

      {/* RESULT */}
      {result && (
        <Card className="mt-6 p-4 border-2">
          <h2 className="text-lg font-semibold">
            {result.success ? "✔ Success" : "❌ Failed"}
          </h2>

          {result.success ? (
            <>
              <p className="mt-2 text-sm">Barcode: {result.barcode}</p>
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
