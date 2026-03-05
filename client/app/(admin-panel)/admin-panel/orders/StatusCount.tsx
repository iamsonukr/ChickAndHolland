"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/constants";

export default function StatusCount({ orderId }: { orderId: number }) {
  const [data, setData] = useState<any>(null);

 useEffect(() => {
  const token = localStorage.getItem("admin-token");

  fetch(API_URL + `/pieces/status-count/${orderId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((res) => res.json())
    .then((d) => setData(d))
    .catch(() => {});
}, [orderId]);


  if (!data) return <p className="mt-4">Loading status overview...</p>;

  const statusColors: any = {
    Pattern: "bg-blue-200 text-blue-900",
    Khaka: "bg-amber-200 text-amber-900",
    "Issue Beading": "bg-purple-200 text-purple-900",
    Beading: "bg-pink-200 text-pink-900",
    Zarkan: "bg-orange-200 text-orange-900",
    Stitching: "bg-green-200 text-green-900",
    "Balance Pending": "bg-gray-300 text-gray-900",
    "Ready To Delivery": "bg-teal-200 text-teal-900",
    Shipped: "bg-green-300 text-green-900",
  };

  return (
    <div className="mt-8 border rounded-lg p-4 bg-white shadow">
      <h3 className="text-lg font-semibold mb-3">Status Overview</h3>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {Object.entries(data.counts).map(([status, count]: any) => (
          <div
            key={status}
            className={`p-3 rounded-lg text-center font-semibold ${statusColors[status]}`}
          >
            <p className="text-sm">{status}</p>
            <p className="text-xl">{count}</p>
          </div>
        ))}
      </div>

      <p className="text-right mt-4 font-bold text-lg">
        Total Pieces: {data.totalPieces}
      </p>
    </div>
  );
}
