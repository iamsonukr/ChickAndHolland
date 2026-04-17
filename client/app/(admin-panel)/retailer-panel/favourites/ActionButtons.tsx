"use client";

import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import useHttp from "@/lib/hooks/usePost";
import { useRouter } from "next/navigation";

const ActionButtons = ({
  productDetails,
  retailerId,
  stockDetails,
  price,
}: {
  productDetails: any;
  retailerId: any;
  stockDetails: any;
  price: any;
}) => {
  const { executeAsync: removeCartItem, loading: removeCartLoading } = useHttp(
    `/cart`,
    "DELETE",
  );
  const { executeAsync: addFav, loading: placingOrder } = useHttp(
    `/retailer-orders/favourites/${retailerId}`,
    "POST",
  );
  const router = useRouter();

  const handleRemoveCartItem = async (product: any, id: number) => {
    try {
      const response = await removeCartItem({
        retailerId,
        productId: product.product.id,
        favouriteId: id,
      });

      if (response.success) {
        toast.success("Successfully removed from Cart");
      } else {
        toast.error("Failed to remove from Cart");
      }

      router.refresh();
    } catch (err) {
      toast.error("Error removing product from Cart");
    }
  };

  const onSubmitFun = async () => {
    try {
      const response = await addFav({
        favourateData: {
          id: productDetails.id,
          quantity: productDetails.quantity,
        },
      });
      if (response.success) {
        toast.success("Successfully place order");
        router.push("/retailer-panel/pending-orders");
      } else {
        toast.error("Failed to place order");
      }

      router.refresh();
    } catch (error) {
      toast.error("Error place order");
    }
  };

  return (
    <div className="grid grid-cols-1 gap-2">
      <Button onClick={onSubmitFun} disabled={placingOrder}>
        <ShoppingBag className={"mr-2"} />
        {placingOrder ? "Placing..." : "Place Order"}
      </Button>
      <Button
        variant="destructive"
        className="mt-1 w-full"
        onClick={() => handleRemoveCartItem(productDetails, productDetails.id)}
        disabled={removeCartLoading}
      >
        {removeCartLoading ? "Removing..." : "Remove from Cart"}
      </Button>
    </div>
  );
};

export default ActionButtons;
