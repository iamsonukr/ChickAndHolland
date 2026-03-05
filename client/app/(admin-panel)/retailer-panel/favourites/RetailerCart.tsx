"use client";

import { useState } from "react";
import CartItemCard from "./CartItemCard";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import useHttp from "@/lib/hooks/usePost";
import { useRouter } from "next/navigation";

const RetailerCart = ({ favourites, retailerId }) => {
  const router = useRouter();
  const [selected, setSelected] = useState<number[]>([]);

  const toggleSelect = (id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectedItems = favourites.filter((item) =>
    selected.includes(item.id)
  );

  const calcTotal = () =>
    selectedItems.reduce(
      (sum, item) => sum + Number(item.displayPrice || 0),
      0
    );

  const { executeAsync, loading } = useHttp(
    `/retailer-orders/favourites/${retailerId}`,
    "POST"
  );

  const placeBulkOrder = async () => {
    if (selected.length === 0) return;

    try {
      const response = await executeAsync({
        favourateData: selectedItems.map((i) => ({
          id: i.id,
          quantity: i.quantity,
        })),
      });

      if (response.success) {
        toast.success("Order placed successfully");
        router.push("/retailer-panel/pending-orders");
        router.refresh();
      } else toast.error(response.message);
    } catch {
      toast.error("Something went wrong");
    }
  };

  if (!favourites.length)
    return <p className="text-center mt-8 text-gray-500">Your cart is empty</p>;

  return (
    <div className="p-4">
      {/* Summary Bar */}
     {/* Summary Bar */}
<div className="p-4 mb-6 border rounded-lg bg-gray-50 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">

  <div className="flex items-center gap-4">
    <p className="text-lg font-semibold">
      Selected: {selected.length} / {favourites.length}
    </p>

    <Button
      variant="outline"
      onClick={() =>
        setSelected(
          selected.length === favourites.length
            ? []
            : favourites.map((i) => i.id)
        )
      }
    >
      {selected.length === favourites.length ? "Deselect All" : "Select All"}
    </Button>
  </div>

  <p className="text-lg font-semibold text-green-600">
    Total: € {calcTotal().toFixed(2)}
  </p>

  <Button
    className="bg-green-700 text-white"
    disabled={!selected.length || loading}
    onClick={placeBulkOrder}
  >
    {loading ? "Processing..." : `Place Order (${selected.length})`}
  </Button>
</div>


      {/* Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {favourites.map((fav) => (
          <CartItemCard
            key={fav.id}
            item={fav}
            selected={selected.includes(fav.id)}
            toggleSelect={() => toggleSelect(fav.id)}
            retailerId={retailerId}
          />
        ))}
      </div>
    </div>
  );
};

export default RetailerCart;
