"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { getImageByStockId } from "@/lib/data";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { CustomizedImage } from "@/components/custom/CustomizedImage";

const StyleNoImage = ({ details }: { details: any }) => {
  const [open, setOpen] = useState(false);
  const [images, setImages] = useState<any[]>([]);

  const openDialog = async () => {
    const res = await getImageByStockId(details.id);
    setImages(res?.images ?? []);
    setOpen(true);
  };

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
            {details.product.productCode}
          </span>

          {/* EXACT INVENTORY IMAGE */}
          <CustomizedImage
            src={details.images.name}
            alt="product-image"
            fill
            className="object-cover"
          />
        </div>
      </DialogTrigger>

      {/* MODAL */}
      <DialogContent className="h-[95vh] max-w-[90vw] md:max-w-[50vw] lg:max-w-[40vw]">
        <DialogHeader>
          <DialogTitle>{details.product.productCode}</DialogTitle>
        </DialogHeader>

        <Carousel opts={{ loop: true }}>
          <CarouselContent>
            {images.map((img: any) => (
              <CarouselItem key={img.id}>
                <div className="relative h-[80vh] w-full">
                  <CustomizedImage
                    src={img.name}
                    alt={img.alt || "product"}
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
      </DialogContent>
    </Dialog>
  );
};

export default StyleNoImage;
