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
    <h2 className="text-2xl font-semibold">No favorites yet</h2>
    <p className="max-w-md text-muted-foreground">
      Add products to your favorites by clicking the heart icon on any product
      page
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
  const router = useRouter();

  const {
    executeAsync: fetchFavorites,
    loading: fetchLoading,
    error,
  } = useHttp("/products/product-details", "GET");

  const { executeAsync: removeFavorite, loading: removeLoading } = useHttp(
    `/favourites`,
    "DELETE",
  );

  // Initialize favorites from props or localStorage
  useEffect(() => {
    if (isLoggedIn && isRetailer) {
      setFavoriteIds(favourites?.map((fv) => fv.product.productCode) || []);
    } else {
      // const localFavorites = JSON.parse(localStorage.getItem("myFavourites") || "[]");
      setFavoriteIds(favourites || []);
    }
  }, [isLoggedIn, isRetailer, favourites]);

  // Fetch favorite details whenever favoriteIds changes
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

  const handleRemoveFavorite = async (product: any, id: number) => {
    try {
      if (!isLoggedIn) {
        const newFavorites = favoriteIds.filter(
          (id) => id !== product.productCode,
        );
        // localStorage.setItem("myFavourites", JSON.stringify(newFavorites));
        document.cookie = `favourites=${JSON.stringify(newFavorites)}; path=/`;
        setFavoriteIds(newFavorites);
        toast.success("Product removed from favorites");
        setEnquireNowProducts(
          enquireNowProducts.filter((id) => id !== product.id),
        );
      } else {
        const response = await removeFavorite({
          retailerId,
          productId: product.id,
          favouriteId: id,
        });

        if (response.success) {
          toast.success("Successfully removed from favorites");
          const newFavorites = favoriteIds.filter(
            (id) => id !== product.productCode,
          );
          setFavoriteIds(newFavorites);
        } else {
          toast.error("Failed to remove from Favorites");
        }
      }

      router.refresh();
    } catch (err) {
      toast.error("Error removing product from favorites");
    }
  };

  const [enquireNowProducts, setEnquireNowProducts] = useState<number[]>([]);

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
      {!isRetailer && (
        <>
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
            <>
              {favoriteDetails.map((item: any) => (
                <>
                  <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    <div className="relative">
                      <ProductCard product={item} isLoggedIn={isLoggedIn} />
                      <Button
                        variant="destructive"
                        className="mt-1 w-full"
                        onClick={() => handleRemoveFavorite(item, item.id)}
                        disabled={removeLoading}
                      >
                        {removeLoading
                          ? "Removing..."
                          : "Remove from Favorites"}
                      </Button>
                      {!isRetailer && (
                        <Button
                          variant="outline"
                          className="absolute left-2 top-2 rounded-full"
                          size={"icon"}
                        >
                          {/*Add to Cart*/}
                          <Checkbox
                            className={
                              "h-full w-full rounded-full border-none p-0"
                            }
                            checked={enquireNowProducts.includes(
                              item.productCode,
                            )}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setEnquireNowProducts([
                                  ...enquireNowProducts,
                                  item.productCode,
                                ]);
                              } else {
                                setEnquireNowProducts(
                                  enquireNowProducts.filter(
                                    (productCode) =>
                                      productCode !== item.productCode,
                                  ),
                                );
                              }
                            }}
                          />
                        </Button>
                      )}
                    </div>
                  </div>
                </>
              ))}
            </>
          ) : (
            <>
              <EmptyState />
            </>
          )}
        </>
      )}
      {isLoggedIn && (
        <>
          {rr && rr.length > 0 ? (
            <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {rr.map((product: any) => (
                <div
                  key={product.id}
                  className="group relative rounded-lg border border-gray-200 transition-all duration-300 hover:shadow-lg"
                >
                  <ProductCard product={product} isLoggedIn={isLoggedIn} />
                  <Button
                    variant="destructive"
                    className="mt-1 w-full"
                    onClick={() =>
                      handleRemoveFavorite(product.product, product.id)
                    }
                    disabled={removeLoading}
                  >
                    {removeLoading ? "Removing..." : "Remove from Cart"}
                  </Button>
                  {!isRetailer && (
                    <Button
                      variant="outline"
                      className="absolute left-2 top-2 rounded-full"
                      size={"icon"}
                    >
                      {/*Add to Cart*/}
                      <Checkbox
                        className={"h-full w-full rounded-full border-none p-0"}
                        checked={enquireNowProducts.includes(
                          product.productCode,
                        )}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setEnquireNowProducts([
                              ...enquireNowProducts,
                              product.product.productCode,
                            ]);
                          } else {
                            setEnquireNowProducts(
                              enquireNowProducts.filter(
                                (productCode) =>
                                  productCode !== product.product.productCode,
                              ),
                            );
                          }
                        }}
                      />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </>
      )}
    </div>
  );
};

export default ShowMyFavourites;
