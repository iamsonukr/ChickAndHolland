"use client";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { CreateOrderForm } from "@/lib/formSchemas";

interface FileUploadFieldProps {
  form: UseFormReturn<CreateOrderForm>;
  index: number;
  name: string;
  label?: string;
}

const FileUploadField = ({ form, index, name, label = "Custom Images" }: FileUploadFieldProps) => {
  const fieldPath = `styles[${index}].${name}` as any;

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const watchedFiles = form.watch(fieldPath);

  useEffect(() => {
    const files = Array.from((watchedFiles ?? []) as any).filter(
      (file): file is File => file instanceof File,
    );
    setSelectedFiles(files);
  }, [watchedFiles]);

  // Sync preview URLs whenever selectedFiles changes
  useEffect(() => {
    const urls = selectedFiles.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [selectedFiles]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newFiles = Array.from(e.target.files ?? []);
      if (newFiles.length === 0) return;

      setSelectedFiles((prev) => {
        const merged = [...prev, ...newFiles];
        // Sync with RHF after state update
        form.setValue(fieldPath, merged, { shouldDirty: true });
        return merged;
      });

      // Reset input so the same file can be re-added if needed
      e.target.value = "";
    },
    [fieldPath, form],
  );

  const handleDelete = useCallback(
    (fileIndex: number) => {
      setSelectedFiles((prev) => {
        const updated = prev.filter((_, i) => i !== fileIndex);
        form.setValue(fieldPath, updated, { shouldDirty: true });
        return updated;
      });
    },
    [fieldPath, form],
  );

  return (
    <FormField
      control={form.control}
      name={fieldPath}
      render={() => (
        <FormItem className="col-span-full">
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <div className="space-y-4">
              <Input
                type="file"
                onChange={handleFileChange}
                className="block w-full cursor-pointer rounded-lg border text-sm"
                accept="image/*"
                multiple
                aria-label="Upload custom images"
              />

              {selectedFiles.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                  {previews.map((preview, fileIndex) => {
                    const file = selectedFiles[fileIndex];
                    // Use a stable key that won't collide even with same file name
                    const fileKey = file
                      ? `${file.name}-${file.lastModified}-${fileIndex}`
                      : `preview-${fileIndex}`;

                    return (
                      <div key={fileKey} className="group relative cursor-pointer">
                        <div className="relative aspect-square overflow-hidden rounded-lg border">
                          <img
                            src={preview}
                            alt={`Preview ${fileIndex + 1}`}
                            className="h-full w-full object-contain"
                          />
                          <div className="absolute inset-0 bg-black/0 transition-all group-hover:bg-black/40">
                            <Button
                              size="icon"
                              type="button"
                              onClick={() => handleDelete(fileIndex)}
                              className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
                              variant="destructive"
                              aria-label={`Remove image ${fileIndex + 1}`}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <span className="mt-1 block truncate text-xs text-gray-500">
                          {file?.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default FileUploadField;
