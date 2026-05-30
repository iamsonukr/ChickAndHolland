"use client";

import { Download, ExternalLink, Loader2, Presentation } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";

const canUseOfficeViewer = (url?: string | null) =>
  Boolean(url && /^https?:\/\//i.test(url));

export default function PptPreview({
  url,
  file,
  fileName = "order-presentation.pptx",
  heightClassName = "h-[75vh]",
}: {
  url?: string | null;
  file?: File | null;
  fileName?: string;
  heightClassName?: string;
}) {
  const [loading, setLoading] = useState(Boolean(url));
  const [failed, setFailed] = useState(false);
  const sourceUrl = url || "";
  const displayName = file?.name || fileName;
  const officeViewerUrl = useMemo(() => {
    if (!canUseOfficeViewer(sourceUrl)) return "";
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
      sourceUrl,
    )}`;
  }, [sourceUrl]);
  const inlineUrl = officeViewerUrl || sourceUrl;

  if (!inlineUrl) {
    return (
      <div
        className={`flex ${heightClassName} flex-col items-center justify-center gap-3 rounded border border-dashed bg-muted/30 p-4 text-center`}
      >
        <Presentation className="h-10 w-10 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">{displayName}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            PPT preview will be available after the file is saved.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Presentation className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate text-sm font-medium">{displayName}</span>
        </div>
        <div className="flex items-center gap-2">
          <a href={sourceUrl} target="_blank" rel="noreferrer">
            <Button type="button" variant="outline" size="sm" className="gap-1.5">
              <ExternalLink className="h-3.5 w-3.5" />
              Open
            </Button>
          </a>
          <a href={sourceUrl} download={displayName}>
            <Button type="button" variant="outline" size="sm" className="gap-1.5">
              <Download className="h-3.5 w-3.5" />
              Download
            </Button>
          </a>
        </div>
      </div>

      <div className={`relative overflow-hidden rounded border ${heightClassName}`}>
        {loading && !failed && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Loading preview...</span>
          </div>
        )}
        {failed ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 bg-muted/30 p-4 text-center">
            <Presentation className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm font-medium">Preview is unavailable</p>
            <p className="max-w-md text-xs text-muted-foreground">
              The file is still saved. Open or download it to view locally.
            </p>
          </div>
        ) : (
          <iframe
            title={`PPT preview - ${displayName}`}
            src={inlineUrl}
            className="h-full w-full bg-background"
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setFailed(true);
            }}
          />
        )}
      </div>
    </div>
  );
}
