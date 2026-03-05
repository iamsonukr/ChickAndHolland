"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

interface HlsVideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  src: string;
  fallbackSrc?: string;
  startLevel?: number;
  maxBufferLength?: number;
  lowLatencyMode?: boolean;
}

export default function HlsVideo({
  src,
  fallbackSrc,
  startLevel = -1,
  maxBufferLength = 60,
  lowLatencyMode = true,
  ...videoProps
}: HlsVideoProps) {
  const {
    className = "",
    autoPlay = false,
    muted = false,
    loop = false,
    playsInline = false,
    controls = false,
    poster,
    preload = "metadata",
    controlsList,
    style,
    ...restProps
  } = videoProps;

  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [useFallback, setUseFallback] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const initialize = () => {
      /** --------------------------
       *  HLS.JS PLAYER INITIALIZATION
       * -------------------------- */
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: false,
          lowLatencyMode,
          startLevel,
          maxBufferLength,
          maxMaxBufferLength: maxBufferLength * 2,
          backBufferLength: 120,
        });

        hlsRef.current = hls;

        hls.loadSource(src);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsLoading(false);
          if (autoPlay) video.play().catch(() => {});
        });

        /** --------------------------
         *  GLOBAL HLS ERROR HANDLER
         * -------------------------- */
        hls.on(Hls.Events.ERROR, (_, data) => {

          // IGNORE EMPTY ERRORS {}
          if (!data || Object.keys(data).length === 0) {
            return;
          }

          // AUTO RECOVER STALLING
          if (data.details === "bufferStalledError") {
            hls.startLoad();
            video.play().catch(() => {});
            return;
          }

          // RECOVER NON-FATAL
          if (!data.fatal) return;

          // FATAL ERRORS → FALLBACK
          if (fallbackSrc) {
            setUseFallback(true);
            hls.destroy();
            return;
          }

          setError("Failed to load video");
        });

        return;
      }

      /** --------------------------
       *  SAFARI NATIVE HLS SUPPORT
       * -------------------------- */
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src;

        video.addEventListener("loadedmetadata", () => {
          setIsLoading(false);
          if (autoPlay) video.play().catch(() => {});
        });

        video.addEventListener("error", () => {
          if (fallbackSrc) {
            setUseFallback(true);
          } else {
            setError("Failed to load video");
          }
        });

        return;
      }

      /** --------------------------
       *  NO HLS SUPPORT AT ALL
       * -------------------------- */
      if (fallbackSrc) {
        setUseFallback(true);
      } else {
        setError("HLS is not supported");
      }
      setIsLoading(false);
    };

    if (!useFallback) {
      initialize();
    }

    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [src, fallbackSrc, autoPlay, useFallback, startLevel, maxBufferLength, lowLatencyMode]);

  /** --------------------------
   *  ERROR DISPLAY
   * -------------------------- */
  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-200 ${className}`}>
        <p className="text-gray-500">Error loading video</p>
      </div>
    );
  }

  /** --------------------------
   *  FALLBACK MP4 PLAYER
   * -------------------------- */
  if (useFallback && fallbackSrc) {
    return (
      <video
        {...restProps}
        className={className}
        autoPlay={autoPlay}
        muted={muted}
        playsInline={playsInline}
        loop={loop}
        controls={controls}
        poster={poster}
        preload={preload}
        controlsList={controlsList}
        style={style}
        src={fallbackSrc}
      />
    );
  }

  /** --------------------------
   *  NORMAL HLS PLAYER
   * -------------------------- */
  return (
    <video
      {...restProps}
      ref={videoRef}
      className={className}
      autoPlay={autoPlay}
      muted={muted}
      playsInline={playsInline}
      loop={loop}
      controls={controls}
      poster={poster}
      preload={preload}
      controlsList={controlsList}
      style={style}
    />
  );
}
