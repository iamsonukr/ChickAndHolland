import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CircleDollarSign, Package, ShoppingCart, Users } from "lucide-react";
import { useState } from "react";

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

export const StatsDisplay = ({ data = {} }: { data?: any }) => {
  const safeData = {
    total: { orders: 0, total_quantity: 0, customers: 0 },
    salesByCurrency: [],
    productData: [],
    ...data,
  };

  const salesByCurrency = getSalesByCurrency(safeData);
  const [selectedCurrency, setSelectedCurrency] = useState("USD");

  const selectedSale =
    salesByCurrency.find((sale) => sale.currencyCode === selectedCurrency) ||
    salesByCurrency[0];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-white hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-blue-700">
              Total Orders
            </CardTitle>
            <ShoppingCart className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-blue-900">
              {safeData.total?.orders || 0}
            </div>
            <p className="mt-1 text-xs text-blue-600">All Time</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-green-700">
              Total Quantity
            </CardTitle>
            <Package className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-green-900">
              {safeData.total?.total_quantity || 0}
            </div>
            <p className="mt-1 text-xs text-green-600">Units Sold</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-white hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-purple-700">
              Total Customers
            </CardTitle>
            <Users className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-purple-900">
              {safeData.total?.customers || 0}
            </div>
            <p className="mt-1 text-xs text-purple-600">Unique Buyers</p>
          </CardContent>
        </Card>


        <Card className="bg-gradient-to-br from-amber-50 to-white hover:shadow-lg">
          <CardHeader className="flex flex-row items-start justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-semibold text-amber-700">
                Revenue Summary
              </CardTitle>

              <p className="mt-1 text-xs text-amber-600">
                Currency based sales overview
              </p>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-lg font-bold text-amber-700">
              {selectedSale.currencySymbol ||
                selectedSale.currencyCode}
            </div>          </CardHeader>

          <CardContent className="space-y-4">
            {/* Currency Selector */}
            <div>
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm font-medium text-amber-700 outline-none focus:border-amber-400"
              >
                {salesByCurrency.map((sale) => (
                  <option
                    key={sale.currencyCode}
                    value={sale.currencyCode}
                  >
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

              <p className="mt-1 text-xs text-amber-600">
                Total Revenue
              </p>
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
          </CardContent>
        </Card>

      </div>

      <Card className="border-none shadow-xl">
        <CardHeader className="rounded-t-lg bg-gray-50">
          <CardTitle className="text-xl font-bold text-gray-800">
            Top 20 Products
          </CardTitle>
          <p className="text-sm text-gray-500">
            Best performing products by quantity
          </p>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[620px]">
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead>Style No</TableHead>
                  <TableHead className="text-right">Total Qty</TableHead>
                  <TableHead className="text-right">Sizes</TableHead>
                  <TableHead className="text-right">Country</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {safeData.productData?.length > 0 ? (
                  safeData.productData.map((product: any, index: number) => (
                    <TableRow key={product.product_id}>
                      <TableCell>
                        <Badge variant="outline" className="mr-2">
                          #{index + 1}
                        </Badge>
                        {product.product_id}
                      </TableCell>
                      <TableCell className="text-right">
                        {product.total_quantity}
                      </TableCell>
                      <TableCell className="text-right">
                        {product.combined_sizes}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">
                          {product.combined_country}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-4 text-center text-gray-500"
                    >
                      No product data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
