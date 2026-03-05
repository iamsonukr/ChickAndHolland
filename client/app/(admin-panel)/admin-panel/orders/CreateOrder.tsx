"use client";
import { useWatch } from "react-hook-form";
import { downloadOrderPPT } from "@/lib/utils/exportPPT";

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
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  Delete,
  Plus,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { Control, useFieldArray, useForm } from "react-hook-form";
import useHttp from "@/lib/hooks/usePost";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreateOrderForm, createOrderFormSchema } from "@/lib/formSchemas";
import { ColorType, OrderType, SizeCountry, sizes } from "@/lib/formSchemas";
import dayjs from "dayjs";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import MultipleSelector, { Option } from "@/components/custom/multi-selector";
import {
  getLatestRegularOrder,
  getLatestRetailerOrder,
  getProductColours,
  getProductDetails,
  getProductDetailsByProductCode,
  searchStyleNumbers,
} from "@/lib/data";
import OrderCustomerPdf from "@/app/(admin-panel)/admin-panel/orders/OrderCustomerPdf";
import { PDFDownloadLink, PDFViewer } from "@react-pdf/renderer";
import { Checkbox } from "@/components/ui/checkbox";
import FreshOrderPdf from "../request/FreshOrderPdf";
const lining = [
  "No Lining",
  "Fully Stitched Lined",
  "Full Separate Lining",
  "Separate Short Lining",
  "Waist to Hips Stitched Lining",
];
const CreateOrder = ({
  customers,
  ordersTotalCount,
}: {
  customers: any[];
  ordersTotalCount: number;
}) => {
  const [open, setOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const sizeOptions: Record<string, number[]> = {
  EU: [32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60],
  US: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28],
  IT: [36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 62, 64],
  UK: [4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32],
};
const [customOrderType, setCustomOrderType] = useState("");


  const { loading, error, executeAsync } = useHttp("/orders");
  const { loading: previewLoading, executeAsync: executePreviewAsync } =
    useHttp("/orders/preview");

  const { executeAsync: mailex } = useHttp(
    "/api/manufacturer",
    "POST",
    false,
    true,
  );

  const router = useRouter();
  const [colors, setColors] = useState([] as any);

const [orderTypeArrayState, setOrderTypeArrayState] = useState([
  ...Object.entries(OrderType).map(([key, value]) => ({
    value: key,
    label: value,
  })),
  { value: "CUSTOM", label: "Custom" },
]);


  const colorTypeArray = Object.entries(ColorType).map(([key, value]) => {
    return {
      value: key,
      label: value,
    };
  }) as { value: keyof typeof ColorType; label: string }[];

  const sizeCountryArray = Object.entries(SizeCountry).map(([key, value]) => {
    return {
      value: key,
      label: value,
    };
  }) as { value: keyof typeof SizeCountry; label: string }[];

  const form = useForm<CreateOrderForm>({
    resolver: zodResolver(createOrderFormSchema),
    defaultValues: {
      // purchaseOrderNo: `CH#${String.fromCharCode(65 + (ordersTotalCount % 26))}${ordersTotalCount + 1}`,
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

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "styles",
  });

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

  const fullComponentWatch = form.watch("styles");

  const onErrors = (errors: any) => {
    toast.error("Failed to add order", {
      description: "Make sure all fields are filled correctly",
    });
  };

  const formattedCustomers = customers.map((customer) => {
    return {
      value: customer.id.toString(),
      label: customer.name,
    } as Option;
  });

  const watchCustomerName = form.watch("customerId");

  const getColourBasedOnId = (id: number) => {
    return colors.find((colour: any) => colour.id === id)?.hexcode;
  };

  const getColourBasedOnhex = (id: string) => {
    return colors.find((colour: any) => colour.hexcode === id)?.name;
  };

  const getcolors = async () => {
    const colours = await getProductColours({});

    setColors(colours.productColours);
  };

 const generatePO = async () => {
  const selected = form.getValues("customerId");
  if (!selected || selected.length < 1) return;

  const customerName = selected[0].label || "";
  const prefix = customerName
    .split(" ")[0]
    .replace(/[^A-Za-z]/g, "")
    .toUpperCase();

  const latestPO = await getLatestRetailerOrder(); // API returning retailer latest PO

  let newNumber = "00001";

  if (latestPO?.success && latestPO?.purchaeOrderNo) {
    const numericPart = latestPO.purchaeOrderNo.replace(/[^\d]/g, "");
    const nextNum = Number(numericPart) + 1;
    newNumber = String(nextNum).padStart(5, "0");
  }

  form.setValue("purchaseOrderNo", `PO#${prefix}${newNumber}`);
};


useEffect(() => {
  generatePO();
}, [watchCustomerName]);


  useEffect(() => {
    getcolors();
  }, []);
// These values only update when actually changed
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
}, [watchedStyles, watchedCustomer, watchedOrderType, watchedAddress, watchedDates, form.formState.isValid]);


  const [eachStyleProductDetails, setEachStyleProductDetails] = useState(
    new Map(),
  );

  const ensureProductDetailsLoaded = async (styles: any) => {
    const newMap = new Map(eachStyleProductDetails);
    let hasChanges = false;

    // Load all missing product details
    for (const style of styles) {
      const styleSelect = style.styleNo?.[0];
      if (
        // styleSelect?.productId &&
        styleSelect?.value &&
        !newMap.has(styleSelect.value)
      ) {
        try {
          const productDetails = await getProductDetailsByProductCode(
            styleSelect.value,
          );

          newMap.set(styleSelect.value, {
            // id: styleSelect.productId,
            productCode: styleSelect.value,
            mesh_color: productDetails.mesh_color,
            beading_color: productDetails.beading_color,
            lining: productDetails.lining,
            lining_color: productDetails.lining_color,
          });
          hasChanges = true;
        } catch (error) {
          console.error("Failed to fetch product details:", error);
        }
      }
    }

    if (hasChanges) {
      setEachStyleProductDetails(newMap);
    }

    return newMap; // Return the map with all details loaded
  };

  const onSubmit = async (data: CreateOrderForm) => {
    // First, ensure product details are loaded like in onPreviewSubmit
    const detailsMap = await ensureProductDetailsLoaded(data.styles);

    const formData = new FormData();

    formData.append("purchaseOrderNo", data.purchaseOrderNo);
    formData.append(
      "manufacturingEmailAddress",
      data.manufacturingEmailAddress,
    );
    formData.append("orderType", data.orderType);
   formData.append(
  "orderReceivedDate",
  data.orderReceivedDate ? data.orderReceivedDate.toString() : ""
);
formData.append(
  "orderCancellationDate",
  data.orderCancellationDate ? data.orderCancellationDate.toString() : ""
);

    formData.append("address", data.address ?? "");
    formData.append("customerId", data.customerId?.[0].value);

    data.styles.forEach((style, index) => {
      const productDetails = detailsMap.get(style.styleNo?.[0]?.value);

      formData.append(`styles[${index}].styleNo`, style.styleNo?.[0].value);
      formData.append(`styles[${index}].colorType`, style.colorType);

      // Use the updated approach for handling SAS values
      formData.append(
        `styles[${index}].beading`,
        style.beading === "SAS" ? productDetails?.beading_color : style.beading,
      );
      formData.append(
        `styles[${index}].mesh`,
        style.mesh === "SAS" ? productDetails?.mesh_color : style.mesh,
      );
      formData.append(
        `styles[${index}].lining`,
        style.lining === "SAS" ? productDetails?.lining : style.lining,
      );
      formData.append(
        `styles[${index}].liningColor`,
        style.liningColor === "SAS"
          ? productDetails?.lining_color
          : style.liningColor,
      );

      formData.append(
        `styles[${index}].customColor`,
        JSON.stringify(style?.customColor?.map((c) => c.value) ?? "[]"),
      );
      formData.append(`styles[${index}].sizeCountry`, style.sizeCountry);
      formData.append(`styles[${index}].size`, style.size);
      formData.append(
        `styles[${index}].customSize`,
        JSON.stringify(style?.customSize?.map((s) => s.value) ?? "[]"),
      );
      formData.append(`styles[${index}].quantity`, style.quantity ?? "");

      if (style.modifiedPhotoImage) {
        Array.from(style.modifiedPhotoImage)?.forEach((file: any) => {
          formData.append(`styles[${index}].modifiedPhotoImage`, file);
        });
      }
      formData.append(
        `styles[${index}].comments`,
        JSON.stringify(style.comments),
      );
      formData.append(
        `styles[${index}].customSizesQuantity`,
        JSON.stringify(style.customSizesQuantity),
      );
    });

    try {
      const response = await executeAsync(formData, {}, (error) => {
        return toast.error("Failed to add order", {
          description: error?.message ?? "Something went wrong",
        });
      });

      if (!response.success) {
        return toast.error("Failed to add order");
      }

      form.reset();
      setOpen(false);
      await mailex({ orderData: previewData });
      toast.success(response.message ?? "Order added successfully");
      setPreviewData(null);
      router.refresh();
      form.setValue("purchaseOrderNo", "");
    } catch (err) {
      toast.error("Failed to add order", {
        description: error?.message ?? "Something went wrong",
      });
    }
  };

  const onPreviewSubmit = async (data: CreateOrderForm) => {
    const detailsMap = await ensureProductDetailsLoaded(data.styles);

    const formData = new FormData();

    formData.append("purchaseOrderNo", data.purchaseOrderNo);
    formData.append(
      "manufacturingEmailAddress",
      data.manufacturingEmailAddress,
    );
    formData.append("orderType", data.orderType);
   formData.append(
  "orderReceivedDate",
  data.orderReceivedDate ? data.orderReceivedDate.toISOString() : ""
);
formData.append(
  "orderCancellationDate",
  data.orderCancellationDate ? data.orderCancellationDate.toISOString() : ""
);

    formData.append("address", data.address ?? "");
    formData.append("customerId", data.customerId?.[0].value);

    data.styles.forEach((style, index) => {
      const productDetails = detailsMap.get(style.styleNo?.[0]?.value);

      formData.append(`styles[${index}].styleNo`, style.styleNo?.[0].value);
      formData.append(
        `styles[${index}].colorType`,
        data.styles[index].colorType,
      );

      // formData.append(`styles[${index}].beading`, data.styles[index].beading);
      // formData.append(`styles[${index}].lining`, data.styles[index].lining);
      // formData.append(`styles[${index}].mesh`, data.styles[index].mesh);
      // formData.append(
      //   `styles[${index}].liningColor`,
      //   data.styles[index].liningColor,
      // );

      // if sas, then get colour from productDetails
      formData.append(
        `styles[${index}].beading`,
        style.beading === "SAS" ? productDetails?.beading_color : style.beading,
      );
      formData.append(
        `styles[${index}].mesh`,
        style.mesh === "SAS" ? productDetails?.mesh_color : style.mesh,
      );
      formData.append(
        `styles[${index}].lining`,
        style.lining === "SAS" ? productDetails?.lining : style.lining,
      );
      formData.append(
        `styles[${index}].liningColor`,
        style.liningColor === "SAS"
          ? productDetails?.lining_color
          : style.liningColor,
      );

      formData.append(
        `styles[${index}].customColor`,
        JSON.stringify(style?.customColor?.map((c) => c.value) ?? "[]"),
      );
      formData.append(`styles[${index}].sizeCountry`, style.sizeCountry);
      formData.append(`styles[${index}].size`, style.size);
      formData.append(
        `styles[${index}].customSize`,
        JSON.stringify(style?.customSize?.map((s) => s.value) ?? "[]"),
      );
      formData.append(`styles[${index}].quantity`, style.quantity ?? "");
      // formData.append(
      //   `styles[${index}].modifiedPhotoImage`,
      //   style.modifiedPhotoImage,
      // );

      if (style?.modifiedPhotoImage) {
        Array.from(style.modifiedPhotoImage)?.forEach((file: any) => {
          formData.append(`styles[${index}].modifiedPhotoImage`, file);
        });
      }
      formData.append(
        `styles[${index}].comments`,
        JSON.stringify(style.comments),
      );
      formData.append(
        `styles[${index}].customSizesQuantity`,
        JSON.stringify(style.customSizesQuantity),
      );
    });

    try {
      const response = await executePreviewAsync(formData, {}, (error) => {
        return toast.error("Failed to add order", {
          description: error?.message ?? "Something went wrong",
        });
      });

      if (response.success) {
        // console.log(response);

        const loop = response.orders[0].styles.reduce(
          (acc: any[], currentItem: any) => {
            // Create the basic return value structure for the current item
            // console.log(currentItem);
            const currentReturnValue = {
              quantity:
                currentItem.customSizesQuantity.length < 1
                  ? currentItem.quantity
                  : currentItem.customSizesQuantity.reduce(
                    (sum: any, item: any) => sum + Number(item.quantity),
                    0,
                  ),
              size:
                currentItem.customSizesQuantity.length < 1
                  ? `${currentItem.size}/${currentItem.quantity}`
                  : currentItem.customSizesQuantity
                    .map((item: any) => `${item.size}/${item.quantity}`)
                    .join(", "),
              styleNo: currentItem.styleNo,
              size_country: currentItem.sizeCountry,

              comments: currentItem.comments.join(", "),
              color: currentItem.colorType,
              image: currentItem.convertedFirstProductImage,
              meshColor:
                currentItem.mesh == "SAS"
                  ? "SAS "
                  : getColourBasedOnhex(currentItem.mesh),
              beadingColor:
                currentItem.beading == "SAS"
                  ? "SAS "
                  : getColourBasedOnhex(currentItem.beading),
              lining: currentItem.lining,
              liningColor:
                currentItem.liningColor == "SAS"
                  ? "SAS "
                  : getColourBasedOnhex(currentItem.liningColor),
              refImg: currentItem.photoUrls,
            };

            // Check if there's an existing item with the same styleNo and matching properties
            const existingItemIndex = acc.findIndex(
              (item) =>
                item.styleNo === currentReturnValue.styleNo &&
                item.meshColor === currentReturnValue.meshColor &&
                item.beadingColor === currentReturnValue.beadingColor &&
                item.lining === currentReturnValue.lining &&
                item.liningColor === currentReturnValue.liningColor &&
                item.color === currentReturnValue.color &&
                item.comments === currentReturnValue.comments &&
                JSON.stringify(item.refImg) ===
                JSON.stringify(currentReturnValue.refImg),
            );

            if (existingItemIndex >= 0) {
              // Merge with existing item
              acc[existingItemIndex].quantity += currentReturnValue.quantity;
              acc[existingItemIndex].size =
                `${acc[existingItemIndex].size},${currentReturnValue.size}`;
            } else {
              // Add new item
              acc.push(currentReturnValue);
            }

            return acc;
          },
          [],
        );

        const preData = {
          customerId: data.customerId,
          manufacturingEmailAddress: data.manufacturingEmailAddress,
          orderCancellationDate: data.orderCancellationDate,
          orderReceivedDate: data.orderReceivedDate,
          orderType: data.orderType,
          purchaseOrderNo: data.purchaseOrderNo,
          details: loop,
        };

        setPreviewData(preData);
         setOpen(true);
      } else {
        return toast.error("Failed to add order");
      }
    } catch (err) {
      toast.error("Failed to add order", {
        description: error?.message ?? "Something went wrong",
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>
          Add New Order <Plus />
        </Button>
      </SheetTrigger>
      <SheetContent className="min-w-[100%] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add New Order</SheetTitle>
          <SheetDescription>
            Fill in the form below to add order
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            className="mt-8 grid grid-cols-1 gap-2 md:grid-cols-3"
            onSubmit={form.handleSubmit(onSubmit, onErrors)}
          >
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
                    placeholder={"Select Customer"}
                    onSearch={async (value) => {
                      return formattedCustomers.filter((customer) => {
                        return customer.label.toLowerCase().includes(value);
                      });
                    }}
                    loadingIndicator={
                      <p className="text-muted-foreground">Loading...</p>
                    }
                    emptyIndicator={
                      <p className="text-muted-foreground">No results found</p>
                    }
                    maxSelected={1}
                  // onChange={(newValues) => {
                  //   // console.log(newValues);
                  //   if (newValues.length <= 0) return;
                  //   const firstName = newValues[0].label.split(" ")[0];
                  //   console.log(firstName);
                  //   const newPurchaseOrderNo = `PO#${firstName} ${ordersTotalCount + 1}`;
                  //   console.log(newPurchaseOrderNo)
                  //   // form.setValue("purchaseOrderNo", newPurchaseOrderNo);
                  // }}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

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

            {/* ORDER TYPE SELECT */}
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
          if (value === "CUSTOM") {
            setCustomOrderType(""); // reset text
          }
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
    if (customOrderType.trim() === "") return;

    const newValue = customOrderType.trim();

    // 1. Add new custom value in dropdown list
    setOrderTypeArrayState((prev) => [
      ...prev.filter((x) => x.value !== "CUSTOM"),
      { value: newValue, label: newValue },
      { value: "CUSTOM", label: "Custom" },
    ]);

    // 2. VERY IMPORTANT: Forcefully update RHF field
    form.setValue("orderType", newValue, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });

    // 3. Trigger validation (fixes "Order Type Required" not disappearing)
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
                          variant={"outline"}
                          className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground",
                          )}
                        >
                          {field.value ? (
                            dayjs(field.value).format("DD MMMM YYYY")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                          variant={"outline"}
                          className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground",
                          )}
                        >
                          {field.value ? (
                            dayjs(field.value).format("DD MMMM YYYY")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem className={"md:col-span-3"}>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Amsterdam" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="!mt-4 space-y-2 md:col-span-3">
              <div className="flex items-center justify-between">
                <Label>Styles</Label>

                <Button variant={"secondary"} onClick={addStyle} type="button">
                  Add Style <Plus />
                </Button>
              </div>
              {fullComponentWatch.map((field: any, index) => {

                  const stableKey = fields[index]?.id ?? index; // use useFieldArray id when available

                const watchColorType = form.watch(
                  `styles[${index}].colorType` as any,
                ) as any;

                const watchSize = form.watch(
                  `styles[${index}].size` as any,
                ) as any;

                const fileRef = form.register(
                  `styles[${index}].modifiedPhotoImage` as any,
                );

                const stylesSelect = form.watch(
                  `styles[${index}].styleNo[0]` as any,
                ) as any;

                return (
                  <Collapsible key={stableKey} className="space-y-2">
                    <div className="flex items-center gap-4">
                      <CollapsibleTrigger asChild>
                        <div className="flex w-full flex-1 cursor-pointer justify-between border-2 border-primary p-2">
                          <p>{index + 1}. Style</p>
                          <ChevronDown />
                        </div>
                      </CollapsibleTrigger>
                      <Button
                        variant={"destructive"}
                        onClick={() => remove(index)}
                        type="button"
                        size="icon"
                        disabled={fields.length === 1}
                      >
                        <Delete />
                      </Button>
                    </div>
                    <CollapsibleContent asChild>
                      <div className="grid grid-cols-1 gap-2 p-2 md:grid-cols-3">
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
                                  placeholder={
                                    "Please enter at least 1 character to search for a style no or type a new one"
                                  }
                                  loadingIndicator={
                                    <p className="text-muted-foreground">
                                      Loading...
                                    </p>
                                  }
                                  emptyIndicator={
                                    <p className="text-muted-foreground">
                                      No results found
                                    </p>
                                  }
                                  maxSelected={1}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`styles[${index}].colorType` as any}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Color Type</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select the color type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {colorTypeArray.map((type) => {
                                    return (
                                      <SelectItem
                                        value={type.value}
                                        key={type.value}
                                      >
                                        {type.label}
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {watchColorType === ColorType.Custom && (
                          <>
                            <FormField
                              control={form.control}
                              name={`styles.${index}.mesh`}
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
                                      <SelectItem value={stylesSelect?.mesh}>
                                        <div className="flex gap-1">
                                          SAS (
                                          <div className="flex items-center">
                                            <p
                                              className="mx-1 h-4 w-4 rounded-full"
                                              style={{
                                                backgroundColor:
                                                  stylesSelect?.mesh,

                                                border: "1px solid #000",
                                              }}
                                            ></p>{" "}
                                            {getColourBasedOnhex(
                                              stylesSelect?.mesh,
                                            )}
                                          </div>
                                          )
                                        </div>
                                      </SelectItem>
                                      {colors.map((colour: any) => (
                                        <SelectItem
                                          key={colour.id}
                                          value={getColourBasedOnId(colour.id)}
                                        >
                                          <div className="flex items-center">
                                            <div
                                              className="h-4 w-4 rounded-full"
                                              style={{
                                                backgroundColor:
                                                  getColourBasedOnId(colour.id),
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

                            <FormField
                              control={form.control}
                              name={`styles.${index}.beading`}
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
                                      <SelectItem value={stylesSelect?.beading}>
                                        <div className="flex gap-1">
                                          SAS (
                                          <div className="flex items-center">
                                            <p
                                              className="mx-1 h-4 w-4 rounded-full"
                                              style={{
                                                backgroundColor:
                                                  stylesSelect?.beading,

                                                border: "1px solid #000",
                                              }}
                                            ></p>{" "}
                                            {getColourBasedOnhex(
                                              stylesSelect?.beading,
                                            )}
                                          </div>
                                          )
                                        </div>
                                      </SelectItem>
                                      {colors.map((colour: any) => (
                                        <SelectItem
                                          key={colour.id}
                                          value={getColourBasedOnId(colour.id)}
                                        >
                                          <div className="flex items-center">
                                            <div
                                              className="h-4 w-4 rounded-full"
                                              style={{
                                                backgroundColor:
                                                  getColourBasedOnId(colour.id),
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
                            <div className={`flex w-full items-end`}>
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
                                      Would You Like To Add Lining To This
                                      Product?
                                    </p>
                                  </FormItem>
                                )}
                              />
                            </div>

                            {fullComponentWatch[index].addLining && (
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
                                            form.setValue(
                                              `styles.${index}.liningColor`,
                                              "",
                                            );
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
                                          <SelectItem
                                            value={stylesSelect?.lining}
                                          >
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

                                {fullComponentWatch[index]?.lining &&
                                  fullComponentWatch[index]?.lining !==
                                  "No Lining" && (
                                    <FormField
                                      control={form.control}
                                      name={`styles.${index}.liningColor`}
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
                                              <SelectItem
                                                value={
                                                  stylesSelect?.liningColor
                                                }
                                              >
                                                <div className="flex gap-1">
                                                  SAS (
                                                  <div className="flex items-center">
                                                    <p
                                                      className="mx-1 h-4 w-4 rounded-full"
                                                      style={{
                                                        backgroundColor:
                                                          stylesSelect?.liningColor,

                                                        border:
                                                          "1px solid #000",
                                                      }}
                                                    ></p>{" "}
                                                    {getColourBasedOnhex(
                                                      stylesSelect?.liningColor,
                                                    )}
                                                  </div>
                                                  )
                                                </div>
                                              </SelectItem>
                                              {colors.map((colour: any) => (
                                                <SelectItem
                                                  key={colour.id}
                                                  value={getColourBasedOnId(
                                                    colour.id,
                                                  )}
                                                >
                                                  <div className="flex items-center">
                                                    <div
                                                      className="h-4 w-4 rounded-full"
                                                      style={{
                                                        backgroundColor:
                                                          getColourBasedOnId(
                                                            colour.id,
                                                          ),
                                                        border:
                                                          "1px solid #000",
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
                              </>
                            )}
                          </>
                        )}

                        {/* {watchColorType === ColorType.Custom && (
                          <FormField
                            control={form.control}
                            name={`styles[${index}].customColor` as any}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Custom Color</FormLabel>
                                <FormControl>
                                  <MultipleSelector
                                    {...field}
                                    creatable
                                    placeholder={
                                      "Type the colour and enter to add it"
                                    }
                                    emptyIndicator={
                                      <p className="text-muted-foreground">
                                        Type any unique colour and press enter
                                        to add it
                                      </p>
                                    }
                                    showBadgesVertically
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )} */}

                        <FormField
  control={form.control}
  name={`styles[${index}].sizeCountry` as any}
  render={({ field }) => (
    <FormItem>
      <FormLabel>Size Country</FormLabel>
      <Select
        onValueChange={(val) => {
          field.onChange(val);
          // reset size + custom sizes when country changes
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
<FormField
  control={form.control}
  name={`styles[${index}].size` as any}
  render={({ field }) => {
    const country = form.getValues(
      `styles[${index}].sizeCountry` as any,
    ) as keyof typeof sizeOptions;

    // sizes based on selected country; fallback to global `sizes`
    const options = sizeOptions[country] || sizes;

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


                        {watchSize === "Custom" && (
                          <FormField
                            control={form.control}
                            name={`styles[${index}].customSize` as any}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Custom Size</FormLabel>
                                <FormControl>
                                  <MultipleSelector
                                    {...field}
                                    onChange={(value) => {
                                      field.onChange(value);

                                      //   set fields for the customSizesQuantity

                                      form.setValue(
                                        `styles[${index}].customSizesQuantity` as any,
                                        value.map((v) => {
                                          return {
                                            size: v.value,
                                            quantity: "",
                                          };
                                        }),
                                      );
                                    }}
                                    creatable
                                    placeholder={
                                      "Type the size and enter to add it"
                                    }
                                    emptyIndicator={
                                      <p className="text-muted-foreground">
                                        Type any unique size and press enter to
                                        add it
                                      </p>
                                    }
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        {watchSize !== "Custom" && (
                          <FormField
                            control={form.control}
                            name={`styles[${index}].quantity` as any}
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
                        )}

                        {watchSize === "Custom" && (
                          <div className={"md:col-span-3"}>
                            <CustomSizesQuantityFieldArray
                              control={form.control}
                              name={`styles[${index}].customSizesQuantity`}
                              register={form.register}
                            />
                          </div>
                        )}

                        <FileUploadField
                          // key={field.id}
                          form={form}
                          index={index}
                          name="modifiedPhotoImage"
                        />

                        <div className={"md:col-span-3"}>
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
              })}
            </div>

            <div className={"mt-4 flex items-center gap-2 md:col-span-3"}>
              <Button
                type={"button"}
                className={"flex-1"}
                variant={"outline"}
                //         onClick={async () => {
                //   // console.log(form.getValues());
                //   // if (form.formState.isValid) {
                //   //   // executePreviewAsync(form.getValues());
                //   //   await onPreviewSubmit(form.getValues());
                //   // } else {
                //   //   console.log(form.formState.errors);
                //   //   toast.error("Failed to add order", {
                //   //     description: "Make sure all fields are filled correctly"
                //   //   });
                //   // }
                //   form.handleSubmit(onPreviewSubmit, onErrors);
                // }}
                onClick={form.handleSubmit(onPreviewSubmit, onErrors)}
                disabled={previewLoading}
              >
                {" "}
                Preview Order{" "}
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? "Loading..." : "Create Order"}
              </Button>
            </div>
          </form>
        </Form>

{previewData && (
  <div className="flex gap-4 mt-4 w-full">
    <div className="flex-1 border rounded-lg p-2">
      <div className="flex justify-between items-center mb-2">
        <h2 className="font-semibold">Preview</h2>

        <div className="flex items-center gap-3">
          {/* PDF Download Button */}
          <PDFDownloadLink
            document={<FreshOrderPdf orderData={previewData} />}
            fileName={`${previewData.purchaseOrderNo}.pdf`}
          >
            {({ loading }) =>
              loading ? (
                <Button disabled>Preparing PDF...</Button>
              ) : (
                <Button className="bg-green-600 text-white">
                  Download PDF
                </Button>
              )
            }
          </PDFDownloadLink>

          {/* PPT Download Button */}
          <Button
            className="bg-blue-600 text-white"
            onClick={() => downloadOrderPPT(previewData)}
          >
            Download PPT
          </Button>
        </div>
      </div>

      <PDFViewer className="w-full h-[75vh]" showToolbar={false}>
        <FreshOrderPdf orderData={previewData} />
      </PDFViewer>
    </div>
  </div>
)}



      </SheetContent>
    </Sheet>
  );
};

const CommentsFieldArray = ({
  control,
  name,
  register,
}: {
  control: Control<CreateOrderForm, any>;
  name: any;
  register: any;
}) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });

  // Local state for the new comment input
  const [newComment, setNewComment] = useState("");
  const newCommentRef = useRef<HTMLTextAreaElement | null>(null); // Create a ref for the new comment textarea

  const handleAddComment = () => {
    if (newComment.trim()) {
      append(newComment); // Append the new comment
      setNewComment(""); // Reset the input field
      newCommentRef.current?.focus(); // Focus back on the new comment textarea
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent the default behavior (new line in textarea)
      handleAddComment(); // Call the function to add comment
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Comments</Label>
        <Button variant="secondary" onClick={handleAddComment} type="button">
          Add Comment <Plus />
        </Button>
      </div>
      <div className="flex items-center gap-4">
        <Textarea
          ref={newCommentRef} // Attach the ref to the textarea
          value={newComment} // Bind to local state
          onChange={(e) => setNewComment(e.target.value)} // Update local state
          onKeyDown={handleKeyDown} // Add key down listener
          placeholder="Type your comment here"
          className="w-full"
        />
      </div>
      {fields.map((field, index) => (
        <div key={field.id} className="flex items-center gap-4">
          <Textarea
            {...register(`${name}.${index}`)} // Bind to the string directly
            placeholder="Type your comment here"
            className="w-full"
          />
          <Button
            variant="destructive"
            onClick={() => remove(index)}
            type="button"
            size="icon"
          >
            <Delete />
          </Button>
        </div>
      ))}
    </div>
  );
};

const CustomSizesQuantityFieldArray = ({
  control,
  name,
  register,
}: {
  control: Control<CreateOrderForm, any>;
  name: any;
  register: any;
}) => {
  const { fields } = useFieldArray({
    control,
    name,
  });

  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
      {fields.map((field: any, index) => {
        return (
          <div key={field.id} className="flex items-center gap-4">
            <div className={"space-y-2"}>
              <Label>Size</Label>
              <Input disabled value={field.size} />
            </div>

            <FormField
              control={control}
              name={`${name}.${index}.quantity` as any}
              render={({ field: quantityField }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input {...quantityField} placeholder="100" type="text" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );
      })}
    </div>
  );
};

const FileUploadField = ({ form, index, name }: any) => {
  const [selectedFiles, setSelectedFiles] = useState([] as any);
  const [previews, setPreviews] = useState([]);

  useEffect(() => {
    // Create preview URLs for the files
    const urls = selectedFiles.map((file: any) =>
      URL.createObjectURL(file),
    ) as any;
    setPreviews(urls);

    // Cleanup function to revoke the URLs
    return () => {
      urls.forEach((url: any) => URL.revokeObjectURL(url));
    };
  }, [selectedFiles]);

  const handleFileChange = (e: any) => {
    const newFiles = Array.from(e.target.files || []);
    setSelectedFiles((prev: any) => [...prev, ...newFiles]);

    // Update form value
    const currentFiles = form.getValues(`styles[${index}].${name}`);
    form.setValue(`styles[${index}].${name}`, [
      ...(currentFiles || []),
      ...newFiles,
    ]);
  };

  const handleDelete = (fileIndex: any) => {
    setSelectedFiles((prev: any) =>
      prev.filter((_: any, i: any) => i !== fileIndex),
    );
    setPreviews((prev) => prev.filter((_, i) => i !== fileIndex));

    // Update form value
    const currentFiles = form.getValues(`styles[${index}].${name}`);
    const updatedFiles = currentFiles.filter(
      (_: any, i: any) => i !== fileIndex,
    );
    form.setValue(`styles[${index}].${name}`, updatedFiles);
  };

  return (
    <FormField
      control={form.control}
      name={`styles[${index}].${name}`}
      render={() => (
        <FormItem className="col-span-full">
          <FormLabel>Custom Images</FormLabel>
          <FormControl>
            <div className="space-y-4">
              <Input
                type="file"
                onChange={handleFileChange}
                className="block w-full cursor-pointer rounded-lg border text-sm"
                accept="image/*"
                multiple
              />

              {selectedFiles.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                 {previews.map((preview, fileIndex) => {
  const file = selectedFiles[fileIndex];
  const fileKey = file ? `${file.name}-${file.lastModified}` : `preview-${fileIndex}`;

  return (
    <div key={fileKey} className="group relative cursor-pointer">
      <div className="relative aspect-square overflow-hidden rounded-lg border">
        <img src={preview} alt={`Preview ${fileIndex + 1}`} className="h-full w-full object-contain" />
        <div className="absolute inset-0 bg-black/0 transition-all group-hover:bg-black/40">
          <Button
            size="icon"
            type="button"
            onClick={() => handleDelete(fileIndex)}
            className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
            variant="destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <span className="mt-1 block truncate text-xs text-gray-500">
        {file?.name}
      </span>
    </div>
  );
})}

                </div>
              )}
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

// export default FileUploadField;

export default CreateOrder;
