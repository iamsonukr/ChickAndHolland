"use client";

import { SyntheticEvent, useState } from "react";
import Image, { ImageProps } from "next/image";
import { cn } from "@/lib/utils";
import LoadingPlaceholder from "@/components/custom/LoadingPlaceHolder";

type CustomizedImageProps = {
  className?: string;
  wrapperClassName?: string;
} & ImageProps;

const CustomizedImage = ({
  className,
  wrapperClassName,
  fill,
  width,
  height,
  onLoad,
  sizes,
  ...props
}: CustomizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const imageSizes = sizes ?? (fill ? "100vw" : undefined);

  const handleLoad = (event: SyntheticEvent<HTMLImageElement>) => {
    setIsLoaded(true);
    onLoad?.(event);
  };

  return (
    <div className={cn("relative h-full w-full", wrapperClassName)}>
      {!isLoaded && <LoadingPlaceholder />}

      {fill ? (
        <Image
          {...props}
          fill
          src={props.src || "/placeholder.png"}
          alt={props.alt || "Image"}
          sizes={imageSizes}
          className={cn(
            "object-cover transition-opacity duration-300",
            !isLoaded && "opacity-0",
            className,
          )}
          onLoad={handleLoad}
        />
      ) : (
        <Image
          {...props}
          width={width ?? 500}
          height={height ?? 750}
          src={props.src || "/placeholder.png"}
          alt={props.alt || "Image"}
          sizes={imageSizes}
          className={cn(
            "h-full w-full max-w-full object-cover transition-opacity duration-300",
            !isLoaded && "opacity-0",
            className,
          )}
          onLoad={handleLoad}
        />
      )}
    </div>
  );
};

export { CustomizedImage };
