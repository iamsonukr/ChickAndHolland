import { ContentLayout } from "@/components/custom/admin-panel/contentLayout";
import { cookies } from "next/headers";
import { getRetailerDashboardData } from "@/lib/data";
import { ArrowDown, ArrowUp, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const RetailerDashboard = async () => {
  const retailer = (await cookies()).get("retailerId")?.value;

  if (!retailer) {
    return (
      <p className="py-4 text-center text-gray-500">Retailer not logged in</p>
    );
  }

  const dashboardData = await getRetailerDashboardData(Number(retailer));

  const dataArray = Array.isArray(dashboardData?.data) ? dashboardData.data : [];
  const totalArray = Array.isArray(dashboardData?.total) ? dashboardData.total : [];

  const safeRow = dataArray[0] || {};
  const defaultSymbol = safeRow.currencySymbol || "€";

  const formatCurrency = (value: any, symbol?: string) => {
    const number = Number(value || 0);
    const useSymbol = symbol || defaultSymbol;
    return `${useSymbol} ${number.toLocaleString("en-EU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const totals = totalArray.map((t: any) => ({
    symbol: t.currencySymbol || defaultSymbol,
    name: t.currencyName || "",
    bill: Number(t.totalBill || 0),
    paid: Number(t.totalPaid || 0),
    balance: Number(t.balance || 0),
  }));

  const isAllPaid = totals.length
    ? totals.every((t) => t.balance <= 0)
    : true;

  return (
    <ContentLayout title="Dashboard">

      {/* ── MOBILE: card layout ── */}
      <div className="flex flex-col gap-3 sm:hidden">
        {dataArray.length === 0 && (
          <div className="rounded-lg border bg-white shadow-sm p-4 text-sm text-gray-500">
            No yearly data yet.
          </div>
        )}
        {dataArray.map((invoice: any, idx: number) => {
          const price = Number(invoice?.price || 0);
          const paid = Number(invoice?.paid || 0);
          const balance = price - paid;
          const isPaid = balance <= 0;

          return (
            <div key={idx} className="rounded-lg border bg-white shadow-sm p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-500">Year</span>
                <span className="font-bold">{invoice?.created_year ?? "-"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Total Orders</span>
                <span className="font-medium">{invoice?.orders ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Total Bill</span>
                <span className="font-medium">{formatCurrency(price, invoice?.currencySymbol)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Paid</span>
                <span className="font-medium text-green-600">{formatCurrency(paid, invoice?.currencySymbol)}</span>
              </div>
              <div className="flex items-center justify-between border-t pt-2 mt-1">
                <span className="text-sm font-semibold text-gray-500">Balance</span>
                <div className="flex items-center gap-1">
                  <span className={isPaid ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                    {formatCurrency(balance, invoice?.currencySymbol)}
                  </span>
                  {isPaid
                    ? <ArrowDown className="h-3 w-3 text-green-600" />
                    : <ArrowUp className="h-3 w-3 text-red-600" />
                  }
                </div>
              </div>
            </div>
          );
        })}

        {/* Mobile total */}
        <div className="rounded-lg border bg-gray-50 p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span>Total Balance</span>
          </div>
          <div className="flex flex-wrap gap-2 justify-start">
            {totals.length === 0 && (
              <Badge variant="outline" className="text-base font-bold text-gray-500">
                No balance data yet
              </Badge>
            )}
            {totals.map((t, idx) => (
              <Badge
                key={idx}
                variant="outline"
                className={`text-base font-bold ${t.balance <= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {formatCurrency(t.balance, t.symbol)}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* ── DESKTOP: table layout ── */}
      <div className="hidden sm:block rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="text-left px-4 py-3 font-semibold">Year</th>
              <th className="text-left px-4 py-3 font-semibold">Total Orders</th>
              <th className="text-left px-4 py-3 font-semibold">Total Bill</th>
              <th className="text-left px-4 py-3 font-semibold">Paid</th>
              <th className="text-right px-4 py-3 font-semibold">Balance</th>
            </tr>
          </thead>
          <tbody>
            {dataArray.map((invoice: any, idx: number) => {
              const price = Number(invoice?.price || 0);
              const paid = Number(invoice?.paid || 0);
              const balance = price - paid;
              const isPaid = balance <= 0;

              return (
                <tr key={idx} className="border-b font-medium hover:bg-gray-50">
                  <td className="px-4 py-3">{invoice?.created_year ?? "-"}</td>
                  <td className="px-4 py-3">{invoice?.orders ?? 0}</td>
                  <td className="px-4 py-3">{formatCurrency(price, invoice?.currencySymbol)}</td>
                  <td className="px-4 py-3">{formatCurrency(paid, invoice?.currencySymbol)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <span className={isPaid ? "text-green-600" : "text-red-600"}>
                        {formatCurrency(balance, invoice?.currencySymbol)}
                      </span>
                      {isPaid
                        ? <ArrowDown className="h-3 w-3 text-green-600" />
                        : <ArrowUp className="h-3 w-3 text-red-600" />
                      }
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={5} className="bg-gray-50 px-4 py-3 text-right font-semibold">
                <div className="flex items-center justify-end gap-3 flex-wrap">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span>Total Balance:</span>
                  {totals.map((t, idx) => (
                    <Badge key={idx} variant="outline" className="text-base font-bold">
                      {formatCurrency(t.balance, t.symbol)}
                    </Badge>
                  ))}
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

    </ContentLayout>
  );
};

export default RetailerDashboard;
