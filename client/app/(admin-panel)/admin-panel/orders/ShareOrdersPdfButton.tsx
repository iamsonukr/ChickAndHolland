"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { API_URL } from "@/lib/constants";
import { getCookie } from "@/lib/utils";
import {
  prepareSelectedOrderPdf,
  shareSelectedOrderPdf,
  downloadSelectedOrderPdf,
} from "@/lib/selectedOrderPdf";
import { useItems } from "./Delete";

export default function ShareOrdersPdfButton() {
  const { items } = useItems();
  const selectionKey = JSON.stringify(items);
  const [prepared, setPrepared] = useState<{ key: string; file: File } | null>(
    null,
  );
  const [failure, setFailure] = useState<{
    key: string;
    message: string;
  } | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [sharing, setSharing] = useState(false);
  const request = useRef<AbortController | null>(null);

  useEffect(() => {
    setPrepared(null);
    setFailure(null);
    setPreparing(false);
    setSharing(false);
    return () => request.current?.abort();
  }, [selectionKey]);

  const file = prepared?.key === selectionKey ? prepared.file : null;
  const error = failure?.key === selectionKey ? failure.message : "";

  const share = async () => {
    if (!items.length || preparing || sharing) return;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    let readyFile = file;
    setFailure(null);
    try {
      if (!readyFile) {
        setPreparing(true);
        readyFile = await prepareSelectedOrderPdf(
          items,
          API_URL,
          getCookie("token") || "",
          controller.signal,
        );
        controller.signal.throwIfAborted();
        setPrepared({ key: selectionKey, file: readyFile });
        setPreparing(false);
        // Some browsers require a new click after lengthy PDF generation.
        if (
          typeof navigator.share === "function" &&
          navigator.canShare?.({ files: [readyFile] }) &&
          navigator.userActivation &&
          !navigator.userActivation.isActive
        ) {
          toast.info("PDF is ready. Click Share PDF again to choose an app.");
          return;
        }
      }
      setSharing(true);
      const result = await shareSelectedOrderPdf(readyFile);
      if (result === "downloaded")
        toast.info(
          "File sharing is unavailable in this browser. PDF downloaded so you can attach it to your message.",
        );
    } catch (error) {
      if (controller.signal.aborted) return;
      const message =
        error instanceof Error
          ? error.message
          : "Unable to generate or share PDF.";
      if (readyFile) {
        const downloadable = readyFile;
        toast.error(message, {
          action: {
            label: "Download PDF",
            onClick: () => downloadSelectedOrderPdf(downloadable),
          },
        });
      } else {
        setFailure({ key: selectionKey, message });
      }
    } finally {
      if (!controller.signal.aborted) {
        setPreparing(false);
        setSharing(false);
      }
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="outline"
        disabled={!items.length || preparing || sharing}
        onClick={share}
      >
        {preparing || sharing ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Share2 className="mr-2 h-4 w-4" />
        )}
        {preparing ? "Generating PDF" : error ? "Retry Share PDF" : "Share PDF"}
        {items.length ? ` (${items.length})` : ""}
      </Button>
      {error && (
        <p role="alert" className="max-w-sm text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
