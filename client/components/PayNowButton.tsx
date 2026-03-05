"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { API_URL } from "@/lib/constants";

export default function PayNowButton({ orderId }: { orderId: number }) {
  const [loading, setLoading] = useState(false);

  const handlePayNow = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/retailer-orders/create-checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ orderId }),
      });

      const data = await res.json();

      if (data?.success && data?.url) {
        window.location.href = data.url;
      } else {
        alert(data?.message || "Payment session creation failed");
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePayNow}
      disabled={loading}
      className="mr-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
    >
      {loading ? "Processing..." : "Pay Now"}
    </Button>
  );
}
