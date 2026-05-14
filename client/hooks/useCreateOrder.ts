"use client";

import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";

import useHttp from "@/lib/hooks/usePost";
import {
  CreateOrderForm,
  createOrderFormSchema,
  ColorType,
  OrderType,
  SizeCountry,
} from "@/lib/formSchemas";
import {
  getLatestRegularOrder,
  getProductColours,
  getProductDetailsByProductCode,
} from "@/lib/data";
import { Option } from "@/components/custom/multi-selector";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UseCreateOrderOptions {
  customers: any[];
  ordersTotalCount: number;
}

export type UploadedFileType = "pdf" | "ppt" | null;

const getCustomerStoreName = (customer: any) =>
  customer?.customerStoreName || customer?.storeName || customer?.name || "";

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function getTrailingPoNumber(poNumber?: string | null) {
  const match = poNumber?.match(/(\d+)\s*$/);
  return match ? Number(match[1]) : 0;
}

export function buildSharedFormData(data: CreateOrderForm): FormData {
  const fd = new FormData();
  fd.append("purchaseOrderNo", data.purchaseOrderNo);
  fd.append("manufacturingEmailAddress", data.manufacturingEmailAddress);
  fd.append("orderType", data.orderType);
  fd.append("address", data.address ?? "");
  fd.append("customerId", data.customerId?.[0]?.value ?? "");
  return fd;
}

function appendDateField(
  fd: FormData,
  fieldName: string,
  value: Date | null | undefined,
  serializer: "string" | "iso" = "string",
) {
  if (!value || Number.isNaN(value.getTime())) return;

  fd.append(
    fieldName,
    serializer === "iso" ? value.toISOString() : value.toString(),
  );
}

export function appendStylesFormData(
  fd: FormData,
  styles: CreateOrderForm["styles"],
  detailsMap: Map<string, any>,
) {
  styles.forEach((style, index) => {
    const productDetails = detailsMap.get(style.styleNo?.[0]?.value ?? "");
    const sas = (val: string | undefined, fallback: string | undefined) =>
      val === "SAS" ? (fallback ?? "") : (val ?? "");

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
    fd.append(
      `styles[${index}].comments`,
      JSON.stringify(style.comments?.map((comment) => comment.trim()).filter(Boolean) ?? []),
    );
    fd.append(`styles[${index}].customSizesQuantity`, JSON.stringify(style.customSizesQuantity));

    if (style.modifiedPhotoImage) {
      Array.from(style.modifiedPhotoImage).forEach((file: any) => {
        fd.append(`styles[${index}].modifiedPhotoImage`, file);
      });
    }
  });
}

export function buildPreviewData(
  data: CreateOrderForm,
  responseOrders: any[],
  getColourBasedOnhex: (hex: string) => string | undefined,
) {
  const buildTemporaryPreviewBarcode = (
    purchaseOrderNo: string,
    styleNo?: string | null,
    index?: number,
  ) => {
    const previewSequence = String((index ?? 0) + 1).padStart(2, "0");
    return `${purchaseOrderNo}-${styleNo ?? "STYLE"}-PREVIEW-${previewSequence}`;
  };

  const resolvePreviewColour = (
    value?: string | null,
    sampleValue?: string | null,
  ) => {
    if (!value || value === "SAS") return "SAS";

    const resolvedValue = getColourBasedOnhex(value) ?? value;
    const isSameAsSample =
      sampleValue &&
      typeof sampleValue === "string" &&
      value.toLowerCase() === sampleValue.toLowerCase();

    return isSameAsSample ? `SAS(${resolvedValue})` : resolvedValue;
  };

  const loop = responseOrders[0].styles.map((currentItem: any, index: number) => ({
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
    barcode:
      currentItem.barcode ??
      buildTemporaryPreviewBarcode(
        data.purchaseOrderNo,
        currentItem.styleNo,
        index,
      ),
    meshColor: resolvePreviewColour(
      currentItem.meshColor ?? currentItem.mesh,
      currentItem.product?.mesh_color,
    ),
    beadingColor: resolvePreviewColour(
      currentItem.beadingColor ?? currentItem.beading,
      currentItem.product?.beading_color,
    ),
    lining: currentItem.lining,
    liningColor: resolvePreviewColour(
      currentItem.liningColor,
      currentItem.product?.lining_color,
    ),
    refImg: currentItem.photoUrls,
  }));

  return {
    customerId: data.customerId,
    manufacturingEmailAddress: data.manufacturingEmailAddress,
    orderCancellationDate: data.orderCancellationDate,
    orderReceivedDate: data.orderReceivedDate ?? new Date(),
    orderType: data.orderType,
    purchaseOrderNo: data.purchaseOrderNo,
    details: loop,
  };
}

/** Resolve a stable "pdf" | "ppt" | null tag from a File object. */
export function resolveFileType(file: File): UploadedFileType {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return "pdf";
  if (name.endsWith(".ppt") || name.endsWith(".pptx")) return "ppt";
  return null;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCreateOrder({ customers, ordersTotalCount }: UseCreateOrderOptions) {
  const router = useRouter();
  const fallbackSequence = Math.max(1, Number(ordersTotalCount) + 1 || 1);

  // ── Derived arrays ──────────────────────────────────────────────────────────
  const colorTypeArray = Object.entries(ColorType).map(([key, value]) => ({
    value: key as keyof typeof ColorType,
    label: value,
  }));

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
  const [eachStyleProductDetails, setEachStyleProductDetails] = useState(
    new Map<string, any>(),
  );

  // ── Uploaded file state ─────────────────────────────────────────────────────
  // Holds the raw File the user drops/selects. null means "use generated output".
  const [uploadedFile, setUploadedFileRaw] = useState<File | null>(null);
  const [uploadedFileType, setUploadedFileType] = useState<UploadedFileType>(null);
  // Object URL for in-browser preview (PDF iframe). Revoked on change / unmount.
  const [uploadedFileObjectUrl, setUploadedFileObjectUrl] = useState<string | null>(null);

  const setUploadedFile = useCallback((file: File | null) => {
    // Always revoke the previous object URL before creating a new one.
    setUploadedFileObjectUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
    setUploadedFileRaw(file);
    setUploadedFileType(file ? resolveFileType(file) : null);
  }, []);

  const clearUploadedFile = useCallback(() => setUploadedFile(null), [setUploadedFile]);

  // Revoke object URL when the hook unmounts.
  useEffect(() => {
    return () => {
      setUploadedFileObjectUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, []);

  // ── HTTP hooks ──────────────────────────────────────────────────────────────
  const { loading, error, executeAsync } = useHttp("/orders");
  const { loading: previewLoading, executeAsync: executePreviewAsync } = useHttp("/orders/preview");

  // ── Colour helpers ──────────────────────────────────────────────────────────
  const getColourBasedOnId = useCallback(
    (id: number) => colors.find((c: any) => c.id === id)?.hexcode as string | undefined,
    [colors],
  );

  const getColourBasedOnhex = useCallback(
    (hex: string) => colors.find((c: any) => c.hexcode === hex)?.name as string | undefined,
    [colors],
  );

  // ── Derived customer options ────────────────────────────────────────────────
  const formattedCustomers: Option[] = customers.map((c) => ({
    value: c.id.toString(),
    label: getCustomerStoreName(c),
  }));

  // ── Form ────────────────────────────────────────────────────────────────────
  const form = useForm<CreateOrderForm>({
    resolver: zodResolver(createOrderFormSchema),
    defaultValues: {
      purchaseOrderNo: `PO# ${fallbackSequence}`,
      manufacturingEmailAddress: "rubyinc@hotmail.com",
      orderType: orderTypeArrayState[0].value,
      orderReceivedDate: new Date(),
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

  const fullComponentWatch = form.watch("styles");

  // ── PO number generation ────────────────────────────────────────────────────
  const watchCustomerName = useWatch({ control: form.control, name: "customerId" });

  const generatePO = useCallback(async () => {
    const selected = form.getValues("customerId");
    if (!selected || selected.length < 1) {
      form.setValue("purchaseOrderNo", `PO# ${fallbackSequence}`);
      return;
    }

    const customerStoreName = selected[0].label ?? "";
    const prefix = customerStoreName
      .split(" ")[0]
      .replace(/[^A-Za-z]/g, "")
      .toUpperCase();

    try {
      const latestPO = await getLatestRegularOrder();
      const latestSequence = getTrailingPoNumber(latestPO?.purchaeOrderNo);
      const nextSequence = latestSequence > 0 ? latestSequence + 1 : fallbackSequence;

      form.setValue("purchaseOrderNo", `PO#${prefix} ${nextSequence}`);
    } catch {
      form.setValue("purchaseOrderNo", `PO#${prefix} ${fallbackSequence}`);
    }
  }, [fallbackSequence, form]);

  useEffect(() => {
    generatePO();
  }, [watchCustomerName, generatePO]);

  // ── Load product colours on mount ───────────────────────────────────────────
  useEffect(() => {
    getProductColours({}).then((res) => setColors(res.productColours ?? []));
  }, []);

  // ── Auto-preview on watched fields change ───────────────────────────────────
  // When the user has uploaded their own file we skip auto-generation entirely —
  // the shell will render the upload instead.
  const watchedForm = useWatch({ control: form.control });

  useEffect(() => {
    if (uploadedFile) return; // user supplied their own file — skip generation
    if (!watchedForm?.orderReceivedDate) return;
    if (!form.formState.isValid) return;

    const timeout = setTimeout(() => {
      onPreviewSubmit(form.getValues());
    }, 900);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    uploadedFile,
    watchedForm,
    form.formState.isValid,
  ]);

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

  // ── onSubmit ────────────────────────────────────────────────────────────────
  const onSubmit = async (data: CreateOrderForm) => {
    const detailsMap = await ensureProductDetailsLoaded(data.styles);
    const fd = buildSharedFormData(data);
    appendDateField(fd, "orderReceivedDate", data.orderReceivedDate);
    appendDateField(fd, "orderCancellationDate", data.orderCancellationDate);
    appendStylesFormData(fd, data.styles, detailsMap);

    // If the user supplied their own file, attach it so the backend can store
    // it directly instead of generating a PDF/PPT server-side.
    if (uploadedFile) {
      fd.append("uploadedOrderFile", uploadedFile);
      fd.append("uploadedOrderFileType", uploadedFileType ?? "");
    }

    try {
      const response = await executeAsync(fd, {}, (err) => {
        toast.error("Failed to add order", {
          description: err?.message ?? "Something went wrong",
        });
      });

      if (!response.success) return toast.error("Failed to add order");

      form.reset();
      setOpen(false);
      clearUploadedFile();
      toast.success(response.message ?? "Order added successfully");
      setPreviewData(null);
      router.refresh();
    } catch {
      toast.error("Failed to add order", {
        description: error?.message ?? "Something went wrong",
      });
    }
  };

  // ── onPreviewSubmit ─────────────────────────────────────────────────────────
  const onPreviewSubmit = async (data: CreateOrderForm) => {
    const detailsMap = await ensureProductDetailsLoaded(data.styles);
    const fd = buildSharedFormData(data);
    appendDateField(fd, "orderReceivedDate", data.orderReceivedDate, "iso");
    appendDateField(
      fd,
      "orderCancellationDate",
      data.orderCancellationDate,
      "iso",
    );
    appendStylesFormData(fd, data.styles, detailsMap);

    try {
      const response = await executePreviewAsync(fd, {}, (err) => {
        toast.error("Failed to preview order", {
          description: err?.message ?? "Something went wrong",
        });
      });

      if (response.success) {
        setPreviewData(buildPreviewData(data, response.orders, getColourBasedOnhex));
        setOpen(true);
      } else {
        toast.error("Failed to preview order");
      }
    } catch {
      toast.error("Failed to preview order", {
        description: error?.message ?? "Something went wrong",
      });
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

  return {
    // form
    form,
    fields,
    remove,
    fullComponentWatch,
    // state
    open,
    setOpen,
    previewData,
    colors,
    customOrderType,
    setCustomOrderType,
    orderTypeArrayState,
    setOrderTypeArrayState,
    // upload
    uploadedFile,
    uploadedFileType,
    uploadedFileObjectUrl,
    setUploadedFile,
    clearUploadedFile,
    // derived
    colorTypeArray,
    sizeCountryArray,
    formattedCustomers,
    // helpers
    getColourBasedOnId,
    getColourBasedOnhex,
    // actions
    onSubmit,
    onPreviewSubmit,
    onErrors,
    addStyle,
    // loading
    loading,
    previewLoading,
  };
}
