// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const LINING_OPTIONS = [
  "No Lining",
  "Fully Stitched Lining",
  "Full Separate Lining",
  "Separate Short Lining",
  "Waist to Hips Stitched Lining",
  "Waist to Hips Seperate Lining",
  "Waist to floor Stitched Lining",
  "Bust To Hips Stitched Lining",
  "Bust To Hips Seperate Lining",
] as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Colour {
  id: string | number;
  name: string;
  hexcode: string;
}

export interface Currency {
  id: string | number;
  name: string;
  code: string;
  symbol: string;
}

export interface Category {
  id: string | number;
  name: string;
}

export interface SubCategory {
  id: string | number;
  name: string;
  category: { id: number };
}

export interface CurrencyPricing {
  currency: { id: string | number };
  price: number;
}

export interface ProductData {
  id: string | number;
  productCode: string;
  price: number;
  description?: string;
  lining?: string;
  mesh_color?: string;
  beading_color?: string;
  beader?: string | null;
  lining_color?: string;
  category?: { id: number };
  subCategory?: { id: number };
  currencyPricing?: CurrencyPricing[];
}

export interface EditProductFormProps {
  categories: Category[];
  subCategories: SubCategory[];
  currencies: Currency[];
  data: ProductData;
}

// ---------------------------------------------------------------------------
// Colour fetch utility
// ---------------------------------------------------------------------------

export const fetchColours = async (): Promise<Colour[]> => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/product-colours`,
    { credentials: "include", cache: "no-store" },
  );
  if (!res.ok) throw new Error(`Colours fetch failed: ${res.statusText}`);
  const json = await res.json();
  return json?.productColours ?? [];
};

// ---------------------------------------------------------------------------
// useEditProductSheet — encapsulates all sheet/form/colours state & logic
// ---------------------------------------------------------------------------

import { useCallback, useMemo, useRef, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AddProductForm as AddProductFormType,
  addProductFormSchema,
} from "@/lib/formSchemas";
import useHttp from "@/lib/hooks/usePost";
import { fetchBeaders } from "@/lib/beaders";

export function useEditProductSheet(data: ProductData, currencies: Currency[]) {
  const [open, setOpen] = useState(false);
  const [colours, setColours] = useState<Colour[]>([]);
  const [beaders, setBeaders] = useState<any[]>([]);
  const [coloursLoading, setColoursLoading] = useState(false);
  const [coloursError, setColoursError] = useState(false);
  const [isFormInitialized, setIsFormInitialized] = useState(false);
  const [currencyComboboxOpen, setCurrencyComboboxOpen] = useState<
    Record<number, boolean>
  >({});

  const isLoadingRef = useRef(false);
  const router = useRouter();

  const currencyMap = useMemo(
    () => new Map(currencies.map((c) => [c.id.toString(), c])),
    [currencies],
  );

  const form = useForm<AddProductFormType>({
    resolver: zodResolver(addProductFormSchema),
    defaultValues: {
      productCode: "",
      productPrice: 0,
      categoryId: undefined,
      subCategoryId: undefined,
      description: "",
      currencyBasedPricing: [],
      lining: undefined,
      mesh: undefined,
      beading: undefined,
      beader: "",
      liningColor: undefined,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "currencyBasedPricing",
  });

  const { loading, error, executeAsync } = useHttp(
    `/products/product-patch/${data.id}`,
    "PATCH",
  );

  // Inside useEditProductSheet...

// 1. Create a pure reset function that doesn't care about the API status
const resetToDefault = useCallback(() => {
  form.reset({
    productCode: data.productCode || "",
    productPrice: Math.floor(data.price) || 0,
    categoryId: data.category?.id?.toString() ?? "",
    subCategoryId: data.subCategory?.id?.toString() ?? "",
    lining: data.lining ? LINING_OPTIONS.find((i) => i === data.lining) : "No Lining",
    description: data.description ?? "",
    mesh: data.mesh_color || "SAS",
    beading: data.beading_color || "SAS",
    beader: data.beader || "",
    liningColor: data.lining_color || "No Color",
    currencyBasedPricing: data.currencyPricing?.map((p) => ({
      currencyId: p.currency?.id?.toString() ?? "",
      price: Math.floor(p.price),
    })) ?? [],
  });
  setIsFormInitialized(true);
}, [data, form]);

// 2. Simplify your loading function to JUST handle the colors
const loadColours = useCallback(async () => {
  if (isLoadingRef.current) return;
  isLoadingRef.current = true;
  setColoursLoading(true);
  setColoursError(false);

  try {
    const productColours = await fetchColours();
    setColours(productColours);
  } catch {
    setColoursError(true);
  } finally {
    isLoadingRef.current = false;
    setColoursLoading(false);
  }
}, []);

const loadBeaders = useCallback(async () => {
  try {
    const productBeaders = await fetchBeaders();
    setBeaders(productBeaders);
  } catch {
    setBeaders([]);
  }
}, []);

// 3. Update handleOpenChange to trigger both
const handleOpenChange = useCallback((newOpen: boolean) => {
  setOpen(newOpen);
  if (newOpen) {
    resetToDefault(); // Fill the form fields immediately
    loadColours();    // Fetch the dropdown options in the background
    loadBeaders();
  }
}, [resetToDefault, loadColours, loadBeaders]);
  // Initialize form values from product data + fetched colours
const initializeForm = useCallback(
  (availableColours: Colour[]) => {
    // Give the Sheet DOM time to mount before resetting
    setTimeout(() => {
      form.reset({
        productCode: data.productCode || "",
        productPrice: Math.floor(data.price) || 0,
        categoryId: data.category?.id?.toString() ?? "",
        subCategoryId: data.subCategory?.id?.toString() ?? "",
        lining: data.lining
          ? LINING_OPTIONS.find((i) => i === data.lining)
          : "No Lining",
        description: data.description ?? "",
        mesh: data.mesh_color || "SAS",
        beading: data.beading_color || "SAS",
        beader: data.beader || "",
        liningColor: data.lining_color || "No Color",
        currencyBasedPricing:
          data.currencyPricing?.map((p) => ({
            currencyId: p.currency?.id?.toString() ?? "",
            price: Math.floor(p.price),
          })) ?? [],
      });
      setIsFormInitialized(true);
    }, 0);
  },
  [data, form],
);

  const loadColoursAndInitialize = useCallback(async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setColoursLoading(true);
    setColoursError(false);

    try {
      const productColours = await fetchColours();
      const productBeaders = await fetchBeaders().catch(() => []);
      setColours(productColours);
      setBeaders(productBeaders);
      initializeForm(productColours);
    } catch {
      setColoursError(true);
      initializeForm([]);
    } finally {
      isLoadingRef.current = false;
      setColoursLoading(false);
    }
  }, [initializeForm]);

  // const handleOpenChange = useCallback(
  //   (newOpen: boolean) => {
  //     setOpen(newOpen);
  //     if (newOpen) loadColoursAndInitialize();
  //   },
  //   [loadColoursAndInitialize],
  // );

  const onSubmit = useCallback(
    async (formData: AddProductFormType) => {
      if (formData.lining === "No Lining") formData.liningColor = "No Color";

      try {
        const response = await executeAsync(formData, {}, () => {
          toast.error("Failed to update Product");
        });
        form.reset();
        setOpen(false);
        toast.success(response.message ?? "Product updated successfully");
        router.refresh();
      } catch {
        toast.error("Failed to update Product", {
          description: error?.message,
        });
      }
    },
    [executeAsync, error, form, router],
  );

  const toggleCombobox = useCallback((index: number, value: boolean) => {
    setCurrencyComboboxOpen((prev) => ({ ...prev, [index]: value }));
  }, []);

  const watchedCategoryId = form.watch("categoryId");
  const watchedLining = form.watch("lining");

  const selectedCurrencyIds = useMemo(
    () => new Set(fields.map((f) => f.currencyId?.toString()).filter(Boolean)),
    [fields],
  );

  const availableCurrencies = useMemo(
    () =>
      currencies.filter(
        (c) => !selectedCurrencyIds.has(c.id.toString()) && c.code !== "EUR",
      ),
    [currencies, selectedCurrencyIds],
  );

  const showLoading = coloursLoading || !isFormInitialized;

  return {
    // sheet
    open,
    handleOpenChange,
    // colours
    colours,
    beaders,
    coloursLoading,
    coloursError,
    loadColoursAndInitialize,
    // form
    form,
    fields,
    append,
    remove,
    onSubmit,
    loading,
    showLoading,
    // derived
    watchedCategoryId,
    watchedLining,
    availableCurrencies,
    currencyMap,
    currencyComboboxOpen,
    toggleCombobox,
  };
}
