"use client";
import ProductCard from "@/components/custom/ProductCard";
import { useEffect, useState } from "react";
import ActionButtons from "./ActionButtons";
import { Button } from "@/components/ui/button";
import { CheckCircle, ShoppingBag, ShoppingCart } from "lucide-react";
import useHttp from "@/lib/hooks/usePost";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

const quantityValidationMessage =
  "Quantity must be greater than 0 before placing an order";

const hasValidOrderQuantity = (quantity: unknown) => {
  const numericQuantity = Number(String(quantity ?? "").trim());
  return Number.isInteger(numericQuantity) && numericQuantity > 0;
};

const Data = ({
  favourites,
  retailerId,
}: {
  favourites: any;
  retailerId: any;
}) => {
  const router = useRouter();

  const [bulkOrder, setBulkOrder] = useState<any[]>([]);
  const [isBulkUpload, setIsBulkUpload] = useState(false);
  const [dataSending, setDataSending] = useState<any>([]);

  const { executeAsync: addFav, loading: removeLoading } = useHttp(
    `/retailer-orders/favourites/${retailerId}`,
    "POST",
  );

  const bulkOrderIdFun = (product: any) => {
    const alreadySelected = bulkOrder.some((item) => item.id === product.id);

    if (!alreadySelected && !hasValidOrderQuantity(product.quantity)) {
      toast.error(quantityValidationMessage);
      return;
    }

    setBulkOrder((prevOrder) => {
      const exists = prevOrder.some((item) => item.id === product.id);
      return exists
        ? prevOrder.filter((item) => item.id !== product.id)
        : [...prevOrder, product];
    });
  };

  // Calculate total using displayPrice
  const calculateTotal = () => {
    let total = 0;
    bulkOrder.forEach((item) => {
      total += item.displayPrice;
    });
    return parseFloat(total.toFixed(3));
  };

  const finalDataFormateFun = () => {
    const bulk = bulkOrder.map((item) => ({
      id: item.id,
      quantity: item.quantity,
    }));
    setDataSending(bulk);
  };

  const onSubmit = async () => {
    if (bulkOrder.some((item) => !hasValidOrderQuantity(item.quantity))) {
      toast.error(quantityValidationMessage);
      return;
    }

    try {
      const response = await addFav({
        favourateData: bulkOrder,
      });
      if (response.success) {
        toast.success("Successfully place order");
        router.push("/retailer-panel/pending-orders");
      } else {
        toast.error("Failed to place order");
      }

      router.refresh();
    } catch (error: any) {
      toast.error(error?.message ?? "Error place order");
    }
  };

  useEffect(() => {
    setBulkOrder([]);
  }, [isBulkUpload]);

  useEffect(() => {
    if (bulkOrder.length > 0) {
      finalDataFormateFun();
    }
  }, [bulkOrder]);

  const selectAll = () => {
    if (favourites.favourites && favourites.favourites.length > 0) {
      const validFavourites = favourites.favourites.filter((item: any) =>
        hasValidOrderQuantity(item.quantity),
      );

      if (validFavourites.length !== favourites.favourites.length) {
        toast.error(quantityValidationMessage);
      }

      if (bulkOrder.length === validFavourites.length) {
        setBulkOrder([]);
      } else {
        setBulkOrder([...validFavourites]);
      }
    }
  };

  const isAllSelected =
    favourites.favourites &&
    bulkOrder.length === favourites.favourites.length &&
    bulkOrder.length > 0;

  return (
    <div>
      {favourites.favourites?.length > 0 ? (
        <>
          <div className="my-4 flex items-center justify-between">
            <div>
              {isBulkUpload && (
                <div className="text-sm font-medium">
                  {bulkOrder.length} items selected
                </div>
              )}
            </div>
            <div className="flex gap-4">
              {isBulkUpload ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setIsBulkUpload(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={selectAll}>
                    {isAllSelected ? "Deselect All" : "Select All"}
                  </Button>
                  {bulkOrder.length > 0 && (
                    <Button onClick={onSubmit} disabled={removeLoading}>
                      <ShoppingBag className={"mr-2"} />
                      {removeLoading
                        ? "Processing..."
                        : `Place Order (${bulkOrder.length})`}
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button onClick={() => setIsBulkUpload(true)}>
                    Multi Order
                  </Button>
                  <Button
                    onClick={() => {
                      setIsBulkUpload(true);
                      setTimeout(() => selectAll(), 50);
                    }}
                  >
                    Select All
                  </Button>
                </>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-7 4xl:grid-cols-8">
            {favourites.favourites?.map((product: any) => (
              <div
                className={`relative space-y-2 ${bulkOrder.some((item) => item.id === product.id) ? "rounded-lg ring-2 ring-blue-500" : ""}`}
                key={product.id}
              >
                {isBulkUpload && (
                  <div
                    className="absolute z-30 h-full w-full cursor-pointer bg-[#00000033]"
                    onClick={() => bulkOrderIdFun(product)}
                  >
                    {bulkOrder.some((item) => item.id === product.id) && (
                      <div className="flex h-full w-full items-center justify-center">
                        <CheckCircle className="h-16 w-16 text-white" />
                      </div>
                    )}
                  </div>
                )}
                <ProductCard product={product} openInDifferentTab isLoggedIn />
                <ActionButtons
                  productDetails={product}
                  stockDetails={product.stock}
                  retailerId={retailerId}
                  price={product.displayPrice}
                />
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
          <ShoppingCart className="h-16 w-16 text-muted-foreground/40" />
          <h2 className="text-2xl font-semibold">Your cart is empty</h2>
          <p className="max-w-md text-muted-foreground">
            Browse our collections and add products to your cart using the
            &ldquo;Add to my Cart&rdquo; button on any product page.
          </p>
          <Link
            href="/collections/72/80"
            className="mt-2 inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Browse Collections
          </Link>
        </div>
      )}
    </div>
  );
};

export default Data;
