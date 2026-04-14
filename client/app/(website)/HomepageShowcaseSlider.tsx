"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/autoplay";

type HomepageShowcaseSlide = {
  src: string;
  width: number;
  height: number;
};

const IMAGE_SIZES =
  "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, calc(100vw - 2rem)";

export default function HomepageShowcaseSlider({
  slides,
}: {
  slides: HomepageShowcaseSlide[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { rootMargin: "150px" },
    );

    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full max-w-6xl px-4">
      <Swiper
        modules={[Autoplay]}
        loop
        speed={700}
        autoplay={
          isVisible ? { delay: 1500, disableOnInteraction: false } : false
        }
        breakpoints={{
          320: { slidesPerView: 1 },
          640: { slidesPerView: 2 },
          1024: { slidesPerView: 3 },
        }}
      >
        {slides.map(({ src, width, height }) => (
          <SwiperSlide key={src}>
            <div className="relative group overflow-hidden shadow-lg transition-all duration-500">
              <Image
                src={src}
                alt="SS26 collection"
                width={width}
                height={height}
                sizes={IMAGE_SIZES}
                className="h-[580px] w-full object-fill transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
