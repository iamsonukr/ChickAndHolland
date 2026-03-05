"use client";

import { useRouter } from "next/navigation";
import { memo, useEffect, useState } from "react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/custom/button";
import { Edit, Plus, X, DollarSign, ChevronsUpDown, Check } from "lucide-react";
import {
  AddProductForm as AddProductFormType,
  addProductFormSchema,
} from "@/lib/formSchemas";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import useHttp from "@/lib/hooks/usePost";
import { toast } from "sonner";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getProductColours } from "@/lib/data";
import { cn } from "@/lib/utils";

const lining = [
  "No Lining",
  "Fully Stitched Lined",
  "Full Separate Lining",
  "Separate Short Lining",
  "Waist to Hips Stitched Lining",
];

const EditProductForm = ({
  categories,
  subCategories,
  currencies,
  data,
}: {
  categories: any[];
  subCategories: any[];
  currencies: any[];
  data: any;
}) => {
  const [open, setOpen] = useState(false);
  const [colors, setColors] = useState([] as any);
  const [currencyComboboxOpen, setCurrencyComboboxOpen] = useState<{
    [key: number]: boolean;
  }>({});

  const router = useRouter();

  const form = useForm<AddProductFormType>({
    resolver: zodResolver(addProductFormSchema),
    defaultValues: {
      productCode: "",
      categoryId: undefined,
      subCategoryId: undefined,
      description: "",
      currencyBasedPricing: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "currencyBasedPricing",
  });

  const { loading, error, executeAsync } = useHttp(
    "/products/product-patch/" + data.id,
    "PATCH",
  );

  const onSubmit = async (formData: AddProductFormType) => {
    try {
      if (formData.lining == "No Lining") {
        formData.liningColor = "No Color";
      }

      const response = await executeAsync(formData, {}, (error) => {
        return toast.error("Failed to update Product");
      });

      form.reset();
      form.setValue("categoryId", "");
      form.setValue("subCategoryId", "");
      setOpen(false);
      toast.success(response.message ?? "Product updated successfully");
      router.refresh();
    } catch (err) {
      toast.error("Failed to update Product", {
        description: error?.message,
      });
    }
  };

  const watchedCategoryId = form.watch("categoryId");
  const watchedLining = form.watch("lining");

 const filteredSubCategories: any = (subCategories || []).filter(
  (subCategory) =>
    subCategory?.category?.id &&
    Number(watchedCategoryId) === subCategory.category.id
);


  // Get already selected currencies to filter them out
  // Also filter out EUR since it's the default currency (already has its own field)
const selectedCurrencyIds = fields
  .map((f) => f.currencyId?.toString())
  .filter(Boolean);
  const availableCurrencies = (currencies || []).filter(
    (currency) =>
      !selectedCurrencyIds.includes(currency.id.toString()) &&
      currency.code !== "EUR", // Exclude EUR since it's the default price
  );

  const addCurrencyPricing = () => {
    append({
      currencyId: "",
      price: 0,
    });
  };

  const getCurrencyDetails = (currencyId: string) => {
    return (currencies || []).find(
      (currency) => currency.id.toString() === currencyId,
    );
  };

  const colorsFun = async () => {
    try {
      const colours = await getProductColours({});
      const dataColor = colours?.productColours || [];

      setColors(dataColor);
      form.setValue(
        "mesh",
        dataColor.find((colour: any) => colour.hexcode === data.mesh_color)
          ?.hexcode,
      );
      form.setValue(
        "beading",
        dataColor.find((colour: any) => colour.hexcode == data.beading_color)
          ?.hexcode,
      );
      form.setValue(
        "liningColor",
        dataColor.find((colour: any) => colour.hexcode == data.lining_color)
          ?.hexcode,
      );
    } catch (error) {
      console.error("Failed to fetch colors:", error);
      setColors([]);
    }
  };

  useEffect(() => {
    colorsFun();

  const existingCurrencyPricing =
  data.currencyPricing?.map((pricing: any) => ({
    currencyId: pricing.currency?.id?.toString() || "",
    price: Math.floor(pricing.price),
  })) || [];



    form.reset({
  productCode: data.productCode,
  productPrice: Math.floor(data.price),

  categoryId: data?.category?.id
    ? data.category.id.toString()
    : "",

  subCategoryId: data?.subCategory?.id
    ? data.subCategory.id.toString()
    : "",

  lining: lining.find((i) => i == data.lining),
  description: data.description || "",
  currencyBasedPricing: existingCurrencyPricing,
});
 // 🔥 LOGS HERE
  console.log("🔥 CURRENCIES FROM PROPS: ", currencies);
  console.log("🔥 PRODUCT PRICING FROM DB: ", data.currencyPricing);
  console.log("🔥 FIELDS FROM RHF: ", existingCurrencyPricing);

  }, [data]);

  return (
    <div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button>
            <Edit />
          </Button>
        </SheetTrigger>
        <SheetContent className="min-w-[100%] overflow-y-auto md:min-w-[50%] lg:min-w-[35%]">
          <SheetHeader>
            <SheetTitle>Edit Product</SheetTitle>
            <SheetDescription>
              Fill in the form below to edit product
            </SheetDescription>
          </SheetHeader>

          <Form {...form}>
            <form
              className="mt-8 space-y-2"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <FormField
                control={form.control}
                name="productCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Code</FormLabel>
                    <FormControl>
                      <Input placeholder="SD880059" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="productPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Product Price (Euro)</FormLabel>
                    <FormControl>
                      <Input placeholder="1000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-base font-semibold">
                    Additional Currency Pricing (Optional)
                  </FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addCurrencyPricing}
                    disabled={availableCurrencies.length === 0}
                  >
                    <DollarSign className="mr-1 h-4 w-4" />
                    Add USD/GBP Price
                  </Button>
                </div>

                {fields.length > 0 && (
                  <div className="space-y-3 rounded-lg bg-gray-50 p-4">
                    {fields.map((field, index) => {
                      const currency = getCurrencyDetails(field.currencyId);
                      return (
                        <div key={field.id} className="flex items-end gap-2">
                          <FormField
                            control={form.control}
                            name={`currencyBasedPricing.${index}.currencyId`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel>Currency</FormLabel>
                                <Popover
                                  open={currencyComboboxOpen[index] || false}
                                  onOpenChange={(open) =>
                                    setCurrencyComboboxOpen((prev) => ({
                                      ...prev,
                                      [index]: open,
                                    }))
                                  }
                                >
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={
                                          currencyComboboxOpen[index] || false
                                        }
                                        className={cn(
                                          "w-full justify-between",
                                          !field.value &&
                                            "text-muted-foreground",
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
                                        <CommandEmpty>
                                          No currency found.
                                        </CommandEmpty>
                                        <CommandGroup className="max-h-64 overflow-auto">

  {/* Show selected currency (even if filtered out) */}
  {field.value &&
    getCurrencyDetails(field.value) && (
      <CommandItem
        key={`selected-${field.value}`}
        value={getCurrencyDetails(field.value)?.name?.toLowerCase() || ""}
        onSelect={() => {
          field.onChange(field.value);
          setCurrencyComboboxOpen((prev) => ({
            ...prev,
            [index]: false,
          }));
        }}
      >
        <Check
          className={cn(
            "mr-2 h-4 w-4 opacity-100"
          )}
        />
        {getCurrencyDetails(field.value)?.name} (
        {getCurrencyDetails(field.value)?.code}){" "}
        {getCurrencyDetails(field.value)?.symbol}
      </CommandItem>
    )}

  {/* Show remaining available currencies */}
  {availableCurrencies
  .filter((c) => c.id.toString() !== field.value)
  .map((currency: any) => (
    <CommandItem
      key={`currency-${currency.id}`}
      value={currency.name?.toLowerCase() || ""}
      onSelect={() => {
        field.onChange(currency.id.toString());
        setCurrencyComboboxOpen((prev) => ({
          ...prev,
          [index]: false,
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

      {currency.name} ({currency.code}) {currency.symbol}
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
                            name={`currencyBasedPricing.${index}.price`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel>Price</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="0"
                                    {...field}
                                    onChange={(e) =>
                                      field.onChange(Number(e.target.value))
                                    }
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => remove(index)}
                            className="mb-2"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={(e) => {
                        field.onChange(e);
                        form.setValue("subCategoryId", "");
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select the category of this product" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(categories || []).map((category: any) => (
                          <SelectItem
                            key={category.id}
                            value={category.id.toString()}
                          >
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchedCategoryId && (
                <FormField
                  control={form.control}
                  name="subCategoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Collection</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select the collection of this product" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {filteredSubCategories.map((collection: any) => (
                            <SelectItem
                              key={collection.id}
                              value={collection.id.toString()}
                            >
                              {collection.name}
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
                name={"mesh"}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mesh Color</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Mesh Color" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(colors || []).map((colour: any) => (
                          <SelectItem key={colour.id} value={colour.hexcode}>
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
                name={"beading"}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Beading Color</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Beading Color" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(colors || []).map((colour: any) => (
                          <SelectItem key={colour.id} value={colour.hexcode}>
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
                name={"lining"}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lining</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        if (value === "No Lining") {
                          form.setValue("liningColor", "No Color");
                        }
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Lining" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {lining.map((item) => (
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

              {watchedLining && watchedLining !== "No Lining" && (
                <FormField
                  control={form.control}
                  name={"liningColor"}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lining Color</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Lining Color" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(colors || []).map((colour: any) => (
                            <SelectItem
                              key={colour.id}
                              value={colour.hexcode as string}
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
              )}

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Product Description"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <Button
                  type="submit"
                  className="mt-4 w-full"
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Update Product"}
                </Button>
              </div>
            </form>
          </Form>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default memo(EditProductForm);
