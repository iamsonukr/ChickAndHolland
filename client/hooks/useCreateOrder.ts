"use client";

import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DefaultValues,
  useFieldArray,
  useForm,
  useWatch,
} from "react-hook-form";

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
import {
  calculateRetailerStylePricing,
  resolveProductCurrencyPrice,
} from "@/lib/orderPricing";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UseCreateOrderOptions {
  customers: any[];
  ordersTotalCount: number;
  editOrder?: any;
  onSuccess?: () => void;
  editPassword?: string;
}

export type UploadedFileType = "pdf" | "ppt" | null;

const getCustomerStoreName = (customer: any) =>
  customer?.customerStoreName || customer?.storeName || customer?.name || "";

const parseJsonArray = (value: any) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string" || !value.trim()) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const getCustomSizeText = (value: any) => {
  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim();
  }

  if (value && typeof value === "object") {
    return String(value.size ?? value.value ?? value.label ?? "").trim();
  }

  return "";
};

const getCustomSizeEntries = (customSize: any, customSizesQuantity?: any) => {
  const customSizeEntries = parseJsonArray(customSize)
    .map(getCustomSizeText)
    .filter(Boolean);

  if (customSizeEntries.length) {
    return customSizeEntries;
  }

  return parseJsonArray(customSizesQuantity)
    .map(getCustomSizeText)
    .filter(Boolean);
};

const getPositivePieceCount = (quantity: unknown) => {
  const numericQuantity = Math.trunc(Number(quantity));
  return Number.isFinite(numericQuantity) && numericQuantity > 0
    ? numericQuantity
    : 0;
};

const toDateValue = (value: any) => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const hasDirtyFields = (dirtyFields: any): boolean => {
  if (!dirtyFields || typeof dirtyFields !== "object") return false;
  return Object.values(dirtyFields).some((value) =>
    value === true ? true : hasDirtyFields(value),
  );
};

const getFirstFormErrorMessage = (errors: any): string | undefined => {
  if (!errors || typeof errors !== "object") return undefined;
  if (typeof errors.message === "string") return errors.message;

  for (const value of Object.values(errors)) {
    const message = getFirstFormErrorMessage(value);
    if (message) return message;
  }

  return undefined;
};

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

function getCustomerCurrencyId(customer?: any) {
  return customer?.currencyId ?? customer?.currency?.id ?? null;
}

function appendStylePricingFormData(
  fd: FormData,
  style: CreateOrderForm["styles"][number],
  index: number,
  productDetails: any,
  customer?: any,
) {
  if (!productDetails) return;

  const resolvedPrice = resolveProductCurrencyPrice(
    productDetails,
    getCustomerCurrencyId(customer),
  );
  const pricing = calculateRetailerStylePricing({
    basePrice: resolvedPrice.amount,
    size: style.size,
    quantity: style.quantity,
    customSizesQuantity: style.customSizesQuantity,
  });

  fd.append(`styles[${index}].unitPrice`, pricing.unitPrice.toFixed(2));
  fd.append(`styles[${index}].subtotal`, pricing.subtotal.toFixed(2));
  fd.append(`styles[${index}].discount`, pricing.discount.toFixed(2));
  fd.append(`styles[${index}].totalPrice`, pricing.total.toFixed(2));
  fd.append(
    `styles[${index}].currencyId`,
    resolvedPrice.currencyId == null ? "" : String(resolvedPrice.currencyId),
  );
  fd.append(`styles[${index}].currencyCode`, resolvedPrice.currencyCode ?? "");
  fd.append(
    `styles[${index}].currencySymbol`,
    resolvedPrice.currencySymbol ?? "",
  );
}

function appendStyleFormData(
  fd: FormData,
  style: CreateOrderForm["styles"][number],
  index: number,
  detailsMap: Map<string, any>,
  customer?: any,
) {
  const productDetails = detailsMap.get(style.styleNo?.[0]?.value ?? "");
  const sas = (val: string | undefined, fallback: string | undefined) =>
    val === "SAS" ? (fallback ?? "") : (val ?? "");

  if (style.styleId) fd.append(`styles[${index}].id`, String(style.styleId));
  fd.append(`styles[${index}].styleNo`, style.styleNo?.[0]?.value ?? "");
  fd.append(`styles[${index}].colorType`, style.colorType);
  fd.append(`styles[${index}].beading`, sas(style.beading, productDetails?.beading_color));
  fd.append(`styles[${index}].mesh`, sas(style.mesh, productDetails?.mesh_color));
  fd.append(`styles[${index}].lining`, sas(style.lining, productDetails?.lining));
  fd.append(`styles[${index}].liningColor`, sas(style.liningColor, productDetails?.lining_color));
  fd.append(`styles[${index}].customColor`, JSON.stringify(style.customColor?.map((c) => c.value) ?? []));
  fd.append(`styles[${index}].sizeCountry`, style.sizeCountry);
  fd.append(`styles[${index}].size`, style.size);
  fd.append(
    `styles[${index}].customSize`,
    JSON.stringify(
      (style.customSize ?? [])
        .map((size: any) => getCustomSizeText(size))
        .filter(Boolean),
    ),
  );
  fd.append(`styles[${index}].quantity`, style.quantity ?? "");
  fd.append(
    `styles[${index}].comments`,
    JSON.stringify(style.comments?.map((comment) => comment.trim()).filter(Boolean) ?? []),
  );
  fd.append(`styles[${index}].customSizesQuantity`, JSON.stringify(style.customSizesQuantity));
  appendStylePricingFormData(fd, style, index, productDetails, customer);

  if (style.modifiedPhotoImage) {
    Array.from(style.modifiedPhotoImage).forEach((file: any) => {
      fd.append(`styles[${index}].modifiedPhotoImage`, file);
    });
  }
}

export function appendStylesFormData(
  fd: FormData,
  styles: CreateOrderForm["styles"],
  detailsMap: Map<string, any>,
  customer?: any,
) {
  styles.forEach((style, index) =>
    appendStyleFormData(fd, style, index, detailsMap, customer),
  );
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

  const buildPreviewStylePieces = (style: any) => {
    const customSizeRows = parseJsonArray(style.customSizesQuantity)
      .map((sizeRow: any) => ({
        ...sizeRow,
        quantity: getPositivePieceCount(sizeRow?.quantity),
      }))
      .filter((sizeRow: any) => sizeRow.quantity > 0);

    if (customSizeRows.length > 0) {
      return customSizeRows.flatMap((sizeRow: any) => {
        const size = getCustomSizeText(sizeRow) || style.size;

        return Array.from({ length: sizeRow.quantity }, () => ({
          ...style,
          size,
          quantity: 1,
          customSize: [],
          customSizesQuantity: [],
        }));
      });
    }

    const quantity = getPositivePieceCount(style.quantity);

    if (quantity <= 1) {
      return [
        {
          ...style,
          quantity: quantity || Number(style.quantity || 0),
        },
      ];
    }

    return Array.from({ length: quantity }, () => ({
      ...style,
      quantity: 1,
    }));
  };

  const previewStyles = (responseOrders[0]?.styles ?? []).flatMap(
    buildPreviewStylePieces,
  );

  const loop = previewStyles.map((currentItem: any, index: number) => {
    const customSizesQuantity = parseJsonArray(currentItem.customSizesQuantity);
    const customSizeEntries = getCustomSizeEntries(
      currentItem.customSize,
      customSizesQuantity,
    );
    const isCustomSize =
      String(currentItem.size ?? "").trim().toLowerCase() === "custom";
    const hasCustomSizeEntries = isCustomSize && customSizeEntries.length > 0;

    return {
      quantity:
        customSizesQuantity.length < 1
          ? currentItem.quantity
          : customSizesQuantity.reduce(
              (sum: number, item: any) => sum + Number(item.quantity),
              0,
            ),
      size: hasCustomSizeEntries
        ? "Custom"
        : customSizesQuantity.length < 1
          ? `${currentItem.size}/${currentItem.quantity}`
          : customSizesQuantity.map((i: any) => `${i.size}/${i.quantity}`).join(", "),
      customSize: customSizeEntries,
      customSizesQuantity,
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
    };
  });

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

export function useCreateOrder({
  customers,
  ordersTotalCount,
  editOrder,
  onSuccess,
  editPassword,
}: UseCreateOrderOptions) {
  const router = useRouter();
  const isEditMode = Boolean(editOrder?.id);
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
  const {
    loading: updateLoading,
    error: updateError,
    executeAsync: executeUpdateAsync,
  } = useHttp(`/orders/${editOrder?.id ?? ""}`, "PATCH");
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
  const buildEmptyStyle = (): CreateOrderForm["styles"][number] => ({
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
  });

  const mapStyleToFormValue = (style: any): CreateOrderForm["styles"][number] => {
    const styleNo = String(style?.styleNo ?? "");
    const customSizesQuantity = parseJsonArray(style?.customSizesQuantity);
    const customSize = parseJsonArray(style?.customSize);
    const customColor = parseJsonArray(style?.customColor);
    const comments = parseJsonArray(style?.comments);
    const hasCustomSizes = customSizesQuantity.length > 0;

    return {
      styleId: style?.id,
      styleNo: styleNo
        ? ([
            {
              value: styleNo,
              label: styleNo,
              mesh: style?.mesh_color,
              beading: style?.beading_color,
              lining: style?.lining,
              liningColor: style?.lining_color,
            },
          ] as any)
        : [],
      colorType: style?.colorType || colorTypeArray[0].value,
      customColor: customColor.map((value: any) => ({
        value: String(value),
        label: String(value),
      })),
      sizeCountry: style?.sizeCountry || sizeCountryArray[0].value,
      size: hasCustomSizes ? "Custom" : String(style?.size ?? ""),
      customSize: (hasCustomSizes ? customSizesQuantity : customSize).map(
        (value: any) => {
          const sizeValue = typeof value === "object" ? value.size : value;
          return {
            value: String(sizeValue ?? ""),
            label: String(sizeValue ?? ""),
          };
        },
      ),
      quantity: style?.quantity != null ? String(style.quantity) : "",
      customSizesQuantity: customSizesQuantity.map((item: any) => ({
        size: String(item?.size ?? ""),
        quantity: String(item?.quantity ?? ""),
      })),
      comments: comments.map((comment: any) => String(comment)),
      beading: style?.beading_color || "SAS",
      lining: style?.lining || "SAS",
      liningColor: style?.lining_color || "SAS",
      mesh: style?.mesh_color || "SAS",
      addLining:
        Boolean(style?.lining) &&
        !["SAS", "No Lining"].includes(String(style.lining)),
    };
  };

  const buildDefaultValues = (): DefaultValues<CreateOrderForm> => {
    if (isEditMode) {
      const orderCustomer = editOrder?.customer;
      const customerOption =
        orderCustomer?.id != null
          ? [
              {
                value: String(orderCustomer.id),
                label: getCustomerStoreName(orderCustomer),
              },
            ]
          : [];

      return {
        purchaseOrderNo: editOrder?.purchaeOrderNo ?? "",
        manufacturingEmailAddress:
          editOrder?.manufacturingEmailAddress ?? "rubyinc@hotmail.com",
        orderType: editOrder?.orderType || orderTypeArrayState[0].value,
        orderReceivedDate: toDateValue(editOrder?.orderReceivedDate) ?? new Date(),
        orderCancellationDate: toDateValue(editOrder?.orderCancellationDate),
        address: editOrder?.address ?? "",
        customerId: customerOption,
        styles: editOrder?.styles?.length
          ? editOrder.styles.map(mapStyleToFormValue)
          : [buildEmptyStyle()],
      };
    }

    return {
      purchaseOrderNo: `PO# ${fallbackSequence}`,
      manufacturingEmailAddress: "rubyinc@hotmail.com",
      orderType: orderTypeArrayState[0].value,
      orderReceivedDate: new Date(),
      orderCancellationDate: undefined,
      address: "",
      customerId: [],
      styles: [buildEmptyStyle()],
    };
  };

  const form = useForm<CreateOrderForm>({
    resolver: zodResolver(createOrderFormSchema),
    defaultValues: buildDefaultValues(),
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "styles",
  });

  const fullComponentWatch = form.watch("styles");

  useEffect(() => {
    if (!isEditMode || !open) return;

    form.reset(buildDefaultValues());
    setPreviewData(null);
    clearUploadedFile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, open, editOrder?.id]);

  // ── PO number generation ────────────────────────────────────────────────────
  const watchCustomerName = useWatch({ control: form.control, name: "customerId" });
  const selectedCustomer = useMemo(() => {
    const selectedCustomerId = watchCustomerName?.[0]?.value;
    if (!selectedCustomerId) return null;

    return (
      customers.find((customer) => String(customer.id) === String(selectedCustomerId)) ??
      null
    );
  }, [customers, watchCustomerName]);

  const generatePO = useCallback(async () => {
    if (isEditMode) {
      return;
    }

    if (form.getFieldState("purchaseOrderNo").isDirty) {
      return;
    }

    const selected = form.getValues("customerId");
    if (!selected || selected.length < 1) {
      form.setValue("purchaseOrderNo", `PO# ${fallbackSequence}`, {
        shouldDirty: false,
        shouldValidate: true,
      });
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

      form.setValue("purchaseOrderNo", `PO#${prefix} ${nextSequence}`, {
        shouldDirty: false,
        shouldValidate: true,
      });
    } catch {
      form.setValue("purchaseOrderNo", `PO#${prefix} ${fallbackSequence}`, {
        shouldDirty: false,
        shouldValidate: true,
      });
    }
  }, [fallbackSequence, form, isEditMode]);

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
              ...details,
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

  useEffect(() => {
    ensureProductDetailsLoaded(fullComponentWatch);
  }, [ensureProductDetailsLoaded, fullComponentWatch]);

  // ── onSubmit ────────────────────────────────────────────────────────────────
  const submitOrder = async (
    data: CreateOrderForm,
    publishStatus?: "published" | "draft",
  ) => {
    const detailsMap = await ensureProductDetailsLoaded(data.styles);
    const orderCustomer =
      customers.find(
        (customer) => String(customer.id) === String(data.customerId?.[0]?.value),
      ) ?? selectedCustomer;

    if (isEditMode) {
      const dirtyFields = form.formState.dirtyFields as any;
      const isChangingPublishStatus = Boolean(
        publishStatus && publishStatus !== editOrder?.publishStatus,
      );
      const originalStyleIds = (editOrder?.styles ?? [])
        .map((style: any) => Number(style?.id))
        .filter(Boolean);
      const currentStyleIds = data.styles
        .map((style) => Number(style?.styleId))
        .filter(Boolean);
      const deleteStyleIds = originalStyleIds.filter(
        (id: number) => !currentStyleIds.includes(id),
      );
      const hasUploadedStyleImage = data.styles.some(
        (style) => style.modifiedPhotoImage?.length,
      );

      if (
        !hasDirtyFields(dirtyFields) &&
        deleteStyleIds.length === 0 &&
        !uploadedFile &&
        !hasUploadedStyleImage &&
        !isChangingPublishStatus
      ) {
        toast.info("No changes to update");
        return;
      }

      const fd = new FormData();

      if (dirtyFields.purchaseOrderNo) fd.append("purchaseOrderNo", data.purchaseOrderNo);
      if (dirtyFields.manufacturingEmailAddress) {
        fd.append("manufacturingEmailAddress", data.manufacturingEmailAddress);
      }
      if (dirtyFields.orderType) fd.append("orderType", data.orderType);
      if (dirtyFields.address) fd.append("address", data.address ?? "");
      if (dirtyFields.customerId) {
        fd.append("customerId", data.customerId?.[0]?.value ?? "");
      }
      if (dirtyFields.orderReceivedDate) {
        appendDateField(fd, "orderReceivedDate", data.orderReceivedDate);
      }
      if (dirtyFields.orderCancellationDate) {
        appendDateField(fd, "orderCancellationDate", data.orderCancellationDate);
      }
      if (deleteStyleIds.length) {
        fd.append("deleteStyleIds", JSON.stringify(deleteStyleIds));
      }
      if (publishStatus) fd.append("publishStatus", publishStatus);

      data.styles.forEach((style, index) => {
        const styleDirty = dirtyFields.styles?.[index];
        const isNewStyle = !style.styleId;
        const hasNewImages = Boolean(style.modifiedPhotoImage?.length);

        if (!isNewStyle && !styleDirty && !hasNewImages && !dirtyFields.customerId) {
          return;
        }
        appendStyleFormData(fd, style, index, detailsMap, orderCustomer);
      });

      if (uploadedFile) {
        fd.append("uploadedOrderFile", uploadedFile);
        fd.append("uploadedOrderFileType", uploadedFileType ?? "");
      }

      try {
        const response = await executeUpdateAsync(
          fd,
          { headers: editPassword ? { "X-Edit-Password": editPassword } : undefined },
          (err) => {
            toast.error("Failed to update order", {
              description: err?.message ?? "Something went wrong",
            });
          },
        );

        if (!response.success) {
          toast.error("Failed to update order");
          return;
        }

        form.reset(data);
        setOpen(false);
        clearUploadedFile();
        toast.success(
          response.message ??
            (publishStatus === "draft" ? "Draft saved successfully" : "Order updated successfully"),
        );
        onSuccess?.();
        setPreviewData(null);
        router.refresh();
      } catch {
        toast.error("Failed to update order", {
          description: updateError?.message ?? "Something went wrong",
        });
      }
      return;
    }

    const fd = buildSharedFormData(data);
    if (publishStatus) fd.append("publishStatus", publishStatus);
    appendDateField(fd, "orderReceivedDate", data.orderReceivedDate);
    appendDateField(fd, "orderCancellationDate", data.orderCancellationDate);
    appendStylesFormData(fd, data.styles, detailsMap, orderCustomer);

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

      if (!response.success) {
        toast.error("Failed to add order");
        return;
      }

      form.reset();
      setOpen(false);
      clearUploadedFile();
      toast.success(
        response.message ??
          (publishStatus === "draft" ? "Draft saved successfully" : "Order added successfully"),
      );
      onSuccess?.();
      setPreviewData(null);
      router.refresh();
    } catch {
      toast.error("Failed to add order", {
        description: error?.message ?? "Something went wrong",
      });
    }
  };

  const onSubmit = async (data: CreateOrderForm) => submitOrder(data);
  const onSaveDraft = async (data: CreateOrderForm) => submitOrder(data, "draft");

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
    const orderCustomer =
      customers.find(
        (customer) => String(customer.id) === String(data.customerId?.[0]?.value),
      ) ?? selectedCustomer;
    appendStylesFormData(fd, data.styles, detailsMap, orderCustomer);

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
  const onErrors = (errors?: any) => {
    toast.error(isEditMode ? "Failed to update order" : "Failed to add order", {
      description:
        getFirstFormErrorMessage(errors) ??
        "Make sure all fields are filled correctly",
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
    selectedCustomer,
    productDetailsByStyleNo: eachStyleProductDetails,
    // helpers
    getColourBasedOnId,
    getColourBasedOnhex,
    // actions
    onSubmit,
    onSaveDraft,
    onPreviewSubmit,
    onErrors,
    addStyle,
    // loading
    loading: isEditMode ? updateLoading : loading,
    previewLoading,
  };
}
