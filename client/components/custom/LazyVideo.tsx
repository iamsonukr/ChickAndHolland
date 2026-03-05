"use client";

import { memo, useEffect, useRef, useState } from "react";
import LoadingPlaceholder from "@/components/custom/LoadingPlaceHolder";
import { cn } from "@/lib/utils";

const LazyVideo = ({ src, className }: { src: string; className?: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "50px",
      },
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isVisible && videoRef.current) {
      videoRef.current.load();
    }
  }, [isVisible]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {!isLoaded && <LoadingPlaceholder />}
      {isVisible && (
        <video
          ref={videoRef}
          className={cn(
            "h-full w-full object-cover",
            !isLoaded && "opacity-0",
            "transition-opacity duration-300",
          )}
          autoPlay
          muted
          loop
          playsInline
          controlsList="nodownload"
          preload="metadata"
          onLoadedData={() => setIsLoaded(true)}
        >
          <source src={src} type="video/mp4" />
        </video>
      )}
    </div>
  );
};

export default memo(LazyVideo);
