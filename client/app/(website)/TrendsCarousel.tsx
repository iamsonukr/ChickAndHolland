"use client";

import { useEffect, useRef, useState } from "react";
import { CustomizedImage } from "@/components/custom/CustomizedImage";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import AutoPlay from "embla-carousel-autoplay";
import { useRouter } from "next/navigation";

const images = [
  {
    id: "1151",
    src: "https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/ChangesJuly26/HomeContent/EDITORIAL%20CAMPAIGN/B1/HF110615.jpg",
    alt: "Picture of chic and holland dresses",
  },
  {
    id: "1205",
    src: "https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/ChangesJuly26/HomeContent/EDITORIAL%20CAMPAIGN/B1/HF110673.jpg",
    alt: "Picture of chic and holland dresses",
  },
  {
    id: "1160",
    src: "https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/ChangesJuly26/HomeContent/EDITORIAL%20CAMPAIGN/B1/HF110702.jpg",
    alt: "Picture of chic and holland dresses",
  },
  {
    id: "1235",
    src: "https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/ChangesJuly26/HomeContent/EDITORIAL%20CAMPAIGN/B1/PH120133.jpg",
    alt: "Picture of chic and holland dresses",
  },
  {
    id: "1252",
    src: "https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/ChangesJuly26/HomeContent/EDITORIAL%20CAMPAIGN/B1/PH120141.jpg",
    alt: "Picture of chic and holland dresses",
  },
  {
    id: "1168",
    src: "https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/ChangesJuly26/HomeContent/EDITORIAL%20CAMPAIGN/B2/HF110603.jpg",
    alt: "Picture of chic and holland dresses",
  },
  {
    id: "1156",
    src: "https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/ChangesJuly26/HomeContent/EDITORIAL%20CAMPAIGN/B2/HF110695.jpg",
    alt: "Picture of chic and holland dresses",
  },
  {
    id: "1204",
    src: "https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/ChangesJuly26/HomeContent/EDITORIAL%20CAMPAIGN/B2/HF110704.jpg",
    alt: "Picture of chic and holland dresses",
  },
  {
    id: "1154",
    src: "https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/ChangesJuly26/HomeContent/EDITORIAL%20CAMPAIGN/B2/PH120142.jpg",
    alt: "Picture of chic and holland dresses",
  },
  {
    id: "1147",
    src: "https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/ChangesJuly26/HomeContent/EDITORIAL%20CAMPAIGN/B2/PH120151.jpg",
    alt: "Picture of chic and holland dresses",
  },
    {
    id: "1128",
    src: "https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/ChangesJuly26/HomeContent/EDITORIAL%20CAMPAIGN/B3/HF110628.jpg",
    alt: "Picture of chic and holland dresses",
  },  {
    id: "1136",
    src: "https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/ChangesJuly26/HomeContent/EDITORIAL%20CAMPAIGN/B3/HF110636.jpg",
    alt: "Picture of chic and holland dresses",
  },  {
    id: "1170",
    src: "https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/ChangesJuly26/HomeContent/EDITORIAL%20CAMPAIGN/B3/HF110670.jpg",
    alt: "Picture of chic and holland dresses",
  },
    {
    id: "1172",
    src: "https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/ChangesJuly26/HomeContent/EDITORIAL%20CAMPAIGN/B3/HF110672.jpg",
    alt: "Picture of chic and holland dresses",
  },
    {
    id: "1151",
    src: "https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/ChangesJuly26/HomeContent/EDITORIAL%20CAMPAIGN/B3/PH120151.jpg",
    alt: "Picture of chic and holland dresses",
  },
];

const IMAGE_SIZES = "(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw";

const TrendsCarousel = () => {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const autoplayRef = useRef(
    AutoPlay({
      delay: 2000,
      stopOnInteraction: false,
      playOnInit: false,
    }),
  );
  const [api, setApi] = useState<CarouselApi>();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { rootMargin: "200px" },
    );

    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const autoplay = api?.plugins()?.autoplay;
    if (!autoplay) return;

    if (isVisible) {
      autoplay.play();
      return;
    }

    autoplay.stop();
  }, [api, isVisible]);

  return (
    <div ref={containerRef} className="w-full">
      <Carousel
        setApi={setApi}
        opts={{
          loop: true,
        }}
        plugins={[autoplayRef.current]}
      >
        <CarouselContent className="-ml-1 md:-ml-2">
          {images.map((image) => (
            <CarouselItem
              key={image.id}
              className="cursor-pointer pl-1 md:basis-1/3 md:pl-2 lg:basis-1/4"
              onClick={() => {
                router.push(`/product/${image.id}`);
              }}
            >
              <CustomizedImage
                src={image.src}
                alt={image.alt}
                loading="lazy"
                sizes={IMAGE_SIZES}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="flex justify-center space-x-2 py-4 max-w-[200px] mx-auto">
          <img src="https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/ChangesJuly26/HomeContent/Floral%20line.png" alt="" />
        </div>
      </Carousel>
    </div>
  );
};

export default TrendsCarousel;
