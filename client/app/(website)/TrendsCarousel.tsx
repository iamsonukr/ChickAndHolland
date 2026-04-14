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
    src: "https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/homepage/HF110456.jpg",
    alt: "Picture of chic and holland dresses",
  },
  {
    id: "1205",
    src: "https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/homepage/HF110458.jpg",
    alt: "Picture of chic and holland dresses",
  },
  {
    id: "1160",
    src: "https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/homepage/HF110502.jpg",
    alt: "Picture of chic and holland dresses",
  },
  {
    id: "1235",
    src: "https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/homepage/HF110547.jpg",
    alt: "Picture of chic and holland dresses",
  },
  {
    id: "1252",
    src: "https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/homepage/HF110555.jpg",
    alt: "Picture of chic and holland dresses",
  },
  {
    id: "1168",
    src: "https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/homepage/HF110557.jpg",
    alt: "Picture of chic and holland dresses",
  },
  {
    id: "1156",
    src: "https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/homepage/HF110562.jpg",
    alt: "Picture of chic and holland dresses",
  },
  {
    id: "1204",
    src: "https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/homepage/PH120103.jpg",
    alt: "Picture of chic and holland dresses",
  },
  {
    id: "1154",
    src: "https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/homepage/PH120114.jpg",
    alt: "Picture of chic and holland dresses",
  },
  {
    id: "1147",
    src: "https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/homepage/PH120116.jpg",
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
      </Carousel>
    </div>
  );
};

export default TrendsCarousel;
