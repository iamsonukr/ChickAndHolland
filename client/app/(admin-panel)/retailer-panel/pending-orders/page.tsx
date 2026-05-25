import { getRetailersOrders } from "@/lib/data";
import { cookies } from "next/headers";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import CustomPagination from "@/components/custom/admin-panel/customPagination";
import { ContentLayout } from "@/components/custom/admin-panel/contentLayout";
import ActionButtons from "./ActionButtons";
import { fresh } from "@/lib/utils";
import TableScrollWrapper from "@/components/TableScrollWrapper";
import { formatDateOnlyDisplay } from "@/lib/dateOnly";

const COL_WIDTHS = {
  date:    "w-[140px]",
  type:    "w-[150px]",
  qty:     "w-[100px]",
  amount:  "w-[140px]",
  status:  "w-[130px]",
  actions: "w-[120px]",
};

const getStatusStyle = (is_approved: number | null) => {
  if (is_approved === 1) return { label: "Approved", className: "bg-green-100 text-green-700" };
  if (is_approved === 2) return { label: "Rejected", className: "bg-red-100 text-red-700" };
  return { label: "Pending", className: "bg-yellow-100 text-yellow-700" };
};

const MyOrders = async (props: {
  searchParams: Promise<Record<string, string>>;
}) => {
  const searchParams = await props.searchParams;
  const retailerId = (await cookies()).get("retailerId")?.value;
  const currentPage = searchParams["cPage"] ? Number(searchParams["cPage"]) : 1;
  const query = searchParams["q"] ?? "";

  const myOrders = await getRetailersOrders({
    retailerId: Number(retailerId),
    page: currentPage,
    query,
    isApproved: 0,
  });

  const orders = myOrders?.orders ?? [];

  return (
    <ContentLayout title="My Orders">
      <div className="space-y-4">

        {/* Summary */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {orders.length > 0
              ? `Showing ${orders.length} order${orders.length !== 1 ? "s" : ""}`
              : "No pending orders"}
          </p>
        </div>

        {/* Table */}
        <TableScrollWrapper>
          <Table className="table-fixed w-full border">
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className={`${COL_WIDTHS.date} text-center`}>Ordered On</TableHead>
                <TableHead className={`${COL_WIDTHS.type} text-center`}>Order Type</TableHead>
                <TableHead className={`${COL_WIDTHS.qty} text-center`}>Quantity</TableHead>
                <TableHead className={`${COL_WIDTHS.amount} text-center`}>Total Amount</TableHead>
                <TableHead className={`${COL_WIDTHS.status} text-center`}>Status</TableHead>
                <TableHead className={`${COL_WIDTHS.actions} text-center`}>Details</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {orders.length > 0 ? (
                orders.map((order: any, index: number) => {
                  const { label, className } = getStatusStyle(order.is_approved);
                  const currency = order.currencySymbol ?? "€";
                  const amount = parseFloat(order.total_price).toFixed(2);

                  return (
                    <TableRow
                      key={order.id ?? index}
                      className="text-center hover:bg-muted/20"
                    >
                      {/* Date */}
                      <TableCell className="truncate">
                        {formatDateOnlyDisplay(order.formatted_date, "DD-MM-YYYY")}
                      </TableCell>

                      {/* Order Type */}
                      <TableCell>
                        {order.order_type === "Fresh" ? fresh : order.order_type}
                      </TableCell>

                      {/* Quantity */}
                      <TableCell className="font-medium">
                        {order.Total}
                      </TableCell>

                      {/* Total Amount */}
                      <TableCell className="font-medium">
                        {currency} {amount}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
                          {label}
                        </span>
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        {retailerId && (
                          <ActionButtons
                            id={order.id}
                            retailerId={Number(retailerId)}
                            is_approved={order.is_approved}
                            type={order.order_type}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-16 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-base font-medium">No orders found</p>
                      <p className="text-sm">Your pending orders will appear here.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableScrollWrapper>

        {/* Pagination */}
        {myOrders?.totalCount > 0 && (
          <div className="flex justify-end">
            <CustomPagination
              currentPage={currentPage}
              totalLength={myOrders.totalCount}
            />
          </div>
        )}

      </div>
    </ContentLayout>
  );
};

export default MyOrders;
