"use client";

import { useCallback, useRef, useState } from "react";
import { FileUp, X, FileText, Presentation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UploadedFileType } from "@/hooks/useCreateOrder";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UploadOrderFileProps {
  uploadedFile: File | null;
  uploadedFileType: UploadedFileType;
  onFileSelect: (file: File | null) => void;
}

const ACCEPTED = ".pdf,.ppt,.pptx";
const ACCEPTED_MIME = [
  "application/pdf",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function UploadOrderFile({
  uploadedFile,
  uploadedFileType,
  onFileSelect,
}: UploadOrderFileProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = (file: File): string | null => {
    if (!ACCEPTED_MIME.includes(file.type) && !file.name.match(/\.(pdf|pptx?)$/i)) {
      return "Only PDF and PPT/PPTX files are accepted.";
    }
    if (file.size > 50 * 1024 * 1024) {
      return "File must be under 50 MB.";
    }
    return null;
  };

  const handleFile = useCallback(
    (file: File) => {
      const err = validate(file);
      if (err) {
        setError(err);
        return;
      }
      setError(null);
      onFileSelect(file);
    },
    [onFileSelect],
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset so the same file can be re-selected after clearing.
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const FileIcon = uploadedFileType === "ppt" ? Presentation : FileText;

  // ── Uploaded state ──────────────────────────────────────────────────────────
  if (uploadedFile) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-dashed bg-muted/40 px-4 py-3">
        <FileIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{uploadedFile.name}</p>
          <p className="text-xs text-muted-foreground">
            {uploadedFileType?.toUpperCase()} · {formatBytes(uploadedFile.size)}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={() => {
            setError(null);
            onFileSelect(null);
          }}
          aria-label="Remove uploaded file"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  // ── Drop zone ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-1.5">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload PDF or PPT file"
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-6 text-center transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/60 hover:bg-muted/40",
        )}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        <FileUp
          className={cn(
            "h-7 w-7 transition-colors",
            isDragging ? "text-primary" : "text-muted-foreground",
          )}
        />
        <div>
          <p className="text-sm font-medium">
            Drop a file or{" "}
            <span className="text-primary underline-offset-2 hover:underline">browse</span>
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">PDF or PPT / PPTX · max 50 MB</p>
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="sr-only"
        onChange={onInputChange}
        aria-hidden="true"
      />
    </div>
  );
}