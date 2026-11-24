"use client";

import { useEffect, useState } from "react";
import PdfPreview from "@/components/pdf/PdfPreview";

export default function OrderPdfViewer() {
  const [file, setFile] = useState<File | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      const params = new URLSearchParams(location.hash.slice(1));
      setShowSearch(params.get("search") === "1");
      const source = new URL(params.get("source") || "");
      if (source.protocol !== "blob:" || source.origin !== location.origin) throw new Error();
      const response = await fetch(source, { signal: controller.signal });
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      if (!controller.signal.aborted) {
        setFile(new File([blob], params.get("name") || "order.pdf", { type: "application/pdf" }));
      }
    }
    load().catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, []);

  if (!file) return <p role="status">{error ? "Reopen the PDF from the order preview." : "Opening PDF…"}</p>;
  return <PdfPreview file={file} fileName={file.name} showActions={false} showSearchToggle={false} initiallyShowSearch={showSearch}
    autoExternalFallback={false} heightClassName="h-dvh" />;
}
