"use client";

import ProductCard from "@/components/custom/ProductCard";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import PlaceOrder from "@/components/custom/retailer-panel/PlaceOrder";
import useHttp from "@/lib/hooks/usePost";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const CartItemCard = ({ item, selected, toggleSelect, retailerId }) => {
  const router = useRouter();

  const { executeAsync, loading } = useHttp(`favourites`, "DELETE");

  const removeItem = async () => {
    try {
      const res = await executeAsync({
        retailerId,
        productId: item.product.id,
        favouriteId: item.id,
      });

      if (res.success) {
        toast.success("Removed from cart");
        router.refresh();
      } else toast.error(res.message);
    } catch {
      toast.error("Error removing item");
    }
  };

  return (
    <div
      className={`relative border rounded-lg shadow hover:shadow-lg p-2 ${
        selected ? "ring-2 ring-blue-500" : ""
      }`}
    >
      <div className="cursor-pointer" onClick={toggleSelect}>
        {selected && (
          <CheckCircle className="absolute z-20 top-3 right-3 h-6 w-6 text-blue-500" />
        )}
      </div>

      <ProductCard product={item.product} isLoggedIn />

      <div className="mt-2">
        <PlaceOrder stockId={item.id} quantity={item.quantity} />
        <Button
          variant="destructive"
          className="w-full mt-2"
          onClick={removeItem}
          disabled={loading}
        >
          {loading ? "Removing..." : "Remove"}
        </Button>
      </div>
    </div>
  );
};

export default CartItemCard;
