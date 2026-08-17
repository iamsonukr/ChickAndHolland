"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ShoppingBag, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Textarea } from "@/components/ui/textarea";
import MultipleSelector from "@/components/custom/multi-selector";
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

const FALLBACK_SAMPLE_STYLE_NO = "NS110064";
const NEXT_STYLE_TIMEOUT_MS = 10000;
const liningOptions = [
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
const colorTypeOptions = ["SAS", "Custom"];

const sampleOrderSchema = z
  .object({
    colorType: z.string().min(1, "Color Type is required"),
    customColor: z.string().optional(),
    sizeCountry: z.string().min(1, "Country is required"),
    size: z.string().min(1, "Size is required"),
    customSize: z
      .array(
        z.union([
          z.string(),
          z.object({
            value: z.string().optional(),
            label: z.string().optional(),
          }),
        ]),
      )
      .optional(),
    mesh: z.string().optional(),
    beading: z.string().optional(),
    beader: z.string().optional(),
    addLining: z.boolean().optional(),
    lining: z.string().optional(),
    liningColor: z.string().optional(),
    quantity: z
      .string()
      .trim()
      .min(1, "Quantity is required")
      .refine((value) => {
        const quantity = Number(value);
        return Number.isInteger(quantity) && quantity > 0;
      }, "Quantity must be greater than 0"),
    comments: z.string().optional(),
    primaryImage: z
      .any()
      .refine((files) => files?.length === 1, "Primary Image is required"),
    secondaryImages: z.any().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.colorType === "Custom") {
      if (!data.mesh?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Mesh Color is required",
          path: ["mesh"],
        });
      }

      if (!data.beading?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Beading Color is required",
          path: ["beading"],
        });
      }
    }

    if (data.addLining && !data.lining?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Lining is required",
        path: ["lining"],
      });
    }

    if (
      data.addLining &&
      data.lining !== "No Lining" &&
      !data.liningColor?.trim()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Lining Color is required when lining is not 'No Lining'",
        path: ["liningColor"],
      });
    }
  });

type SampleOrderForm = z.infer<typeof sampleOrderSchema>;

const fileListToArray = (value: unknown): File[] => {
  if (!value) return [];
  if (typeof FileList !== "undefined" && value instanceof FileList) {
    return Array.from(value);
  }
  return Array.isArray(value)
    ? value.filter((file): file is File => file instanceof File)
    : [];
};

const buildFilePreviews = (files: File[]) =>
  files.map((file) => ({
    name: file.name,
    url: URL.createObjectURL(file),
  }));

const getColourValue = (colour: any) =>
  String(colour?.hexcode || colour?.name || colour?.id || "").trim();

const getColourLabel = (colour: any) =>
  String(colour?.name || colour?.hexcode || colour?.id || "").trim();

const PlaceSampleOrderForm = ({
  colours = [],
  beaders = [],
}: {
  colours: any[];
  beaders: any[];
}) => {
  const [open, setOpen] = useState(true);
  const [nextStyleNo, setNextStyleNo] = useState(FALLBACK_SAMPLE_STYLE_NO);
  const router = useRouter();
  const form = useForm<SampleOrderForm>({
    resolver: zodResolver(sampleOrderSchema),
    defaultValues: {
      colorType: "Custom",
      customColor: "",
      sizeCountry: "EU",
      size: "",
      customSize: [],
      mesh: "",
      beading: "",
      beader: "",
      addLining: false,
      lining: "No Lining",
      liningColor: "",
      quantity: "1",
      comments: "",
      primaryImage: undefined,
      secondaryImages: undefined,
    },
  });
  const watchCountry = form.watch("sizeCountry");
  const watchAddLining = form.watch("addLining");
  const watchColorType = form.watch("colorType");
  const watchLining = form.watch("lining");
  const watchSize = form.watch("size");
  const watchPrimaryImage = form.watch("primaryImage");
  const watchSecondaryImages = form.watch("secondaryImages");
  const [primaryImagePreviews, setPrimaryImagePreviews] = useState<
    { name: string; url: string }[]
  >([]);
  const [secondaryImagePreviews, setSecondaryImagePreviews] = useState<
    { name: string; url: string }[]
  >([]);
  const isCustomColorType = watchColorType === "Custom";
  const currentSizes = useMemo(
    () => sizeOptions[watchCountry] ?? [],
    [watchCountry],
  );
  const colourOptions = useMemo(
    () =>
      colours
        .map((colour: any) => ({
          value: getColourValue(colour),
          label: getColourLabel(colour),
          hexcode: colour?.hexcode,
        }))
        .filter((colour: any) => colour.value),
    [colours],
  );
  const colourValues = useMemo(
    () => colourOptions.map((colour: any) => colour.value),
    [colourOptions],
  );
  const beaderOptions = useMemo(
    () =>
      beaders
        .map((beader: any) =>
          String(
            typeof beader === "string" ? beader : (beader?.name ?? ""),
          ).trim(),
        )
        .filter(Boolean),
    [beaders],
  );
  const { executeAsync: getNextStyle, loading: nextStyleLoading } = useHttp(
    "/cart/sample-order/next-style",
    "GET",
  );
  const { executeAsync: placeSampleOrder, loading } = useHttp(
    "/cart/sample-order",
    "POST",
  );
  const getNextStyleRef = useRef(getNextStyle);

  useEffect(() => {
    getNextStyleRef.current = getNextStyle;
  }, [getNextStyle]);

  const refreshNextStyleNo = useCallback(async () => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(
      () => controller.abort(),
      NEXT_STYLE_TIMEOUT_MS,
    );

    try {
      const response: any = await getNextStyleRef.current(undefined, {
        signal: controller.signal,
      });
      if (response?.styleNo) {
        setNextStyleNo(response.styleNo);
      } else {
        setNextStyleNo(FALLBACK_SAMPLE_STYLE_NO);
      }
    } catch {
      setNextStyleNo(FALLBACK_SAMPLE_STYLE_NO);
    } finally {
      window.clearTimeout(timeoutId);
    }
  }, []);

  useEffect(() => {
    refreshNextStyleNo();
  }, [refreshNextStyleNo]);

  useEffect(() => {
    const previews = buildFilePreviews(fileListToArray(watchPrimaryImage));
    setPrimaryImagePreviews(previews);

    return () =>
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
  }, [watchPrimaryImage]);

  useEffect(() => {
    const previews = buildFilePreviews(fileListToArray(watchSecondaryImages));
    setSecondaryImagePreviews(previews);

    return () =>
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
  }, [watchSecondaryImages]);

  useEffect(() => {
    if (watchColorType === "SAS") {
      form.setValue("customColor", "", { shouldDirty: true });
      form.setValue("mesh", "SAS", { shouldDirty: true, shouldValidate: true });
      form.setValue("beading", "SAS", {
        shouldDirty: true,
        shouldValidate: true,
      });
      return;
    }

    if (watchColorType === "Custom") {
      if (form.getValues("mesh") === "SAS") form.setValue("mesh", "");
      if (form.getValues("beading") === "SAS") form.setValue("beading", "");
      if (form.getValues("lining") === "SAS") {
        form.setValue("lining", "No Lining");
      }
      if (form.getValues("liningColor") === "SAS") {
        form.setValue("liningColor", "");
      }
    }
  }, [form, watchColorType]);

  const onSubmit = async (values: SampleOrderForm) => {
    const retailerId = getCookie("retailerId");

    if (!retailerId) {
      toast.error("Retailer ID missing. Please login again.");
      return;
    }

    const primaryImage = fileListToArray(values.primaryImage)[0];
    const secondaryImages = fileListToArray(values.secondaryImages);
    const isCustomOrder = values.colorType === "Custom";
    const addLining = Boolean(values.addLining);
    const formData = new FormData();
    formData.append("retailerId", retailerId);
    formData.append("colorType", values.colorType);
    formData.append(
      "customColor",
      isCustomOrder ? (values.customColor ?? "") : "",
    );
    formData.append("sizeCountry", values.sizeCountry);
    formData.append("size", values.size);
    formData.append(
      "customSize",
      JSON.stringify(
        (values.customSize ?? [])
          .map((size: any) =>
            typeof size === "string" ? size : size?.value || size?.label || "",
          )
          .map((size) => String(size).trim())
          .filter(Boolean),
      ),
    );
    formData.append("mesh", isCustomOrder ? (values.mesh ?? "") : "SAS");
    formData.append("beading", isCustomOrder ? (values.beading ?? "") : "SAS");
    formData.append("beader", values.beader ?? "");
    formData.append("addLining", addLining ? "1" : "0");
    formData.append(
      "lining",
      addLining ? (values.lining ?? "No Lining") : "SAS",
    );
    formData.append(
      "liningColor",
      addLining ? (values.liningColor ?? "") : "SAS",
    );
    formData.append("quantity", values.quantity);
    formData.append("comments", values.comments ?? "");
    formData.append("primaryImage", primaryImage);
    secondaryImages.forEach((image) =>
      formData.append("secondaryImages", image),
    );

    try {
      const response: any = await placeSampleOrder(formData);
      toast.success(response?.message ?? "Sample order request submitted");
      if (response?.nextStyleNo) {
        setNextStyleNo(response.nextStyleNo);
      } else {
        await refreshNextStyleNo();
      }
      form.reset({
        colorType: "Custom",
        customColor: "",
        sizeCountry: "EU",
        size: "",
        customSize: [],
        mesh: "",
        beading: "",
        beader: "",
        addLining: false,
        lining: "No Lining",
        liningColor: "",
        quantity: "1",
        comments: "",
        primaryImage: undefined,
        secondaryImages: undefined,
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
          Place a custom sample order request. It will be sent to admin for
          review under Retailer Collection / Custom Category.
        </p>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button className="mt-4">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Place Sample Order
            </Button>
          </SheetTrigger>
          <SheetContent className="!min-w-[95%] !max-w-[95%] overflow-y-auto md:!min-w-[860px] md:!max-w-[860px]">
            <SheetHeader>
              <SheetTitle>Place Sample Order</SheetTitle>
              <SheetDescription>
                Fill in the sample order details for admin review.
              </SheetDescription>
            </SheetHeader>

            <Form {...form}>
              <form
                className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3"
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
                  name="sizeCountry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          form.setValue("size", "");
                          form.setValue("customSize", []);
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
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          if (value !== "Custom") {
                            form.setValue("customSize", []);
                          }
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select size" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Custom">Custom</SelectItem>
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

                {watchSize === "Custom" && (
                  <FormField
                    control={form.control}
                    name="customSize"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Custom Sizes</FormLabel>
                        <FormControl>
                          <MultipleSelector
                            value={(field.value ?? []).map((value: any) =>
                              typeof value === "string"
                                ? { value, label: value }
                                : value,
                            )}
                            onChange={(options) =>
                              field.onChange(
                                options.map((option) => option.value),
                              )
                            }
                            creatable
                            placeholder="Type a size and press Enter"
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

                <FormField
                  control={form.control}
                  name="colorType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color Type</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select color type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {colorTypeOptions.map((colorType) => (
                            <SelectItem key={colorType} value={colorType}>
                              {colorType}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {isCustomColorType && (
                  <>
                    <FormField
                      control={form.control}
                      name="customColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Custom Color</FormLabel>
                          <FormControl>
                            <Input placeholder="Color notes" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {(["mesh", "beading"] as const).map((name) => (
                      <FormField
                        key={name}
                        control={form.control}
                        name={name}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {name === "mesh" ? "Mesh Color" : "Beading Color"}
                            </FormLabel>
                            <Select
                              value={
                                colourValues.includes(String(field.value))
                                  ? String(field.value)
                                  : ""
                              }
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select color" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {colourOptions.map((colour: any) => (
                                  <SelectItem
                                    key={colour.value}
                                    value={colour.value}
                                  >
                                    <div className="flex items-center gap-2">
                                      {colour.hexcode && (
                                        <span
                                          className="h-4 w-4 rounded-full border"
                                          style={{
                                            backgroundColor: colour.hexcode,
                                          }}
                                        />
                                      )}
                                      {colour.label}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormControl>
                              <Input
                                className="mt-2"
                                placeholder="Or type custom color text"
                                value={
                                  colourValues.includes(String(field.value))
                                    ? ""
                                    : String(field.value ?? "")
                                }
                                onChange={(event) =>
                                  field.onChange(event.target.value)
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </>
                )}

                <FormField
                  control={form.control}
                  name="beader"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Beader</FormLabel>
                      <FormControl>
                        <Input list="sample-order-beaders" {...field} />
                      </FormControl>
                      <datalist id="sample-order-beaders">
                        {beaderOptions.map((beader) => (
                          <option key={beader} value={beader} />
                        ))}
                      </datalist>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="addLining"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 rounded-md border px-3 py-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value ?? false}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            if (!checked) {
                              form.setValue("lining", "No Lining");
                              form.setValue("liningColor", "");
                            }
                          }}
                        />
                      </FormControl>
                      <FormLabel className="m-0 cursor-pointer">
                        Add Lining
                      </FormLabel>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {watchAddLining && (
                  <FormField
                    control={form.control}
                    name="lining"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lining</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            if (value === "No Lining") {
                              form.setValue("liningColor", "");
                            }
                          }}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select lining" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {liningOptions.map((lining) => (
                              <SelectItem key={lining} value={lining}>
                                {lining}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {watchAddLining && watchLining !== "No Lining" && (
                  <FormField
                    control={form.control}
                    name="liningColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lining Color</FormLabel>
                        <Select
                          value={
                            colourValues.includes(String(field.value))
                              ? String(field.value)
                              : ""
                          }
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select color" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {colourOptions.map((colour: any) => (
                              <SelectItem
                                key={colour.value}
                                value={colour.value}
                              >
                                <div className="flex items-center gap-2">
                                  {colour.hexcode && (
                                    <span
                                      className="h-4 w-4 rounded-full border"
                                      style={{
                                        backgroundColor: colour.hexcode,
                                      }}
                                    />
                                  )}
                                  {colour.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormControl>
                          <Input
                            className="mt-2"
                            placeholder="Or type custom lining color text"
                            value={
                              colourValues.includes(String(field.value))
                                ? ""
                                : String(field.value ?? "")
                            }
                            onChange={(event) =>
                              field.onChange(event.target.value)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

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

                <FormField
                  control={form.control}
                  name="comments"
                  render={({ field }) => (
                    <FormItem className="md:col-span-3">
                      <FormLabel>Comments</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Order comments" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="primaryImage"
                  render={({ field: { onChange, value, ...field } }) => (
                    <FormItem className="md:col-span-3">
                      <FormLabel>Primary Image</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="file"
                          accept="image/*"
                          onChange={(event) => onChange(event.target.files)}
                        />
                      </FormControl>
                      {primaryImagePreviews.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-3">
                          {primaryImagePreviews.map((preview) => (
                            <div
                              key={preview.url}
                              className="w-36 rounded-md border bg-muted/30 p-2"
                            >
                              <div
                                className="h-28 rounded border bg-white bg-contain bg-center bg-no-repeat"
                                style={{
                                  backgroundImage: `url(${preview.url})`,
                                }}
                              />
                              <p className="mt-2 truncate text-xs text-muted-foreground">
                                {preview.name}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="secondaryImages"
                  render={({ field: { onChange, value, ...field } }) => (
                    <FormItem className="md:col-span-3">
                      <FormLabel>Secondary Images</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(event) => {
                            const existingFiles = fileListToArray(
                              form.getValues("secondaryImages"),
                            );
                            const selectedFiles = fileListToArray(
                              event.target.files,
                            );

                            onChange([...existingFiles, ...selectedFiles]);
                            event.target.value = "";
                          }}
                        />
                      </FormControl>
                      {secondaryImagePreviews.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-3">
                          {secondaryImagePreviews.map((preview, index) => (
                            <div
                              key={preview.url}
                              className="relative w-36 rounded-md border bg-muted/30 p-2"
                            >
                              <Button
                                type="button"
                                size="icon"
                                variant="destructive"
                                className="absolute right-1 top-1 h-6 w-6"
                                onClick={() => {
                                  const updatedFiles = fileListToArray(
                                    form.getValues("secondaryImages"),
                                  ).filter(
                                    (_, fileIndex) => fileIndex !== index,
                                  );

                                  form.setValue(
                                    "secondaryImages",
                                    updatedFiles,
                                    {
                                      shouldDirty: true,
                                      shouldTouch: true,
                                    },
                                  );
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                              <div
                                className="h-28 rounded border bg-white bg-contain bg-center bg-no-repeat"
                                style={{
                                  backgroundImage: `url(${preview.url})`,
                                }}
                              />
                              <p className="mt-2 truncate text-xs text-muted-foreground">
                                {preview.name}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full md:col-span-3"
                  disabled={loading}
                >
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
