"use client";

import { CustomizedImage } from "@/components/custom/CustomizedImage";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import AutoPlay from "embla-carousel-autoplay";

const TopSectionCarousel = () => {
  return (
    <div className="w-full md:hidden">
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
      >
        <CarouselContent>
          <CarouselItem>
            <CustomizedImage
              src={
                "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-images/new_image_60aza.webp"
              }
              alt="Picture of chic and holland dresses"
              className="m-0 h-dvh w-full p-0"
              unoptimized
            />
          </CarouselItem>
          <CarouselItem>
            <video
              src="https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/DKGQ5065.mp4"
              autoPlay={true}
              muted={true}
              loop={true}
              playsInline={true}
              controlsList="nodownload"
              className="m-0 h-dvh w-full object-fill p-0"
            ></video>
          </CarouselItem>
          <CarouselItem>
            <CustomizedImage
              src={
                "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-images/new_image_w7baj5.webp"
              }
              alt="Picture of chic and holland dresses"
              className="m-0 h-dvh w-full p-0"
              unoptimized
            />
          </CarouselItem>
        </CarouselContent>
      </Carousel>
    </div>
  );
};

export default TopSectionCarousel;
