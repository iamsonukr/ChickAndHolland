"use client";

import { SyntheticEvent, memo, useEffect, useRef, useState } from "react";
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
  onLoadedData,
  onCanPlay,
  ...videoProps
}: LazyHlsVideoProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasEnteredViewport, setHasEnteredViewport] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);

        if (entry.isIntersecting) {
          setHasEnteredViewport(true);
        }
      },
      { rootMargin },
    );

    observer.observe(container);

    return () => observer.disconnect();
  }, [rootMargin]);

  const handleVideoReady = () => {
    setIsVideoReady(true);
  };

  const handleLoadedData = (event: SyntheticEvent<HTMLVideoElement>) => {
    handleVideoReady();
    onLoadedData?.(event);
  };

  const handleCanPlay = (event: SyntheticEvent<HTMLVideoElement>) => {
    handleVideoReady();
    onCanPlay?.(event);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "safari-media-frame relative h-full w-full overflow-hidden",
        wrapperClassName,
      )}
    >
      <CustomizedImage
        src={posterSrc}
        alt={posterAlt}
        className={cn(
          "safari-media-layer transition-opacity duration-300",
          hasEnteredViewport && isVideoReady ? "opacity-0" : "opacity-100",
          className,
        )}
        wrapperClassName="h-full w-full"
        sizes={imageSizes}
        loading="lazy"
      />

      {hasEnteredViewport && (
        <HlsVideo
          {...videoProps}
          shouldPlay={Boolean(videoProps.autoPlay) && isVisible}
          className={cn(
            "safari-media-layer absolute inset-0 transition-opacity duration-300",
            isVideoReady ? "opacity-100" : "opacity-0",
            className,
          )}
          poster={poster ?? posterSrc}
          preload={preload}
          onLoadedData={handleLoadedData}
          onCanPlay={handleCanPlay}
        />
      )}
    </div>
  );
};

export default memo(LazyHlsVideo);
