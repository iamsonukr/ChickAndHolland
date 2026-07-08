"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ShoppingBag } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import useHttp from "@/lib/hooks/usePost";
import { getCookie } from "@/lib/utils";
import { useRouter } from "next/navigation";

const sizeOptions: Record<string, number[]> = {
  EU: [32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60],
  US: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28],
  IT: [36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 62, 64],
  UK: [4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32],
};

const sampleOrderSchema = z.object({
  sizeCountry: z.string().min(1, "Country is required"),
  size: z.string().min(1, "Size is required"),
  color: z.string().min(1, "Color is required"),
  quantity: z
    .string()
    .trim()
    .min(1, "Quantity is required")
    .refine((value) => {
      const quantity = Number(value);
      return Number.isInteger(quantity) && quantity > 0;
    }, "Quantity must be greater than 0"),
  image: z.any().refine((files) => files?.length === 1, "Image is required"),
});

type SampleOrderForm = z.infer<typeof sampleOrderSchema>;

const getColourValue = (colour: any) =>
  String(colour?.hexcode || colour?.name || colour?.id || "").trim();

const PlaceSampleOrderForm = ({
  colours = [],
}: {
  colours: any[];
}) => {
  const [open, setOpen] = useState(true);
  const [nextStyleNo, setNextStyleNo] = useState("NS001164");
  const router = useRouter();
  const form = useForm<SampleOrderForm>({
    resolver: zodResolver(sampleOrderSchema),
    defaultValues: {
      sizeCountry: "EU",
      size: "",
      color: "",
      quantity: "1",
      image: undefined,
    },
  });
  const watchCountry = form.watch("sizeCountry");
  const currentSizes = useMemo(
    () => sizeOptions[watchCountry] ?? [],
    [watchCountry],
  );
  const { executeAsync: getNextStyle, loading: nextStyleLoading } = useHttp(
    "/cart/sample-order/next-style",
    "GET",
  );
  const { executeAsync: placeSampleOrder, loading } = useHttp(
    "/cart/sample-order",
    "POST",
  );

  const refreshNextStyleNo = async () => {
    try {
      const response: any = await getNextStyle();
      if (response?.styleNo) {
        setNextStyleNo(response.styleNo);
      }
    } catch {
      setNextStyleNo("NS001164");
    }
  };

  useEffect(() => {
    refreshNextStyleNo();
  }, []);

  const onSubmit = async (values: SampleOrderForm) => {
    const retailerId = getCookie("retailerId");

    if (!retailerId) {
      toast.error("Retailer ID missing. Please login again.");
      return;
    }

    const image = values.image?.[0];
    const formData = new FormData();
    formData.append("retailerId", retailerId);
    formData.append("sizeCountry", values.sizeCountry);
    formData.append("size", values.size);
    formData.append("color", values.color);
    formData.append("quantity", values.quantity);
    formData.append("image", image);

    try {
      const response: any = await placeSampleOrder(formData);
      toast.success(response?.message ?? "Sample order added to cart");
      if (response?.nextStyleNo) {
        setNextStyleNo(response.nextStyleNo);
      } else {
        await refreshNextStyleNo();
      }
      form.reset({
        sizeCountry: "EU",
        size: "",
        color: "",
        quantity: "1",
        image: undefined,
      });
      setOpen(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to place sample order");
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-background p-5 shadow-sm">
        <h1 className="text-xl font-semibold">Sample Order</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Place a custom sample order. It will be added to your cart under
          Retailer Collection / Custom Category.
        </p>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button className="mt-4">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Place Sample Order
            </Button>
          </SheetTrigger>
          <SheetContent className="!min-w-[90%] !max-w-[90%] overflow-y-auto md:!min-w-[520px] md:!max-w-[520px]">
            <SheetHeader>
              <SheetTitle>Place Sample Order</SheetTitle>
              <SheetDescription>
                Upload the sample image and select the requested size, country,
                color, and quantity.
              </SheetDescription>
            </SheetHeader>

            <Form {...form}>
              <form
                className="mt-6 space-y-4"
                onSubmit={form.handleSubmit(onSubmit)}
              >
                <div className="space-y-2">
                  <FormLabel>Style No.</FormLabel>
                  <Input
                    value={nextStyleLoading ? "Loading..." : nextStyleNo}
                    readOnly
                    className="bg-muted"
                  />
                </div>

                <FormField
                  control={form.control}
                  name="image"
                  render={({ field: { onChange, value, ...field } }) => (
                    <FormItem>
                      <FormLabel>Image Upload</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="file"
                          accept="image/*"
                          onChange={(event) => onChange(event.target.files)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sizeCountry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          form.setValue("size", "");
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.keys(sizeOptions).map((country) => (
                            <SelectItem key={country} value={country}>
                              {country}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Size</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select size" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {currentSizes.map((size) => (
                            <SelectItem key={size} value={String(size)}>
                              {size}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select color" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {colours.map((colour: any) => {
                            const value = getColourValue(colour);

                            return (
                              <SelectItem key={value} value={value}>
                                <div className="flex items-center gap-2">
                                  {colour?.hexcode && (
                                    <span
                                      className="h-4 w-4 rounded-full border"
                                      style={{ backgroundColor: colour.hexcode }}
                                    />
                                  )}
                                  {colour?.name || value}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} step={1} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Placing sample order..." : "Place Sample Order"}
                </Button>
              </form>
            </Form>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};

export default PlaceSampleOrderForm;
