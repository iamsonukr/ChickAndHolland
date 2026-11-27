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
import {
  MailWarning,
  Package,
  ShoppingCart,
  UserCheck,
  Users,
} from "lucide-react";
import RevenueSummary from "./RevenueSummary";

export const StatsDisplay = ({ data = {} }: { data?: any }) => {
  const safeData = {
    total: {
      orders: 0,
      total_quantity: 0,
      customers: 0,
      registered_customers: 0,
    },
    salesByCurrency: [],
    productData: [],
    emailNotifications: { failedCount: 0, latest: [] },
    ...data,
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {safeData.emailNotifications?.failedCount > 0 && (
          <Card className="border-red-200 bg-red-50 hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-red-700">
                Failed Emails
              </CardTitle>
              <MailWarning className="h-5 w-5 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-red-900">
                {safeData.emailNotifications.failedCount}
              </div>
              <p className="mt-1 text-xs text-red-600">
                Check Draft Orders to retry
              </p>
            </CardContent>
          </Card>
        )}

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
            <p className="mt-1 text-xs text-blue-600">Selected date range</p>
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
              {safeData.total?.total_quantity ?? "Unavailable"}
            </div>
            <p className="mt-1 text-xs text-green-600">Selected date range / All Status</p>
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

        <Card className="bg-gradient-to-br from-cyan-50 to-white hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-cyan-700">
              Registered Customers
            </CardTitle>
            <UserCheck className="h-5 w-5 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-cyan-900">
              {safeData.total?.registered_customers || 0}
            </div>
            <p className="mt-1 text-xs text-cyan-600">Retailer Panel</p>
          </CardContent>
        </Card>

        <RevenueSummary key={`${safeData.revenueDateRange?.startDate}:${safeData.revenueDateRange?.endDate}`} dateRange={safeData.revenueDateRange} />
      </div>

      <Card className="border-none shadow-xl">
        <CardHeader className="rounded-t-lg bg-gray-50">
          <CardTitle className="text-xl font-bold text-gray-800">
            Top 30 Products
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
