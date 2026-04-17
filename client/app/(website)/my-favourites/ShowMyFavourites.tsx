"use client";

import ProductCard from "@/components/custom/ProductCard";
import { Button } from "@/components/custom/button";
import useHttp from "@/lib/hooks/usePost";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import EnquireProducts from "@/components/custom/website/EnquireProducts";

export const EmptyState = () => (
  <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
    <h2 className="text-2xl font-semibold">No favourites yet</h2>
    <p className="max-w-md text-muted-foreground">
      Add products to your favourites by clicking &ldquo;Add to my
      Favorites&rdquo; on any product page.
    </p>
  </div>
);

const LoadingState = () => (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="h-96 animate-pulse rounded-lg bg-gray-100" />
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
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [favoriteDetails, setFavoriteDetails] = useState<any>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [enquireNowProducts, setEnquireNowProducts] = useState<number[]>([]);
  const router = useRouter();

  const {
    executeAsync: fetchFavorites,
    loading: fetchLoading,
    error,
  } = useHttp("/products/product-details", "GET");

  // Initialize favorites from props (guest cookie array of product codes)
  useEffect(() => {
    setFavoriteIds(favourites || []);
  }, [favourites]);

  // Fetch product details for each saved product code
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
  }, [favoriteIds]);

  const handleRemoveFavorite = (product: any) => {
    try {
      const newFavorites = favoriteIds.filter(
        (id) => id !== product.productCode,
      );
      document.cookie = `favourites=${JSON.stringify(newFavorites)}; path=/`;
      setFavoriteIds(newFavorites);
      setFavoriteDetails((prev: any[]) =>
        prev.filter((p) => p.productCode !== product.productCode),
      );
      setEnquireNowProducts((prev) =>
        prev.filter((id) => id !== product.id),
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
        <h2 className="text-xl text-red-600">
          {error.message ?? "Failed to load favorites"}
        </h2>
        <Button
          variant="outline"
          className="mt-4"
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
    <div className="container my-4">
      {/* Enquire bar — shown when products are selected */}
      <EnquireProducts
        buttonText={
          enquireNowProducts.length > 0
            ? `Enquire Now (${enquireNowProducts.length})`
            : "Select Products to Enquire"
        }
        disabled={enquireNowProducts.length === 0}
        callback={() => setEnquireNowProducts([])}
        productCodes={enquireNowProducts.join(",")}
      />

      {favoriteDetails && favoriteDetails.length > 0 ? (
        <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {favoriteDetails.map((item: any) => (
            <div key={item.id} className="relative">
              <ProductCard product={item} isLoggedIn={isLoggedIn} />

              {/* Remove button */}
              <Button
                variant="destructive"
                className="mt-1 w-full"
                onClick={() => handleRemoveFavorite(item)}
              >
                Remove from Favorites
              </Button>

              {/* Enquire checkbox overlay */}
              <Button
                variant="outline"
                className="absolute left-2 top-2 rounded-full"
                size={"icon"}
              >
                <Checkbox
                  className="h-full w-full rounded-full border-none p-0"
                  checked={enquireNowProducts.includes(item.productCode)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setEnquireNowProducts([
                        ...enquireNowProducts,
                        item.productCode,
                      ]);
                    } else {
                      setEnquireNowProducts(
                        enquireNowProducts.filter(
                          (productCode) => productCode !== item.productCode,
                        ),
                      );
                    }
                  }}
                />
              </Button>
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
