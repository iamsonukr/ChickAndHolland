"use client";

import { Download, ExternalLink, Presentation } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";

const canUseOfficeViewer = (url?: string | null) => {
  if (!url || !/^https?:\/\//i.test(url)) return false;

  try {
    const parsedUrl = new URL(url);
    return !["localhost", "127.0.0.1", "::1"].includes(parsedUrl.hostname);
  } catch {
    return false;
  }
};

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
  const [showOnlinePreview, setShowOnlinePreview] = useState(false);
  const sourceUrl = url || "";
  const displayName = file?.name || fileName;
  const officeViewerUrl = useMemo(() => {
    if (!canUseOfficeViewer(sourceUrl)) return "";
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
      sourceUrl,
    )}`;
  }, [sourceUrl]);

  if (!sourceUrl) {
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
          {officeViewerUrl && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setShowOnlinePreview((value) => !value)}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {showOnlinePreview ? "Hide Preview" : "Preview Online"}
            </Button>
          )}
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

      <div
        className={`relative overflow-hidden rounded border bg-muted/30 ${heightClassName}`}
      >
        {showOnlinePreview && officeViewerUrl ? (
          <iframe
            title={`PPT preview - ${displayName}`}
            src={officeViewerUrl}
            className="h-full w-full bg-background"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center">
            <Presentation className="h-12 w-12 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{displayName}</p>
              <p className="mt-1 max-w-md text-xs text-muted-foreground">
                PPT/PPTX files are ready to open or download. Online preview is
                loaded only when requested so the browser does not auto-download
                the file.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
