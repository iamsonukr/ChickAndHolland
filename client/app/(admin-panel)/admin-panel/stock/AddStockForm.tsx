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
import { Plus, DollarSign, ChevronsUpDown, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import {
  AddStockForm as AddStockFormType,
  SizeCountry,
  addStockFormSchema,
} from "@/lib/formSchemas";
import useHttp from "@/lib/hooks/usePost";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { sizes } from "@/lib/formSchemas";

import MultipleSelector, { Option } from "@/components/custom/multi-selector";
import { getProductsCodes, getProductsPrice } from "@/lib/data";
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

const sizeOptions = {
  EU: [32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60],
  US: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28],
  IT: [36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 62, 64],
  UK: [4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32],
};

const AddStockForm = ({ colours, currencies }: { colours: any[]; currencies: any[] }) => {
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [price, setPrice] = useState("0");
  const [mcolors, setMColors] = useState<any>();
  const [currencyComboboxOpen, setCurrencyComboboxOpen] = useState<{
    [key: string]: boolean;
  }>({});
  const sizeCountryArray = Object.entries(SizeCountry).map(([key, value]) => {
    return {
      value: key,
      label: value,
    };
  }) as { value: keyof typeof SizeCountry; label: string }[];

  const form = useForm<AddStockFormType>({
    resolver: zodResolver(addStockFormSchema),
    defaultValues: {
      styleNo: [],
      colorsQuantity: [
        {
          quantity: "",
          price: parseInt(price),
          size: "",
          discount: 0,
          size_country: sizeCountryArray[0].value,
          beading: "",
          lining: "",
          liningColor: "",
          mesh: "",
          currencyBasedPricing: [],
        },
      ],
    },
  });

  const { append, fields, remove } = useFieldArray({
    control: form.control,
    name: "colorsQuantity",
  });

  // Helper functions for currency management
  const getCurrencyDetails = (currencyId: string) => {
    return currencies.find((currency) => currency.id.toString() === currencyId);
  };

 const getAvailableCurrencies = (index: number) => {
  const selectedCurrencies =
    form.watch(`colorsQuantity.${index}.currencyBasedPricing`)?.map(
      (item: any) => item.currencyId
    ) || [];

  return currencies?.filter(
    (currency) => !selectedCurrencies.includes(currency.id.toString())
  );
};


 const addCurrencyPricing = (index: number) => {
  const available = getAvailableCurrencies(index);
  if (!available || available.length === 0) return;

  const current = form.watch(`colorsQuantity.${index}.currencyBasedPricing`) || [];

  form.setValue(`colorsQuantity.${index}.currencyBasedPricing`, [
    ...current,
    {
      currencyId: available[0].id.toString(),
      price: 0,
      discount: 0,
    },
  ]);
};

  const removeCurrencyPricing = (colorIndex: number, currencyIndex: number) => {
    const currentPricing = form.watch(`colorsQuantity.${colorIndex}.currencyBasedPricing`) || [];
    const updatedPricing = currentPricing.filter((_: any, idx: number) => idx !== currencyIndex);
    form.setValue(`colorsQuantity.${colorIndex}.currencyBasedPricing`, updatedPricing);
  };

  const addColorQuantity = () => {
    append({
      quantity: "",
      price: parseInt(price),
      size: "",
      discount: 0,
      size_country: sizeCountryArray[0].value.toString(),
      beading: "",
      lining: "",
      liningColor: "",
      mesh: "",
      currencyBasedPricing: [],
    });
  };

  const getColourHex = (id: string) => {
    return colours.find((colour) => colour.hexcode === id)?.name;
  };

  const productCode = async (data: string) => {
    try {
      const res = await getProductsCodes(data);
      const options = res.products.map((customer: any) => {
        return {
          value: customer.id.toString(),
          label: customer.productCode,
        } as Option;
      });
      setProducts(options);
      return options;
    } catch (error) {
      console.log(error);
    }
  };

  const priceByCode = async (id: string) => {
    try {
      const res = await getProductsPrice(id);

      form.setValue("colorsQuantity.0.price", res.price.price);
      setPrice(res.price.price);
      setMColors(res.price);
      // form.setValue("price", res.price[0].price);
    } catch (error) {
      console.log(error);
    }
  };

  const { loading, error, executeAsync } = useHttp("/stock");

  const router = useRouter();

  const onSubmit = async (data: AddStockFormType) => {
    try {
      // Transform the data to match the backend expected format
      const transformedData = {
        ...data,
        colorsQuantity: data.colorsQuantity.map((item) => ({
          ...item,
          currencyPricing: item.currencyBasedPricing?.map((currencyItem) => ({
            currencyId: Number(currencyItem.currencyId),
            price: currencyItem.price.toString(),
            discount: currencyItem.discount.toString(),
          })) || [],
        })),
      };

      const response = await executeAsync(transformedData, {}, (error) => {
        toast.error("Failed to add stock", {
          description: error?.message,
        });
      });

      form.reset();
      setOpen(false);
      toast.success(response.message ?? "Stock added successfully");
      router.refresh();
    } catch (err) {
      console.error("Error adding stock:", err);
    }
  };

  useEffect(() => {
    productCode("pavan");
  }, [mcolors]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>
          Add New Stock <Plus />
        </Button>
      </SheetTrigger>
      <SheetContent className="min-w-[100%] overflow-y-auto md:min-w-[50%] lg:min-w-[35%]">
        <SheetHeader>
          <SheetTitle>Add New Stock</SheetTitle>
          <SheetDescription>
            Fill in the form below to add stock
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            className="mt-8 space-y-2"
            onSubmit={form.handleSubmit(onSubmit, (errors) => {
              console.log(errors);
            })}
          >
            <FormField
              control={form.control}
              name="styleNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Style No</FormLabel>
                  {/* @ts-ignore */}
                  <MultipleSelector
                    {...field}
                    defaultOptions={products}
                    placeholder={"Select Style No"}
                    onSearch={async (value) => {
                      return await productCode(value);
                    }}
                    loadingIndicator={
                      <p className="text-muted-foreground">Loading...</p>
                    }
                    emptyIndicator={
                      <p className="text-muted-foreground">No results found</p>
                    }
                    onChange={(selectedOption) => {
                      setPrice("0");
                      priceByCode(selectedOption[0].value);
                      field.onChange(selectedOption);
                    }}
                    maxSelected={1}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            {fields.map((item, index: number) => (
              <div key={item.id} className="space-y-2">
                <div className="flex">
                  <p className="flex h-[20px] w-[20px] items-center justify-center rounded-full bg-black p-1 text-center text-white">
                    {index + 1}
                  </p>
                </div>
                <div className="flex justify-between">
                 

                <div className="flex justify-between gap-4">

  {/* SIZE COUNTRY */}
  <FormField
    control={form.control}
    name={`colorsQuantity.${index}.size_country`}
    render={({ field }) => (
      <FormItem className="w-1/2">
        <FormLabel>Size Country</FormLabel>

        <Select
          onValueChange={(val) => {
            field.onChange(val);
            form.setValue(`colorsQuantity.${index}.size`, "");
          }}
          value={field.value}
        >
          <FormControl>
            <SelectTrigger>
              <SelectValue placeholder="Size Country" />
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
      </FormItem>
    )}
  />

  {/* SIZE */}
  <FormField
    control={form.control}
    name={`colorsQuantity.${index}.size`}
    render={({ field }) => {
      const country = form.watch(`colorsQuantity.${index}.size_country`);
      const options = sizeOptions[country] || [];

      return (
        <FormItem className="w-1/2">
          <FormLabel>Select Size</FormLabel>

          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select Size" />
              </SelectTrigger>
            </FormControl>

            <SelectContent>
              {options.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormItem>
      );
    }}
  />

</div>


                </div>
                <div className="flex justify-between">
                  <FormField
                    control={form.control}
                    name={`colorsQuantity.${index}.price`}
                    render={({ field }) => (
                      <FormItem className="w-6/12">
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
                    name={`colorsQuantity.${index}.quantity`}
                    render={({ field }) => (
                      <FormItem className="w-5/12">
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input placeholder="100" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name={`colorsQuantity.${index}.mesh`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mesh Color</FormLabel>
                      <Select onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Mesh Color" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {form.watch("styleNo").length > 0 && (
                            <SelectItem value={mcolors?.mesh_color}>
                              <div className="flex items-center">
                                <div
                                  className="h-4 w-4 rounded-full"
                                  style={{
                                    backgroundColor: mcolors?.mesh_color,
                                    border: "1px solid #000",
                                  }}
                                />
                                <span className="ml-2">
                                  SAS({getColourHex(mcolors?.mesh_color || "")})
                                </span>
                              </div>
                            </SelectItem>
                          )}
                          {colours
                            .filter((i) => i.hexcode != mcolors?.mesh_color)
                            .map((colour: any) => (
                              <SelectItem
                                key={colour.id}
                                value={colour.hexcode}
                              >
                                <div className="flex items-center">
                                  <div
                                    className="h-4 w-4 rounded-full"
                                    style={{
                                      backgroundColor: colour.hexcode,
                                      border: "1px solid #000",
                                    }}
                                  />
                                  <span className="ml-2">{colour.name}</span>
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
                  name={`colorsQuantity.${index}.beading`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Beading Color</FormLabel>
                      <Select onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Lining Color" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {form.watch("styleNo").length > 0 && (
                            <SelectItem value={mcolors?.beading_color}>
                              <div className="flex items-center">
                                <div
                                  className="h-4 w-4 rounded-full"
                                  style={{
                                    backgroundColor: mcolors?.beading_color,
                                    border: "1px solid #000",
                                  }}
                                />
                                <span className="ml-2">
                                  SAS(
                                  {getColourHex(mcolors?.beading_color || "")})
                                </span>
                              </div>
                            </SelectItem>
                          )}

                          {colours
                            .filter((i) => i.hexcode != mcolors?.beading_color)
                            .map((colour: any) => (
                              <SelectItem
                                key={colour.id}
                                value={colour.hexcode}
                              >
                                <div className="flex items-center">
                                  <div
                                    className="h-4 w-4 rounded-full"
                                    style={{
                                      backgroundColor: colour.hexcode,
                                      border: "1px solid #000",
                                    }}
                                  />
                                  <span className="ml-2">{colour.name}</span>
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
                  name={`colorsQuantity.${index}.lining`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lining</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          if (value === "No Lining") {
                            form.setValue(
                              `colorsQuantity.${index}.liningColor`,
                              "",
                            );
                          }
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Lining" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {form.watch("styleNo").length > 0 && (
                            <SelectItem value={mcolors?.lining}>
                              SAS({mcolors?.lining})
                            </SelectItem>
                          )}
                          {/* {lining
  .filter((i) => i != mcolors?.lining)
  .map((item, idx) => (
    <SelectItem key={idx} value={item}>
      {item}
    </SelectItem>
  ))} */}

{lining
  .filter((i) => i != mcolors?.lining)
  .map((item) => (
    <SelectItem key={item} value={item}>
      {item}
    </SelectItem>
  ))}

                        </SelectContent>
                      </Select>

                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch(`colorsQuantity.${index}.lining`) &&
                  form.watch(`colorsQuantity.${index}.lining`) !==
                    "No Lining" && (
                    <FormField
                      control={form.control}
                      name={`colorsQuantity.${index}.liningColor`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lining Color </FormLabel>
                          <Select onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Lining Color" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {form.watch("styleNo").length > 0 && (
                                <SelectItem value={mcolors?.lining_color}>
                                  <div className="flex items-center">
                                    <div
                                      className="h-4 w-4 rounded-full"
                                      style={{
                                        backgroundColor: mcolors?.lining_color,
                                        border: "1px solid #000",
                                      }}
                                    />
                                    <span className="ml-2">
                                      SAS(
                                      {getColourHex(
                                        mcolors?.lining_color || "",
                                      )}
                                      )
                                    </span>
                                  </div>
                                </SelectItem>
                              )}

                              {colours
                                .filter(
                                  (i) => i.hexcode != mcolors?.lining_color,
                                )
                                .map((colour: any) => (
                                  <SelectItem
                                    key={colour.id}
                                    value={colour.hexcode}
                                  >
                                    <div className="flex items-center">
                                      <div
                                        className="h-4 w-4 rounded-full"
                                        style={{
                                          backgroundColor: colour.hexcode,
                                          border: "1px solid #000",
                                        }}
                                      />
                                      <span className="ml-2">
                                        {colour.name}
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

                <FormField
                  control={form.control}
                  name={`colorsQuantity.${index}.discount`}
                  render={({ field }) => (
                    <FormItem className="">
                      <FormLabel>Discount</FormLabel>
                      <FormControl>
                        <Input placeholder="10" {...field} type="number" />
                      </FormControl>
                      <FormDescription>
                        Enter discount in percentage. Eg: 10
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                      onClick={() => addCurrencyPricing(index)}
                      disabled={getAvailableCurrencies(index)?.length === 0}
                    >
                      <DollarSign className="mr-1 h-4 w-4" />
                      Add USD/GBP Price
                    </Button>
                  </div>

                  {form.watch(`colorsQuantity.${index}.currencyBasedPricing`)?.length > 0 && (
                    <div className="space-y-3 rounded-lg bg-gray-50 p-4">
                      {form.watch(`colorsQuantity.${index}.currencyBasedPricing`)?.map((currencyField: any, currencyIndex: number) => {
                        const currency = getCurrencyDetails(currencyField.currencyId);
                        const comboboxKey = `${index}-${currencyIndex}`;
                        return (
                          <div key={currencyIndex} className="flex items-end gap-2">
                            <FormField
                              control={form.control}
                              name={`colorsQuantity.${index}.currencyBasedPricing.${currencyIndex}.currencyId`}
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
                                            {getAvailableCurrencies(index)
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
                              name={`colorsQuantity.${index}.currencyBasedPricing.${currencyIndex}.price`}
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
                              name={`colorsQuantity.${index}.currencyBasedPricing.${currencyIndex}.discount`}
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
                              onClick={() => removeCurrencyPricing(index, currencyIndex)}
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

                <div className="flex gap-4">
                  {fields.length < 15 && (
                    <Button
                      onClick={() => {
                        addColorQuantity();
                      }}
                      type="button"
                    >
                      Add
                    </Button>
                  )}

                  {index > 0 && (
                    <Button
                      variant={"destructive"}
                      type="button"
                      onClick={() => {
                        remove(index);
                      }}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            ))}

            <div>
              <Button type="submit" className="mt-4 w-full" disabled={loading}>
                {loading ? "Loading..." : "Add Stock"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
};

export default AddStockForm;
