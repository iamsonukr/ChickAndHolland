"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useEffect, useMemo, useState } from "react";
import { getImageByStockId } from "@/lib/data";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { CustomizedImage } from "@/components/custom/CustomizedImage";

const normalizeImages = (images: unknown) => {
  if (Array.isArray(images)) return images.filter(Boolean);
  return images ? [images] : [];
};

const StyleNoImage = ({ details }: { details: any }) => {
  const initialImages = useMemo(
    () =>
      [
        ...normalizeImages(details.images),
        ...normalizeImages(details.product?.images),
      ].filter((image: any, index, self) => {
        const key = image?.id ?? image?.name;
        return key && self.findIndex((item: any) => (item?.id ?? item?.name) === key) === index;
      }),
    [details.images, details.product?.images],
  );
  const [open, setOpen] = useState(false);
  const [images, setImages] = useState<any[]>(initialImages);

  useEffect(() => {
    setImages(initialImages);
  }, [initialImages]);

  const openDialog = async () => {
    try {
      const res = await getImageByStockId(details.id);
      setImages(res?.images ?? []);
    } catch {
      setImages(initialImages);
    }
    setOpen(true);
  };

  const productCode = details.product?.productCode || details.productCode || "Stock";
  const thumbnail = initialImages[0]?.name || "";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {/* IMAGE WRAPPER */}
        <div
          onClick={openDialog}
          className="relative h-full w-full cursor-pointer"
        >
          {/* PRODUCT CODE */}
          <span className="absolute right-1 top-1 z-10 rounded bg-black/80 px-1.5 py-0.5 text-xs text-white">
            {productCode}
          </span>

          {/* EXACT INVENTORY IMAGE */}
          <CustomizedImage
            src={thumbnail}
            alt={productCode}
            fill
            className="object-cover"
          />
        </div>
      </DialogTrigger>

      {/* MODAL */}
      <DialogContent className="h-[95vh] max-w-[90vw] md:max-w-[50vw] lg:max-w-[40vw]">
        <DialogHeader>
          <DialogTitle>{productCode}</DialogTitle>
        </DialogHeader>

        {images.length > 0 ? (
          <Carousel opts={{ loop: true }}>
            <CarouselContent>
              {images.map((img: any, index: number) => (
                <CarouselItem key={img.id ?? `${img.name}-${index}`}>
                  <div className="relative h-[80vh] w-full">
                    <CustomizedImage
                      src={img.name}
                      alt={img.alt || productCode}
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>

            {images.length > 1 && (
              <>
                <CarouselPrevious />
                <CarouselNext />
              </>
            )}
          </Carousel>
        ) : (
          <div className="relative h-[80vh] w-full overflow-hidden rounded-md border">
            <CustomizedImage
              src=""
              alt={productCode}
              fill
              className="object-contain"
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default StyleNoImage;
