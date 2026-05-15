"use client";

import { XCircle, PackageX, RotateCcw } from "lucide-react";

interface ScanFailOverlayProps {
  open: boolean;
  title?: string;
  message?: string;
  failedStage?: string | null;
  reason?: string | null;
  orderType?: string;
}

export default function ScanFailOverlay({
  open,
  title = "Scan Failed",
  message = "Unable to move product to next stage",
  failedStage,
  reason,
  orderType,
}: ScanFailOverlayProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-red-600">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
      </div>

      <div className="relative flex flex-col items-center px-6 text-center text-white">
        {/* Error icon */}
        <div className="mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-white/15 backdrop-blur">
          <XCircle className="h-20 w-20 animate-pulse text-white" />
        </div>

        {/* Heading */}
        <h1 className="text-4xl font-bold tracking-tight">
          {title}
        </h1>

        {/* Message */}
        <p className="mt-3 max-w-md text-lg text-red-50">
          {message}
        </p>

        {/* Order Type */}
        {orderType && (
          <div className="mt-5 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-sm font-medium backdrop-blur">
            {orderType}
          </div>
        )}

        {/* Failure Details */}
        {(failedStage || reason) && (
          <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-white/15 bg-white/10 px-6 py-4 backdrop-blur">
            {failedStage && (
              <div className="text-left">
                <p className="text-xs uppercase tracking-wider text-red-100/80">
                  Failed Stage
                </p>

                <p className="font-semibold">
                  {failedStage}
                </p>
              </div>
            )}

            {reason && (
              <div className="text-left">
                <p className="text-xs uppercase tracking-wider text-red-100/80">
                  Reason
                </p>

                <p className="font-semibold">
                  {reason}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Bottom */}
        {/* <div className="mt-10 flex items-center gap-2 text-sm text-red-100">
          <RotateCcw className="h-4 w-4" />
          Please scan again
        </div> */}
      </div>
    </div>
  );
}