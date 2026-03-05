"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { QrReader } from "react-qr-reader";
import { API_URL } from "@/lib/constants";

export default function QRScanPage() {
  const [barcode, setBarcode] = useState("");
  const [scannedData, setScannedData] = useState<any>(null);
  const [stage, setStage] = useState("");
  const [qty, setQty] = useState("");

  // ----------------------------------------
  // AUTO DETECT SCAN → Retailer OR Store
  // ----------------------------------------
 const fetchBarcode = async (code: string) => {
  try {
    // 1️⃣ Try retailer
    let res = await fetch(`${API_URL}/retailer-scan/${encodeURIComponent(code)}`);
    let r = await res.json();

    if (r.success) {
      setScannedData({
        type: "retailer",
        style: r.data,
        progress: r.data.progress ?? []
      });
      toast.success("Retailer barcode detected");
      return;
    }

    // 2️⃣ Try store
    res = await fetch(`${API_URL}/orders/store-scan/${encodeURIComponent(code)}`);
    r = await res.json();

    if (r.success) {
      setScannedData({
        type: "store",
        style: r.data,
        progress: r.data.progress ?? []
      });
      toast.success("Store barcode detected");
      return;
    }

    toast.error("Invalid Barcode!");
  } catch (err) {
    toast.error("Error scanning barcode");
  }
};


  // Camera QR Scan
  const handleScan = async (data: string | null) => {
    if (data && data !== barcode) {
      setBarcode(data);
      await fetchBarcode(data);
    }
  };

  // ----------------------------------------
  // STATUS UPDATE FOR BOTH ORDER TYPES
  // ----------------------------------------
  const updateStatus = async () => {
    if (!barcode || !stage || !qty) {
      toast.error("Please fill all fields");
      return;
    }

    let url = "";

    // Retailer update API
    if (scannedData?.type === "retailer") {
      url = `${API_URL}/status/update-status`;
    }

    // Store update API
    if (scannedData?.type === "store") {
      url = `${API_URL}/orders/store-status/update`;
    }

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ barcode, stage, qty: Number(qty) }),
    });

    const data = await res.json();

    if (data.success) {
      toast.success("Status updated");
      setStage("");
      setQty("");
      fetchBarcode(barcode); // Refresh details
    } else {
      toast.error(data.message);
    }
  };

  const stages = [
    "Pattern",
    "Khaka",
    "Issue Beading",
    "Beading",
    "Zarkan",
    "Stitching",
    "Balance Pending",
    "Ready To Delivery",
    "Shipped",
  ];

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">📷 Scan Barcode</h1>

      {/* CAMERA QR SCANNER */}
      <div className="w-full max-w-md">
        <QrReader
          onResult={(result) => result?.text && handleScan(result.text)}
          constraints={{ facingMode: "environment" }}
          containerStyle={{ width: "100%" }}
        />
      </div>

      {/* MANUAL INPUT */}
      <div className="mt-4">
        <Input
          placeholder="Enter barcode manually"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          className="mb-3"
        />
        <Button onClick={() => fetchBarcode(barcode)}>Fetch</Button>
      </div>

      {/* RESULT CARD */}
      {scannedData && (
        <Card className="mt-6 p-4 border-2">

          <h2 className="text-lg font-semibold">
            {scannedData.type === "retailer" ? "Retailer Order" : "Store Order"}
          </h2>

          <h2 className="text-lg font-semibold">
            Style: {scannedData.style.styleNo}
          </h2>

          <p>
            Order:{" "}
            {scannedData.type === "retailer"
              ? scannedData.style.order?.purchaeOrderNo
              : scannedData.style.order?.purchaeOrderNo || "N/A"}
          </p>

          <p>Total Qty: {scannedData.style.quantity}</p>

          <h3 className="mt-4 font-semibold">Progress:</h3>
          <div className="mt-2 space-y-1">
            {scannedData?.progress?.length > 0 ? (
              scannedData.progress.map((p: any) => (
                <div key={p.id} className="text-sm">
                  {p.stage}: {p.qty} pcs (
                  {new Date(p.date).toLocaleDateString()})
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No progress yet</p>
            )}
          </div>

          {/* STATUS UPDATE SECTION */}
          <div className="mt-6 space-y-3">
            <Select value={stage} onValueChange={setStage}>
              <SelectTrigger>
                <SelectValue placeholder="Select Stage" />
              </SelectTrigger>
              <SelectContent>
                {stages.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="number"
              placeholder="Enter quantity"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />

            <Button className="w-full" onClick={updateStatus}>
              Update Status
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
