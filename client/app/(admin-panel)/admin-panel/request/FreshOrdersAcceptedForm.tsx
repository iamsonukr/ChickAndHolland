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
import { downloadOrderPPT } from "@/lib/utils/exportPPT";

const formatOriginalSizeDisplay = (item: {
  original_size?: unknown;
  product_size?: unknown;
  size?: unknown;
  size_country?: unknown;
}) => {
  const size = String(
    item?.original_size ?? item?.product_size ?? item?.size ?? "",
  ).trim();
  const sizeCountry = String(item?.size_country ?? "").trim();

  if (!size) {
    return sizeCountry;
  }

  return sizeCountry ? `${size} (${sizeCountry})` : size;
};

const getTrailingPoNumber = (poNumber?: string | null) => {
  const match = poNumber?.match(/(\d+)\s*$/);
  return match ? Number(match[1]) : 0;
};

const getCustomerStoreName = (data: any) =>
  data?.customerStoreName || data?.customer_store_name || data?.storeName || data?.customer_name || "";

const hasDirtyFields = (dirtyFields: any): boolean => {
  if (!dirtyFields || typeof dirtyFields !== "object") return false;
  return Object.values(dirtyFields).some((value) =>
    value === true ? true : hasDirtyFields(value),
  );
};

const groupAcceptedFreshRows = (rows: any[] = []) => {
  const groupedRows = new Map<string, any>();

  rows.forEach((row) => {
    const key = String(row?.fav_id ?? `${row?.styleNo}-${row?.size}`);
    const existing = groupedRows.get(key);

    if (!existing) {
      groupedRows.set(key, {
        ...row,
        quantity: Number(row?.quantity || 0),
        barcodes: row?.barcode ? [String(row.barcode)] : [],
      });
      return;
    }

    existing.quantity += Number(row?.quantity || 0);
    if (row?.barcode) existing.barcodes.push(String(row.barcode));
  });

  return Array.from(groupedRows.values());
};

const FreshOrdersAcceptedForm = ({
  customers,
  id,
  editMode = false,
  retailerOrderId,
  triggerLabel,
  editOrder,
  onSuccess,
  editPassword,
}: {
  customers: any[];
  id: number;
  editMode?: boolean;
  retailerOrderId?: number;
  triggerLabel?: string;
  editOrder?: any;
  onSuccess?: () => void;
  editPassword?: string;
}) => {
  const isEditMode = editMode && Boolean(retailerOrderId);
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
  const {
    loading: updateLoading,
    error: updateError,
    executeAsync: executeUpdateAsync,
  } = useHttp(
    `/retailer-orders/admin/edit-order/${retailerOrderId ?? ""}`,
    "PATCH",
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
      const res = await getRetailerAdminFreshOrderDetails(
        id,
        isEditMode ? 1 : 0,
      );
      const rawData = Array.isArray(res.data) ? res.data : [];
      let data = isEditMode ? groupAcceptedFreshRows(rawData) : rawData;

      if (!data.length) {
        throw new Error("Order details were not found");
      }

      form.setValue("orderId", id);
      console.log("ORDER ID →", form.getValues("orderId"));


      const colours = await getProductColours({});
      let colors = colours.productColours;

      // 🔹 Fetch latest Fresh PO #
      // 1️⃣ Get Customer Prefix
      // 1️⃣ Get Customer Prefix
      const customerStoreName = getCustomerStoreName(data[0]);
      const customerPrefix = customerStoreName
        .split(" ")[0]
        .replace(/[^A-Za-z]/g, "")
        .toUpperCase();

      // 2️⃣ Fetch last retailer PO from backend and keep the global sequence
      let newPO = data[0].purchaseOrderNo || editOrder?.purchaeOrderNo || "";
      if (!isEditMode) {
        const latestPO = await getLatestRetailerOrder();
        const nextSequence = getTrailingPoNumber(latestPO?.purchaeOrderNo) + 1 || 1;
        newPO = `PO#${customerPrefix} ${nextSequence}`;
      }

      // 3️⃣ Set PO in form
      form.setValue("purchaseOrderNo", newPO);




      const invoice = `IN_${uuidv4().replace(/-/g, "").substring(0, 6)}`;
      const estimate = `EB_${uuidv4().replace(/-/g, "").substring(0, 6)}`;

      // form.setValue("purchaseOrderNo", newPO);
      form.setValue("customerId", customerStoreName);
      form.setValue(
        "manufacturingEmailAddress",
        data[0].manufacturingEmailAddress ||
          editOrder?.manufacturingEmailAddress ||
          "rubyinc@hotmail.com",
      );
      form.setValue(
        "orderReceivedDate",
        new Date(data[0].orderReceivedDate || editOrder?.orderReceivedDate),
      );
      if (data[0].orderCancellationDate || editOrder?.orderCancellationDate) {
        form.setValue(
          "orderCancellationDate",
          new Date(data[0].orderCancellationDate || editOrder?.orderCancellationDate),
        );
      }
      form.setValue("address", data[0].address || editOrder?.address || "");
      form.setValue("phoneNumber", data[0].phoneNumber || editOrder?.customer?.phoneNumber || "");


      const arrayData = data.map((it: any) => ({
        styleNo: it.productCode ?? it.styleNo ?? "", customColor: it.color,
        size: formatOriginalSizeDisplay(it),
        quantity: it.quantity,
        comments: it.comments,
        amount: Number(it.price),
        fav_id: it.fav_id,
        customization_p: Number(it.customization_price || 0),
        barcodes: it.barcodes || (it.barcode ? [String(it.barcode)] : []),
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
      form.setValue(
        "shipping",
        Number(data[0].shippingAmount ?? editOrder?.shippingAmount ?? 0),
      );
      form.setValue(
        "total_amount",
        Number(data[0].purchaseAmount ?? editOrder?.purchaseAmount ?? total),
      );
      form.setValue(
        "advance",
        Number(data[0].paidAmount ?? editOrder?.paidAmount ?? 0),
      );
      form.setValue("estimate", data[0].estimateNo || editOrder?.estimateNo || estimate);
      form.setValue("invoice", data[0].invoiceNo || editOrder?.invoiceNo || invoice);
      setTotalState(total);

      if (data.length > 0 && data[0].currencySymbol) {
        setCurrencyInfo({
          symbol: data[0].currencySymbol,
          name: data[0].currencyName,
        });
      }

      form.reset(form.getValues());
      setPreviewData(null);
      setDetails(data);
    } catch (error) {
      console.log(error);
    }
  };


  const getFavouriteRowId = (current: any, index: number) =>
    String(current?.fav_id ?? details[index]?.fav_id ?? "");

  const getPieceCount = (quantity: unknown) => {
    const numericQuantity = Math.trunc(Number(quantity));
    return Number.isFinite(numericQuantity) && numericQuantity > 0
      ? numericQuantity
      : 0;
  };

  const buildFreshPreviewBarcode = (
    purchaseOrderNo: string,
    styleNo?: string,
    rowIndex = 0,
    pieceIndex = 0,
  ) => {
    const rowSequence = String(rowIndex + 1).padStart(2, "0");
    const pieceSequence = String(pieceIndex + 1).padStart(2, "0");

    return `${purchaseOrderNo}-${styleNo ?? "STYLE"}-PREVIEW-${rowSequence}-${pieceSequence}`;
  };

  const buildFreshBarcodeGroups = (rows: any[] = []) => {
    const groupedBarcodes = new Map<string, string[]>();

    rows.forEach((row) => {
      if (!row?.barcode || row?.fav_id == null) {
        return;
      }

      const favouriteId = String(row.fav_id);
      const existingBarcodes = groupedBarcodes.get(favouriteId) ?? [];
      existingBarcodes.push(String(row.barcode));
      groupedBarcodes.set(favouriteId, existingBarcodes);
    });

    return groupedBarcodes;
  };

  const buildFreshPreviewDetails = async (
    data: CreateFreshOrderForm,
    purchaseOrderNo: string,
    groupedBarcodes?: Map<string, string[]>,
  ) => {
    const colours = await getProductColours({});
    const colors = colours.productColours;

    const detailGroups = await Promise.all(
      data.styles.map(async (current, index) => {
        const styleNo = parseInt(details[index].product_id);
        const standardColors = await productColorSAS(styleNo);
        const favouriteId = getFavouriteRowId(current, index);
        const rowBarcodes =
          groupedBarcodes?.get(favouriteId) ??
          (Array.isArray((current as any).barcodes)
            ? (current as any).barcodes
            : []);
        const cleanSize = String(current.size ?? "")
          .split("")
          .map((item) => (item.trim() ? item : ""))
          .join("");
        const match = /\((.*?)\)/.exec(cleanSize);
        const sizeCountry = match ? match[1] : "";
        const displaySize = cleanSize.split("(")[0].trim();
        const totalPieces = Math.max(getPieceCount(current.quantity), rowBarcodes.length);

        if (totalPieces <= 0) {
          return [];
        }

        const rowTotalPrice = Number(details[index]?.total_amount) || 0;
        const unitPrice = rowTotalPrice / totalPieces;

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

        const currentRefImages = details[index].reference_image
          ? await Promise.all(
              JSON.parse(details[index].reference_image).map((item: any) =>
                convertWebPToJPG(item),
              ),
            )
          : [];
        const productImage = await convertWebPToJPG(details[index].image);

        return Array.from({ length: totalPieces }, (_, pieceIndex) => ({
          quantity: 1,
          size: displaySize,
          size_country: sizeCountry,
          styleNo: current.styleNo,
          comments: current.comments || "",
          price: unitPrice,
          color: current.meshColor || current.customColor,
          image: productImage,
          refImg: currentRefImages,
          meshColor: meshColorDisplay,
          beadingColor: beadingColorDisplay,
          lining: liningDisplay,
          liningColor: liningColorDisplay,
          barcode:
            rowBarcodes[pieceIndex] ||
            buildFreshPreviewBarcode(
              purchaseOrderNo,
              current.styleNo,
              index,
              pieceIndex,
            ),
        }));
      }),
    );

    return detailGroups.flat();
  };

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

    if (isEditMode) {
      const dirtyFields = form.formState.dirtyFields;

      if (!hasDirtyFields(dirtyFields) && !uploadedFile) {
        toast.info("No changes to update");
        return;
      }

      try {
        const response = await executeUpdateAsync(
          { orderType: "Fresh", orderData: dataSend, changedFields: dirtyFields },
          { headers: editPassword ? { "X-Edit-Password": editPassword } : undefined },
        );

        if (!response.success) {
          toast.error("Failed to update order");
          return;
        }

        if (uploadedFile) {
          if (!retailerOrderId) {
            throw new Error("Order ID missing for uploaded document.");
          }

          const formData = new FormData();
          formData.append("ppt", uploadedFile);
          formData.append("orderId", String(retailerOrderId));
          formData.append("source", "retailer");
          formData.append("uploadedOrderFileType", uploadedFileType ?? "");

          const uploadResponse = await fetch(`${API_URL}/upload-ppt`, {
            method: "POST",
            body: formData,
          });
          const uploadJson = await uploadResponse.json();

          if (!uploadResponse.ok || !uploadJson.success) {
            throw new Error(
              uploadJson?.message || "Order updated but the uploaded document failed to save.",
            );
          }
        }

        form.reset(data);
        setOpen(false);
        toast.success(response.message ?? "Order updated successfully");
        onSuccess?.();
        setPreviewData(null);
        router.refresh();
      } catch (err: any) {
        toast.error("Failed to update order", {
          description: err?.message ?? updateError?.message ?? "Something went wrong",
        });
      }

      return;
    }

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
        onSuccess?.();
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
        const purchaseOrderNo = response.purchaseOrderNo || data.purchaseOrderNo;
        const barcodeGroups = buildFreshBarcodeGroups(
          Array.isArray(response.createdStyles) ? response.createdStyles : [],
        );
        const finalStyles = await buildFreshPreviewDetails(
          data,
          purchaseOrderNo,
          barcodeGroups,
        );

        const preData = {
          customerId: data.customerId,
          manufacturingEmailAddress: data.manufacturingEmailAddress,
          orderCancellationDate: data.orderCancellationDate,
          orderReceivedDate: data.orderReceivedDate,
          orderType: "Fresh",
          purchaseOrderNo,
          details: finalStyles,
          total: total_state,
        };

        await FreshEmail(preData);
      } else {
        return toast.error("Failed to add order");
      }
      // await mailex({ orderData: previewData });
      form.reset();
      setOpen(false);
      toast.success(response.message ?? "Order added successfully");
      onSuccess?.();
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
      const formBarcodeGroups = new Map<string, string[]>();
      data.styles.forEach((style: any, index) => {
        const favouriteId = getFavouriteRowId(style, index);
        if (Array.isArray(style.barcodes) && style.barcodes.length) {
          formBarcodeGroups.set(favouriteId, style.barcodes);
        }
      });
      const finalStyles = await buildFreshPreviewDetails(
        data,
        data.purchaseOrderNo,
        formBarcodeGroups,
      );

      setPreviewData({
        customerId: data.customerId,
        manufacturingEmailAddress: data.manufacturingEmailAddress,
        orderCancellationDate: data.orderCancellationDate,
        orderReceivedDate: data.orderReceivedDate,
        orderType: "Fresh",
        purchaseOrderNo: data.purchaseOrderNo,
        details: finalStyles,
        total: total_state,
      });
      return;
    } catch (err) {
      console.error("❌ onPreviewSubmit ERROR →", err);
      toast.error("Failed to generate preview");
    }
  };


  const onErrors = (errors: any) => {
    toast.error(isEditMode ? "Failed to update order" : "Failed to add order", {
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
          <Button onClick={fetchData}>{triggerLabel ?? (isEditMode ? "Edit" : "Accept")}</Button>
        </SheetTrigger>
        <SheetContent className="min-w-[100%] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{isEditMode ? "Edit Retail Order" : "Add New Order"}</SheetTitle>
            <SheetDescription>
              {isEditMode
                ? "Update the fields that need to change"
                : "Fill in the form below to add order"}
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
                                    value={formatOriginalSizeDisplay(details[index])}
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
                  disabled={loading || updateLoading}
                >
                  {loading || updateLoading
                    ? "Loading..."
                    : isEditMode
                      ? "Update Order"
                      : "Create Order"}
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
                            form.setValue(`styles.${idx}.customColor`, e.target.value, {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
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
                            form.setValue(`styles.${idx}.size`, e.target.value, {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
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
                            form.setValue(`styles.${idx}.meshColor`, e.target.value, {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
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
                            form.setValue(`styles.${idx}.beadingColor`, e.target.value, {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
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
                            form.setValue(`styles.${idx}.lining`, e.target.value, {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
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
                            form.setValue(`styles.${idx}.liningColor`, e.target.value, {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
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
                          form.setValue(`styles.${idx}.comments`, e.target.value, {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
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
                          form.setValue(`styles.${idx}.quantity`, e.target.value, {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                          formChange();
                          onPreviewSubmit(form.getValues());
                        }}
                      />
                    </div>
                  </div>

                ))}

              </div>

              {/* 🔹 Download Button */}
              <div className="flex flex-wrap justify-end gap-3 py-3">
                <PDFDownloadLink
                  document={<RetailerPdf orderData={previewData} />}
                  fileName={`${previewData.purchaseOrderNo}.pdf`}
                >
                  <button className="rounded bg-blue-600 px-4 py-2 text-white shadow">
                    Download PDF
                  </button>
                </PDFDownloadLink>
                <button
                  type="button"
                  onClick={() => downloadOrderPPT(previewData)}
                  className="rounded bg-green-600 px-4 py-2 text-white shadow hover:bg-green-700"
                >
                  Download PPT
                </button>
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
