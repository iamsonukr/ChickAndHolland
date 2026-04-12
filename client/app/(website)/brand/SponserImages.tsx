"use client";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import AutoPlay from "embla-carousel-autoplay";
import React from "react";

type SponsorItem = {
  image_url: string;
  description?: string | null;
};

type SponserImagesProps = {
  sponsor?: SponsorItem[];
};

const SponserImages = ({ sponsor = [] }: SponserImagesProps) => {
  return (
    <div className="w-full overflow-hidden px-2 py-2 sm:px-3">
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
        className="w-full"
      >
        <CarouselContent className="-ml-2 sm:-ml-4">
          {sponsor.map((item, index) => (
            <CarouselItem
              className="basis-full pl-2 sm:basis-1/2 sm:pl-4 lg:basis-1/3"
              key={index}
            >
              <div className="flex h-full flex-col gap-3 rounded-2xl border border-[#C9A39A]/10 bg-[#050505]/70 p-2">
                <div className="flex items-center justify-center rounded-xl">
                  <img
                    src={item.image_url}
                    alt={item.description || "Sponsor image"}
                    loading="lazy"
                    className="h-auto max-h-[520px] w-auto max-w-full rounded-xl object-contain"
                  />
                  </div>
                {item.description && (
                  <p className="px-1 text-center font-mysi text-sm sm:text-base md:text-lg lg:text-xl 2xl:text-2xl">
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
