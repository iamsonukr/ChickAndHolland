"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useInView } from "react-intersection-observer";
import ProductCard from "./ProductCard";
import LazyVideo from "./LazyVideo";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 12;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Product {
  id: string | number;
  [key: string]: unknown;
}

interface ProductGroup {
  video?: string;
  products: Product[];
}

interface AllProductData {
  products: ProductGroup[];
  productsWithoutVideo: Product[];
}

interface Props {
  allProductData: AllProductData;
  initialLoadedGroups: number;
  initialLoadedWithoutVideo: number;
  isLoggedIn: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ClientPaginatedProducts({
  allProductData,
  initialLoadedGroups,
  initialLoadedWithoutVideo,
  isLoggedIn,
}: Props) {
  const allGroups = allProductData.products ?? [];
  const allNoVideo = allProductData.productsWithoutVideo ?? [];

  const [loadedGroupCount, setLoadedGroupCount] = useState(initialLoadedGroups);
  const [loadedNoVideoCount, setLoadedNoVideoCount] = useState(initialLoadedWithoutVideo);

  // Slices of items actually rendered by this client component
  const [clientGroups, setClientGroups] = useState<ProductGroup[]>([]);
  const [clientNoVideo, setClientNoVideo] = useState<Product[]>([]);

  const isLoadingRef = useRef(false);

  const hasMore =
    loadedGroupCount < allGroups.length ||
    loadedNoVideoCount < allNoVideo.length;

  const { ref, inView } = useInView({ threshold: 0, rootMargin: "200px" });

  const loadMore = useCallback(() => {
    if (isLoadingRef.current || !hasMore) return;
    isLoadingRef.current = true;

    let remaining = ITEMS_PER_PAGE;
    const newGroups: ProductGroup[] = [];
    let gi = loadedGroupCount;

    while (remaining > 0 && gi < allGroups.length) {
      newGroups.push(allGroups[gi]);
      remaining -= allGroups[gi].products.length;
      gi++;
    }

    const newNoVideo: Product[] =
      remaining > 0
        ? allNoVideo.slice(loadedNoVideoCount, loadedNoVideoCount + remaining)
        : [];

    setClientGroups((prev) => [...prev, ...newGroups]);
    setClientNoVideo((prev) => [...prev, ...newNoVideo]);
    setLoadedGroupCount(gi);
    setLoadedNoVideoCount((prev) => prev + newNoVideo.length);

    isLoadingRef.current = false;
  }, [allGroups, allNoVideo, loadedGroupCount, loadedNoVideoCount, hasMore]);

  useEffect(() => {
    if (inView) loadMore();
  }, [inView, loadMore]);

  // Nothing rendered until the first batch loads
  if (!hasMore && clientGroups.length === 0 && clientNoVideo.length === 0) {
    return null;
  }

  return (
    <>
      {/* Groups with (optional) video */}
      {clientGroups.map((group, i) => (
        <div
          key={`client-group-${i}`}
          className={cn(
            "grid grid-cols-1 gap-2",
            group.video
              ? "lg:grid-cols-3 lg:grid-rows-2"
              : "lg:grid-cols-4 lg:grid-rows-1",
          )}
        >
          {group.video && (
            <LazyVideo
              src={group.video}
              className="h-full w-full lg:col-span-1 lg:row-span-2"
            />
          )}
          {group.products.map((product) => (
            <ProductCard
              key={`client-product-${product.id}`}
              product={product}
              className="lg:col-span-1 lg:row-span-1"
              priority={false}
              isLoggedIn={isLoggedIn}
              outerPrice={isLoggedIn}
              hiddenButtons
            />
          ))}
        </div>
      ))}

      {/* Products without video */}
      {clientNoVideo.length > 0 && (
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-4">
          {clientNoVideo.map((product) => (
            <ProductCard
              key={`client-product-no-video-${product.id}`}
              product={product}
              isLoggedIn={isLoggedIn}
              priority={false}
              outerPrice={isLoggedIn}
              hiddenButtons
            />
          ))}
        </div>
      )}

      {/* Sentinel + spinner */}
      {hasMore && (
        <div
          ref={ref}
          className="flex h-20 w-full items-center justify-center"
          aria-label="Loading more products"
        >
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />
        </div>
      )}
    </>
  );
}