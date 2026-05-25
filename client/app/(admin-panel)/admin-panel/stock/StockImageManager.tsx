"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Trash2, X } from "lucide-react";
import { Button } from "@/components/custom/button";
import { CustomizedImage } from "@/components/custom/CustomizedImage";
import { cn } from "@/lib/utils";

export type StockImage = {
  id?: number;
  name?: string;
  alt?: string;
};

type PreviewImage = {
  key: string;
  url: string;
};

type StockImageManagerProps = {
  images?: StockImage[];
  selectedFiles: File[];
  onSelectedFilesChange: (files: File[]) => void;
  onRemoveExistingImage?: (image: StockImage) => Promise<void> | void;
  removingImageId?: number | null;
  disabled?: boolean;
  label?: string;
  className?: string;
};

const getFileKey = (file: File) =>
  `${file.name}-${file.size}-${file.lastModified}`;

const StockImageManager = ({
  images = [],
  selectedFiles,
  onSelectedFilesChange,
  onRemoveExistingImage,
  removingImageId,
  disabled,
  label = "Images",
  className,
}: StockImageManagerProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImages, setPreviewImages] = useState<PreviewImage[]>([]);

  useEffect(() => {
    const previews = selectedFiles.map((file) => ({
      key: getFileKey(file),
      url: URL.createObjectURL(file),
    }));

    setPreviewImages(previews);

    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [selectedFiles]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).filter((file) =>
      file.type.startsWith("image/"),
    );

    if (files.length) {
      onSelectedFilesChange([...selectedFiles, ...files]);
    }

    event.target.value = "";
  };

  const removeSelectedFile = (fileKey: string) => {
    onSelectedFilesChange(
      selectedFiles.filter((file) => getFileKey(file) !== fileKey),
    );
  };

  const hasImages = images.length > 0 || previewImages.length > 0;

  return (
    <div className={cn("space-y-3 rounded-md border p-3", className)}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">{label}</p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
        >
          <ImagePlus className="mr-2 h-4 w-4" />
          Add Images
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled}
      />

      {hasImages ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((image, index) => (
            <div
              key={image.id ?? `${image.name}-${index}`}
              className="relative aspect-[3/4] overflow-hidden rounded-md border bg-muted"
            >
              <CustomizedImage
                src={image.name || ""}
                alt={image.alt || "Stock image"}
                fill
                className="object-cover"
              />
              {onRemoveExistingImage && image.id && (
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="absolute right-1 top-1 h-7 w-7"
                  onClick={() => onRemoveExistingImage(image)}
                  loading={removingImageId === image.id}
                  disabled={disabled}
                  aria-label="Remove image"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}

          {previewImages.map((preview) => (
            <div
              key={preview.key}
              className="relative aspect-[3/4] overflow-hidden rounded-md border border-dashed bg-muted"
            >
              <CustomizedImage
                src={preview.url}
                alt="Selected stock image preview"
                fill
                className="object-cover"
                unoptimized
              />
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="absolute right-1 top-1 h-7 w-7"
                onClick={() => removeSelectedFile(preview.key)}
                disabled={disabled}
                aria-label="Remove selected image"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <button
          type="button"
          className="flex h-28 w-full items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
        >
          No images yet
        </button>
      )}
    </div>
  );
};

export default StockImageManager;
