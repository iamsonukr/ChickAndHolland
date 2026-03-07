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
          align: "start",
        }}
        plugins={[
          AutoPlay({
            delay: 2000,
            stopOnInteraction: false,
          }),
        ]}
        className="w-full overflow-hidden"
      >
        <CarouselContent className="ml-0 ">
          {sponsor &&
            sponsor.map((item: any, index: number) => (
              <CarouselItem
                className="pl-0 basis-full sm:basis-1/3 lg:basis-1/3"
                key={index}
              >
                <div className="flex flex-col items-center gap-2 p-2">
                  <div className="relative w-full aspect-[3/4]">
                    <CustomizedImage
                      src={item.image_url}
                      alt="sponsor image"
                      unoptimized
                      fill
                      className="object-cover rounded-xl"
                    />
                  </div>
                  {item.description && (
                    <p className="text-center font-mysi text-sm sm:text-base md:text-lg lg:text-xl 2xl:text-2xl px-2">
                      {item.description}
                    </p>
                  )}
                </div>
              </CarouselItem>
            ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
};

export default SponserImages;