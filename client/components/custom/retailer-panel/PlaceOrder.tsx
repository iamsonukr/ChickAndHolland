"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import useHttp from "@/lib/hooks/usePost";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export const placeOrderFormSchema = z.object({
  quantity: z.string(),
});

export type PlaceOrderForm = z.infer<typeof placeOrderFormSchema>;

const PlaceOrder = ({ stockId, quantity }) => {
  const [open, setOpen] = useState(false);

  const [retailerId, setRetailerId] = useState<string | null>(null);
  const [currencyId, setCurrencyId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const retailerCookie = document.cookie
        .split(";")
        .find((c) => c.trim().startsWith("retailerId="));

      const currencyCookie = document.cookie
        .split(";")
        .find((c) => c.trim().startsWith("currencyId="));

      setRetailerId(retailerCookie?.split("=")[1] || null);
      setCurrencyId(currencyCookie?.split("=")[1] || null);
    }
  }, []);

  const form = useForm<PlaceOrderForm>({
    resolver: zodResolver(placeOrderFormSchema),
    defaultValues: {
      quantity: "",
    },
  });

  const { handleSubmit, control, reset, getValues } = form;

  // ❗️NO URL HERE — WE SET IT LATER
  const { loading, executeAsync } = useHttp("", "POST");

  const router = useRouter();

  const onSubmit = async () => {
    const qty = Number(getValues("quantity"));

    if (!retailerId) {
      toast.error("Retailer ID missing. Please login again.");
      return;
    }

    if (qty > quantity) {
      toast.error("Entered quantity exceeds available stock!");
      return;
    }

    const url = `/retailer-orders/stock/${retailerId}/${stockId}/${qty}`;

    try {
      const response = await executeAsync(
        { currencyId: currencyId ? Number(currencyId) : null },
        { url } // 👈 FINAL URL GOES HERE
      );

      if (response.success) {
        reset();
        setOpen(false);
        toast.success(response.message ?? "Order placed successfully");
        router.push("/retailer-panel/pending-orders");
        router.refresh();
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button className="w-full">
            <ShoppingBag className="mr-2" />
            Place Order
          </Button>
        </SheetTrigger>

        <SheetContent className="min-w-[100%] overflow-y-auto md:min-w-[50%] lg:min-w-[35%]">
          <SheetHeader>
            <SheetTitle>Place Order</SheetTitle>
            <SheetDescription>Enter the quantity.</SheetDescription>
          </SheetHeader>

          <Form {...form}>
            <form className="mt-8 space-y-2" onSubmit={handleSubmit(onSubmit)}>
              <FormField
                control={control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={Number(quantity)}
                        placeholder="1"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Maximum available: {quantity}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="mt-4 w-full" disabled={loading}>
                {loading ? "Placing order..." : "Place Order"}
              </Button>
            </form>
          </Form>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default PlaceOrder;
