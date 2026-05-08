"use client";

import ProductCard from "@/components/custom/ProductCard";
import { Button } from "@/components/custom/button";
import useHttp from "@/lib/hooks/usePost";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import EnquireProducts from "@/components/custom/website/EnquireProducts";
import ProductItems from "./ProductItems";

export const EmptyState = () => (
  <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
    <h2 className="text-xl font-semibold">No favourites yet</h2>
    <p className="max-w-md text-sm text-muted-foreground">
      Add products to your favourites by clicking &ldquo;Add to my Favorites&rdquo; on any product page.
    </p>
  </div>
);

const LoadingState = () => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
    {[...Array(4)].map((_, i) => (
      <div
        key={i}
        className="h-[420px] animate-pulse rounded-xl border bg-gray-100"
      />
    ))}
  </div>
);

const ShowMyFavourites = ({
  favourites,
  isLoggedIn,
  isRetailer,
  retailerId,
  rr,
}: {
  favourites: any;
  isLoggedIn: any;
  isRetailer: any;
  retailerId: any;
  rr: any;
}) => {
  const [favoriteIds, setFavoriteIds] = useState<any[]>([]);
  const [favoriteDetails, setFavoriteDetails] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [enquireNowProducts, setEnquireNowProducts] = useState<number[]>([]);
  const router = useRouter();
  const favoriteProductCodes = Array.from(
    new Set(favoriteDetails.map((item: any) => item.productCode))
  );
  const isAllSelected =
    favoriteProductCodes.length > 0 &&
    favoriteProductCodes.every((productCode) =>
      enquireNowProducts.includes(productCode)
    );
  const hasSomeSelected = enquireNowProducts.length > 0;

  const {
    executeAsync: fetchFavorites,
    loading: fetchLoading,
    error,
  } = useHttp("/products/product-details", "GET");

  useEffect(() => {
    setFavoriteIds(favourites || []);
  }, [favourites]);

  // `fetchFavorites` is recreated by the custom hook; adding it here would refetch on every render.
  useEffect(() => {
    const fetchFavoriteDetails = async () => {
      if (favoriteIds.length === 0) {
        setFavoriteDetails([]);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetchFavorites({ ids: favoriteIds.join(",") });
        if (response.success) {
          setFavoriteDetails(response.products);
        } else {
          toast.error("Failed to fetch favorites");
          setFavoriteDetails([]);
        }
      } catch (err) {
        toast.error("Error loading favorites");
        setFavoriteDetails([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavoriteDetails();
  }, [favoriteIds]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setEnquireNowProducts((prev) => {
      const availableProductCodes = new Set(
        favoriteDetails.map((item: any) => item.productCode)
      );
      const nextSelected = prev.filter((productCode) =>
        availableProductCodes.has(productCode)
      );

      return nextSelected.length === prev.length ? prev : nextSelected;
    });
  }, [favoriteDetails]);

  const handleToggleSelectAll = (checked: boolean | string) => {
    if (checked) {
      setEnquireNowProducts(favoriteProductCodes);
      return;
    }

    setEnquireNowProducts([]);
  };

  const handleToggleProduct = (productCode: number, checked: boolean | string) => {
    if (checked) {
      setEnquireNowProducts((prev) =>
        prev.includes(productCode) ? prev : [...prev, productCode]
      );
      return;
    }

    setEnquireNowProducts((prev) =>
      prev.filter((selectedCode) => selectedCode !== productCode)
    );
  };

  const handleRemoveFavorite = (product: any) => {
    try {
      const newFavorites = favoriteIds.filter(
        (id) => id !== product.productCode
      );
      document.cookie = `favourites=${JSON.stringify(newFavorites)}; path=/`;
      setFavoriteIds(newFavorites);
      setFavoriteDetails((prev) =>
        prev.filter((p) => p.productCode !== product.productCode)
      );
      setEnquireNowProducts((prev) =>
        prev.filter((id) => id !== product.productCode)
      );
      toast.success("Product removed from favorites");
      router.refresh();
    } catch (err) {
      toast.error("Error removing product from favorites");
    }
  };

  if (error) {
    return (
      <div className="container my-8 text-center">
        <h2 className="text-base text-red-600">
          {error.message ?? "Failed to load favorites"}
        </h2>
        <Button
          variant="outline"
          className="mt-4 h-9 px-4 text-sm"
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (isLoading || fetchLoading) {
    return (
      <div className="container my-4">
        <LoadingState />
      </div>
    );
  }

  return (
    <div className="container my-4 space-y-4">
      <div className="z-1 md:mt-10 flex flex-col gap-3 rounded-xl border bg-background/95 p-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-3 text-sm font-medium">
          <Checkbox
            checked={
              hasSomeSelected && !isAllSelected ? "indeterminate" : isAllSelected
            }
            onCheckedChange={handleToggleSelectAll}
            disabled={favoriteProductCodes.length === 0}
          />
          <span>
            {isAllSelected
              ? "Deselect all products"
              : `Select all products${favoriteProductCodes.length > 0 ? ` (${favoriteProductCodes.length})` : ""}`}
          </span>
        </label>

        <EnquireProducts
          page="favourites"
          buttonText={
            enquireNowProducts.length > 0
              ? `Enquire Now (${enquireNowProducts.length})`
              : "Select Products to Enquire"
          }
          disabled={enquireNowProducts.length === 0}
          callback={() => setEnquireNowProducts([])}
          productCodes={enquireNowProducts.join(",")}
        />
      </div>

      {favoriteDetails && favoriteDetails.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {favoriteDetails.map((item: any) => (
            <div
              key={item.id}
              className="group relative overflow-hidden rounded-xl border bg-background shadow-sm"
            >
              <div className="relative">
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute left-2 top-2 z-10 h-8 w-8 rounded-full bg-white/90 shadow-sm"
                >
                  <Checkbox
                    className="h-4 w-4 rounded-full border-none p-0"
                    checked={enquireNowProducts.includes(item.productCode)}
                    onCheckedChange={(checked) =>
                      handleToggleProduct(item.productCode, checked)
                    }
                  />
                </Button>

                <div className="[&_.product-image]:aspect-[4/5] [&_.product-image]:w-full [&_.product-image]:overflow-hidden [&_.product-image_img]:h-full [&_.product-image_img]:w-full [&_.product-image_img]:object-cover">
                  <ProductItems product={item} isLoggedIn={isLoggedIn} />
                </div>
              </div>

              <div className="p-3 pt-2">
                <Button
                  variant="destructive"
                  className="h-8 w-full text-xs font-medium"
                  onClick={() => handleRemoveFavorite(item)}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
};

export default ShowMyFavourites;
