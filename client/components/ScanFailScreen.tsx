"use client";

import { XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScanFailScreenProps {
  open: boolean;
  title?: string;
  subtitle?: string;
  stage?: string;
}

export default function ScanFailScreen({
  open,
  title = "Scan Failed",
  subtitle = "Stage transition not allowed",
  stage,
}: ScanFailScreenProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 z-[120] flex items-center justify-center bg-red-600 transition-all duration-300",
        open
          ? "opacity-100 visible scale-100"
          : "opacity-0 invisible scale-95"
      )}
    >
      <div className="flex flex-col items-center px-6 text-center text-white">
        {/* Animated circle */}
        <div className="mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm animate-pulse">
          <XCircle className="h-16 w-16 text-white" strokeWidth={2.5} />
        </div>

        <h2 className="text-3xl font-bold tracking-tight">
          {title}
        </h2>

        <p className="mt-2 text-sm text-red-50">
          {subtitle}
        </p>

        {stage && (
          <div className="mt-5 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-semibold backdrop-blur-sm">
            {stage}
          </div>
        )}
      </div>
    </div>
  );
}