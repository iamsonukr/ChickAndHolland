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

export const StatsDisplay = ({ data }: { data: any }) => {
  const salesByCurrency = getSalesByCurrency(data);

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
              {data.total?.orders || 0}
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
              {data.total?.total_quantity || 0}
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
              {data.total?.customers || 0}
            </div>
            <p className="mt-1 text-xs text-purple-600">Unique Buyers</p>
          </CardContent>
        </Card>

        {salesByCurrency.map((sale) => (
          <Card
            key={sale.currencyId ?? sale.currencyCode}
            className="bg-gradient-to-br from-amber-50 to-white hover:shadow-lg"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-amber-700">
                Total Sales ({sale.currencyCode})
              </CardTitle>
              <CircleDollarSign className="h-5 w-5 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="break-words text-3xl font-extrabold text-amber-900">
                {formatCurrency(
                  sale.totalSales,
                  sale.currencyCode,
                  sale.currencySymbol,
                )}
              </div>
              <p className="mt-1 text-xs text-amber-600">
                {sale.orderCount || 0} confirmed orders
              </p>
            </CardContent>
          </Card>
        ))}
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
