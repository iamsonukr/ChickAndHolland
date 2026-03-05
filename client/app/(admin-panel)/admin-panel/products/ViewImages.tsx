"use client";

import { Button } from "@/components/custom/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

import { Image } from "lucide-react";
import useHttp from "@/lib/hooks/usePost";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { useRef, useState } from "react";

const ViewImages = ({ productData }: any) => {
  const { executeAsync, loading } = useHttp(
    `/products/images/${productData?.images?.[0]?.id}`,
    "DELETE",
  );

  const { executeAsync: addImage, loading: addImageLoading } = useHttp(
    `/products/images`,
    "POST",
  );

  const router = useRouter();

  const fileRef = useRef<HTMLInputElement>(null);

  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(event.target.files);
  };

  const handleClearFiles = () => {
    if (fileRef.current) {
      fileRef.current.value = "";
    }
    setSelectedFiles(null);
  };

  const fileCount = selectedFiles?.length ?? 0;

  return (
    <Dialog >
      <DialogTrigger asChild>
        <Button size={"icon"} variant={"secondary"}>
          <Image />
        </Button>
      </DialogTrigger>
      <DialogContent className={' '}>
        <DialogHeader className="mt-6">
          <DialogTitle asChild>
            <div className="flex items-center justify-between">
              <h1 className="text-xl">Product Images</h1>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={async () => {
                    if (fileCount > 0) {
                      try {
                        const formData = new FormData();

                        for (let i = 0; i < fileCount; i++) {
                          formData.append(
                            `images[${i}]`,
                            selectedFiles?.item(i) as File,
                          );
                        }

                        formData.append("productId", productData.id);

                        await addImage(formData, {}, (error) => {
                          return toast.error("Error uploading images");
                        });

                        setSelectedFiles(null);

                        toast("Images uploaded successfully");
                        router.refresh();
                      } catch (error) {
                        return toast.error("Error uploading images");
                      }
                    } else {
                      fileRef.current?.click();
                    }
                  }}
                  variant={fileCount > 0 ? "default" : "secondary"}
                  loading={addImageLoading}
                >
                  {fileCount > 0 ? "Submit" : "Upload New Images"}
                </Button>
                {fileCount > 0 && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleClearFiles}
                  >
                    Clear selected images
                  </Button>
                )}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <input
          type="file"
          ref={fileRef}
          className="hidden"
          onChange={handleFileChange}
          multiple
          accept="image/*"
        />

        <Carousel opts={{ loop: true }} className={'max-h-[80dvh]  lg:max-h-[90dvh]'}>
          <CarouselContent className={'max-h-[80dvh]  lg:max-h-[90dvh]'}>
            {productData?.images.map((image: any, index: number) => (
              <CarouselItem key={image.id} className={'flex flex-col justify-center items-center w-full'}>
                <div className="relative space-y-2  w-[70%] ">
                  <img
                    src={image.name}
                    alt={image.alt}
                    className="h-auto !max-h-[70vh] lg:!max-h-[80dvh] w-[100%]"
                  />

                  <Button
                    variant={"destructive"}
                    className="w-full"
                    onClick={async () => {
                      await executeAsync(
                        {},
                        {
                          url: `/products/images/${image.id}`,
                        },
                        (error) => {
                          return toast.error("Error deleting image");
                        },
                      );

                      toast("Image deleted successfully");
                      router.refresh();
                    }}
                    loading={loading}
                  >
                    Remove Image
                  </Button>

                  <Badge
                    className="absolute right-2 top-2"
                    variant={"secondary"}
                  >
                    #{index + 1}
                  </Badge>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </DialogContent>
    </Dialog>
  );
};

export default ViewImages;
