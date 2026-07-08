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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const quantityValidationMessage = "Quantity must be greater than 0";

const isPositiveWholeQuantity = (value: unknown) => {
  const quantity = Number(String(value ?? "").trim());
  return Number.isInteger(quantity) && quantity > 0;
};

export const placeOrderFormSchema = z.object({
  quantity: z
    .string({
      required_error: "Quantity is required",
      invalid_type_error: "Quantity is required",
    })
    .trim()
    .min(1, { message: "Quantity is required" })
    .refine(isPositiveWholeQuantity, {
      message: quantityValidationMessage,
    }),
});

export type PlaceOrderForm = z.infer<typeof placeOrderFormSchema>;

type RetailerOption = {
  id: number | string;
  name: string;
  currencyId?: number | string | null;
};

const PlaceOrder = ({
  stockId,
  quantity,
  mode = "retailer",
  retailerOptions = [],
  redirectTo = "/retailer-panel/pending-orders",
}: {
  stockId: number | string;
  quantity: number | string;
  mode?: "retailer" | "admin";
  retailerOptions?: RetailerOption[];
  redirectTo?: string;
}) => {
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

  const form = useForm<PlaceOrderForm & { retailerId?: string }>({
    resolver: zodResolver(
      placeOrderFormSchema.extend({
        retailerId: z.string().optional(),
      }),
    ),
    defaultValues: {
      quantity: "",
      retailerId: "",
    },
  });

  const { handleSubmit, control, reset, getValues } = form;

  // ❗️NO URL HERE — WE SET IT LATER
  const { loading, executeAsync } = useHttp("", "POST");

  const router = useRouter();

  const onSubmit = async () => {
    const qty = Number(getValues("quantity"));
    const availableQuantity = Number(quantity);
    const selectedRetailerId =
      mode === "admin" ? String(getValues("retailerId") || "") : retailerId;
    const selectedRetailer = retailerOptions.find(
      (retailer) => String(retailer.id) === String(selectedRetailerId),
    );

    if (!selectedRetailerId) {
      toast.error(
        mode === "admin"
          ? "Please select a customer."
          : "Retailer ID missing. Please login again.",
      );
      return;
    }

    if (!Number.isInteger(qty) || qty <= 0) {
      toast.error(quantityValidationMessage);
      return;
    }

    if (!Number.isInteger(availableQuantity) || availableQuantity <= 0) {
      toast.error("No stock available for this item.");
      return;
    }

    if (qty > availableQuantity) {
      toast.error("Entered quantity exceeds available stock!");
      return;
    }

    const url = `/retailer-orders/stock/${selectedRetailerId}/${stockId}/${qty}`;

    try {
      const response = await executeAsync(
        {
          currencyId:
            selectedRetailer?.currencyId ?? (currencyId ? Number(currencyId) : null),
        },
        { url } // 👈 FINAL URL GOES HERE
      );

      if (response.success) {
        reset();
        setOpen(false);
        toast.success(response.message ?? "Order placed successfully");
        router.push(redirectTo);
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
            <SheetTitle>Place Stock Order</SheetTitle>
            <SheetDescription>
              {mode === "admin"
                ? "Select a customer and enter the quantity."
                : "Enter the quantity."}
            </SheetDescription>
          </SheetHeader>

          <Form {...form}>
            <form className="mt-8 space-y-2" onSubmit={handleSubmit(onSubmit)}>
              {mode === "admin" && (
                <FormField
                  control={control}
                  name="retailerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer</FormLabel>
                      <Select
                        value={field.value || ""}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select customer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {retailerOptions.length ? (
                            retailerOptions.map((retailer) => (
                              <SelectItem
                                key={retailer.id}
                                value={String(retailer.id)}
                              >
                                {retailer.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="__none__" disabled>
                              No retailer customers found
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
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
                        step={1}
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
