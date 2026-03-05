"use client";

import { useState, useEffect, useRef, memo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import LazyVideo from "@/components/custom/LazyVideo";
import ProductCard from "@/components/custom/ProductCard";

const ClientCollectionProducts = ({
  initialData,
  categoryId,
  subCategoryId,
  isLoggedIn,
  searchParams,
}: {
  initialData: { products: any[]; productsWithoutVideo: any[] };
  categoryId: number;
  subCategoryId: number;
  isLoggedIn: boolean;
  searchParams: { [key: string]: string | string[] | undefined };
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const allData = useRef(initialData);
  const router = useRouter();

  // Only access client search params after mounting
  const clientSearchParams = useSearchParams();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Safely initialize state with fallback values
  const getInitialVisibleGroups = () => {
    const serverValue = searchParams.visibleGroups;
    const clientValue = isMounted
      ? clientSearchParams?.get("visibleGroups")
      : null;
    const value = clientValue ?? serverValue;
    return value && !isNaN(parseInt(value as string, 10))
      ? parseInt(value as string, 10)
      : 1;
  };

  const getInitialVisibleNonVideo = () => {
    const serverValue = searchParams.visibleNonVideo;
    const clientValue = isMounted
      ? clientSearchParams?.get("visibleNonVideo")
      : null;
    const value = clientValue ?? serverValue;
    return value && !isNaN(parseInt(value as string, 10))
      ? parseInt(value as string, 10)
      : 8;
  };

  const [visibleGroups, setVisibleGroups] = useState(getInitialVisibleGroups);
  const [visibleNonVideoProducts, setVisibleNonVideoProducts] = useState(
    getInitialVisibleNonVideo,
  );

  const GROUPS_PER_LOAD = 1;
  const NON_VIDEO_PRODUCTS_PER_LOAD = 3;

  const hasMoreGroups = visibleGroups < allData.current.products.length;
  const hasMoreNonVideoProducts =
    visibleNonVideoProducts < allData.current.productsWithoutVideo.length;
  const hasMore =
    hasMoreGroups ||
    (allData.current.products.length === 0 && hasMoreNonVideoProducts);

  const loaderRef = useRef<HTMLDivElement>(null);

  // Update URL search params
  useEffect(() => {
    if (!isMounted) return;

    const params = new URLSearchParams(window.location.search);
    params.set("visibleGroups", visibleGroups.toString());
    params.set("visibleNonVideo", visibleNonVideoProducts.toString());
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [visibleGroups, visibleNonVideoProducts, router, isMounted]);

  // Infinite scroll observer
  useEffect(() => {
    if (!isMounted || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreContent();
        }
      },
      { threshold: 0.1 },
    );

    const currentLoader = loaderRef.current;
    if (currentLoader) {
      observer.observe(currentLoader);
    }

    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader);
      }
    };
  }, [hasMore, isMounted]);

  const loadMoreContent = () => {
    if (hasMoreGroups) {
      setVisibleGroups((prev) =>
        Math.min(prev + GROUPS_PER_LOAD, allData.current.products.length),
      );
    } else if (
      allData.current.products.length === 0 &&
      hasMoreNonVideoProducts
    ) {
      setVisibleNonVideoProducts((prev) =>
        Math.min(
          prev + NON_VIDEO_PRODUCTS_PER_LOAD,
          allData.current.productsWithoutVideo.length,
        ),
      );
    }
  };

  return (
    <div>
      <div className="mx-8 mt-10 flex flex-col gap-6">
        {allData.current.products.length > 0 &&
          allData.current.products
            .slice(0, visibleGroups)
            .map((group: any, i: number) => (
              <div
                key={i}
                className={cn(
                  "grid grid-cols-1 gap-4",
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
                {group.products?.map((product: any, index: number) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    className="lg:col-span-1 lg:row-span-1"
                    priority={i === 0 && index < 6}
                    isLoggedIn={isLoggedIn}
                    outerPrice={isLoggedIn}
                  />
                ))}
              </div>
            ))}

        {allData.current.products.length === 0 &&
          allData.current.productsWithoutVideo.length > 0 && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
              {allData.current.productsWithoutVideo
                .slice(0, visibleNonVideoProducts)
                .map((product: any) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isLoggedIn={isLoggedIn}
                    priority={false}
                    outerPrice={isLoggedIn}
                  />
                ))}
            </div>
          )}

        {hasMore && (
          <div ref={loaderRef} className="flex justify-center py-8">
            <div className="flex animate-pulse items-center">
              <div className="mx-1 h-2 w-2 rounded-full bg-gray-500"></div>
              <div className="mx-1 h-2 w-2 rounded-full bg-gray-500"></div>
              <div className="mx-1 h-2 w-2 rounded-full bg-gray-500"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(ClientCollectionProducts);
