"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { QrReader } from "react-qr-reader";
import { API_URL } from "@/lib/constants";

export default function StoreQRScanPage() {
  const [barcode, setBarcode] = useState("");
  const [scannedData, setScannedData] = useState<any>(null);
  const [scanLock, setScanLock] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 🔍 fetch style + progress
  const fetchBarcode = async (code: string) => {
    const res = await fetch(
      `${API_URL}/orders/store-scan/${encodeURIComponent(code)}`
    );
    const r = await res.json();
    if (r.success) setScannedData(r.data);
  };

  // 📦 MAIN SCAN HANDLER
  const handleScan = async (data: string | null) => {
    if (!data || scanLock) return;

    setScanLock(true);
    setBarcode(data);

    try {
      const res = await fetch(`${API_URL}/orders/store-scan-update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barcode: data }),
      });

      const r = await res.json();

      // ❌ blocked cases (balance pending / ready by admin)
      if (!r.success) {
        toast.error(r.message);
        await fetchBarcode(data);
        return;
      }

      // ✅ success cases
      if (r.nextStage === "Balance Pending") {
        toast.success("✅ Balance Pending reached");
      } 
      else if (r.nextStage === "Shipped") {
        toast.success("🚚 Order successfully shipped");
      } 
      else {
        toast.success(`Stage Updated → ${r.nextStage}`);
      }

      await fetchBarcode(data);
    } catch (err) {
      toast.error("Scan failed");
    } finally {
      setBarcode("");
      inputRef.current?.focus();
      setTimeout(() => setScanLock(false), 1500);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-4">📦 Store Barcode Scanner</h1>

      {/* CAMERA SCAN */}
      <QrReader
        onResult={(r) => r?.text && handleScan(r.text)}
        constraints={{ facingMode: "environment" }}
        className="rounded border"
      />

      {/* MANUAL INPUT */}
      <div className="mt-4 flex gap-2">
        <Input
          ref={inputRef}
          placeholder="Enter / Scan barcode"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
        />
        <Button onClick={() => handleScan(barcode)}>Process</Button>
      </div>

      {/* RESULT CARD */}
      {scannedData && (
        <Card className="mt-6 p-4 space-y-1">
          <h2 className="font-semibold text-lg">
            Style: {scannedData.styleNo}
          </h2>

          <p>
            <b>Order:</b> {scannedData.purchaeOrderNo}
          </p>

          <p>
            <b>Completed Qty:</b> {scannedData.completedQty} /{" "}
            {scannedData.quantity}
          </p>

          <p>
            <b>Remaining Qty:</b> {scannedData.remainingQty}
          </p>

          {/* 🔔 STATUS GUIDANCE */}
          {scannedData.progress?.some(
            (p: any) => p.status === "Ready To Delivery"
          ) && (
            <p className="text-green-600 font-medium">
              ✅ Order Ready To Delivery —You Can Shipped
            </p>
          )}
        </Card>
      )}
    </div>
  );
}
