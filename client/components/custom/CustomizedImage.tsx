"use client";

import { useState } from "react";
import Image, { ImageProps } from "next/image";
import { cn } from "@/lib/utils";
import LoadingPlaceholder from "@/components/custom/LoadingPlaceHolder";

type CustomizedImageProps = {
  className?: string;
} & ImageProps;

const CustomizedImage = ({
  className,
  fill,
  width,
  height,
  ...props
}: CustomizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className={cn("relative h-full w-full", className)}>
      {!isLoaded && <LoadingPlaceholder />}

      {fill ? (
        // ✅ FILL MODE (NO width / height)
        <Image
          {...props}
          fill
          src={props.src || "/placeholder.png"}
          alt={props.alt || "Image"}
          className={cn(
            "h-full w-full object-cover transition-opacity duration-300",
            !isLoaded && "opacity-0"
          )}
          onLoad={() => setIsLoaded(true)}
          priority={false}
        />
      ) : (
        // ✅ NORMAL MODE (width / height only)
        <Image
          {...props}
          width={width ?? 500}
          height={height ?? 750}
          src={props.src || "/placeholder.png"}
          alt={props.alt || "Image"}
          className={cn(
            "h-full w-full max-w-full object-cover transition-opacity duration-300",
            !isLoaded && "opacity-0"
          )}
          onLoad={() => setIsLoaded(true)}
          priority={false}
        />
      )}
    </div>
  );
};

export { CustomizedImage };
