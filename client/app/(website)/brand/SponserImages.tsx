"use client";
import { CustomizedImage } from "@/components/custom/CustomizedImage";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import AutoPlay from "embla-carousel-autoplay";
import React from "react";

const SponserImages = ({ sponsor }: any) => {
  return (
    <div className="w-full overflow-hidden">
      <Carousel
        opts={{
          loop: true,
        }}
        plugins={[
          AutoPlay({
            delay: 2000,
            stopOnInteraction: false,
          }),
        ]}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {sponsor &&
            sponsor.map((item: any, index: number) => (
              <CarouselItem
                className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3"
                key={index}
              >
                <div className="flex h-full font-adornstoryserif flex-col items-center gap-2">
                  <div className="w-full h-[220px] sm:h-[280px] md:h-[448px] lg:h-[512px] relative">
                    <CustomizedImage
                      src={item.image_url}
                      alt="sponsor image"
                      unoptimized
                      fill
                      className="object-contain"
                    />
                  </div>
                  <p className="text-center text-sm sm:text-base font-mysi md:text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-3xl">
                    {item.description && item.description}
                  </p>
                </div>
              </CarouselItem>
            ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
};

export default SponserImages;