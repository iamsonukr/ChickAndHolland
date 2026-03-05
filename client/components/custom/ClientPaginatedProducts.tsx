"use client";
// components/custom/ClientPaginatedProducts.jsx
import { useState, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import ProductCard from "./ProductCard";
import LazyVideo from "./LazyVideo";
import { cn } from "@/lib/utils";

const ITEMS_PER_PAGE = 12;

export default function ClientPaginatedProducts({
  allProductData,
  initialLoadedGroups,
  initialLoadedWithoutVideo,
  isLoggedIn,
}) {
  // Track which additional products to show (beyond the server-rendered ones)
  const [additionalGroups, setAdditionalGroups] = useState([]);
  const [additionalProductsWithoutVideo, setAdditionalProductsWithoutVideo] =
    useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "200px",
  });

  // Function to load more products
  const loadMoreProducts = () => {
    const nextPage = currentPage + 1;

    // Calculate which additional products to show next
    const allGroups = allProductData.products || [];
    const allProductsNoVideo = allProductData.productsWithoutVideo || [];

    // Start from where server rendering left off
    let newGroups = [];
    let startGroupIndex = initialLoadedGroups + additionalGroups.length;
    let itemsToLoad = ITEMS_PER_PAGE;

    // Add more product groups
    while (itemsToLoad > 0 && startGroupIndex < allGroups.length) {
      newGroups.push(allGroups[startGroupIndex]);
      itemsToLoad -= allGroups[startGroupIndex].products.length;
      startGroupIndex++;
    }

    // Add more products without video if needed
    let newProductsWithoutVideo = [];
    if (itemsToLoad > 0) {
      const startIndex =
        initialLoadedWithoutVideo + additionalProductsWithoutVideo.length;
      const endIndex = Math.min(
        startIndex + itemsToLoad,
        allProductsNoVideo.length,
      );

      newProductsWithoutVideo = allProductsNoVideo.slice(startIndex, endIndex);
    }

    // Update state with new products
    setAdditionalGroups([...additionalGroups, ...newGroups]);
    setAdditionalProductsWithoutVideo([
      ...additionalProductsWithoutVideo,
      ...newProductsWithoutVideo,
    ]);
    setCurrentPage(nextPage);
  };

  // Load more when scrolling to bottom
  useEffect(() => {
    if (inView) {
      loadMoreProducts();
    }
  }, [inView]);

  // Check if we have more data to show
  const hasMore =
    initialLoadedGroups + additionalGroups.length <
    (allProductData.products || []).length ||
    initialLoadedWithoutVideo + additionalProductsWithoutVideo.length <
    (allProductData.productsWithoutVideo || []).length;

  // If no additional products to load, don't render anything
  if (
    !hasMore &&
    additionalGroups.length === 0 &&
    additionalProductsWithoutVideo.length === 0
  ) {
    return null;
  }

  return (
    <>
      {/* Additional products with videos (client-rendered) */}
      {additionalGroups.map((group, i) => (
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
            />
          ))}
        </div>
      ))}

      {/* Additional products without videos (client-rendered) */}
      {additionalProductsWithoutVideo.length > 0 && (
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-4">
          {additionalProductsWithoutVideo.map((product) => (
            <ProductCard
              key={`client-product-no-video-${product.id}`}
              product={product}
              isLoggedIn={isLoggedIn}
              priority={false}
              outerPrice={isLoggedIn}
            />
          ))}
        </div>
      )}

      {/* Loading indicator - only shown if there's more to load */}
      {hasMore && (
        <div ref={ref} className="flex h-20 w-full items-center justify-center">
          <div className="flex animate-pulse space-x-4">
            <div className="h-10 w-10 rounded-full bg-gray-200"></div>
            <div className="flex-1 space-y-2 py-1">
              <div className="h-2 rounded bg-gray-200"></div>
              <div className="h-2 w-5/6 rounded bg-gray-200"></div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
