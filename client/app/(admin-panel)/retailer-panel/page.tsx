import { ContentLayout } from "@/components/custom/admin-panel/contentLayout";
import { cookies } from "next/headers";
import { getRetailerDashboardData } from "@/lib/data";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowDown, ArrowUp, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const RetailerDashboard = async () => {
  const retailer = (await cookies()).get("retailerId")?.value;

  if (!retailer) {
    return (
      <p className="py-4 text-center text-gray-500">
        Retailer not logged in
      </p>
    );
  }

 const dashboardData = await getRetailerDashboardData(Number(retailer));

// prevent crash when no data
const dataArray = Array.isArray(dashboardData?.data)
  ? dashboardData.data
  : [];

const totalArray = Array.isArray(dashboardData?.total)
  ? dashboardData.total
  : [];

// ensure objects exist
const safeRow = dataArray[0] || {};
const safeTotal = totalArray[0] || {};


  // Get currency symbol safely
  const currencySymbol =
  safeRow.currencySymbol ||
  safeTotal.currencySymbol ||
  "€";


  const formatCurrency = (value: any) => {
    const number = Number(value || 0);
    return `${currencySymbol} ${number.toLocaleString("en-EU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // If no data, show message
  if (!dataArray.length) {
    return (
      <ContentLayout title="Dashboard">
        <p className="py-4 text-center text-gray-500">
          No financial data available
        </p>
      </ContentLayout>
    );
  }

  return (
    <ContentLayout title="Dashboard">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold">Year</TableHead>
              <TableHead className="font-semibold">Total Orders</TableHead>
              <TableHead className="font-semibold">Total Bill</TableHead>
              <TableHead className="font-semibold">Paid</TableHead>
              <TableHead className="text-end font-semibold">Balance</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {dataArray.map((invoice: any, idx: number) => {
              const price = Number(invoice?.price || 0);
              const paid = Number(invoice?.paid || 0);
              const balance = price - paid;
              const isPaid = balance <= 0;

              return (
                <TableRow key={idx} className="font-medium hover:bg-gray-50">
                  <TableCell>{invoice?.created_year ?? "-"}</TableCell>
                  <TableCell>{invoice?.orders ?? 0}</TableCell>
                  <TableCell>{formatCurrency(price)}</TableCell>
                  <TableCell>{formatCurrency(paid)}</TableCell>
                  <TableCell className="text-end">
                    <div className="flex items-center justify-end gap-1">
                      <span className={isPaid ? "text-green-600" : "text-red-600"}>
                        {formatCurrency(balance)}
                      </span>
                      {isPaid ? (
                        <ArrowDown className="h-3 w-3 text-green-600" />
                      ) : (
                        <ArrowUp className="h-3 w-3 text-red-600" />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>

          <TableFooter>
            <TableRow>
              <TableCell colSpan={5} className="bg-gray-50 text-end font-semibold">
                <div className="flex items-center justify-end gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span>Total Balance:</span>
                  <Badge variant="outline" className="text-base font-bold">
                    {formatCurrency(totalArray?.[0]?.vv || 0)}
                  </Badge>
                </div>
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </ContentLayout>
  );
};

export default RetailerDashboard;
