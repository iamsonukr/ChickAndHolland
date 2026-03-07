"use client";

import { useState } from "react";
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
  ...props
}: CustomizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className={cn("relative h-full w-full", wrapperClassName)}>
      {!isLoaded && <LoadingPlaceholder />}

      {fill ? (
        <Image
          {...props}
          fill
          src={props.src || "/placeholder.png"}
          alt={props.alt || "Image"}
          className={cn(
            "object-cover transition-opacity duration-300",
            !isLoaded && "opacity-0",
            className  // ← now className overrides image styles, not wrapper
          )}
          onLoad={() => setIsLoaded(true)}
          priority={false}
        />
      ) : (
        <Image
          {...props}
          width={width ?? 500}
          height={height ?? 750}
          src={props.src || "/placeholder.png"}
          alt={props.alt || "Image"}
          className={cn(
            "h-full w-full max-w-full object-cover transition-opacity duration-300",
            !isLoaded && "opacity-0",
            className  // ← same here
          )}
          onLoad={() => setIsLoaded(true)}
          priority={false}
        />
      )}
    </div>
  );
};

export { CustomizedImage };