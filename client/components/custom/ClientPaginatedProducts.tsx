"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useInView } from "react-intersection-observer";
import ProductCard from "./ProductCard";
import LazyVideo from "./LazyVideo";
import { cn } from "@/lib/utils";
import { API_URL } from "@/lib/constants";

const ITEMS_PER_PAGE = 12;

interface Product {
  id: string | number;
  [key: string]: unknown;
}

interface ProductGroup {
  video?: string;
  products: Product[];
}

// Backend /filter returns flat products, totalCount, hasMore
interface BackendResponse {
  products: Product[];       // flat array — NOT grouped
  totalCount: number;
  hasMore: boolean;
}

// What we store after normalizing
interface PageData {
  groups: ProductGroup[];    // grouped (with video) — empty for paginated pages
  soloProducts: Product[];   // flat products to render in grid
  hasMore: boolean;
}

interface Props {
  categoryId: number;
  subCategoryId: number;
  currencyId?: number;
  isLoggedIn: boolean;
  initialPage: number;
  itemsPerPage?: number;
}

function soloGridClass(count: number): string {
  const desktopCols = Math.min(count, 4);
  const colMap: Record<number, string> = {
    1: "lg:grid-cols-1",
    2: "lg:grid-cols-2",
    3: "lg:grid-cols-3",
    4: "lg:grid-cols-4",
  };
  return cn("grid grid-cols-1 gap-2", colMap[desktopCols] ?? "lg:grid-cols-4");
}

export default function ClientPaginatedProducts({
  categoryId,
  subCategoryId,
  currencyId,
  isLoggedIn,
  initialPage,
  itemsPerPage = ITEMS_PER_PAGE,
}: Props) {
  const [pages, setPages] = useState<PageData[]>([]);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isFetchingRef = useRef(false);

  const { ref, inView } = useInView({ threshold: 0, rootMargin: "200px" });

  const fetchNextPage = useCallback(async () => {
    if (isFetchingRef.current || !hasMore) return;
    isFetchingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        categoryId: String(categoryId),
        subCategoryId: String(subCategoryId),
        page: String(currentPage),
        limit: String(itemsPerPage),
        ...(currencyId !== undefined ? { currencyId: String(currencyId) } : {}),
      });

      const res = await fetch(`${API_URL}/products/filter?${params}`);

      if (!res.ok) {
        const body = await res.text();
        console.error(`[ClientPaginatedProducts] HTTP ${res.status}:`, body);
        throw new Error(`HTTP ${res.status}`);
      }

      const data: BackendResponse = await res.json();

      // Backend returns flat products array — treat all as solo products
      // Video grouping only happens server-side via getProducts()
      const flatProducts = Array.isArray(data.products) ? data.products : [];

      if (!flatProducts.length) {
        setHasMore(false);
        return;
      }

      const normalized: PageData = {
        groups: [],               // no video grouping for paginated pages
        soloProducts: flatProducts,
        hasMore: data.hasMore ?? false,
      };

      setPages((prev) => [...prev, normalized]);
      setCurrentPage((p) => p + 1);
      setHasMore(data.hasMore ?? false);
    } catch (err) {
      console.error("[ClientPaginatedProducts] fetch error:", err);
      setError("Failed to load more products.");
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [categoryId, subCategoryId, currencyId, currentPage, itemsPerPage, hasMore]);

  useEffect(() => {
    if (inView) fetchNextPage();
  }, [inView, fetchNextPage]);

  if (pages.length === 0 && !isLoading && !hasMore) return null;

  return (
    <>
      {pages.map((page, pageIndex) => (
        <div key={`lazy-page-${pageIndex}`} className="flex flex-col gap-2">

          {/* Video groups — empty for paginated pages but kept for future use */}
          {page.groups?.map((group, groupIndex) => (
            <div
              key={`lazy-group-${pageIndex}-${groupIndex}`}
              className={cn(
                "grid grid-cols-1 gap-2",
                group.video ? "lg:grid-cols-3" : "lg:grid-cols-4",
              )}
            >
              {group.video && (
                <LazyVideo
                  src={group.video}
                  className="h-full w-full lg:col-span-1 lg:row-span-2"
                />
              )}
              {group.products?.map((product) => (
                <ProductCard
                  key={`lazy-product-${product.id}`}
                  product={product}
                  className="lg:col-span-1"
                  priority={false}
                  isLoggedIn={isLoggedIn}
                  outerPrice={isLoggedIn}
                  hiddenButtons
                />
              ))}
            </div>
          ))}

          {/* Flat products from backend */}
          {page.soloProducts?.length > 0 && (
            <div className={soloGridClass(page.soloProducts.length)}>
              {page.soloProducts.map((product) => (
                <ProductCard
                  key={`lazy-solo-${product.id}`}
                  product={product}
                  isLoggedIn={isLoggedIn}
                  priority={false}
                  outerPrice={isLoggedIn}
                  hiddenButtons
                />
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Error + retry */}
      {error && (
        <div className="flex flex-col items-center gap-3 py-8">
          <p className="text-sm text-red-500">{error}</p>
          <button
            onClick={() => { isFetchingRef.current = false; fetchNextPage(); }}
            className="px-4 py-2 text-sm border border-black hover:bg-black hover:text-white transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Skeleton — only between pages */}
      {isLoading && pages.length > 0 && (
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-4 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[300px] bg-gray-200 rounded" />
          ))}
        </div>
      )}

      {/* End of catalogue */}
      {!hasMore && pages.length > 0 && (
        <p className="py-8 text-center text-sm tracking-widest text-gray-400 uppercase">
          End of collection
        </p>
      )}

      {/* Sentinel */}
      {hasMore && !error && (
        <div ref={ref} className="h-1 w-full" aria-hidden="true" />
      )}
    </>
  );
}