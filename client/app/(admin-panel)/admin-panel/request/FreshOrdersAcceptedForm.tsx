"use client";



import { getRetailerOrderWithBarcode } from "@/lib/data";
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
  Download,
  Presentation,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { Control, useFieldArray, useForm } from "react-hook-form";
import useHttp from "@/lib/hooks/usePost";
import {
  CreateFreshOrderForm,
  CreateOrderForm,
  createFreshOrderFormSchema,
} from "@/lib/formSchemas";
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
import { Option } from "@/components/custom/multi-selector";
import { API_URL } from "@/lib/constants";
import {
  getLatestRetailerOrder,
  getProductColorsCheck,
  getProductColours,
  getRetailerAdminFreshOrderDetails,
} from "@/lib/data";
import OrderCustomerPdf from "@/app/(admin-panel)/admin-panel/orders/OrderCustomerPdf";
import { PDFDownloadLink, PDFViewer } from "@react-pdf/renderer";
import { v4 as uuidv4 } from "uuid";
import Link from "next/link";
import FreshOrderPdf from "./FreshOrderPdf";
import { convertWebPToJPG } from "./StockAcceptedForm";
import RetailerPdf from "./RetailerPdf";
import { UploadOrderFile } from "@/components/CreateOrder/UploadOrderFile";
import { UploadedFileType } from "@/hooks/useCreateOrder";

const getTrailingPoNumber = (poNumber?: string | null) => {
  const match = poNumber?.match(/(\d+)\s*$/);
  return match ? Number(match[1]) : 0;
};

const FreshOrdersAcceptedForm = ({
  customers,
  id,
}: {
  customers: any[];
  id: number;
}) => {
  const [details, setDetails] = useState<any[]>([]);
  const [currencyInfo, setCurrencyInfo] = useState<{
    symbol: string;
    name: string;
  } | null>(null);

  const [open, setOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [total_state, setTotalState] = useState(0);
  const [uploadedFile, setUploadedFileRaw] = useState<File | null>(null);
  const [uploadedFileType, setUploadedFileType] = useState<UploadedFileType>(null);
  const [uploadedFileObjectUrl, setUploadedFileObjectUrl] = useState<string | null>(null);

  const setUploadedFile = useCallback((file: File | null) => {
    setUploadedFileObjectUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }

      return file ? URL.createObjectURL(file) : null;
    });
    setUploadedFileRaw(file);
    setUploadedFileType(file ? (file.name.endsWith(".pdf") ? "pdf" : "ppt") : null);
  }, []);

  const clearUploadedFile = useCallback(() => setUploadedFile(null), [setUploadedFile]);

  const { executeAsync: mailex } = useHttp(
    "/stock-email",
    "POST",
    true
  );

  const { loading, error, executeAsync } = useHttp(
    "/retailer-orders/admin/accepted/favorites-order",
    "POST",
  );

  const router = useRouter();

  const form = useForm<CreateFreshOrderForm>({
    resolver: zodResolver(createFreshOrderFormSchema),
    defaultValues: {
      // purchaseOrderNo: `CH#${String.fromCharCode(65 + (ordersTotalCount % 26))}${ordersTotalCount + 1}`,
      orderId: id,
      purchaseOrderNo: "",
      manufacturingEmailAddress: "",
      orderReceivedDate: undefined,
      orderCancellationDate: undefined,
      address: "",
      phoneNumber: "",
      customerId: "",
      advance: 0,
      customization: 0,
      product_amount: 0,
      shipping: 0,
      total_amount: 0,
      estimate: "",
      invoice: "",
      styles: [
        {
          styleNo: "",
          customColor: "",
          size: "",
          quantity: "",
          comments: "",
          customization_p: 0,
          meshColor: "",
          beadingColor: "",
          lining: "",
          liningColor: "",
        },
      ],
    },
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "styles",
  });

  const watch = form.watch();

  const fetchData = async () => {
    try {
      const res = await getRetailerAdminFreshOrderDetails(id, 0);
      let data = res.data;

      form.setValue("orderId", id);
      console.log("ORDER ID →", form.getValues("orderId"));


      const colours = await getProductColours({});
      let colors = colours.productColours;

      // 🔹 Fetch latest Fresh PO #
      // 1️⃣ Get Customer Prefix
      // 1️⃣ Get Customer Prefix
      const customerPrefix = data[0].customer_name
        .split(" ")[0]
        .replace(/[^A-Za-z]/g, "")
        .toUpperCase();

      // 2️⃣ Fetch last retailer PO from backend and keep the global sequence
      const latestPO = await getLatestRetailerOrder();
      const nextSequence = getTrailingPoNumber(latestPO?.purchaeOrderNo) + 1 || 1;
      const newPO = `PO#${customerPrefix} ${nextSequence}`;

      // 3️⃣ Set PO in form
      form.setValue("purchaseOrderNo", newPO);




      const invoice = `IN_${uuidv4().replace(/-/g, "").substring(0, 6)}`;
      const estimate = `EB_${uuidv4().replace(/-/g, "").substring(0, 6)}`;

      // form.setValue("purchaseOrderNo", newPO);
      form.setValue("customerId", data[0].customer_name);
      form.setValue("manufacturingEmailAddress", "rubyinc@hotmail.com");
      form.setValue("orderReceivedDate", new Date(data[0].orderReceivedDate));
      form.setValue("address", data[0].address);
      form.setValue("phoneNumber", data[0].phoneNumber);


      const arrayData = data.map((it: any) => ({
        styleNo: it.productCode ?? it.styleNo ?? "", customColor: it.color,
        size: it.admin_us_size
          ? `${it.admin_us_size}`
          : `${it.size} (${it.size_country})`,
        quantity: it.quantity,
        comments: it.comments,
        amount: Number(it.price),
        fav_id: it.fav_id,
        customization_p: 0,
        meshColor:
          it.mesh_color !== "SAS"
            ? colors.find((colour: any) => colour.hexcode === it.mesh_color)
              ?.name
            : "SAS",
        beadingColor:
          it.beading_color !== "SAS"
            ? colors.find(
              (colour: any) => colour.hexcode === it.beading_color,
            )?.name
            : "SAS",
        lining: it.lining,
        liningColor:
          it.lining_color !== "SAS"
            ? colors.find((colour: any) => colour.hexcode === it.lining_color)
              ?.name
            : "SAS",
      }));

      form.setValue("styles", arrayData);

      let total = data.reduce(
        (sum: any, item: any) => sum + Number(item.total_amount),
        0
      );

      form.setValue("product_amount", total);
      form.setValue("total_amount", total);
      form.setValue("estimate", estimate);
      form.setValue("invoice", invoice);
      setTotalState(total);

      if (data.length > 0 && data[0].currencySymbol) {
        setCurrencyInfo({
          symbol: data[0].currencySymbol,
          name: data[0].currencyName,
        });
      }

      setDetails(data);
    } catch (error) {
      console.log(error);
    }
  };


  const getFavouriteRowId = (current: any, index: number) =>
    String(current?.fav_id ?? details[index]?.fav_id ?? "");

  const buildFreshBarcodeMap = (rows: any[]) =>
    new Map(
      rows
        .filter((row: any) => row?.barcode && row?.fav_id != null)
        .map((row: any) => [String(row.fav_id), row.barcode]),
    );

  const buildFreshRowKey = ({
    favouriteId,
    styleNo,
    size,
    quantity,
    meshColor,
    beadingColor,
    lining,
    liningColor,
    customColor,
    comments,
    barcode,
  }: any) =>
    [
      favouriteId ?? "",
      styleNo ?? "",
      size ?? "",
      quantity ?? "",
      meshColor ?? "",
      beadingColor ?? "",
      lining ?? "",
      liningColor ?? "",
      customColor ?? "",
      comments ?? "",
      barcode ?? "",
    ].join("::");

  const onSubmitFun = async (data: CreateFreshOrderForm) => {
    const finalData = details[0] as any;

    const dataSend = {
      rfo_id: id,
      retailerId: finalData.retailerId,
      address: data.address,
      purchaseOrderNo: data.purchaseOrderNo,
      hasId: data.styles.map((i: any) => i.colorType).join(","),
      manufacturingEmailAddress: data.manufacturingEmailAddress,
      orderCancellationDate: data.orderCancellationDate,
      orderReceivedDate: data.orderReceivedDate,
      Size: data.styles.map((i: any) => i.size).join(","),
      size_country: details.map((i) => i.size_country).join(","),
      StyleNo: data.styles.map((i: any) => i.styleNo).join(","),
      quantity: data.styles.map((i) => i.quantity).join(","),
      total_amount: form.getValues("total_amount"),
      advance: data.advance,
      styles: data.styles,
      shipping: data.shipping,
      estimate: data.estimate,
      invoice: data.invoice,
      phoneNumber: data.phoneNumber,
    };

    // If user uploaded a file, create the order first, then attach the uploaded document.
    if (uploadedFile) {
      try {
        const response = await executeAsync({
          orderData: dataSend,
        });

        if (!response.success) {
          toast.error("Failed to add order");
          return;
        }

        if (!response.orderId) {
          throw new Error("Order was created but no order ID was returned for the uploaded document.");
        }

        const formData = new FormData();
        formData.append("ppt", uploadedFile);
        formData.append("orderId", String(response.orderId));
        formData.append("uploadedOrderFileType", uploadedFileType ?? "");

        const uploadResponse = await fetch(`${API_URL}/upload-ppt`, {
          method: "POST",
          body: formData,
        });

        const uploadJson = await uploadResponse.json();

        if (!uploadResponse.ok || !uploadJson.success) {
          throw new Error(
            uploadJson?.message || "Order was created but the uploaded document failed to save.",
          );
        }

        toast.success(response.message ?? "Order Added Successfully!");
        setOpen(false);
        router.refresh();
        return;
      } catch (err: any) {
        const message = err?.message ?? "Something went wrong";
        toast.error(
          message.includes("Order was created")
            ? "Order created, but document upload failed"
            : "Failed to add order",
          {
            description: message,
          },
        );
      }
    }

    // Original flow for auto-generated PDF
    // convert this formData
    try {
      const response = await executeAsync({
        orderData: dataSend,
      });

      if (response.success) {
        const acceptedOrderRes = await getRetailerOrderWithBarcode(
          Number(form.getValues("orderId")),
        );
        const barcodeMap = buildFreshBarcodeMap(
          Array.isArray(acceptedOrderRes?.data) ? acceptedOrderRes.data : [],
        );

        const combinedStyles = await Promise.all(
          data.styles.map(async (current, index) => {
            // First get the standard colors for this specific style
            const colours = await getProductColours({});

            let colors = colours.productColours;
            const styleNo = parseInt(details[index].product_id);
            const standardColors = await productColorSAS(styleNo);
            const favouriteId = getFavouriteRowId(current, index);

            // Clean up size string
            const cleanSize = String(current.size ?? "")
              .split("")
              .map((item) => (item.trim() ? item : ""))
              .join("");

            // Compare each color with standard and mark as SAS if matching
            const meshColorDisplay =
              current.meshColor ===
                colors.find(
                  (colour: any) => colour.hexcode == standardColors.mesh_color,
                )?.name
                ? `SAS( ${current.meshColor} )`
                : current.meshColor;

            const beadingColorDisplay =
              current.beadingColor ===
                colors.find(
                  (colour: any) => colour.hexcode == standardColors.beading_color,
                )?.name
                ? `SAS( ${current.beadingColor} )`
                : current.beadingColor;

            const liningDisplay =
              current.lining === standardColors.lining
                ? `SAS( ${current.lining} )`
                : current.lining;

            const liningColorDisplay =
              current.liningColor ==
                colors.find(
                  (colour: any) => colour.hexcode == standardColors.lining_color,
                )?.name
                ? formatSasValue(current.liningColor)
                : current.liningColor;

            // Get current reference images
            const currentRefImages = details[index].reference_image
              ? JSON.parse(details[index].reference_image).map((item: any) =>
                convertWebPToJPG(item),
              )
              : [];

            // Return the item with necessary properties
            const barcode = barcodeMap.get(favouriteId);
            const match: any = /\((.*?)\)/.exec(cleanSize);
            let valueInBraces = match ? match[1] : "";
            const comparisonKey = buildFreshRowKey({
              favouriteId,
              styleNo: current.styleNo,
              size: cleanSize,
              quantity: current.quantity,
              meshColor: current.meshColor,
              beadingColor: current.beadingColor,
              lining: current.lining,
              liningColor: current.liningColor,
              customColor: current.customColor,
              comments: current.comments,
              barcode,
            });

            return {
              key: comparisonKey,
              quantity: current.quantity,
              size: `${cleanSize.split("(")[0].trim()}/${current.quantity}`,
              size_country: valueInBraces,
              styleNo: current.styleNo,
              comments: current.comments || "", // Ensure comments is always defined
              price: details[index].total_amount,
              color: current.meshColor || current.customColor,
              image: await convertWebPToJPG(details[index].image),
              refImg: currentRefImages,
              meshColor: meshColorDisplay,
              beadingColor: beadingColorDisplay,
              lining: liningDisplay,
              liningColor: liningColorDisplay,
              barcode,
            };
          }),
        );

        // Now perform the combination logic on processed items
        const reduced = combinedStyles.reduce((acc: any[], item) => {
          // Find existing item with same properties
          const existingItemIndex = acc.findIndex(
            (existing) => existing.key === item.key,
          );

          if (existingItemIndex !== -1) {
            // Update existing item
            const existingItem = acc[existingItemIndex];
            const totalQuantity =
              Number(existingItem.quantity) + Number(item.quantity);

            existingItem.quantity = totalQuantity;
            existingItem.size = `${existingItem.size}, ${item.size}`;
            existingItem.price =
              Number(existingItem.price) + Number(item.price);

            // Combine reference images (removing duplicates if desired)
            existingItem.refImg = [
              ...new Set([...existingItem.refImg, ...item.refImg]),
            ];

            // Keep the latest image
            existingItem.image = item.image;
          } else {
            // Add new item
            acc.push(item);
          }

          return acc;
        }, []);

        // Remove temporary key and prepare final data
        const finalStyles = reduced.map(({ key, ...rest }) => rest);

        const preData = {
          customerId: data.customerId,
          manufacturingEmailAddress: data.manufacturingEmailAddress,
          orderCancellationDate: data.orderCancellationDate,
          orderReceivedDate: data.orderReceivedDate,
          orderType: "Fresh",
          purchaseOrderNo: data.purchaseOrderNo,
          details: finalStyles,
          total: total_state,
        };

        FreshEmail(preData);
      } else {
        return toast.error("Failed to add order");
      }
      // await mailex({ orderData: previewData });
      form.reset();
      setOpen(false);
      toast.success(response.message ?? "Order added successfully");
      setPreviewData(null);
      router.refresh();
    } catch (err) {
      toast.error("Failed to add order", {
        description: error?.message ?? "Something went wrong",
      });
    }
  };

  const productColorSAS = async (id: number) => {
    const res = await getProductColorsCheck(id);
    return res.data; // Returns the standard colors for a specific product ID
  };
  const formatSasValue = (value?: string | null) => {
    return value && value !== "SAS" ? `SAS(${value})` : "SAS";
  };


  const onPreviewSubmit = async (data: CreateFreshOrderForm) => {
    try {
      const orderRes = await getRetailerOrderWithBarcode(Number(form.getValues("orderId")));

      if (!orderRes?.success) {
        throw new Error("Failed to fetch order barcode data");
      }

      const barcodeStyles = Array.isArray(orderRes.data) ? orderRes.data : [];

      const barcodeMap = buildFreshBarcodeMap(
        barcodeStyles,
      );

      console.log("🧠 BARCODE MAP →", [...barcodeMap.entries()]);

      // =====================================================
      // 🔥 STEP 2: BUILD PREVIEW STYLES
      // =====================================================
      const combinedStyles = await Promise.all(
        data.styles.map(async (current, index) => {
          // Colors
          const colours = await getProductColours({});
          const colors = colours.productColours;

          const styleNoId = parseInt(details[index].product_id);
          const standardColors = await productColorSAS(styleNoId);
          const favouriteId = getFavouriteRowId(current, index);

          // Clean size
          const cleanSize = String(current.size ?? "")
            .split("")
            .map((item) => (item.trim() ? item : ""))
            .join("");

          // SAS logic
          const meshColorDisplay =
            current.meshColor ===
              colors.find(
                (c: any) => c.hexcode === standardColors.mesh_color
              )?.name
              ? `SAS(${current.meshColor})`
              : current.meshColor;

          const beadingColorDisplay =
            current.beadingColor ===
              colors.find(
                (c: any) => c.hexcode === standardColors.beading_color
              )?.name
              ? `SAS(${current.beadingColor})`
              : current.beadingColor;

          const liningDisplay =
            current.lining === standardColors.lining
              ? `SAS(${current.lining})`
              : current.lining;

          const liningColorDisplay =
            current.liningColor ===
              colors.find(
                (c: any) => c.hexcode === standardColors.lining_color
              )?.name
              ? formatSasValue(current.liningColor)
              : current.liningColor;

          // Reference images
          const currentRefImages = details[index].reference_image
            ? JSON.parse(details[index].reference_image).map((img: any) =>
              convertWebPToJPG(img)
            )
            : [];

          // Size country
          const match = /\((.*?)\)/.exec(cleanSize);
          const sizeCountry = match ? match[1] : "";

          // 🔥 FINAL BARCODE (ONLY SOURCE)
          const barcode = barcodeMap.get(favouriteId) || "N/A";
          const comparisonKey = buildFreshRowKey({
            favouriteId,
            styleNo: current.styleNo,
            size: cleanSize,
            quantity: current.quantity,
            meshColor: current.meshColor,
            beadingColor: current.beadingColor,
            lining: current.lining,
            liningColor: current.liningColor,
            customColor: current.customColor,
            comments: current.comments,
            barcode,
          });

          console.log("🔍 PREVIEW BARCODE →", favouriteId, current.styleNo, barcode);

          return {
            key: comparisonKey,
            quantity: current.quantity,
            size: `${cleanSize.split("(")[0].trim()}/${current.quantity}`,
            size_country: sizeCountry,
            styleNo: current.styleNo,
            comments: current.comments || "",
            price: details[index].total_amount,
            color: current.meshColor || current.customColor,
            image: convertWebPToJPG(details[index].image),
            refImg: currentRefImages,
            meshColor: meshColorDisplay,
            beadingColor: beadingColorDisplay,
            lining: liningDisplay,
            liningColor: liningColorDisplay,
            barcode, // ✅ CORRECT BARCODE
          };
        })
      );

      // =====================================================
      // 🔥 STEP 3: MERGE SAME ITEMS
      // =====================================================
      const reduced = combinedStyles.reduce((acc: any[], item) => {
        const existingIndex = acc.findIndex(
          (e) => e.key === item.key
        );

        if (existingIndex !== -1) {
          const existing = acc[existingIndex];
          existing.quantity =
            Number(existing.quantity) + Number(item.quantity);
          existing.size = `${existing.size}, ${item.size}`;
          existing.price =
            Number(existing.price) + Number(item.price);
          existing.refImg = [
            ...new Set([...existing.refImg, ...item.refImg]),
          ];
          existing.image = item.image;
        } else {
          acc.push(item);
        }

        return acc;
      }, []);

      // Remove temp key
      const finalStyles = reduced.map(({ key, ...rest }) => rest);

      // =====================================================
      // 🔥 STEP 4: SET PREVIEW DATA
      // =====================================================
      const preData = {
        customerId: data.customerId,
        manufacturingEmailAddress: data.manufacturingEmailAddress,
        orderCancellationDate: data.orderCancellationDate,
        orderReceivedDate: data.orderReceivedDate,
        orderType: "Fresh",
        purchaseOrderNo: data.purchaseOrderNo,
        details: finalStyles,
        total: total_state,
      };

      console.log("✅ FINAL PREVIEW DATA →", preData);

      setPreviewData(preData);
    } catch (err) {
      console.error("❌ onPreviewSubmit ERROR →", err);
      toast.error("Failed to generate preview");
    }
  };


  const onErrors = (errors: any) => {
    toast.error("Failed to add order", {
      description: "Make sure all fields are filled correctly",
    });
  };
  const formChange = () => {
    setTimeout(() => {
      let product_total = 0;
      let customization_total = 0;

      if (!watch.styles || !Array.isArray(watch.styles)) {
        console.error("watch.styles is not defined or not an array");
        return;
      }

      for (let index = 0; index < watch.styles.length; index++) {
        const amount = Number(watch.styles[index]?.amount) || 0;
        const customization = Number(watch.styles[index]?.customization_p) || 0;
        const quantity = Number(watch.styles[index]?.quantity) || 0;

        product_total += amount * quantity; // Multiply by quantity
        customization_total += customization * quantity;
      }

      const shipping = Number(form.getValues("shipping")) || 0;

      let wholeTotal = customization_total + product_total + shipping;

      form.setValue("total_amount", wholeTotal);
      form.setValue("customization", customization_total);
      form.setValue("product_amount", product_total);
    }, 200);
  };

  const FreshEmail = async (preData: any) => {
    try {
      console.log("📧 MAIL TO →", preData.manufacturingEmailAddress);

      await mailex({ orderData: preData });

      toast.success("Manufacturer mail sent");
    } catch (err: any) {
      console.error("❌ MAIL ERROR →", err);
      toast.error("Mail failed", {
        description: err?.message || "Mail API error",
      });
    }
  };

  useEffect(() => {
    if (!open) {
      clearUploadedFile();
    }
  }, [open, clearUploadedFile]);

  return (
    <div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button onClick={fetchData}>Accept</Button>
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
              onSubmit={form.handleSubmit(onSubmitFun, onErrors)}
            >
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer</FormLabel>

                    {/* @ts-ignore */}
                    <Input placeholder="PO#RITIK 21" {...field} readOnly />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="orderId"
                render={({ field }) => (
                  <input type="hidden" {...field} />
                )}
              />


              <FormField
                control={form.control}
                name="purchaseOrderNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Order No</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="PO#RITIK 21"
                        {...field}
                        readOnly
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estimate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimate No</FormLabel>
                    <FormControl>
                      <Input placeholder="PO#VICTORIA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="invoice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice No</FormLabel>
                    <FormControl>
                      <Input placeholder="PO#VICTORIA" {...field} />
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
                          disabled
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
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="product_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="0"
                        {...field}
                        type="number"
                        readOnly
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="shipping"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shipping Cost</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="0"
                        {...field}
                        type="number"
                        onChange={(e: any) => {
                          field.onChange(e);
                          formChange();
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="customization"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Customization</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="0"
                        {...field}
                        type="number"
                        readOnly
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="total_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Amount</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="0"
                        {...field}
                        type="number"
                        readOnly
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="advance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Advance</FormLabel>
                    <FormControl>
                      <Input placeholder="0" {...field} type="number" />
                    </FormControl>
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
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem className={"md:col-span-3"}>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+91 9876543210" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />


              <div className="!mt-4 space-y-2 md:col-span-3">
                <div className="flex items-center justify-between">
                  <Label>Styles</Label>
                </div>
                {fields.map((field, index) => {
                  const watchColorType = form.watch(
                    `styles[${index}].colorType` as any,
                  ) as any;

                  const watchSize = form.watch(
                    `styles[${index}].size` as any,
                  ) as any;

                  const fileRef = form.register(
                    `styles[${index}].modifiedPhotoImage` as any,
                  );

                  return (
                    <Collapsible key={field.id} className="space-y-2">
                      <div className="flex items-center gap-4">
                        <CollapsibleTrigger asChild>
                          <div className="flex w-full flex-1 cursor-pointer justify-between border-2 border-primary p-2">
                            <p>
                              {index + 1}. Style ({currencyInfo?.symbol || "€"}
                              {(Number(watch.styles[index].amount) +
                                Number(watch.styles[index].customization_p)) *
                                Number(watch.styles[index].quantity)}
                              )
                            </p>

                            <ChevronDown />
                          </div>
                        </CollapsibleTrigger>
                      </div>
                      <CollapsibleContent asChild>
                        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                          <FormField
                            control={form.control}
                            name={`styles[${index}].styleNo` as any}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Style No{" "}
                                  <Link
                                    href={`/products/${details[index].product_id}`}
                                    target="_blank"
                                    className="font-bold text-blue-700"
                                  >
                                    ({details[index].productCode})
                                  </Link>
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="PO#VICTORIA"
                                    {...field}
                                    readOnly
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`styles[${index}].customColor` as any}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  <div className="flex items-center gap-1">
                                    <p>Color </p>{" "}
                                  </div>
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="PO#VICTORIA"
                                    {...field}
                                    readOnly
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`styles[${index}].meshColor` as any}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  <div className="flex items-center gap-1">
                                    <p>Mesh Color</p>{" "}
                                  </div>
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="PO#VICTORIA"
                                    {...field}
                                    readOnly
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`styles[${index}].beadingColor` as any}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  <div className="flex items-center gap-1">
                                    <p>Beading Color </p>{" "}
                                  </div>
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="PO#VICTORIA"
                                    {...field}
                                    readOnly
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`styles[${index}].lining` as any}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  <div className="flex items-center gap-1">
                                    <p>Lining </p>{" "}
                                  </div>
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="PO#VICTORIA"
                                    {...field}
                                    readOnly
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`styles[${index}].liningColor` as any}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  <div className="flex items-center gap-1">
                                    <p>Lining Color </p>{" "}
                                  </div>
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="PO#VICTORIA"
                                    {...field}
                                    readOnly
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`styles[${index}].size` as any}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Size</FormLabel>

                                <FormControl>
                                  <Input
                                    placeholder="Size"
                                    readOnly
                                    value={
                                      details[index]?.admin_us_size
                                        ? `US ${details[index].admin_us_size}`
                                        : `${details[index].size_country} ${details[index].size}`
                                    }
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`styles[${index}].quantity` as any}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Quantity</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="100"
                                    {...field}
                                    readOnly
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`styles[${index}].customization_p` as any}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Customization</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="100"
                                    {...field}
                                    type="number"
                                    value={field.value || 0}
                                    onChange={(e: any) => {
                                      const value = e.target.value
                                        ? Number(e.target.value)
                                        : 0;
                                      field.onChange(value);
                                      formChange();
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`styles[${index}].amount` as any}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Amount</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="100"
                                    {...field}
                                    type="number"
                                    onChange={(e: any) => {
                                      field.onChange(e);
                                      formChange();
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`styles.${index}.comments`}
                            render={({ field }) => (
                              <FormItem className={"md:col-span-3"}>
                                <FormLabel>Comments</FormLabel>
                                <FormControl>
                                  <Textarea
                                    readOnly
                                    placeholder="Amsterdam"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </div>

              {/* Upload Order File */}
              <div className="md:col-span-3 space-y-2">
                <div className="flex items-start gap-2">
                  <div>
                    <Label>Upload order document</Label>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Optional — replaces the auto-generated PDF / PPT in the preview and on
                      submit.
                    </p>
                  </div>
                </div>
                <UploadOrderFile
                  uploadedFile={uploadedFile}
                  uploadedFileType={uploadedFileType}
                  onFileSelect={setUploadedFile}
                />
              </div>

              <div className={"mt-4 flex items-center gap-2 md:col-span-3"}>
                {!uploadedFile && (
                  <Button
                    type={"button"}
                    className={"flex-1"}
                    variant={"outline"}
                    onClick={form.handleSubmit(onPreviewSubmit)}
                  >
                    {" "}
                    Preview Order{" "}
                  </Button>
                )}
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Create Order"}
                </Button>

              </div>
            </form>
          </Form>

          {/* ── Preview panel — uploaded file ── */}
          {uploadedFile && (
            <div className="mt-4 flex w-full gap-4">
              <div className="flex-1 rounded-lg border p-2">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="font-semibold">Preview</h2>
                  <div className="flex items-center gap-2">
                    <a
                      href={uploadedFileObjectUrl ?? "#"}
                      download={uploadedFile?.name ?? "order-document"}
                      className="inline-flex"
                    >
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <Download className="h-3.5 w-3.5" />
                        Download {uploadedFileType?.toUpperCase()}
                      </Button>
                    </a>
                  </div>
                </div>

                {/* PDF — render inline */}
                {uploadedFileType === "pdf" && uploadedFileObjectUrl && (
                  <iframe
                    src={uploadedFileObjectUrl}
                    className="h-[75vh] w-full rounded border-0"
                    title="Uploaded PDF preview"
                  />
                )}

                {/* PPT — browsers can't render .pptx inline; show a placeholder */}
                {uploadedFileType === "ppt" && (
                  <div className="flex h-[75vh] flex-col items-center justify-center gap-3 rounded border border-dashed bg-muted/30 text-center">
                    <Presentation className="h-10 w-10 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{uploadedFile?.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        PowerPoint files cannot be previewed in the browser.
                        <br />
                        Use the download button above to open it locally.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {previewData && (
            <>
              {/* 🔹 Editable Fields Before PDF */}
              <div className="bg-white p-4 border rounded-md mb-4">
                <h2 className="text-lg font-bold mb-3 text-pink-600">
                  Edit Order Before Download
                </h2>

                {form.watch().styles.map((style: any, idx: number) => (
                  <div key={idx} className="border p-4 rounded-md mb-4 bg-gray-50">

                    <h3 className="font-semibold text-pink-600 mb-2">
                      Style #{idx + 1} — {style.styleNo}
                    </h3>

                    {/* 🔹 2 Column Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                      {/* Color */}
                      <div>
                        <label className="text-black text-sm">Color</label>
                        <input
                          className="border w-full p-2 rounded text-black bg-white"
                          value={style.customColor}
                          onChange={(e) => {
                            form.setValue(`styles.${idx}.customColor`, e.target.value);
                            onPreviewSubmit(form.getValues());
                          }}
                        />
                      </div>

                      {/* Size */}
                      <div>
                        <label className="text-black text-sm">Size</label>
                        <input
                          className="border w-full p-2 rounded text-black bg-white"
                          value={style.size}
                          onChange={(e) => {
                            form.setValue(`styles.${idx}.size`, e.target.value);
                            onPreviewSubmit(form.getValues());
                          }}
                        />
                      </div>

                      {/* Mesh Color */}
                      <div>
                        <label className="text-black text-sm">Mesh Color</label>
                        <input
                          className="border w-full p-2 rounded text-black bg-white"
                          value={style.meshColor}
                          onChange={(e) => {
                            form.setValue(`styles.${idx}.meshColor`, e.target.value);
                            onPreviewSubmit(form.getValues());
                          }}
                        />
                      </div>

                      {/* Beading Color */}
                      <div>
                        <label className="text-black text-sm">Beading Color</label>
                        <input
                          className="border w-full p-2 rounded text-black bg-white"
                          value={style.beadingColor}
                          onChange={(e) => {
                            form.setValue(`styles.${idx}.beadingColor`, e.target.value);
                            onPreviewSubmit(form.getValues());
                          }}
                        />
                      </div>

                      {/* Lining */}
                      <div>
                        <label className="text-black text-sm">Lining</label>
                        <input
                          className="border w-full p-2 rounded text-black bg-white"
                          value={style.lining}
                          onChange={(e) => {
                            form.setValue(`styles.${idx}.lining`, e.target.value);
                            onPreviewSubmit(form.getValues());
                          }}
                        />
                      </div>

                      {/* Lining Color */}
                      <div>
                        <label className="text-black text-sm">Lining Color</label>
                        <input
                          className="border w-full p-2 rounded text-black bg-white"
                          value={style.liningColor}
                          onChange={(e) => {
                            form.setValue(`styles.${idx}.liningColor`, e.target.value);
                            onPreviewSubmit(form.getValues());
                          }}
                        />
                      </div>
                    </div>

                    {/* 🔹 Full Width Row */}
                    <div className="mt-3">
                      <label className="text-black text-sm">Comments</label>
                      <textarea
                        className="border w-full p-2 rounded text-black bg-white"
                        value={style.comments}
                        onChange={(e) => {
                          form.setValue(`styles.${idx}.comments`, e.target.value);
                          onPreviewSubmit(form.getValues());
                        }}
                      />
                    </div>

                    {/* 🔹 Small Input */}
                    <div className="mt-3 w-32">
                      <label className="text-black text-sm">Quantity</label>
                      <input
                        type="number"
                        className="border w-full p-2 rounded text-black bg-white"
                        value={style.quantity}
                        onChange={(e) => {
                          form.setValue(`styles.${idx}.quantity`, e.target.value);
                          formChange();
                          onPreviewSubmit(form.getValues());
                        }}
                      />
                    </div>
                  </div>

                ))}

              </div>

              {/* 🔹 Download Button */}
              <div className="flex justify-end py-3">
                <PDFDownloadLink
                  document={<RetailerPdf orderData={previewData} />}
                  fileName={`${previewData.purchaseOrderNo}.pdf`}
                >
                  <button className="rounded bg-blue-600 px-4 py-2 text-white shadow">
                    Download PDF
                  </button>
                </PDFDownloadLink>
              </div>

              {/* 🔹 Live Preview */}
              <PDFViewer className="mt-2 h-full w-full" showToolbar={false}>
                <FreshOrderPdf orderData={previewData} />
              </PDFViewer>
            </>
          )}

        </SheetContent>
      </Sheet>
    </div>
  );
};

export default memo(FreshOrdersAcceptedForm);
