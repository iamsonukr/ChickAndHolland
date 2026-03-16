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
      className={`relative border rounded-lg shadow hover:shadow-lg p-2 transition-all ${
        selected ? "ring-2 ring-blue-500 bg-blue-50/30" : ""
      }`}
    >
      {/* Tap anywhere on image area to select */}
      <div
        className="cursor-pointer relative"
        onClick={toggleSelect}
      >
        {selected && (
          <CheckCircle className="absolute z-20 top-2 right-2 h-7 w-7 text-blue-500 drop-shadow" />
        )}

        {/* Select indicator for mobile — tap hint */}
        {!selected && (
          <div className="absolute z-20 top-2 right-2 h-7 w-7 rounded-full border-2 border-gray-300 bg-white/70" />
        )}
      </div>

      <ProductCard product={item.product} isLoggedIn />

      {/* Actions */}
      <div className="mt-3 flex flex-col gap-2">
        <PlaceOrder stockId={item.id} quantity={item.quantity} />
        <Button
          variant="destructive"
          size="sm"
          className="w-full"
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