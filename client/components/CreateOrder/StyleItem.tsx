"use client";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import MultipleSelector from "@/components/custom/multi-selector";
import { ChevronDown, Delete } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { ColorType, CreateOrderForm, SizeCountry, sizes } from "@/lib/formSchemas";
import CommentsFieldArray from "./CommentsFieldArray";
import FileUploadField from "./FileUploadField";
import { searchStyleNumbers } from "@/lib/data";
import {
  calculateRetailerStylePricing,
  formatOrderCurrency,
  resolveProductCurrencyPrice,
} from "@/lib/orderPricing";

const lining = [
  "No Lining",
  "Fully Stitched Lined",
  "Full Separate Lining",
  "Separate Short Lining",
  "Waist to Hips Stitched Lining",
  "Waist to floor Stitched Lining",
  "Bust to Hips Stitched lining",
  "Bust to Hips Seperate lining",
];

const sizeOptions: Record<string, number[]> = {
  EU: [32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60],
  US: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28],
  IT: [36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 62, 64],
  UK: [4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32],
};

interface StyleItemProps {
  form: UseFormReturn<CreateOrderForm>;
  index: number;
  fieldId: string;
  colors: any[];
  colorTypeArray: { value: string; label: string }[];
  sizeCountryArray: { value: keyof typeof SizeCountry; label: string }[];
  fullComponentWatch: any[];
  selectedCustomer: any;
  productDetailsByStyleNo: Map<string, any>;
  canRemove: boolean;
  onRemove: (index: number) => void;
  getColourBasedOnId: (id: number) => string | undefined;
  getColourBasedOnhex: (hex: string) => string | undefined;
}

const StyleItem = ({
  form,
  index,
  fieldId,
  colors,
  colorTypeArray,
  sizeCountryArray,
  fullComponentWatch,
  selectedCustomer,
  productDetailsByStyleNo,
  canRemove,
  onRemove,
  getColourBasedOnId,
  getColourBasedOnhex,
}: StyleItemProps) => {
  const watchColorType = form.watch(`styles[${index}].colorType` as any);
  const watchSize = form.watch(`styles[${index}].size` as any);
  const stylesSelect = form.watch(`styles[${index}].styleNo[0]` as any) as any;
  const addLining = fullComponentWatch[index]?.addLining;
  const currentLining = fullComponentWatch[index]?.lining;
  const currentStyle = fullComponentWatch[index] ?? {};
  const selectedStyleCode = stylesSelect?.value ?? "";
  const productDetails = selectedStyleCode
    ? productDetailsByStyleNo.get(selectedStyleCode)
    : null;
  const resolvedPrice = productDetails
    ? resolveProductCurrencyPrice(
        productDetails,
        selectedCustomer?.currencyId ?? selectedCustomer?.currency?.id,
      )
    : null;
  const stylePricing = resolvedPrice
    ? calculateRetailerStylePricing({
        basePrice: resolvedPrice.amount,
        size: currentStyle.size,
        quantity: currentStyle.quantity,
        customSizesQuantity: currentStyle.customSizesQuantity,
      })
    : null;
  const formatPrice = (value: number) =>
    formatOrderCurrency(
      value,
      resolvedPrice?.currencyCode,
      resolvedPrice?.currencySymbol,
    );

  return (
    <Collapsible key={fieldId} defaultOpen={index === 0} className="space-y-2">
      <div className="flex items-center gap-4">
        <CollapsibleTrigger asChild>
          <div className="flex w-full flex-1 cursor-pointer justify-between border-2 border-primary p-2">
            <p>{index + 1}. Style</p>
            <ChevronDown />
          </div>
        </CollapsibleTrigger>
        <Button
          variant="destructive"
          onClick={() => onRemove(index)}
          type="button"
          size="icon"
          disabled={!canRemove}
          aria-label={`Remove style ${index + 1}`}
        >
          <Delete className="h-4 w-4" />
        </Button>
      </div>

      <CollapsibleContent asChild>
        <div className="grid grid-cols-1 gap-2 p-2 md:grid-cols-3">

          {/* ── Style No ── */}
          <FormField
            control={form.control}
            name={`styles[${index}].styleNo` as any}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Style No</FormLabel>
                <FormControl>
                  <MultipleSelector
                    {...field}
                    onSearch={async (value) => {
                      const res = await searchStyleNumbers(value);
                      return res.products;
                    }}
                    creatable
                    placeholder="Please enter at least 1 character to search"
                    loadingIndicator={
                      <p className="text-muted-foreground">Loading...</p>
                    }
                    emptyIndicator={
                      <p className="text-muted-foreground">No results found</p>
                    }
                    maxSelected={1}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* ── Color Type ── */}
          <FormField
            control={form.control}
            name={`styles[${index}].colorType` as any}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Color Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select the color type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {colorTypeArray.map((type) => (
                      <SelectItem value={type.value} key={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* ── Custom color fields (only when colorType === Custom) ── */}
          {watchColorType === ColorType.Custom && (
            <>
              {/* Mesh Color */}
              <FormField
                control={form.control}
                name={`styles.${index}.mesh`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mesh Color</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Mesh Color" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={stylesSelect?.mesh ?? "SAS"}>
                          <div className="flex gap-1">
                            SAS (
                            <div className="flex items-center">
                              <p
                                className="mx-1 h-4 w-4 rounded-full"
                                style={{
                                  backgroundColor: stylesSelect?.mesh,
                                  border: "1px solid #000",
                                }}
                              />
                              {getColourBasedOnhex(stylesSelect?.mesh)}
                            </div>
                            )
                          </div>
                        </SelectItem>
                        {colors.map((colour: any) => (
                          <SelectItem
                            key={colour.id}
                            value={getColourBasedOnId(colour.id) ?? colour.id}
                          >
                            <div className="flex items-center">
                              <div
                                className="h-4 w-4 rounded-full"
                                style={{
                                  backgroundColor: getColourBasedOnId(colour.id),
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

              {/* Beading Color */}
              <FormField
                control={form.control}
                name={`styles.${index}.beading`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Beading Color</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Beading Color" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={stylesSelect?.beading ?? "SAS"}>
                          <div className="flex gap-1">
                            SAS (
                            <div className="flex items-center">
                              <p
                                className="mx-1 h-4 w-4 rounded-full"
                                style={{
                                  backgroundColor: stylesSelect?.beading,
                                  border: "1px solid #000",
                                }}
                              />
                              {getColourBasedOnhex(stylesSelect?.beading)}
                            </div>
                            )
                          </div>
                        </SelectItem>
                        {colors.map((colour: any) => (
                          <SelectItem
                            key={colour.id}
                            value={getColourBasedOnId(colour.id) ?? colour.id}
                          >
                            <div className="flex items-center">
                              <div
                                className="h-4 w-4 rounded-full"
                                style={{
                                  backgroundColor: getColourBasedOnId(colour.id),
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

              {/* Add Lining checkbox */}
              <div className="flex w-full items-end">
                <FormField
                  control={form.control}
                  name={`styles.${index}.addLining`}
                  render={({ field }) => (
                    <FormItem className="flex h-fit w-full items-center gap-2 rounded-md border px-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value ?? false}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <p className="text-lg">
                        Would You Like To Add Lining To This Product?
                      </p>
                    </FormItem>
                  )}
                />
              </div>

              {/* Lining fields (only when addLining is checked) */}
              {addLining && (
                <>
                  <FormField
                    control={form.control}
                    name={`styles.${index}.lining`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lining</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            if (value === "No Lining") {
                              form.setValue(`styles.${index}.liningColor`, "");
                            }
                          }}
                          defaultValue={stylesSelect?.lining}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Lining" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={stylesSelect?.lining ?? "SAS"}>
                              SAS (Same as Sample)
                            </SelectItem>
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

                  {/* Lining Color (only when lining is selected and not "No Lining") */}
                  {currentLining && currentLining !== "No Lining" && (
                    <FormField
                      control={form.control}
                      name={`styles.${index}.liningColor`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lining Color</FormLabel>
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
                              <SelectItem value={stylesSelect?.liningColor ?? "SAS"}>
                                <div className="flex gap-1">
                                  SAS (
                                  <div className="flex items-center">
                                    <p
                                      className="mx-1 h-4 w-4 rounded-full"
                                      style={{
                                        backgroundColor: stylesSelect?.liningColor,
                                        border: "1px solid #000",
                                      }}
                                    />
                                    {getColourBasedOnhex(stylesSelect?.liningColor)}
                                  </div>
                                  )
                                </div>
                              </SelectItem>
                              {colors.map((colour: any) => (
                                <SelectItem
                                  key={colour.id}
                                  value={getColourBasedOnId(colour.id) ?? colour.id}
                                >
                                  <div className="flex items-center">
                                    <div
                                      className="h-4 w-4 rounded-full"
                                      style={{
                                        backgroundColor: getColourBasedOnId(colour.id),
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
                </>
              )}
            </>
          )}

          {/* ── Size Country ── */}
          <FormField
            control={form.control}
            name={`styles[${index}].sizeCountry` as any}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Size Country</FormLabel>
                <Select
                  onValueChange={(val) => {
                    field.onChange(val);
                    form.setValue(`styles[${index}].size` as any, "");
                    form.setValue(`styles[${index}].customSize` as any, []);
                  }}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select the size country" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {sizeCountryArray.map((type) => (
                      <SelectItem value={type.value} key={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* ── Size ── */}
          <FormField
            control={form.control}
            name={`styles[${index}].size` as any}
            render={({ field }) => {
              const country = form.getValues(
                `styles[${index}].sizeCountry` as any,
              ) as keyof typeof sizeOptions;
              const options = sizeOptions[country] ?? sizes;

              return (
                <FormItem>
                  <FormLabel>Size</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        {field.value ? (
                          <SelectValue placeholder="Select the size of this style" />
                        ) : (
                          "Select the size of this style"
                        )}
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {options.map((size) => (
                        <SelectItem value={size.toString()} key={size}>
                          {size}
                        </SelectItem>
                      ))}
                      <SelectItem key="size-custom" value="Custom">
                        Custom
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          {/* ── Custom Size — saved as string[] ── */}
          {watchSize === "Custom" && (
            <FormField
              control={form.control}
              name={`styles[${index}].customSize` as any}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custom Sizes</FormLabel>
                  <FormControl>
                    <MultipleSelector
                      value={(field.value ?? []).map((v: string) =>
                        typeof v === "string" ? { value: v, label: v } : v,
                      )}
                      onChange={(options) => {
                        field.onChange(options.map((o) => o.value));
                      }}
                      creatable
                      placeholder="Type a size and press Enter (e.g. Waist 23)"
                      emptyIndicator={
                        <p className="text-muted-foreground">
                          Type any size and press Enter to add it
                        </p>
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* ── Quantity (only when size is NOT custom) ── */}
          {watchSize !== "Custom" && (
            <FormField
              control={form.control}
              name={`styles[${index}].quantity` as any}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input placeholder="100" type="number" min={0} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {selectedStyleCode && (
            <div className="md:col-span-3 hidden">
              <div className="grid gap-3 rounded-md border bg-muted/30 p-3 text-sm md:grid-cols-5">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Product Price
                  </p>
                  <p className="mt-1 font-semibold">
                    {stylePricing ? formatPrice(stylePricing.baseUnitPrice) : "Loading..."}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Variant Price
                  </p>
                  <p className="mt-1 font-semibold">
                    {stylePricing ? formatPrice(stylePricing.unitPrice) : "Loading..."}
                  </p>
                  {stylePricing && stylePricing.markupPercent > 0 && (
                    <p className="text-xs text-muted-foreground">
                      +{stylePricing.markupPercent}% size adjustment
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Subtotal
                  </p>
                  <p className="mt-1 font-semibold">
                    {stylePricing ? formatPrice(stylePricing.subtotal) : "Loading..."}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Discount
                  </p>
                  <p className="mt-1 font-semibold">
                    {stylePricing ? formatPrice(stylePricing.discount) : "Loading..."}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Total Price
                  </p>
                  <p className="mt-1 font-semibold">
                    {stylePricing ? formatPrice(stylePricing.total) : "Loading..."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── File upload ── */}
          <FileUploadField form={form} index={index} name="modifiedPhotoImage" />

          {/* ── Comments ── */}
          <div className="md:col-span-3">
            <CommentsFieldArray
              control={form.control}
              name={`styles.${index}.comments`}
              register={form.register}
            />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default StyleItem;