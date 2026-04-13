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
import { Package, Users, ShoppingCart } from "lucide-react";

export const StatsDisplay = ({ data }: { data: any }) => {
  const formatCurrency = (value: number) => {
    return Intl.NumberFormat("en-US", {
      style: "currency",
      currency: data.selectedCurrency,
      maximumFractionDigits: 2,
      notation: "compact",
      compactDisplay: "short",
    }).format(value);
  };

  return (
    <div className="space-y-6">

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {/* Total Orders */}
        <Card className="bg-gradient-to-br from-blue-50 to-white hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-blue-700">
              Total Orders
            </CardTitle>
            <ShoppingCart className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-blue-900">
              {data.total?.orders || 0}
            </div>
            <p className="mt-1 text-xs text-blue-600">All Time</p>
          </CardContent>
        </Card>

        {/* Total Quantity */}
        <Card className="bg-gradient-to-br from-green-50 to-white hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-green-700">
              Total Quantity
            </CardTitle>
            <Package className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-green-900">
              {data.total?.total_quantity || 0}
            </div>
            <p className="mt-1 text-xs text-green-600">Units Sold</p>
          </CardContent>
        </Card>

        {/* Total Customers */}
        <Card className="bg-gradient-to-br from-purple-50 to-white hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-purple-700">
              Total Customers
            </CardTitle>
            <Users className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-purple-900">
              {data.total?.customers || 0}
            </div>
            <p className="mt-1 text-xs text-purple-600">Unique Buyers</p>
          </CardContent>
        </Card>

        {/* 🔥 Combined Revenue Card */}
        <Card className="bg-gradient-to-br from-yellow-50 to-white hover:shadow-lg">
          <CardHeader className="flex flex-col items-start gap-3 pb-1 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-sm font-semibold text-yellow-700">
              Revenue Summary
            </CardTitle>

            {/* Currency Select */}
            <select
              className="w-full rounded-md border border-yellow-300 bg-white px-2 py-1 text-[11px] font-semibold text-yellow-700 sm:w-auto"
              value={data.selectedCurrency}
              onChange={(e) => data.onCurrencyChange(e.target.value)}
            >
              <option value="USD">$ USD</option>
              <option value="EUR">€ EUR</option>
              <option value="GBP">£ GBP</option>
              <option value="INR">₹ INR</option>
            </select>
          </CardHeader>

          <CardContent className="space-y-2 pt-0">
            {/* Total */}
            <div className="text-[28px] font-extrabold text-yellow-900">
              {formatCurrency(data.convertedTotal)}
            </div>
            <p className="text-xs text-yellow-600">Total Revenue</p>

            {/* Paid + Pending small summary */}
            <div className="mt-3 space-y-1 border-t pt-3 text-sm">
              <p className="text-emerald-700 font-semibold">
                Paid: {formatCurrency(data.convertedPaid)}
              </p>
              <p className="text-red-700 font-semibold">
                Pending: {formatCurrency(data.convertedPending)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products Table */}
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
              {data.productData?.length > 0 ? (
                data.productData.map((product: any, index: number) => (
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
