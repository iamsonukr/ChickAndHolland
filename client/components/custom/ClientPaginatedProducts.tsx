"use client";
// components/custom/ClientPaginatedProducts.jsx
import { useState, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import ProductCard from "./ProductCard";
import LazyVideo from "./LazyVideo";

const ITEMS_PER_PAGE = 12;

export default function ClientPaginatedProducts({
  allProductData,
  initialLoadedGroups,
  initialLoadedWithoutVideo,
  isLoggedIn,
}) {
  const [additionalGroups, setAdditionalGroups] = useState([]);
  const [additionalProductsWithoutVideo, setAdditionalProductsWithoutVideo] =
    useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "200px",
  });

  const loadMoreProducts = () => {
    const nextPage = currentPage + 1;

    const allGroups = allProductData.products || [];
    const allProductsNoVideo = allProductData.productsWithoutVideo || [];

    let newGroups = [];
    let startGroupIndex = initialLoadedGroups + additionalGroups.length;
    let itemsToLoad = ITEMS_PER_PAGE;

    while (itemsToLoad > 0 && startGroupIndex < allGroups.length) {
      newGroups.push(allGroups[startGroupIndex]);
      itemsToLoad -= allGroups[startGroupIndex].products.length;
      startGroupIndex++;
    }

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

    setAdditionalGroups([...additionalGroups, ...newGroups]);
    setAdditionalProductsWithoutVideo([
      ...additionalProductsWithoutVideo,
      ...newProductsWithoutVideo,
    ]);
    setCurrentPage(nextPage);
  };

  useEffect(() => {
    if (inView) {
      loadMoreProducts();
    }
  }, [inView]);

  const hasMore =
    initialLoadedGroups + additionalGroups.length <
      (allProductData.products || []).length ||
    initialLoadedWithoutVideo + additionalProductsWithoutVideo.length <
      (allProductData.productsWithoutVideo || []).length;

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
        <div key={`client-group-${i}`} className="flex flex-col gap-2">
          {group.video && (
            <LazyVideo
              src={group.video}
              className="h-full w-full"
            />
          )}
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {group.products.map((product) => (
              <ProductCard
                key={`client-product-${product.id}`}
                product={product}
                priority={false}
                isLoggedIn={isLoggedIn}
                outerPrice={isLoggedIn}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Additional products without videos (client-rendered) */}
      {additionalProductsWithoutVideo.length > 0 && (
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
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

      {/* Loading indicator */}
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