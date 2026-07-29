"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatSizeWithCountryLabel } from "@/lib/sizeConversion";

type CurrencyOption = {
  id: number | string;
  code?: string;
  name?: string;
  symbol?: string;
};

type SizeSelectorProps = {
  currencies?: CurrencyOption[];
  currentCurrencyId?: number | string;
  syncCurrency?: boolean;
};

const sizeCurrencyCode: Record<string, string> = {
  EU: "EUR",
  IT: "EUR",
  US: "USD",
  UK: "GBP",
};

const sizeSystems = new Set(Object.keys(sizeCurrencyCode));
const stockSizeSystemCookieName = "stockSizeSystem";

const getCookieValue = (name: string) => {
  if (typeof document === "undefined") return undefined;

  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
    ?.split("=")[1];
};

const setCookieValue = (name: string, value: string) => {
  document.cookie = `${name}=${encodeURIComponent(
    value,
  )}; path=/; max-age=31536000; SameSite=Lax`;
};

const sizeSystemForCurrency = (currency?: CurrencyOption) => {
  const code = currency?.code?.toUpperCase();

  if (code === "USD") return "US";
  if (code === "GBP") return "UK";

  return "EU";
};

export default function SizeSelector({
  currencies = [],
  currentCurrencyId,
  syncCurrency = false,
}: SizeSelectorProps) {
  const router = useRouter();
  const currentCurrency = currencies.find(
    (currency) => String(currency.id) === String(currentCurrencyId),
  );
  const currentCurrencyCode = currentCurrency?.code?.toUpperCase();
  const currentCurrencySizeSystem = sizeSystemForCurrency(currentCurrency);
  const [type, setType] = useState(() =>
    syncCurrency ? currentCurrencySizeSystem : "EU",
  );

  useEffect(() => {
    if (!syncCurrency) return;

    const savedSizeSystem = getCookieValue(stockSizeSystemCookieName);

    if (
      savedSizeSystem &&
      sizeSystems.has(savedSizeSystem) &&
      sizeCurrencyCode[savedSizeSystem] === currentCurrencyCode
    ) {
      setType(savedSizeSystem);
      setCookieValue(stockSizeSystemCookieName, savedSizeSystem);
      return;
    }

    setType(currentCurrencySizeSystem);
    setCookieValue(stockSizeSystemCookieName, currentCurrencySizeSystem);
  }, [
    currentCurrency?.id,
    currentCurrencyCode,
    currentCurrencySizeSystem,
    syncCurrency,
  ]);

  useEffect(() => {
    const all = document.querySelectorAll(".size-convert");

    all.forEach((td) => {
      const size = td.getAttribute("data-eu");
      const from = td.getAttribute("data-from") || "EU";

      td.textContent = formatSizeWithCountryLabel(
        {
          size,
          size_country: from,
        },
        type,
      );
    });
  }, [type]);

  const handleTypeChange = (value: string) => {
    setType(value);

    if (!syncCurrency) return;

    setCookieValue(stockSizeSystemCookieName, value);

    const currencyCode = sizeCurrencyCode[value];
    const selectedCurrency = currencies.find(
      (currency) => currency.code?.toUpperCase() === currencyCode,
    );

    if (!selectedCurrency) return;

    setCookieValue("currencyId", String(selectedCurrency.id));
    router.refresh();
  };

  return (
    <div className="flex flex-col sm:flex-row sm:justify-end sm:items-center gap-2 sm:gap-3">

      <p className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-neutral-100 bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 rounded-md border border-neutral-300 dark:border-neutral-700 shadow-sm">
        🌍 Please select the country based on your size
      </p>

      <Select value={type} onValueChange={handleTypeChange}>
        <SelectTrigger className="w-full sm:w-[200px] bg-white dark:bg-neutral-900 border border-neutral-400 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100">
          <SelectValue placeholder="Select size system" />
        </SelectTrigger>

        <SelectContent className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700">
          <SelectItem value="EU">🇪🇺 Europe</SelectItem>
          <SelectItem value="US">🇺🇸 United States</SelectItem>
          <SelectItem value="UK">🇬🇧 United Kingdom</SelectItem>
          <SelectItem value="IT">🇮🇹 Italy</SelectItem>
        </SelectContent>
      </Select>

    </div>
  );
}
