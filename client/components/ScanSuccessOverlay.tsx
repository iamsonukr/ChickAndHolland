"use client";

import { CheckCircle2, PackageCheck, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScanSuccessOverlayProps {
  open: boolean;
  title?: string;
  message?: string;
  previousStage?: string | null;
  nextStage?: string | null;
  orderType?: string;
}

export default function ScanSuccessOverlay({
  open,
  title = "Scan Successful",
  message = "Product moved to next stage",
  previousStage,
  nextStage,
  orderType,
}: ScanSuccessOverlayProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-emerald-600">
      {/* Animated circles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
      </div>

      <div className="relative flex flex-col items-center px-6 text-center text-white">
        {/* Success icon */}
        <div className="mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-white/15 backdrop-blur">
          <CheckCircle2 className="h-20 w-20 animate-pulse text-white" />
        </div>

        {/* Heading */}
        <h1 className="text-4xl font-bold tracking-tight">
          {title}
        </h1>

        {/* Message */}
        <p className="mt-3 max-w-md text-lg text-emerald-50">
          {message}
        </p>

        {/* Order Type */}
        {orderType && (
          <div className="mt-5 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-sm font-medium backdrop-blur">
            {orderType}
          </div>
        )}

        {/* Stage transition */}
        {(previousStage || nextStage) && (
          <div className="mt-8 flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-6 py-4 backdrop-blur">
            <div className="text-left">
              <p className="text-xs uppercase tracking-wider text-emerald-100/80">
                Previous
              </p>

              <p className="font-semibold">
                {previousStage || "-"}
              </p>
            </div>

            <ArrowRight className="h-5 w-5 opacity-80" />

            <div className="text-left">
              <p className="text-xs uppercase tracking-wider text-emerald-100/80">
                Next
              </p>

              <p className="font-semibold">
                {nextStage || "-"}
              </p>
            </div>
          </div>
        )}

        {/* Bottom */}
        <div className="mt-10 flex items-center gap-2 text-sm text-emerald-100">
          <PackageCheck className="h-4 w-4" />
          Ready for next scan
        </div>
      </div>
    </div>
  );
} 