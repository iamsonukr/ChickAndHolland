"use client";
import { useState, useMemo, useEffect } from "react";
import { StatsDisplay } from "./StatsDisplay";

export default function DashboardClient({ data }) {
  const [selectedCurrency, setSelectedCurrency] = useState("USD");

  useEffect(() => {
    console.log("🔥 RAW BACKEND REVENUE:", data.revenue);
  }, [data]);

  const currencyRates = {
    INR: 1,
    USD: 83.2,
    EUR: 90.3,
    GBP: 105,
  };

  const convert = (amount: number) => {
    return amount / currencyRates[selectedCurrency];
  };

  const convertedTotal = useMemo(() => convert(data?.revenue?.total || 0), [
    data.revenue,
    selectedCurrency,
  ]);

  const convertedPaid = useMemo(() => convert(data?.revenue?.paid || 0), [
    data.revenue,
    selectedCurrency,
  ]);

  const convertedPending = useMemo(() => convert(data?.revenue?.pending || 0), [
    data.revenue,
    selectedCurrency,
  ]);

  return (
    <StatsDisplay
      data={{
        ...data,
        selectedCurrency,
        convertedTotal,
        convertedPaid,
        convertedPending,
        onCurrencyChange: setSelectedCurrency,
      }}
    />
  );
}
