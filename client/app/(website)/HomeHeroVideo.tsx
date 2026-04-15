"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type IdleCallbackHandle = number;

type IdleWindow = Window & {
  requestIdleCallback?: (
    callback: () => void,
    options?: { timeout: number },
  ) => IdleCallbackHandle;
  cancelIdleCallback?: (handle: IdleCallbackHandle) => void;
};

export default function HomeHeroVideo({
  src,
  posterSrc,
  posterAlt,
}: {
  src: string;
  posterSrc: string;
  posterAlt: string;
}) {
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);

  useEffect(() => {
    const win = window as IdleWindow;

    if (win.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const loadVideo = () => setShouldLoadVideo(true);

    if (win.requestIdleCallback) {
      const idleHandle = win.requestIdleCallback(loadVideo, { timeout: 1500 });

      return () => {
        win.cancelIdleCallback?.(idleHandle);
      };
    }

    const timeoutHandle = window.setTimeout(loadVideo, 250);

    return () => window.clearTimeout(timeoutHandle);
  }, []);

  return (
    <>
      <Image
        src={posterSrc}
        alt={posterAlt}
        width={4098}
        height={2732}
        priority
        sizes="100vw"
        className={cn(
          "h-full w-full object-cover transition-opacity duration-500",
          shouldLoadVideo && isVideoReady ? "opacity-0" : "opacity-100",
        )}
      />

      {shouldLoadVideo && (
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          controlsList="nodownload"
          poster={posterSrc}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-500",
            isVideoReady ? "opacity-100" : "opacity-0",
          )}
          onLoadedData={() => setIsVideoReady(true)}
        >
          <source src={src} type="video/mp4" />
        </video>
      )}
    </>
  );
}
