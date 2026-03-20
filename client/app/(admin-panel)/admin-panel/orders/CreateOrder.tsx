"use client";

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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar as CalendarIcon, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import dayjs from "dayjs";
import { cn } from "@/lib/utils";
import { PDFDownloadLink, PDFViewer } from "@react-pdf/renderer";

import useHttp from "@/lib/hooks/usePost";
import MultipleSelector, { Option } from "@/components/custom/multi-selector";
import { CreateOrderForm, createOrderFormSchema, ColorType, OrderType, SizeCountry } from "@/lib/formSchemas";
import {
  getLatestRetailerOrder,
  getProductColours,
  getProductDetailsByProductCode,
} from "@/lib/data";
import FreshOrderPdf from "../request/FreshOrderPdf";
import { downloadOrderPPT } from "@/lib/utils/exportPPT";
import StyleItem from "@/components/CreateOrder/StyleItem";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CreateOrderProps {
  customers: any[];
  ordersTotalCount: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build the base FormData fields shared by both submit and preview calls */
function buildSharedFormData(data: CreateOrderForm): FormData {
  const fd = new FormData();
  fd.append("purchaseOrderNo", data.purchaseOrderNo);
  fd.append("manufacturingEmailAddress", data.manufacturingEmailAddress);
  fd.append("orderType", data.orderType);
  fd.append("address", data.address ?? "");
  fd.append("customerId", data.customerId?.[0]?.value ?? "");
  return fd;
}

// ─── Component ────────────────────────────────────────────────────────────────

const CreateOrder = ({ customers, ordersTotalCount }: CreateOrderProps) => {
  const router = useRouter();

  // ── Derived arrays ──────────────────────────────────────────────────────────
  const colorTypeArray = Object.entries(ColorType).map(([key, value]) => ({
    value: key,
    label: value,
  })) as { value: keyof typeof ColorType; label: string }[];

  const sizeCountryArray = Object.entries(SizeCountry).map(([key, value]) => ({
    value: key as keyof typeof SizeCountry,
    label: value,
  }));

  const [orderTypeArrayState, setOrderTypeArrayState] = useState([
    ...Object.entries(OrderType).map(([key, value]) => ({ value: key, label: value })),
    { value: "CUSTOM", label: "Custom" },
  ]);

  // ── State ───────────────────────────────────────────────────────────────────
  const [open, setOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [colors, setColors] = useState<any[]>([]);
  const [customOrderType, setCustomOrderType] = useState("");
  const [eachStyleProductDetails, setEachStyleProductDetails] = useState(new Map<string, any>());

  // ── HTTP hooks ──────────────────────────────────────────────────────────────
  const { loading, error, executeAsync } = useHttp("/orders");
  const { loading: previewLoading, executeAsync: executePreviewAsync } = useHttp("/orders/preview");
  const { executeAsync: mailex } = useHttp(
    "/api/manufacturer",
    "POST",
    false,
    true,
  );
  // ── Colour helpers ──────────────────────────────────────────────────────────
  const getColourBasedOnId = useCallback(
    (id: number) => colors.find((c: any) => c.id === id)?.hexcode as string | undefined,
    [colors],
  );
  const getColourBasedOnhex = useCallback(
    (hex: string) => colors.find((c: any) => c.hexcode === hex)?.name as string | undefined,
    [colors],
  );

  // ── Form ────────────────────────────────────────────────────────────────────
  const form = useForm<CreateOrderForm>({
    resolver: zodResolver(createOrderFormSchema),
    defaultValues: {
      purchaseOrderNo: `PO#${ordersTotalCount + 1}`,
      manufacturingEmailAddress: "rubyinc@hotmail.com",
      orderType: orderTypeArrayState[0].value,
      orderReceivedDate: undefined,
      orderCancellationDate: undefined,
      address: "",
      customerId: [],
      styles: [
        {
          styleNo: [],
          colorType: colorTypeArray[0].value,
          customColor: [],
          sizeCountry: sizeCountryArray[0].value,
          size: "",
          customSize: [],
          quantity: "",
          customSizesQuantity: [],
          comments: [],
          beading: "SAS",
          lining: "SAS",
          liningColor: "SAS",
          mesh: "SAS",
          addLining: false,
        },
      ],
    },
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "styles" });
  const fullComponentWatch = form.watch("styles");

  // ── Derived customer options ────────────────────────────────────────────────
  const formattedCustomers: Option[] = customers.map((c) => ({
    value: c.id.toString(),
    label: c.name,
  }));

  // ── PO number generation ────────────────────────────────────────────────────
  const watchCustomerName = useWatch({ control: form.control, name: "customerId" });

  const generatePO = useCallback(async () => {
    const selected = form.getValues("customerId");
    if (!selected || selected.length < 1) return;

    const customerName = selected[0].label ?? "";
    const prefix = customerName
      .split(" ")[0]
      .replace(/[^A-Za-z]/g, "")
      .toUpperCase();

    try {
      const latestPO = await getLatestRetailerOrder();
      let newNumber = "00001";
      if (latestPO?.success && latestPO?.purchaeOrderNo) {
        const numericPart = latestPO.purchaeOrderNo.replace(/[^\d]/g, "");
        newNumber = String(Number(numericPart) + 1).padStart(5, "0");
      }
      form.setValue("purchaseOrderNo", `PO#${prefix}${newNumber}`);
    } catch {
      // silently keep existing PO number if generation fails
    }
  }, [form]);

  useEffect(() => { generatePO(); }, [watchCustomerName, generatePO]);

  // ── Load product colours on mount ───────────────────────────────────────────
  useEffect(() => {
    getProductColours({}).then((res) => setColors(res.productColours ?? []));
  }, []);

  // ── Auto-preview on watched fields change ───────────────────────────────────
  const watchedStyles = useWatch({ control: form.control, name: "styles" });
  const watchedCustomer = useWatch({ control: form.control, name: "customerId" });
  const watchedOrderType = useWatch({ control: form.control, name: "orderType" });
  const watchedAddress = useWatch({ control: form.control, name: "address" });
  const watchedDates = useWatch({
    control: form.control,
    name: ["orderReceivedDate", "orderCancellationDate"],
  });

  useEffect(() => {
    if (!watchedDates?.[0] || !watchedDates?.[1]) return;
    if (!form.formState.isValid) return;

    const timeout = setTimeout(() => {
      onPreviewSubmit(form.getValues());
    }, 900);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedStyles, watchedCustomer, watchedOrderType, watchedAddress, watchedDates, form.formState.isValid]);

  // ── Product details loader ──────────────────────────────────────────────────
  const ensureProductDetailsLoaded = useCallback(
    async (styles: CreateOrderForm["styles"]) => {
      const newMap = new Map(eachStyleProductDetails);
      let hasChanges = false;

      for (const style of styles) {
        const styleSelect = style.styleNo?.[0];
        if (styleSelect?.value && !newMap.has(styleSelect.value)) {
          try {
            const details = await getProductDetailsByProductCode(styleSelect.value);
            newMap.set(styleSelect.value, {
              productCode: styleSelect.value,
              mesh_color: details.mesh_color,
              beading_color: details.beading_color,
              lining: details.lining,
              lining_color: details.lining_color,
            });
            hasChanges = true;
          } catch {
            console.error(`Failed to fetch product details for ${styleSelect.value}`);
          }
        }
      }

      if (hasChanges) setEachStyleProductDetails(newMap);
      return newMap;
    },
    [eachStyleProductDetails],
  );

  // ── Append styles FormData rows ─────────────────────────────────────────────
  const appendStylesFormData = (
    fd: FormData,
    styles: CreateOrderForm["styles"],
    detailsMap: Map<string, any>,
  ) => {
    styles.forEach((style, index) => {
      const productDetails = detailsMap.get(style.styleNo?.[0]?.value ?? "");
      const sas = (val: string, fallback: string | undefined) =>
        val === "SAS" ? (fallback ?? "") : val;

      fd.append(`styles[${index}].styleNo`, style.styleNo?.[0]?.value ?? "");
      fd.append(`styles[${index}].colorType`, style.colorType);
      fd.append(`styles[${index}].beading`, sas(style.beading, productDetails?.beading_color));
      fd.append(`styles[${index}].mesh`, sas(style.mesh, productDetails?.mesh_color));
      fd.append(`styles[${index}].lining`, sas(style.lining, productDetails?.lining));
      fd.append(`styles[${index}].liningColor`, sas(style.liningColor, productDetails?.lining_color));
      fd.append(`styles[${index}].customColor`, JSON.stringify(style.customColor?.map((c) => c.value) ?? []));
      fd.append(`styles[${index}].sizeCountry`, style.sizeCountry);
      fd.append(`styles[${index}].size`, style.size);
      fd.append(`styles[${index}].customSize`, JSON.stringify(style.customSize?.map((s) => s.value) ?? []));
      fd.append(`styles[${index}].quantity`, style.quantity ?? "");
      fd.append(`styles[${index}].comments`, JSON.stringify(style.comments));
      fd.append(`styles[${index}].customSizesQuantity`, JSON.stringify(style.customSizesQuantity));

      if (style.modifiedPhotoImage) {
        Array.from(style.modifiedPhotoImage).forEach((file: any) => {
          fd.append(`styles[${index}].modifiedPhotoImage`, file);
        });
      }
    });
  };

  // ── Build preview data object ───────────────────────────────────────────────
  const buildPreviewData = (data: CreateOrderForm, responseOrders: any[]) => {
    const loop = responseOrders[0].styles.reduce((acc: any[], currentItem: any) => {
      const current = {
        quantity:
          currentItem.customSizesQuantity.length < 1
            ? currentItem.quantity
            : currentItem.customSizesQuantity.reduce(
                (sum: number, item: any) => sum + Number(item.quantity),
                0,
              ),
        size:
          currentItem.customSizesQuantity.length < 1
            ? `${currentItem.size}/${currentItem.quantity}`
            : currentItem.customSizesQuantity.map((i: any) => `${i.size}/${i.quantity}`).join(", "),
        styleNo: currentItem.styleNo,
        size_country: currentItem.sizeCountry,
        comments: currentItem.comments.join(", "),
        color: currentItem.colorType,
        image: currentItem.convertedFirstProductImage,
        meshColor: currentItem.mesh === "SAS" ? "SAS " : getColourBasedOnhex(currentItem.mesh),
        beadingColor: currentItem.beading === "SAS" ? "SAS " : getColourBasedOnhex(currentItem.beading),
        lining: currentItem.lining,
        liningColor: currentItem.liningColor === "SAS" ? "SAS " : getColourBasedOnhex(currentItem.liningColor),
        refImg: currentItem.photoUrls,
      };

      const existingIdx = acc.findIndex(
        (item) =>
          item.styleNo === current.styleNo &&
          item.meshColor === current.meshColor &&
          item.beadingColor === current.beadingColor &&
          item.lining === current.lining &&
          item.liningColor === current.liningColor &&
          item.color === current.color &&
          item.comments === current.comments &&
          JSON.stringify(item.refImg) === JSON.stringify(current.refImg),
      );

      if (existingIdx >= 0) {
        acc[existingIdx].quantity += current.quantity;
        acc[existingIdx].size = `${acc[existingIdx].size},${current.size}`;
      } else {
        acc.push(current);
      }

      return acc;
    }, []);

    return {
      customerId: data.customerId,
      manufacturingEmailAddress: data.manufacturingEmailAddress,
      orderCancellationDate: data.orderCancellationDate,
      orderReceivedDate: data.orderReceivedDate,
      orderType: data.orderType,
      purchaseOrderNo: data.purchaseOrderNo,
      details: loop,
    };
  };

  // ── onSubmit ────────────────────────────────────────────────────────────────
  const onSubmit = async (data: CreateOrderForm) => {
    const detailsMap = await ensureProductDetailsLoaded(data.styles);
    const fd = buildSharedFormData(data);
    fd.append("orderReceivedDate", data.orderReceivedDate?.toString() ?? "");
    fd.append("orderCancellationDate", data.orderCancellationDate?.toString() ?? "");
    appendStylesFormData(fd, data.styles, detailsMap);

    try {
      const response = await executeAsync(fd, {}, (err) => {
        toast.error("Failed to add order", { description: err?.message ?? "Something went wrong" });
        console.log(err);
      });

      if (!response.success) return toast.error("Failed to add order");

      form.reset();
      setOpen(false);
      // await mailex({ orderData: previewData });
      toast.success(response.message ?? "Order added successfully");
      setPreviewData(null);
      router.refresh();
      form.setValue("purchaseOrderNo", "");
    } catch {
      toast.error("Failed to add order", { description: error?.message ?? "Something went wrong" });
    }
  };

  // ── onPreviewSubmit ─────────────────────────────────────────────────────────
  const onPreviewSubmit = async (data: CreateOrderForm) => {
    const detailsMap = await ensureProductDetailsLoaded(data.styles);
    const fd = buildSharedFormData(data);
    fd.append("orderReceivedDate", data.orderReceivedDate?.toISOString() ?? "");
    fd.append("orderCancellationDate", data.orderCancellationDate?.toISOString() ?? "");
    appendStylesFormData(fd, data.styles, detailsMap);

    try {
      const response = await executePreviewAsync(fd, {}, (err) => {
        toast.error("Failed to preview order", { description: err?.message ?? "Something went wrong" });
      });

      if (response.success) {
        setPreviewData(buildPreviewData(data, response.orders));
        setOpen(true);
      } else {
        toast.error("Failed to preview order");
      }
    } catch {
      toast.error("Failed to preview order", { description: error?.message ?? "Something went wrong" });
    }
  };

  // ── onErrors ────────────────────────────────────────────────────────────────
  const onErrors = () => {
    toast.error("Failed to add order", {
      description: "Make sure all fields are filled correctly",
    });
  };

  // ── Add style ────────────────────────────────────────────────────────────────
  const addStyle = () => {
    append({
      colorType: colorTypeArray[0].value,
      customColor: [],
      sizeCountry: sizeCountryArray[0].value,
      size: "",
      customSize: [],
      quantity: "",
      customSizesQuantity: [],
      styleNo: [],
      comments: [],
      beading: "SAS",
      lining: "SAS",
      liningColor: "SAS",
      mesh: "SAS",
      addLining: false,
    });
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>
          Add New Order <Plus className="ml-1 h-4 w-4" />
        </Button>
      </SheetTrigger>

      <SheetContent className="min-w-[100%] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add New Order</SheetTitle>
          <SheetDescription>Fill in the form below to add an order</SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            className="mt-8 grid grid-cols-1 gap-2 md:grid-cols-3"
            onSubmit={form.handleSubmit(onSubmit, onErrors)}
          >
            {/* ── Customer ── */}
            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer</FormLabel>
                  {/* @ts-ignore */}
                  <MultipleSelector
                    {...field}
                    defaultOptions={formattedCustomers}
                    placeholder="Select Customer"
                    onSearch={async (value) =>
                      formattedCustomers.filter((c) =>
                        c.label.toLowerCase().includes(value.toLowerCase()),
                      )
                    }
                    loadingIndicator={<p className="text-muted-foreground">Loading...</p>}
                    emptyIndicator={<p className="text-muted-foreground">No results found</p>}
                    maxSelected={1}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ── Purchase Order No ── */}
            <FormField
              control={form.control}
              name="purchaseOrderNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purchase Order No</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ── Manufacturing Email ── */}
            <FormField
              control={form.control}
              name="manufacturingEmailAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Manufacturing Email</FormLabel>
                  <FormControl>
                    <Input placeholder="johndoe@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ── Order Type ── */}
            <FormField
              control={form.control}
              name="orderType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order Type</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      if (value === "CUSTOM") setCustomOrderType("");
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Order Type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {orderTypeArrayState.map((type) => (
                        <SelectItem value={type.value} key={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Custom order type input */}
                  {field.value === "CUSTOM" && (
                    <div className="mt-2 space-y-2">
                      <Input
                        placeholder="Enter custom order type"
                        value={customOrderType}
                        onChange={(e) => setCustomOrderType(e.target.value)}
                      />
                      <Button
                        type="button"
                        className="w-fit"
                        onClick={async () => {
                          const newValue = customOrderType.trim();
                          if (!newValue) return;
                          setOrderTypeArrayState((prev) => [
                            ...prev.filter((x) => x.value !== "CUSTOM"),
                            { value: newValue, label: newValue },
                            { value: "CUSTOM", label: "Custom" },
                          ]);
                          form.setValue("orderType", newValue, {
                            shouldValidate: true,
                            shouldDirty: true,
                            shouldTouch: true,
                          });
                          await form.trigger("orderType");
                        }}
                      >
                        Save
                      </Button>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ── Order Received Date ── */}
            <FormField
              control={form.control}
              name="orderReceivedDate"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-2.5">
                  <FormLabel>Order Received Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                        >
                          {field.value ? dayjs(field.value).format("DD MMMM YYYY") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ── Order Shipping Date ── */}
            <FormField
              control={form.control}
              name="orderCancellationDate"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-2.5">
                  <FormLabel>Order Shipping Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                        >
                          {field.value ? dayjs(field.value).format("DD MMMM YYYY") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ── Address ── */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem className="md:col-span-3">
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Amsterdam" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ── Styles list ── */}
            <div className="!mt-4 space-y-2 md:col-span-3">
              <div className="flex items-center justify-between">
                <Label>Styles</Label>
                <Button variant="secondary" onClick={addStyle} type="button">
                  Add Style <Plus className="ml-1 h-4 w-4" />
                </Button>
              </div>

              {fullComponentWatch.map((_, index) => (
                <StyleItem
                  key={fields[index]?.id ?? index}
                  form={form}
                  index={index}
                  fieldId={fields[index]?.id ?? String(index)}
                  colors={colors}
                  colorTypeArray={colorTypeArray}
                  sizeCountryArray={sizeCountryArray}
                  fullComponentWatch={fullComponentWatch}
                  canRemove={fields.length > 1}
                  onRemove={remove}
                  getColourBasedOnId={getColourBasedOnId}
                  getColourBasedOnhex={getColourBasedOnhex}
                />
              ))}
            </div>

            {/* ── Form action buttons ── */}
            <div className="mt-4 flex items-center gap-2 md:col-span-3">
              <Button
                type="button"
                className="flex-1"
                variant="outline"
                onClick={form.handleSubmit(onPreviewSubmit, onErrors)}
                disabled={previewLoading}
              >
                {previewLoading ? "Loading..." : "Preview Order"}
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? "Loading..." : "Create Order"}
              </Button>
            </div>
          </form>
        </Form>

        {/* ── PDF / PPT Preview ── */}
        {previewData && (
          <div className="mt-4 flex w-full gap-4">
            <div className="flex-1 rounded-lg border p-2">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="font-semibold">Preview</h2>
                <div className="flex items-center gap-3">
                  <PDFDownloadLink
                    document={<FreshOrderPdf orderData={previewData} />}
                    fileName={`${previewData.purchaseOrderNo}.pdf`}
                  >
                    {({ loading: pdfLoading }) =>
                      pdfLoading ? (
                        <Button disabled>Preparing PDF...</Button>
                      ) : (
                        <Button className="bg-green-600 text-white">Download PDF</Button>
                      )
                    }
                  </PDFDownloadLink>

                  <Button
                    className="bg-blue-600 text-white"
                    onClick={() => downloadOrderPPT(previewData)}
                  >
                    Download PPT
                  </Button>
                </div>
              </div>

              <PDFViewer className="h-[75vh] w-full" showToolbar={false}>
                <FreshOrderPdf orderData={previewData} />
              </PDFViewer>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CreateOrder;