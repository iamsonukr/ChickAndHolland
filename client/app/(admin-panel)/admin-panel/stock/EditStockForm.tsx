"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormLabel,
  FormField,
  FormMessage,
  FormItem,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { Edit, Plus, DollarSign, ChevronsUpDown, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  editStockForm as AddStockFormType,
  editStockFormSchema,
} from "@/lib/formSchemas";
import useHttp from "@/lib/hooks/usePost";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
const lining = [
  "No Lining",
  "Fully Stitched Lined",
  "Full Separate Lining",
  "Separate Short Lining",
  "Waist to Hips Stitched Lining",
];
const EditStockForm = ({ previousData, colours, currencies }: any) => {
  const [open, setOpen] = useState(false);
  const [currencyComboboxOpen, setCurrencyComboboxOpen] = useState<{
    [key: string]: boolean;
  }>({});

  const form = useForm<AddStockFormType>({
    resolver: zodResolver(editStockFormSchema),
    defaultValues: {
      price: "",
      discount: "0",
      quantity: "",
      beading: "",
      lining: "",
      liningColor: "",
      mesh: "",
      currencyBasedPricing: [],
    },
  });

  const { loading, error, executeAsync } = useHttp(
    "/stock/" + previousData.id,
    "PUT",
  );

  const router = useRouter();

  // Helper functions for currency management
  // Safe currency array (avoids undefined.find error)

// Safe currency list
// Safe currency list fix
const currencyList = Array.isArray(currencies)
  ? currencies
  : currencies?.currencies ?? [];

// Get currency details
const getCurrencyDetails = (currencyId: string) => {
  return currencyList.find(c => c.id.toString() === currencyId);
};

// Filter available currencies
const getAvailableCurrencies = () => {
  const selected = (form.watch("currencyBasedPricing") || [])
    .map((i: any) => i.currencyId.toString());

  return currencyList.filter(c => !selected.includes(c.id.toString()));
};





  const addCurrencyPricing = () => {
    const availableCurrencies = getAvailableCurrencies();
    if (availableCurrencies.length > 0) {
      const currentPricing = form.watch("currencyBasedPricing") || [];
      form.setValue("currencyBasedPricing", [
        ...currentPricing,
        {
          currencyId: availableCurrencies[0].id.toString(),
          price: 0,
          discount: 0,
        },
      ]);
    }
  };

  const removeCurrencyPricing = (currencyIndex: number) => {
    const currentPricing = form.watch("currencyBasedPricing") || [];
    const updatedPricing = currentPricing.filter((_: any, idx: number) => idx !== currencyIndex);
    form.setValue("currencyBasedPricing", updatedPricing);
  };

  const onSubmit = async (data: AddStockFormType) => {
    try {
      // Transform the data to match the backend expected format
      const transformedData = {
        ...data,
        currencyPricing: data.currencyBasedPricing?.map((currencyItem) => ({
          currencyId: Number(currencyItem.currencyId),
          price: currencyItem.price.toString(),
          discount: currencyItem.discount.toString(),
        })) || [],
      };

      const response = await executeAsync(transformedData);

      if (error) {
        return toast.error("Failed to edit stock");
      }

      form.reset();
      setOpen(false);
      toast.success(response.message ?? "Stock edited successfully");
      router.refresh();
    } catch (err) {
      toast.error("Failed to edit stock", {
        description: error?.message,
      });
    }
  };

  const getColourBasedOnId = (id: number) => {
    return colours.find((colour: any) => colour.id === id)?.hexcode;
  };

  useEffect(() => {
    // Transform existing currency pricing for the form
    const existingCurrencyPricing = previousData.currencyPricing?.map((cp: any) => ({
      currencyId: cp.currency.id.toString(),
      price: cp.price,
      discount: ((cp.price - cp.discountedPrice) / cp.price * 100) || 0,
    })) || [];

    form.reset({
      price: previousData.price,
      discount: previousData.discount.toString(),
      quantity: previousData.quantity.toString(),
      mesh: previousData.mesh_color.toString(),
      beading: previousData.beading_color.toString(),
      liningColor: previousData.lining_color?.toString(),
      lining: previousData.lining.toString(),
      currencyBasedPricing: existingCurrencyPricing,
    });
  }, [previousData]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size={"icon"} className="flex w-full justify-center gap-2">
          Edit
          <Edit />
        </Button>
      </SheetTrigger>
      <SheetContent className="min-w-[100%] overflow-y-auto md:min-w-[50%] lg:min-w-[35%]">
        <SheetHeader>
          <SheetTitle>Edit Stock</SheetTitle>
          <SheetDescription>
            Fill in the form below to edit stock
            <span className="ms-2 text-lg text-black">
              ({previousData.product.productCode})
            </span>
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            className="mt-8 space-y-2"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price</FormLabel>
                  <FormControl>
                    <Input placeholder="1000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="discount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discount</FormLabel>
                  <FormControl>
                    <Input placeholder="10" {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter discount in percentage. Eg: 10
                  </FormDescription>
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
                    <Input placeholder="100" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`mesh`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mesh Color</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Mesh Color" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {colours.map((colour: any) => (
                        <SelectItem key={colour.id} value={colour.hexcode}>
                          <div className="flex items-center">
                            <div
                              className="h-4 w-4 rounded-full"
                              style={{
                                backgroundColor: colour.hexcode,
                                border: "1px solid #000",
                              }}
                            />
                            <span className="ml-2">
                              {previousData.product.mesh_color == colour.hexcode
                                ? ` SAS(${colour.name})`
                                : colour.name}
                            </span>
                          </div>
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
              name={`beading`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beading Color</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Lining Color" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {colours.map((colour: any) => (
                        <SelectItem key={colour.id} value={colour.hexcode}>
                          <div className="flex items-center">
                            <div
                              className="h-4 w-4 rounded-full"
                              style={{
                                backgroundColor: colour.hexcode,
                                border: "1px solid #000",
                              }}
                            />
                            <span className="ml-2">
                              {previousData.product.beading_color ==
                              colour.hexcode
                                ? ` SAS(${colour.name})`
                                : colour.name}
                            </span>
                          </div>
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
              name={`lining`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lining</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      if (value === "No Lining") {
                        form.setValue("liningColor", "");
                      }
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Lining" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {lining.map((item) => (
                        <SelectItem value={item} key={item}>
                          {item == previousData.product.lining
                            ? `SAS(${item})`
                            : item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch("lining") && form.watch("lining") !== "No Lining" && (
              <FormField
                control={form.control}
                name={`liningColor`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lining Color </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Lining Color" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {colours.map((colour: any) => (
                          <SelectItem key={colour.id} value={colour.hexcode}>
                            <div className="flex items-center">
                              <div
                                className="h-4 w-4 rounded-full"
                                style={{
                                  backgroundColor: colour.hexcode,
                                  border: "1px solid #000",
                                }}
                              />
                              <span className="ml-2">
                                {previousData.product.lining_color ==
                                colour.hexcode
                                  ? `SAS(${colour.name})`
                                  : colour.name}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Currency Based Pricing Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel className="text-base font-semibold">
                  Additional Currency Pricing (Optional)
                </FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addCurrencyPricing()}
                  disabled={getAvailableCurrencies().length === 0}
                >
                  <DollarSign className="mr-1 h-4 w-4" />
                  Add USD/GBP Price
                </Button>
              </div>

              {form.watch("currencyBasedPricing")?.length > 0 && (
                <div className="space-y-3 rounded-lg bg-gray-50 p-4">
                  {form.watch("currencyBasedPricing")?.map((currencyField: any, currencyIndex: number) => {
                    const currency = getCurrencyDetails(currencyField.currencyId);
                    const comboboxKey = `edit-${currencyIndex}`;
                    return (
                      <div key={currencyIndex} className="flex items-end gap-2">
                        <FormField
                          control={form.control}
                          name={`currencyBasedPricing.${currencyIndex}.currencyId`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel>Currency</FormLabel>
                              <Popover
                                open={currencyComboboxOpen[comboboxKey] || false}
                                onOpenChange={(open) =>
                                  setCurrencyComboboxOpen((prev) => ({
                                    ...prev,
                                    [comboboxKey]: open,
                                  }))
                                }
                              >
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      role="combobox"
                                      aria-expanded={currencyComboboxOpen[comboboxKey] || false}
                                      className={cn(
                                        "w-full justify-between",
                                        !field.value && "text-muted-foreground",
                                      )}
                                    >
                                      {field.value
                                        ? `${getCurrencyDetails(field.value)?.name} (${getCurrencyDetails(field.value)?.symbol})`
                                        : "Select currency"}
                                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0">
                                  <Command>
                                    <CommandInput placeholder="Search currencies..." />
                                    <CommandList>
                                      <CommandEmpty>No currency found.</CommandEmpty>
                                      <CommandGroup className="max-h-64 overflow-auto">
                                        {getAvailableCurrencies()
                                          .concat(field.value ? [getCurrencyDetails(field.value)].filter(Boolean) : [])
                                          .filter((currency, idx, arr) => arr.findIndex(c => c.id === currency.id) === idx)
                                          .map((currency) => (
                                            <CommandItem
                                              key={currency.id}
                                              value={currency.name?.toLowerCase() || ""}
                                              onSelect={() => {
                                                field.onChange(currency.id.toString());
                                                setCurrencyComboboxOpen((prev) => ({
                                                  ...prev,
                                                  [comboboxKey]: false,
                                                }));
                                              }}
                                            >
                                              <Check
                                                className={cn(
                                                  "mr-2 h-4 w-4",
                                                  field.value === currency.id.toString()
                                                    ? "opacity-100"
                                                    : "opacity-0"
                                                )}
                                              />
                                              {currency.name} ({currency.symbol})
                                            </CommandItem>
                                          ))}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`currencyBasedPricing.${currencyIndex}.price`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel>Price</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="1000"
                                  type="number"
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`currencyBasedPricing.${currencyIndex}.discount`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel>Discount (%)</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="10"
                                  type="number"
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCurrencyPricing(currencyIndex)}
                          className="h-10 w-10 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <Button type="submit" className="mt-4 w-full" disabled={loading}>
                {loading ? "Loading..." : "Update Stock"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
};

export default EditStockForm;
