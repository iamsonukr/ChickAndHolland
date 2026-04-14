"use client";

import { memo, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { CustomizedImage } from "@/components/custom/CustomizedImage";
import HlsVideo, { HlsVideoProps } from "@/components/custom/HlsVideo";

interface LazyHlsVideoProps extends HlsVideoProps {
  posterSrc: string;
  posterAlt: string;
  imageSizes?: string;
  rootMargin?: string;
  wrapperClassName?: string;
}

const LazyHlsVideo = ({
  posterSrc,
  posterAlt,
  imageSizes,
  rootMargin = "200px",
  wrapperClassName,
  className,
  poster,
  preload = "metadata",
  ...videoProps
}: LazyHlsVideoProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { rootMargin },
    );

    observer.observe(container);

    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div
      ref={containerRef}
      className={cn("relative h-full w-full overflow-hidden", wrapperClassName)}
    >
      {isVisible ? (
        <HlsVideo
          {...videoProps}
          className={className}
          poster={poster ?? posterSrc}
          preload={preload}
        />
      ) : (
        <CustomizedImage
          src={posterSrc}
          alt={posterAlt}
          className={className}
          wrapperClassName="h-full w-full"
          sizes={imageSizes}
          loading="lazy"
        />
      )}
    </div>
  );
};

export default memo(LazyHlsVideo);
