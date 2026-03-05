"use client";

import { useState } from "react";
import { API_URL } from "@/lib/constants";

export default function WorkerScanPage() {
  const [barcode, setBarcode] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [message, setMessage] = useState("");

  const handleScan = async () => {
    setMessage("");

const res = await fetch(`${API_URL}/order-status/scan-order/${barcode}`);
    const data = await res.json();

    if (!data.success) {
      setOrder(null);
      setMessage("❌ Order not found");
      return;
    }

    setOrder(data.data);
  };

  const updateStatus = async () => {
  const res = await fetch(`${API_URL}/order-status/qr-scan-update/${barcode}`, {
    method: "PUT",
  });

  const data = await res.json();
  setMessage(data.message);

  if (data.success) {
    handleScan();
  }
};


  return (
    <div style={{ padding: 20 }}>
      <h1>Scan Order Barcode</h1>

      <input
        value={barcode}
        onChange={(e) => setBarcode(e.target.value)}
        placeholder="Enter barcode..."
      />
      <button onClick={handleScan}>Scan</button>

      {order && (
        <div style={{ marginTop: 20 }}>
          <h3>Order Found</h3>
          <p><b>Order ID:</b> {order.id}</p>
          <p><b>Current Status:</b> {order.orderStatus}</p>

          <button
            onClick={updateStatus}
            style={{ marginTop: 10, padding: "8px 12px", background: "green", color: "white" }}
          >
            Update to Next Status
          </button>
        </div>
      )}

      {message && <p style={{ marginTop: 20 }}>{message}</p>}
    </div>
  );
}
