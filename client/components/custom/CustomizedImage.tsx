"use client";

import {
  SyntheticEvent,
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image, { ImageProps } from "next/image";
import { cn } from "@/lib/utils";
import LoadingPlaceholder from "@/components/custom/LoadingPlaceHolder";

type CustomizedImageProps = {
  className?: string;
  wrapperClassName?: string;
} & ImageProps;

const CustomizedImage = forwardRef<HTMLImageElement, CustomizedImageProps>(({
  className,
  wrapperClassName,
  fill,
  width,
  height,
  loading,
  onLoad,
  onError,
  sizes,
  priority,
  unoptimized,
  ...props
}, ref) => {
  const fallbackSrc = "/sample.jpeg";
  const srcString = typeof props.src === "string" ? props.src.trim() : undefined;
  const resolvedSrc = useMemo(
    () => (srcString && srcString.length > 0 ? srcString : fallbackSrc),
    [srcString],
  );
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(resolvedSrc);
  const imageSizes = sizes ?? (fill ? "100vw" : undefined);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const setImageRef = useCallback(
    (node: HTMLImageElement | null) => {
      imageRef.current = node;

      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }

      if (node?.complete && node.naturalWidth > 0) {
        setIsLoaded(true);
      }
    },
    [ref],
  );

  useEffect(() => {
    setIsLoaded(false);
    setCurrentSrc(resolvedSrc);
  }, [resolvedSrc]);

  useEffect(() => {
    const image = imageRef.current;

    if (image?.complete && image.naturalWidth > 0) {
      setIsLoaded(true);
    }
  }, [currentSrc]);

  const handleLoad = (event: SyntheticEvent<HTMLImageElement>) => {
    setIsLoaded(true);
    onLoad?.(event);
  };

  const handleError = (event: SyntheticEvent<HTMLImageElement>) => {
    onError?.(event);

    if (currentSrc !== fallbackSrc) {
      setIsLoaded(false);
      setCurrentSrc(fallbackSrc);
      return;
    }

    setIsLoaded(true);
  };

  const usePlainImg = /^(https?:|blob:|data:)/.test(currentSrc);

  return (
    <div className={cn("relative h-full w-full", wrapperClassName)}>
      {!isLoaded && <LoadingPlaceholder />}

      {usePlainImg ? (
        // Use plain <img> for external URLs to avoid Next.js image optimization issues
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={setImageRef}
          src={currentSrc}
          alt={props.alt || "Image"}
          width={fill ? undefined : width ?? 500}
          height={fill ? undefined : height ?? 750}
          loading={loading}
          decoding={props.decoding}
          className={cn(
            "transition-opacity duration-300",
            fill ? "absolute inset-0 h-full w-full" : "h-auto w-full",
            !isLoaded && "opacity-0",
            className,
          )}
          onLoad={handleLoad}
          onError={handleError}
        />
      ) : fill ? (
        <Image
          ref={setImageRef}
          {...props}
          fill
          src={currentSrc}
          alt={props.alt || "Image"}
          sizes={imageSizes}
          loading={loading}
          priority={priority}
          unoptimized={unoptimized}
          className={cn(
            "object-cover transition-opacity duration-300",
            !isLoaded && "opacity-0",
            className,
          )}
          onLoad={handleLoad}
          onError={handleError}
        />
      ) : (
        <Image
          ref={setImageRef}
          {...props}
          width={width ?? 500}
          height={height ?? 750}
          src={currentSrc}
          alt={props.alt || "Image"}
          sizes={imageSizes}
          loading={loading}
          priority={priority}
          unoptimized={unoptimized}
          style={{ width: "100%", height: "auto" }}
          className={cn(
            "w-full max-w-full object-cover transition-opacity duration-300",
            !isLoaded && "opacity-0",
            className,
          )}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  );
});

CustomizedImage.displayName = "CustomizedImage";

export { CustomizedImage };
