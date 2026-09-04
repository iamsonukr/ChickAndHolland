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
import { UseFormReturn, useWatch } from "react-hook-form";
import {
  ColorType,
  CreateOrderForm,
  SizeCountry,
  sizes,
} from "@/lib/formSchemas";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import CommentsFieldArray from "./CommentsFieldArray";
import FileUploadField from "./FileUploadField";
import CustomSizesQuantityFieldArray from "./CustomSizesQuantityFieldArray";
import { searchStyleNumbers } from "@/lib/data";
import dynamic from "next/dynamic";
import BeaderSelectField from "@/components/BeaderSelectField";

import {
  calculateRetailerStylePricing,
  formatOrderCurrency,
  resolveProductCurrencyPrice,
} from "@/lib/orderPricing";

const AddProductFormDynamic = dynamic(
  () => import("@/app/(admin-panel)/admin-panel/products/AddProductForm"),
  { ssr: false },
);

const lining = [
  "No Lining",
  "Fully Stitched Lining",
  "Full Separate Lining",
  "Separate Short Lining",
  "Waist to Hips Stitched Lining",
  "Waist to Hips Seperate Lining",
  "Waist to floor Stitched Lining",
  "Bust To Hips Stitched Lining",
  "Bust To Hips Seperate Lining",
];
const COLOR_CUSTOM_VALUE = "Custom";
const LINING_CUSTOM_VALUE = "Custom";
const MULTIPLE_SIZES_VALUE = "Multiple";

const sizeOptions: Record<string, number[]> = {
  EU: [32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60],
  US: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28],
  IT: [36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 62, 64],
  UK: [4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32],
};

const getSelectItemValue = (value: unknown, fallback = "SAS") => {
  const stringValue = String(value ?? "").trim();
  return stringValue || fallback;
};

const getColorSelectValue = (value: unknown, knownValues: string[]) => {
  const stringValue = String(value ?? "").trim();
  return knownValues.includes(stringValue) ? stringValue : "";
};

const getCustomColorText = (value: unknown, knownValues: string[]) => {
  const stringValue = String(value ?? "");
  const trimmedValue = stringValue.trim();
  return trimmedValue && !knownValues.includes(trimmedValue) ? stringValue : "";
};

const getCustomLiningText = (value: unknown, knownValues: string[]) => {
  const stringValue = String(value ?? "");
  const trimmedValue = stringValue.trim();
  return trimmedValue &&
    trimmedValue !== LINING_CUSTOM_VALUE &&
    !knownValues.includes(trimmedValue)
    ? stringValue
    : "";
};

interface StyleItemProps {
  form: UseFormReturn<CreateOrderForm>;
  index: number;
  fieldId: string;
  colors: any[];
  beaders: any[];
  productCategories: any[];
  productSubCategories: any[];
  currencies: any[];
  colorTypeArray: { value: string; label: string }[];
  sizeCountryArray: { value: keyof typeof SizeCountry; label: string }[];
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
  beaders,
  productCategories,
  productSubCategories,
  currencies,
  colorTypeArray,
  sizeCountryArray,
  selectedCustomer,
  productDetailsByStyleNo,
  canRemove,
  onRemove,
  getColourBasedOnId,
  getColourBasedOnhex,
}: StyleItemProps) => {
  const currentStyle = useWatch({
    control: form.control,
    name: `styles.${index}` as any,
  }) as any;
  const watchColorType =
    useWatch({
      control: form.control,
      name: `styles.${index}.colorType` as any,
    }) ?? currentStyle?.colorType;
  const isCustomColorType =
    String(watchColorType ?? "").trim().toLowerCase() ===
    String(ColorType.Custom).trim().toLowerCase();
  const watchSize = currentStyle?.size;
  const watchSizeCountry =
    currentStyle?.sizeCountry as keyof typeof sizeOptions;
  const stylesSelect = currentStyle?.styleNo?.[0] as any;
  const addLining = currentStyle?.addLining;
  const currentLining = currentStyle?.lining;
  const currentMesh = currentStyle?.mesh;
  const isCustomLining =
    Boolean(currentLining) &&
    currentLining !== "SAS" &&
    !lining.includes(String(currentLining));
  const [customLiningActive, setCustomLiningActive] = useState(isCustomLining);
  const [customColorActiveByField, setCustomColorActiveByField] = useState<
    Record<string, boolean>
  >({});
  const styleValue = currentStyle ?? {};
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
  const sampleMeshValue = getSelectItemValue(stylesSelect?.mesh);
  const sampleBeadingValue = getSelectItemValue(stylesSelect?.beading);
  const sampleBeaderValue = String(
    styleValue?.beader || stylesSelect?.beader || productDetails?.beader || "",
  ).trim();
  const sampleLiningValue = getSelectItemValue(stylesSelect?.lining);
  const sampleLiningColorValue = getSelectItemValue(stylesSelect?.liningColor);
  const colorOptions = useMemo(
    () =>
      colors.map((colour: any) => ({
        id: colour.id,
        name: colour.name,
        hex: getColourBasedOnId(colour.id),
        value: getSelectItemValue(
          getColourBasedOnId(colour.id),
          getSelectItemValue(colour.id, getSelectItemValue(colour.name)),
        ),
      })),
    [colors, getColourBasedOnId],
  );
  const colorOptionValues = useMemo(
    () => colorOptions.map((colour) => colour.value).filter(Boolean),
    [colorOptions],
  );
  const knownColorValuesBySample = useMemo(
    () => ({
      mesh: Array.from(
        new Set([sampleMeshValue, ...colorOptionValues].filter(Boolean)),
      ),
      beading: Array.from(
        new Set([sampleBeadingValue, ...colorOptionValues].filter(Boolean)),
      ),
      liningColor: Array.from(
        new Set([sampleLiningColorValue, ...colorOptionValues].filter(Boolean)),
      ),
    }),
    [
      colorOptionValues,
      sampleBeadingValue,
      sampleLiningColorValue,
      sampleMeshValue,
    ],
  );
  const knownLiningValues = useMemo(
    () =>
      Array.from(new Set([sampleLiningValue, ...lining, LINING_CUSTOM_VALUE])),
    [sampleLiningValue],
  );
  const stylePricing = useMemo(
    () =>
      resolvedPrice
        ? calculateRetailerStylePricing({
            basePrice: resolvedPrice.amount,
            size: styleValue.size,
            quantity: styleValue.quantity,
            customSizesQuantity: styleValue.customSizesQuantity,
          })
        : null,
    [
      resolvedPrice,
      styleValue.customSizesQuantity,
      styleValue.quantity,
      styleValue.size,
    ],
  );
  const formatPrice = (value: number) =>
    formatOrderCurrency(
      value,
      resolvedPrice?.currencyCode,
      resolvedPrice?.currencySymbol,
    );
  const sizeOptionsForCountry = sizeOptions[watchSizeCountry] ?? sizes;
  const isMultipleSizes = watchSize === MULTIPLE_SIZES_VALUE;
  const multipleSizeRows = styleValue.customSizesQuantity ?? [];
  const setMultipleSizeRows = useCallback((nextSizes: string[]) => {
    const existingRows = styleValue.customSizesQuantity ?? [];
    const nextRows = nextSizes.map((size) => {
      const existingRow = existingRows.find(
        (row: any) => String(row?.size) === String(size),
      );

      return {
        size: String(size),
        quantity: existingRow?.quantity ?? "1",
      };
    });

    form.setValue(`styles.${index}.customSizesQuantity` as any, nextRows, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    form.setValue(`styles.${index}.quantity` as any, "1", {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  }, [form, index, styleValue.customSizesQuantity]);
  const setCustomColorActive = useCallback(
    (fieldName: string, active: boolean) => {
      setCustomColorActiveByField((prev) => ({
        ...prev,
        [fieldName]: active,
      }));
    },
    [],
  );

  useEffect(() => {
    if (!addLining) {
      setCustomLiningActive(false);
      return;
    }

    if (isCustomLining) {
      setCustomLiningActive(true);
    }
  }, [addLining, isCustomLining]);

  useEffect(() => {
    if (isCustomColorType) return;

    setCustomColorActiveByField({});

    const meshPath = `styles.${index}.mesh` as const;
    const beadingPath = `styles.${index}.beading` as const;
    const customColorPath = `styles.${index}.customColor` as const;

    if (form.getValues(meshPath as any) !== "SAS") {
      form.setValue(meshPath as any, "SAS", {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    }

    if (form.getValues(beadingPath as any) !== "SAS") {
      form.setValue(beadingPath as any, "SAS", {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    }

    if ((form.getValues(customColorPath as any) ?? []).length) {
      form.setValue(customColorPath as any, [], {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    }
  }, [form, index, isCustomColorType]);

  useEffect(() => {
    if (!addLining || !currentLining || currentLining === "No Lining") return;
    if (!currentMesh) return;

    form.setValue(`styles.${index}.liningColor`, currentMesh, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  }, [addLining, currentLining, currentMesh, form, index]);

  return (
    <Collapsible key={fieldId} defaultOpen={index === 0} className="space-y-2">
      <div className="flex items-center gap-4">
        <CollapsibleTrigger asChild>
          <div className="flex w-full flex-1 cursor-pointer justify-between border-2 border-primary p-2">
            <p>
              {index + 1}. Style{" "}
              {selectedStyleCode ? `(${selectedStyleCode})` : ""}
            </p>{" "}
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
                    placeholder="Please enter at least 1 character to search"
                    loadingIndicator={
                      <p className="text-muted-foreground">Loading...</p>
                    }
                    emptyIndicator={
                      <div
                        role="button"
                        tabIndex={0}
                        className="cursor-pointer rounded-md border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-sm hover:bg-muted"
                        // ✅ FIXED: stopPropagation on pointerDown to block Radix,
                        //    then navigate on click which fires after Radix is done
                        onPointerDown={(e) => {
                          e.stopPropagation();
                        }}
                        onClick={() => {
                          // Open add Style Form (programmatically trigger global event)
                          try {
                            window.dispatchEvent(
                              new Event("openAddProductForm"),
                            );
                          } catch (err) {
                            // fallback: no-op
                          }
                        }}
                      >
                        Add New Style
                      </div>
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
            name={`styles.${index}.colorType` as any}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Color Type</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    if (value === ColorType.Custom) {
                      setCustomColorActive("mesh", true);
                      setCustomColorActive("beading", true);
                      if (addLining) {
                        setCustomColorActive("liningColor", true);
                      }
                    }
                    // When switching away from Custom, clear custom color fields
                    if (value !== ColorType.Custom) {
                      setCustomColorActive("mesh", false);
                      setCustomColorActive("beading", false);
                      setCustomColorActive("liningColor", false);
                      form.setValue(`styles.${index}.customColor`, [], {
                        shouldDirty: true,
                        shouldTouch: true,
                        shouldValidate: true,
                      });
                      form.setValue(`styles.${index}.mesh`, "SAS", {
                        shouldDirty: true,
                        shouldTouch: true,
                        shouldValidate: true,
                      });
                      form.setValue(`styles.${index}.beading`, "SAS", {
                        shouldDirty: true,
                        shouldTouch: true,
                        shouldValidate: true,
                      });
                    }
                  }}
                  value={field.value}
                >
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
          {isCustomColorType && (
            <>
              {/* Mesh Color */}
              <FormField
                control={form.control}
                name={`styles.${index}.mesh`}
                render={({ field }) => {
                  const knownColorValues = knownColorValuesBySample.mesh;
                  const customText = getCustomColorText(
                    field.value,
                    knownColorValues,
                  );
                  const customActive =
                    isCustomColorType ||
                    customColorActiveByField.mesh ||
                    Boolean(customText);

                  return (
                    <FormItem>
                      <FormLabel>Mesh Color</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          const isCustom = value === COLOR_CUSTOM_VALUE;
                          setCustomColorActive("mesh", isCustom);
                          field.onChange(isCustom ? "" : value);
                        }}
                        value={
                          customActive
                            ? COLOR_CUSTOM_VALUE
                            : getColorSelectValue(
                                field.value,
                                knownColorValues,
                              )
                        }
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Mesh Color" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={sampleMeshValue}>
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
                          {colorOptions.map((colour) => (
                            <SelectItem
                              key={colour.id}
                              value={colour.value}
                            >
                              <div className="flex items-center">
                                <div
                                  className="h-4 w-4 rounded-full"
                                  style={{
                                    backgroundColor: colour.hex,
                                    border: "1px solid #000",
                                  }}
                                />
                                <span className="ml-2">{colour.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                          <SelectItem value={COLOR_CUSTOM_VALUE}>
                            Custom
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {customActive && (
                        <Input
                          className="mt-2"
                          placeholder="Or type custom mesh text"
                          value={customText}
                          onChange={(event) => {
                            setCustomColorActive("mesh", true);
                            field.onChange(event.target.value);
                          }}
                        />
                      )}
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              {/* Beading Color */}
              <FormField
                control={form.control}
                name={`styles.${index}.beading`}
                render={({ field }) => {
                  const knownColorValues = knownColorValuesBySample.beading;
                  const customText = getCustomColorText(
                    field.value,
                    knownColorValues,
                  );
                  const customActive =
                    isCustomColorType ||
                    customColorActiveByField.beading ||
                    Boolean(customText);

                  return (
                    <FormItem>
                      <FormLabel>Beading Color</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          const isCustom = value === COLOR_CUSTOM_VALUE;
                          setCustomColorActive("beading", isCustom);
                          field.onChange(isCustom ? "" : value);
                        }}
                        value={
                          customActive
                            ? COLOR_CUSTOM_VALUE
                            : getColorSelectValue(
                                field.value,
                                knownColorValues,
                              )
                        }
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Beading Color" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={sampleBeadingValue}>
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
                          {colorOptions.map((colour) => (
                            <SelectItem
                              key={colour.id}
                              value={colour.value}
                            >
                              <div className="flex items-center">
                                <div
                                  className="h-4 w-4 rounded-full"
                                  style={{
                                    backgroundColor: colour.hex,
                                    border: "1px solid #000",
                                  }}
                                />
                                <span className="ml-2">{colour.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                          <SelectItem value={COLOR_CUSTOM_VALUE}>
                            Custom
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {customActive && (
                        <Input
                          className="mt-2"
                          placeholder="Or type custom beading text"
                          value={customText}
                          onChange={(event) => {
                            setCustomColorActive("beading", true);
                            field.onChange(event.target.value);
                          }}
                        />
                      )}
                      <FormMessage />
                    </FormItem>
                  );
                }}
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
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            if (checked) {
                              if (isCustomColorType) {
                                setCustomColorActive("liningColor", true);
                              }
                              form.setValue(
                                `styles.${index}.liningColor`,
                                form.getValues(`styles.${index}.mesh`) || "SAS",
                                {
                                  shouldDirty: true,
                                  shouldTouch: true,
                                  shouldValidate: true,
                                },
                              );
                            }
                            if (!checked) {
                              setCustomLiningActive(false);
                              setCustomColorActive("liningColor", false);
                              form.setValue(`styles.${index}.lining`, "SAS", {
                                shouldDirty: true,
                                shouldTouch: true,
                                shouldValidate: true,
                              });
                              form.setValue(
                                `styles.${index}.liningColor`,
                                "SAS",
                                {
                                  shouldDirty: true,
                                  shouldTouch: true,
                                  shouldValidate: true,
                                },
                              );
                            }
                          }}
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
                    render={({ field }) => {
                      return (
                        <FormItem>
                          <FormLabel>Lining</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              const isCustom = value === LINING_CUSTOM_VALUE;
                              setCustomLiningActive(isCustom);
                              field.onChange(isCustom ? "" : value);
                              if (value === "No Lining") {
                                setCustomColorActive("liningColor", false);
                                form.setValue(
                                  `styles.${index}.liningColor`,
                                  "",
                                );
                              }
                              if (!isCustom) {
                                form.trigger(`styles.${index}.lining` as any);
                              }
                            }}
                            value={
                              getCustomLiningText(
                                field.value,
                                knownLiningValues,
                              ) || customLiningActive
                                ? LINING_CUSTOM_VALUE
                                : field.value
                            }
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Lining" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={sampleLiningValue}>
                                SAS (Same as Sample)
                              </SelectItem>
                              {lining.map((item) => (
                                <SelectItem key={item} value={item}>
                                  {item}
                                </SelectItem>
                              ))}
                              <SelectItem value={LINING_CUSTOM_VALUE}>
                                Custom
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            className="mt-2"
                            placeholder="Or type custom lining text"
                            value={getCustomLiningText(
                              field.value,
                              knownLiningValues,
                            )}
                            onChange={(event) => {
                              setCustomLiningActive(true);
                              field.onChange(event.target.value);
                            }}
                          />
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                  {/* Lining Color (only when lining is selected and not "No Lining") */}
                  {currentLining && currentLining !== "No Lining" && (
                    <FormField
                      control={form.control}
                      name={`styles.${index}.liningColor`}
                      render={({ field }) => {
                        const knownColorValues =
                          knownColorValuesBySample.liningColor;
                        const customText = getCustomColorText(
                          field.value,
                          knownColorValues,
                        );
                        const customActive =
                          isCustomColorType ||
                          customColorActiveByField.liningColor ||
                          Boolean(customText);

                        return (
                          <FormItem>
                            <FormLabel>Lining Color</FormLabel>
                            <Select
                              onValueChange={(value) => {
                                const isCustom = value === COLOR_CUSTOM_VALUE;
                                setCustomColorActive("liningColor", isCustom);
                                field.onChange(isCustom ? "" : value);
                              }}
                              value={
                                customActive
                                  ? COLOR_CUSTOM_VALUE
                                  : getColorSelectValue(
                                      field.value,
                                      knownColorValues,
                                    )
                              }
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select Lining Color" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value={sampleLiningColorValue}>
                                  <div className="flex gap-1">
                                    SAS (
                                    <div className="flex items-center">
                                      <p
                                        className="mx-1 h-4 w-4 rounded-full"
                                        style={{
                                          backgroundColor:
                                            stylesSelect?.liningColor,
                                          border: "1px solid #000",
                                        }}
                                      />
                                      {getColourBasedOnhex(
                                        stylesSelect?.liningColor,
                                      )}
                                    </div>
                                    )
                                  </div>
                                </SelectItem>
                                {colorOptions.map((colour) => (
                                  <SelectItem
                                    key={colour.id}
                                    value={colour.value}
                                  >
                                    <div className="flex items-center">
                                      <div
                                        className="h-4 w-4 rounded-full"
                                        style={{
                                          backgroundColor: colour.hex,
                                          border: "1px solid #000",
                                        }}
                                      />
                                      <span className="ml-2">
                                        {colour.name}
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                                <SelectItem value={COLOR_CUSTOM_VALUE}>
                                  Custom
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            {customActive && (
                              <Input
                                className="mt-2"
                                placeholder="Or type custom lining color text"
                                value={customText}
                                onChange={(event) => {
                                  setCustomColorActive("liningColor", true);
                                  field.onChange(event.target.value);
                                }}
                              />
                            )}
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                  )}
                </>
              )}
            </>
          )}

          {/* ── Size Country ── */}
          {!isCustomColorType && (
            <>
              <div className="flex w-full items-end">
                <FormField
                  control={form.control}
                  name={`styles.${index}.addLining`}
                  render={({ field }) => (
                    <FormItem className="flex h-fit w-full items-center gap-2 rounded-md border px-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value ?? false}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            if (!checked) {
                              setCustomLiningActive(false);
                              form.setValue(`styles.${index}.lining`, "SAS", {
                                shouldDirty: true,
                                shouldTouch: true,
                                shouldValidate: true,
                              });
                              form.setValue(
                                `styles.${index}.liningColor`,
                                "SAS",
                                {
                                  shouldDirty: true,
                                  shouldTouch: true,
                                  shouldValidate: true,
                                },
                              );
                            }
                          }}
                        />
                      </FormControl>
                      <p className="text-lg">
                        Would You Like To Add Lining To This Product?
                      </p>
                    </FormItem>
                  )}
                />
              </div>

              {addLining && (
                <>
                  <FormField
                    control={form.control}
                    name={`styles.${index}.lining`}
                    render={({ field }) => {
                      return (
                        <FormItem>
                          <FormLabel>Lining</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              const isCustom = value === LINING_CUSTOM_VALUE;
                              setCustomLiningActive(isCustom);
                              field.onChange(isCustom ? "" : value);
                              if (value === "No Lining") {
                                form.setValue(
                                  `styles.${index}.liningColor`,
                                  "",
                                );
                              }
                              if (!isCustom) {
                                form.trigger(`styles.${index}.lining` as any);
                              }
                            }}
                            value={
                              getCustomLiningText(
                                field.value,
                                knownLiningValues,
                              ) || customLiningActive
                                ? LINING_CUSTOM_VALUE
                                : field.value
                            }
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Lining" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={sampleLiningValue}>
                                SAS (Same as Sample)
                              </SelectItem>
                              {lining.map((item) => (
                                <SelectItem key={item} value={item}>
                                  {item}
                                </SelectItem>
                              ))}
                              <SelectItem value={LINING_CUSTOM_VALUE}>
                                Custom
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            className="mt-2"
                            placeholder="Or type custom lining text"
                            value={getCustomLiningText(
                              field.value,
                              knownLiningValues,
                            )}
                            onChange={(event) => {
                              setCustomLiningActive(true);
                              field.onChange(event.target.value);
                            }}
                          />
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                  {currentLining && currentLining !== "No Lining" && (
                    <FormField
                      control={form.control}
                      name={`styles.${index}.liningColor`}
                      render={({ field }) => {
                        const knownColorValues =
                          knownColorValuesBySample.liningColor;

                        return (
                          <FormItem>
                            <FormLabel>Lining Color</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={getColorSelectValue(
                                field.value,
                                knownColorValues,
                              )}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select Lining Color" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value={sampleLiningColorValue}>
                                  <div className="flex gap-1">
                                    SAS (
                                    <div className="flex items-center">
                                      <p
                                        className="mx-1 h-4 w-4 rounded-full"
                                        style={{
                                          backgroundColor:
                                            stylesSelect?.liningColor,
                                          border: "1px solid #000",
                                        }}
                                      />
                                      {getColourBasedOnhex(
                                        stylesSelect?.liningColor,
                                      )}
                                    </div>
                                    )
                                  </div>
                                </SelectItem>
                                {colorOptions.map((colour) => (
                                  <SelectItem
                                    key={colour.id}
                                    value={colour.value}
                                  >
                                    <div className="flex items-center">
                                      <div
                                        className="h-4 w-4 rounded-full"
                                        style={{
                                          backgroundColor: colour.hex,
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
                            <Input
                              className="mt-2"
                              placeholder="Or type custom lining color text"
                              value={getCustomColorText(
                                field.value,
                                knownColorValues,
                              )}
                              onChange={(event) =>
                                field.onChange(event.target.value)
                              }
                            />
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                  )}
                </>
              )}
            </>
          )}

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
                    form.setValue(
                      `styles[${index}].customSizesQuantity` as any,
                      [],
                    );
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
                    onValueChange={(value) => {
                      field.onChange(value);

                      if (value === MULTIPLE_SIZES_VALUE) {
                        form.setValue(`styles.${index}.customSize` as any, [], {
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: true,
                        });
                        form.setValue(`styles.${index}.quantity` as any, "1", {
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: true,
                        });
                        return;
                      }

                      if (value !== "Custom") {
                        form.setValue(`styles.${index}.customSize` as any, [], {
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: true,
                        });
                        form.setValue(
                          `styles.${index}.customSizesQuantity` as any,
                          [],
                          {
                            shouldDirty: true,
                            shouldTouch: true,
                            shouldValidate: true,
                          },
                        );
                      }
                    }}
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
                      <SelectItem key="size-custom" value="Custom">
                        Custom
                      </SelectItem>
                      <SelectItem
                        key="size-multiple"
                        value={MULTIPLE_SIZES_VALUE}
                      >
                        Multiple Sizes
                      </SelectItem>
                      {options.map((size) => (
                        <SelectItem value={size.toString()} key={size}>
                          {size}
                        </SelectItem>
                      ))}
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
                      value={(field.value ?? []).map((v: any) =>
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

          {isMultipleSizes && (
            <div className="space-y-3 md:col-span-3">
              <FormLabel>Sizes & Quantities</FormLabel>
              <MultipleSelector
                value={multipleSizeRows.map((row: any) => ({
                  value: String(row?.size ?? ""),
                  label: String(row?.size ?? ""),
                }))}
                defaultOptions={sizeOptionsForCountry.map((size) => ({
                  value: String(size),
                  label: String(size),
                }))}
                onChange={(options) =>
                  setMultipleSizeRows(options.map((option) => option.value))
                }
                placeholder="Select all sizes for this style"
                emptyIndicator={
                  <p className="text-muted-foreground">No sizes found</p>
                }
              />
              <CustomSizesQuantityFieldArray
                control={form.control}
                name={`styles.${index}.customSizesQuantity`}
                register={form.register}
              />
            </div>
          )}

          {/* Beader */}
          <FormField
            control={form.control}
            name={`styles.${index}.beader`}
            render={({ field }) => (
              <BeaderSelectField
                value={field.value || sampleBeaderValue}
                onChange={field.onChange}
                beaders={beaders}
              />
            )}
          />

          {/* ── Quantity ── */}
          {!isMultipleSizes && (
            <FormField
              control={form.control}
              name={`styles[${index}].quantity` as any}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="100"
                      type="number"
                      min={1}
                      step={1}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {selectedStyleCode && (
            <div className="hidden md:col-span-3">
              <div className="grid gap-3 rounded-md border bg-muted/30 p-3 text-sm md:grid-cols-5">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Product Price
                  </p>
                  <p className="mt-1 font-semibold">
                    {stylePricing
                      ? formatPrice(stylePricing.baseUnitPrice)
                      : "Loading..."}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Variant Price
                  </p>
                  <p className="mt-1 font-semibold">
                    {stylePricing
                      ? formatPrice(stylePricing.unitPrice)
                      : "Loading..."}
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
                    {stylePricing
                      ? formatPrice(stylePricing.subtotal)
                      : "Loading..."}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Discount
                  </p>
                  <p className="mt-1 font-semibold">
                    {stylePricing
                      ? formatPrice(stylePricing.discount)
                      : "Loading..."}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Total Price
                  </p>
                  <p className="mt-1 font-semibold">
                    {stylePricing
                      ? formatPrice(stylePricing.total)
                      : "Loading..."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── File upload ── */}
          <FileUploadField
            form={form}
            index={index}
            name="modifiedPhotoImage"
            label="Custom / New Style Images"
          />

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
      {/* Mount AddProductForm once so it can listen for the global open event */}
      {index === 0 && (
        <AddProductFormDynamic
          categories={productCategories}
          subCategories={productSubCategories}
          currencies={currencies}
          hideTrigger
        />
      )}
    </Collapsible>
  );
};

export default memo(StyleItem);
