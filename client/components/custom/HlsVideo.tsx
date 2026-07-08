"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

export interface HlsVideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  src: string;
  fallbackSrc?: string;
  startLevel?: number;
  maxBufferLength?: number;
  backBufferLength?: number;
  lowLatencyMode?: boolean;
  shouldPlay?: boolean;
}

export default function HlsVideo({
  src,
  fallbackSrc,
  startLevel = -1,
  maxBufferLength = 15,
  backBufferLength = 30,
  lowLatencyMode = false,
  shouldPlay,
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
  const [useFallback, setUseFallback] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const shouldManagePlayback = shouldPlay ?? autoPlay;
  const shouldManagePlaybackRef = useRef(shouldManagePlayback);
  const isHlsSource = /\.m3u8(?:$|[?#])/i.test(src);

  useEffect(() => {
    setUseFallback(false);
    setError(null);
  }, [src, fallbackSrc]);

  useEffect(() => {
    shouldManagePlaybackRef.current = shouldManagePlayback;
  }, [shouldManagePlayback]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || useFallback) return;

    if (!isHlsSource) {
      const handleLoadedMetadata = () => {
        if (autoPlay && shouldManagePlaybackRef.current) {
          video.play().catch(() => {});
        }
      };

      const handleError = () => {
        if (fallbackSrc && fallbackSrc !== src) {
          setUseFallback(true);
          return;
        }

        setError("Failed to load video");
      };

      video.src = src;
      video.addEventListener("loadedmetadata", handleLoadedMetadata);
      video.addEventListener("error", handleError);

      return () => {
        video.removeEventListener("loadedmetadata", handleLoadedMetadata);
        video.removeEventListener("error", handleError);
        video.removeAttribute("src");
        video.load();
      };
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode,
        startLevel,
        maxBufferLength,
        maxMaxBufferLength: maxBufferLength * 2,
        backBufferLength,
        capLevelToPlayerSize: true,
      });

      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (autoPlay && shouldManagePlaybackRef.current) {
          video.play().catch(() => {});
        }
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (!data || Object.keys(data).length === 0) {
          return;
        }

        if (data.details === "bufferStalledError") {
          hls.startLoad();
          if (shouldManagePlaybackRef.current) {
            video.play().catch(() => {});
          }
          return;
        }

        if (!data.fatal) {
          return;
        }

        if (fallbackSrc) {
          setUseFallback(true);
          hls.destroy();
          return;
        }

        setError("Failed to load video");
      });

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    }

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      const handleLoadedMetadata = () => {
        if (autoPlay && shouldManagePlaybackRef.current) {
          video.play().catch(() => {});
        }
      };

      const handleError = () => {
        if (fallbackSrc) {
          setUseFallback(true);
          return;
        }

        setError("Failed to load video");
      };

      video.src = src;
      video.addEventListener("loadedmetadata", handleLoadedMetadata);
      video.addEventListener("error", handleError);

      return () => {
        video.removeEventListener("loadedmetadata", handleLoadedMetadata);
        video.removeEventListener("error", handleError);
        video.removeAttribute("src");
        video.load();
      };
    }

    if (fallbackSrc) {
      setUseFallback(true);
      return;
    }

    setError("HLS is not supported");
  }, [
    src,
    fallbackSrc,
    autoPlay,
    useFallback,
    startLevel,
    maxBufferLength,
    backBufferLength,
    lowLatencyMode,
    isHlsSource,
  ]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !autoPlay) return;

    if (shouldManagePlayback) {
      video.play().catch(() => {});
      return;
    }

    video.pause();
  }, [autoPlay, shouldManagePlayback, useFallback]);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-200 ${className}`}
      >
        <p className="text-gray-500">Error loading video</p>
      </div>
    );
  }

  if (useFallback && fallbackSrc) {
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
        src={fallbackSrc}
      />
    );
  }

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
