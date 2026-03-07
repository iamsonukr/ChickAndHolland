"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

// ✅ Separated into its own component so Suspense can wrap useSearchParams
function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get("session_id") ?? null;

  const [orderId, setOrderId] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      return;
    }

    // fetch(`${process.env.NEXT_PUBLIC_API_URL}/stripe/payment-status/${sessionId}`)
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/stripe/payment-status/${sessionId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.stripeStatus === "paid") {
          setOrderId(data.orderId);
          setStatus("success");
        } else {
          setStatus("error");
        }
      })
      .catch(() => setStatus("error"));
  }, [sessionId]);
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
        <p className="text-gray-500 animate-pulse">Verifying payment...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-gray-100 p-4">
        <div className="w-full max-w-md shadow-xl bg-white p-6 rounded-xl text-center">
          <h1 className="text-2xl font-bold mb-2 text-red-600">Payment Verification Failed</h1>
          <p className="text-gray-500 mb-6">We couldn't verify your payment. Please contact support.</p>
          <a href="/retailer-panel/my-orders">
            <button className="w-full bg-black text-white p-3 rounded-lg">Go to My Orders</button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100 p-4">
      <div className="w-full max-w-md shadow-xl bg-white p-6 rounded-xl">
        <h1 className="text-2xl font-bold mb-4">Payment Successful 🎉</h1>
        <p>Your order has been received and is pending admin approval.</p>

        {orderId && (
          <div className="mt-4 bg-gray-100 p-3 rounded-lg">
            <p className="text-sm text-gray-500">Order Reference</p>
            <p className="font-semibold">{orderId}</p>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <a href="/retailer-panel/my-orders" className="w-full">
            <button className="w-full bg-black text-white p-3 rounded-lg">Go to My Orders</button>
          </a>
          <a href="/retailer-panel/dashboard" className="w-full">
            <button className="w-full border p-3 rounded-lg">Go to Dashboard</button>
          </a>
        </div>

        <p className="text-xs text-gray-500 mt-4">
          A confirmation email has been sent to your email.
        </p>
      </div>
    </div>
  );
}

// ✅ Suspense required by Next.js when using useSearchParams()
export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
          <p className="text-gray-500 animate-pulse">Loading...</p>
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}