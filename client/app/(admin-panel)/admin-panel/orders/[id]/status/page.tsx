"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { API_URL } from "@/lib/constants";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import StatusLabelBox from "@/components/StatusLabelBox";
import StatusLabelBox1 from "@/components/StoreLable";

import { PDFDownloadLink } from "@react-pdf/renderer";
import LabelPdf from "@/components/LabelPdf";
import LabelPdf1 from "@/components/LabelBox";

export default function OrderStatusPage({ params }: any) {
  const { id } = use(params);

  const [retailerReport, setRetailerReport] = useState<any[]>([]);
  const [storeReport, setStoreReport] = useState<any[]>([]);
  const [stockReport, setStockReport] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/report/status/report/${id}`);
      const json = await res.json();
      if (json.success) setRetailerReport(json.data || []);
    } catch {}

    try {
      const res2 = await fetch(`${API_URL}/orders/store-status/report/${id}`);
      const json2 = await res2.json();
      if (json2.success) setStoreReport(json2.data || []);
    } catch {}

    try {
      const res3 = await fetch(`${API_URL}/report/stock-status/report/${id}`);
      const json3 = await res3.json();
      if (json3.success) setStockReport(json3.data || []);
    } catch {}

    setLoading(false);
  };

  useEffect(() => {
    fetchReport();
  }, []);

  if (loading) return <p className="p-6">Loading report...</p>;

  const nothing =
    !retailerReport.length &&
    !storeReport.length &&
    !stockReport.length;

  if (nothing) return <p className="p-6">No report found</p>;

  return (
    <div className="p-6">

      {/* ================= HEADER ================= */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Order Status Report</h1>

        {/* QR SCAN BUTTON */}
        <Link href="/admin-panel/orders/qr-scan">
          <Button variant="outline" className="text-sm">
            📷 QR Scan
          </Button>
        </Link>
      </div>

      {/* ================================================= */}
      {/* 🔵 RETAILER REPORT */}
      {/* ================================================= */}
      {retailerReport.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xl font-bold mb-4 text-blue-600">
            Retailer Order Status
          </h2>

          {retailerReport.map((item: any) => (
            <Card key={item.styleId} className="p-4 mb-4 border-2">
              <div className="flex justify-between gap-6">
                <div className="flex-1">
                  <h2 className="font-semibold text-lg">
                    {item.styleNo} ({item.barcode})
                  </h2>

                  {/* <p>Total Qty: {item.totalQty}</p>
                  <p>Completed: {item.completed}</p>
                  <p>Remaining: {item.remaining}</p> */}

                  <h3 className="mt-2 font-semibold">Progress Logs</h3>

                  {item.progress?.map((p: any) => (
                    <div key={p.id} className="text-sm">
                      {p.stage} — 
                      {/* {p.qty} pcs —{" "} */}
                      {new Date(p.createdAt).toLocaleDateString()}
                    </div>
                  ))}
                </div>

                <div className="flex flex-col items-center gap-2">
                  <StatusLabelBox item={item} />
                  <PDFDownloadLink
                    document={<LabelPdf item={item} />}
                    fileName={`${item.styleNo}-label.pdf`}
                  >
                    {({ loading }) => (
                      <button className="rounded bg-black px-3 py-1 text-xs text-white">
                        {loading ? "Preparing PDF..." : "⬇ Download Label"}
                      </button>
                    )}
                  </PDFDownloadLink>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ================================================= */}
      {/* 🟢 STORE REPORT */}
      {/* ================================================= */}
      {storeReport.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xl font-bold mb-4 text-green-600">
            Store Order Status
          </h2>

          {storeReport.map((item: any) => (
            <Card key={item.styleId} className="p-4 mb-4 border-2">
              <div className="flex justify-between gap-6">
                <div className="flex-1">
                  <h2 className="font-semibold text-lg">
                    {item.styleNo} ({item.barcode})
                  </h2>

                  {/* <p>Total Qty: {item.totalQty}</p>
                  <p>Completed: {item.completedQty}</p>
                  <p>Remaining: {item.remainingQty}</p> */}

                  <h3 className="mt-2 font-semibold">Progress Logs</h3>

                  {item.progress?.map((p: any) => (
                    <div key={p.id} className="text-sm">
                      {p.stage || p.status} — 
                      {/* {p.qty} pcs —{" "} */}
                      {new Date(p.createdAt).toLocaleDateString()}
                    </div>
                  ))}
                </div>

                <div className="flex flex-col items-center gap-2">
                  <StatusLabelBox1 item={item} />
                  <PDFDownloadLink
                    document={<LabelPdf1 item={item} />}
                    fileName={`${item.styleNo}-label.pdf`}
                  >
                    {({ loading }) => (
                      <button className="rounded bg-black px-3 py-1 text-xs text-white">
                        {loading ? "Preparing PDF..." : "⬇ Download Label"}
                      </button>
                    )}
                  </PDFDownloadLink>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ================================================= */}
      {/* 🟣 STOCK REPORT */}
      {/* ================================================= */}
      {stockReport.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4 text-purple-600">
            Stock Order Status
          </h2>

          {stockReport.map((item: any) => (
            <Card key={item.styleId} className="p-4 mb-4 border-2">
              <div className="flex justify-between gap-6">
                <div className="flex-1">
                  <h2 className="font-semibold text-lg">
                    {item.styleNo} ({item.barcode})
                  </h2>

                  {/* <p>Total Qty: {item.totalQty}</p>
                  <p>Completed: {item.completedQty}</p>
                  <p>Remaining: {item.remainingQty}</p> */}

                  <h3 className="mt-2 font-semibold">Progress Logs</h3>

                  {item.progress?.map((p: any) => (
                    <div key={p.id} className="text-sm">
                      {p.stage || p.status} — 
                      {/* {p.qty} pcs —{" "} */}
                      {new Date(p.createdAt).toLocaleDateString()}
                    </div>
                  ))}
                </div>

                <div className="flex flex-col items-center gap-2">
                  <StatusLabelBox item={item} />
                  <PDFDownloadLink
                    document={<LabelPdf item={item} />}
                    fileName={`${item.styleNo}-label.pdf`}
                  >
                    {({ loading }) => (
                      <button className="rounded bg-black px-3 py-1 text-xs text-white">
                        {loading ? "Preparing PDF..." : "⬇ Download Label"}
                      </button>
                    )}
                  </PDFDownloadLink>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
