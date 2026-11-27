"use client";
import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { API_URL } from "@/lib/constants";
import { getCookie } from "@/lib/utils";

type SalesByCurrency = {
  currencyId?: number;
  currencyCode: string;
  currencyName?: string;
  currencySymbol?: string;
  totalSales: number;
  orderCount?: number;
};

const fallbackCurrencies: SalesByCurrency[] = [
  {
    currencyCode: "INR",
    currencyName: "Indian Rupee",
    totalSales: 0,
    orderCount: 0,
  },
  {
    currencyCode: "USD",
    currencyName: "US Dollar",
    totalSales: 0,
    orderCount: 0,
  },
  {
    currencyCode: "EUR",
    currencyName: "Euro",
    totalSales: 0,
    orderCount: 0,
  },
];

const getSalesByCurrency = (data: any): SalesByCurrency[] => {
  if (
    !Array.isArray(data?.salesByCurrency) ||
    data.salesByCurrency.length === 0
  ) {
    return fallbackCurrencies;
  }

  return data.salesByCurrency.map((item: any) => ({
    currencyId: Number(item.currencyId || 0),
    currencyCode: String(item.currencyCode || "").toUpperCase(),
    currencyName: item.currencyName,
    currencySymbol: item.currencySymbol,
    totalSales: Number(item.totalSales || 0),
    orderCount: Number(item.orderCount || 0),
  }));
};

const formatCurrency = (
  value: number,
  currencyCode: string,
  currencySymbol?: string,
) => {
  const amount = Number.isFinite(Number(value)) ? Number(value) : 0;

  try {
    return Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currencySymbol || currencyCode} ${Intl.NumberFormat("en-US", {
      maximumFractionDigits: 2,
    }).format(amount)}`;
  }
};

export default function RevenueSummary({
  dateRange,
}: {
  dateRange?: { startDate: string; endDate: string };
}) {
  const [sales, setSales] = useState<SalesByCurrency[] | null>(null);
  const [showPasswordBox, setShowPasswordBox] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const salesByCurrency = getSalesByCurrency({ salesByCurrency: sales });
  const selectedSale =
    salesByCurrency.find((sale) => sale.currencyCode === selectedCurrency) ||
    salesByCurrency[0];
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [sessionToken, setSessionToken] = useState("");
  const [checking, setChecking] = useState(true);
  const startDate = dateRange?.startDate;
  const endDate = dateRange?.endDate;

  const requestRevenue = async (
    token: string,
    secret?: string,
    signal?: AbortSignal,
  ) => {
    return fetch(`${API_URL}/analytics/revenue-summary`, {
      method: "POST",
      cache: "no-store",
      signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        startDate,
        endDate,
        ...(secret === undefined ? {} : { password: secret }),
      }),
    });
  };

  useEffect(() => {
    const controller = new AbortController();
    setChecking(true);
    const token = getCookie("token") || "";
    requestRevenue(token, undefined, controller.signal)
      .then(async (response) => {
        const result = await response.json();
        if (controller.signal.aborted) return;
        if (response.ok && result.success) {
          setSales(result.salesByCurrency);
          setExpiresAt(result.expiresAt);
          setSessionToken(token);
          setError("");
        } else {
          setSales(null);
          setExpiresAt(null);
          if (response.status !== 401)
            setError(result.message || "Unable to load revenue.");
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setError("Unable to load revenue. Please retry.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setChecking(false);
      });
    return () => controller.abort();
  }, [startDate, endDate]);

  useEffect(() => {
    if (!expiresAt) return;
    const expire = () => {
      if (
        Date.now() >= expiresAt ||
        (getCookie("token") || "") !== sessionToken
      ) {
        setSales(null);
        setExpiresAt(null);
        setPassword("");
        setShowPasswordBox(false);
      }
    };
    const interval = window.setInterval(expire, 1000);
    window.addEventListener("focus", expire);
    expire();
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", expire);
    };
  }, [expiresAt, sessionToken]);

  const unlock = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const token = getCookie("token") || "";
      const response = await requestRevenue(token, password);
      const result = await response.json();
      if (!response.ok || !result.success)
        throw new Error(result.message || "Unable to unlock revenue.");
      setSales(result.salesByCurrency);
      setExpiresAt(result.expiresAt);
      setSessionToken(token);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to unlock revenue.",
      );
    } finally {
      setPassword("");
      setBusy(false);
    }
  };

  const lock = async () => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `${API_URL}/analytics/revenue-summary/lock`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${getCookie("token") || ""}` },
        },
      );
      if (!response.ok && response.status !== 401)
        throw new Error("Unable to lock revenue. Please retry.");
      setSales(null);
      setExpiresAt(null);
      setPassword("");
      setShowPasswordBox(false);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to lock revenue.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card className="bg-gradient-to-br from-amber-50 to-white hover:shadow-lg">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-amber-700">
            Revenue Summary
            {!sales && (
              <button
                type="button"
                aria-label={
                  showPasswordBox
                    ? "Hide revenue password form"
                    : "Show revenue password form"
                }
                aria-expanded={showPasswordBox}
                aria-controls="revenue-password-box"
                onClick={() => {
                  setShowPasswordBox((value) => !value);
                  setPassword("");
                }}
                className="rounded p-1 hover:bg-amber-100 focus-visible:outline focus-visible:outline-2"
              >
                {showPasswordBox ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            )}
          </CardTitle>

          <p className="mt-1 text-xs text-amber-600">
            Currency based sales overview
          </p>
        </div>
        {sales && (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-lg font-bold text-amber-700">
            {selectedSale.currencySymbol || selectedSale.currencyCode}
          </div>
        )}
      </CardHeader>

      {(sales || showPasswordBox) && (
        <CardContent id="revenue-password-box" className="space-y-4">
          {checking ? (
            <p className="text-sm text-muted-foreground">Loading revenue...</p>
          ) : !sales ? (
            <form onSubmit={unlock} className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Enter the Revenue Summary password to view sales.
              </p>
              <Input
                aria-label="Revenue Summary password"
                type="password"
                autoComplete="off"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <Button type="submit" disabled={busy || !dateRange}>
                {busy ? "Unlocking..." : "Unlock Revenue Summary"}
              </Button>
              <p className="text-xs text-muted-foreground">
                Set or reset this password in Settings.
              </p>
            </form>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={lock}
              >
                Lock
              </Button>
              {/* Currency Selector */}
              <div>
                <select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm font-medium text-amber-700 outline-none focus:border-amber-400"
                >
                  {salesByCurrency.map((sale) => (
                    <option key={sale.currencyCode} value={sale.currencyCode}>
                      {sale.currencyCode} — {sale.currencyName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Revenue */}
              <div>
                <h2 className="break-words text-3xl font-extrabold text-amber-900">
                  {formatCurrency(
                    selectedSale.totalSales || 0,
                    selectedSale.currencyCode || "USD",
                    selectedSale.currencySymbol,
                  )}
                </h2>

                <p className="mt-1 text-xs text-amber-600">Total Revenue</p>
              </div>

              {/* Stats */}
              <div className="border-t border-amber-100 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Confirmed Orders
                  </span>

                  <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                    {selectedSale.orderCount || 0}
                  </Badge>
                </div>
              </div>
            </>
          )}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </CardContent>
      )}
    </Card>
  );
}
