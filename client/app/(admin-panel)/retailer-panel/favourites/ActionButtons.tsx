"use client";

import { Button } from "@/components/ui/button";
import PlaceOrder from "@/components/custom/retailer-panel/PlaceOrder";
import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import useHttp from "@/lib/hooks/usePost";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

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
  const { executeAsync: removeFavorite, loading: removeLoading } = useHttp(
    `favourites`,
    "DELETE",
  );
  const { executeAsync: addFav, loading: removeLoadings } = useHttp(
    `/retailer-orders/favourites/${retailerId}`,
    "POST",
  );
  const [text, setText] = useState("");
  const router = useRouter();

  const handleRemoveFavorite = async (product: any, id: number) => {
    try {
      const response = await removeFavorite({
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
      {/* <Button variant={"destructive"} className="w-full">
        Remove from Favourites
      </Button> */}
      {/*<PlaceOrder retailerId={retailerId} stock={stockDetails} />*/}
      {/* <PlaceOrder productId={productDetails.id} /> */}
      {/* <Button className="w-full">Create Order</Button> */}

      <Button onClick={onSubmitFun}>
        <ShoppingBag className={"mr-2"} />
        Place Order
      </Button>
      <Button
        variant="destructive"
        className="mt-1 w-full"
        onClick={() => handleRemoveFavorite(productDetails, productDetails.id)}
        // disabled={removeLoading}
      >
        Remove from Cart
      </Button>
    </div>
  );
};

export default ActionButtons;
