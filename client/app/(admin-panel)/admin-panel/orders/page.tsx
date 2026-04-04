import { ContentLayout } from "@/components/custom/admin-panel/contentLayout";
import CreateOrder from "./CreateOrder";
import { getCustomers, getDates, getOrderDates, getOrders } from "@/lib/data";
import CustomSearchBar from "@/components/custom/admin-panel/customSearchBar";
import CustomPagination from "@/components/custom/admin-panel/customPagination";
import dayjs from "dayjs";
import TableActions from "./TableActions";
import { cn, fresh } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import UpdateOrderStatus from "@/app/(admin-panel)/admin-panel/orders/UpdateOrderStatus";
import OrderTypeFilter from "@/app/(admin-panel)/admin-panel/orders/OrderTypeFilter";
import UpdateTrackingId from "./UpdateTrackingId";
import UpdateRetailerOrderStatus from "./UpdateRetailerOrderStatus";
import UpdateRetailerTrackingId from "./UpdateRetailerTrackingId";
import AddressCard from "./AddressCard";
import Delete, { DeleteButton, ItemsProvider } from "./Delete";
import OrderDetailsSheet from "./OrderDetails";
import TableScrollWrapper from "@/components/TableScrollWrapper";
import AdjustSequenceButton from "./AdjustSequenceButton";

const statusToDbField: Record<string, string | null> = {
  "Pattern":           "pattern",
  "Khaka":             "khaka",
  "Issue Beading":     "issue_beading",
  "Beading":           "beading",
  "Zarkan":            "zarkan",
  "Stitching":         "stitching",
  "Ready to Delivery": "ready_to_delivery",
  "Shipped":           "shipped",
  "Balance Pending":   null,
};

const getRowClassName = (difference: number, orderStatus: string) => {
  if (orderStatus === "Shipped")  return "bg-green-500 text-black hover:bg-green-600";
  if (difference < 7)             return "bg-red-600 text-white hover:bg-red-500";
  if (difference < 14)            return "bg-yellow-400 text-black hover:bg-yellow-500";
  return "";
};

const OrdersPage = async (props: {
  searchParams: Promise<Record<string, string>>;
}) => {
  const searchParams = await props.searchParams;
  const currentPage = searchParams["cPage"] ? Number(searchParams["cPage"]) : 1;
  const query       = searchParams["q"]         ?? "";
  const orderType   = searchParams["orderType"] ?? "";
  const dueFilter   = searchParams["due"]       ?? "";

  const orders = await getOrders({
    page: currentPage,
    query,
    orderType: orderType === "All" ? "" : orderType,
  });

  const orderStatusData = async (status: string, id: number) => {
    const res = await getDates(id);
    if (status === "Pattern/Khaka") {
      return res.data.pattern ? dayjs(res.data.pattern).format("MMM D, YYYY") : "";
    }
    return dayjs(res.data[status]).format("MMM D, YYYY");
  };

  const orderStatusDataTwo = async (status: string, id: number) => {
    const res = await getOrderDates(id);
    if (!res.data) return "";
    const dbField = statusToDbField[status];
    if (!dbField) return "";
    return res.data[dbField] ? dayjs(res.data[dbField]).format("MMM D, YYYY") : "";
  };

  const customers = await getCustomers({});
  const arr_ = orders?.orders?.[0]?.purchaeOrderNo.split(" ");
  const latestOrderPurchaseOrderNo =
    Number(arr_?.[arr_?.length - 1]) || orders?.totalCount;

  const bulkData = orders?.orders?.map((i: any) => ({
    id: i.id,
    orderType: i.orderType,
  }));

  return (
    <ContentLayout title="Orders Page">
      <ItemsProvider>
        <div className="flex flex-col gap-4">

          {/* Page Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-lg md:text-xl font-semibold">All Orders</h1>
            <div className="flex items-center gap-2">
              <DeleteButton />
              <AdjustSequenceButton />
              <CreateOrder
                customers={customers.customers}
                ordersTotalCount={latestOrderPurchaseOrderNo}
              />
            </div>
          </div>

          <div className="space-y-2">

            {/* Search + Filter */}
            <div className="flex items-center gap-2">
              <CustomSearchBar query={query} />
              <OrderTypeFilter />
              <div className="flex items-center gap-1 text-xs">
                <a
                  href={`?q=${encodeURIComponent(query)}&orderType=${orderType}&due=lt7`}
                  className={cn(
                    "rounded border px-2 py-1 hover:bg-muted",
                    dueFilter === "lt7" ? "bg-red-100 border-red-300" : ""
                  )}
                >
                  Due &lt; 7 days
                </a>
                {/* <a
                  href={`?q=${encodeURIComponent(query)}&orderType=${orderType}&due=lt14`}
                  className={cn(
                    "rounded border px-2 py-1 hover:bg-muted",
                    dueFilter === "lt14" ? "bg-yellow-100 border-yellow-300" : ""
                  )}
                >
                  Due &lt; 14 days
                </a> */}
                <a
                  href={`?q=${encodeURIComponent(query)}&orderType=${orderType}&due=shipped`}
                  className={cn(
                    "rounded border px-2 py-1 hover:bg-muted",
                    dueFilter === "shipped" ? "bg-green-100 border-green-300" : ""
                  )}
                >
                  Shipped
                </a>
                <a
                  href={`?q=${encodeURIComponent(query)}&orderType=${orderType}`}
                  className="rounded border px-2 py-1 hover:bg-muted"
                >
                  Clear
                </a>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                Due in &lt; 7 days
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-yellow-400" />
                Due in &lt; 14 days
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Shipped
              </span>
            </div>

            {/* Table */}
            <div className="w-full overflow-x-auto rounded-lg border border-border">
              <Table className="w-full min-w-[900px] text-xs">
                <TableHeader className="bg-muted/50">
                  <TableRow className="whitespace-nowrap">
                    <TableHead className="w-8 px-2 py-1.5 text-center">
                      <Delete bulk={bulkData} type="bulk" />
                    </TableHead>
                    <TableHead className="px-2 py-1.5">Customer</TableHead>
                    <TableHead className="px-2 py-1.5 w-[110px] sm:w-[130px]">PO#</TableHead>
                    <TableHead className="px-2 py-1.5 w-[120px] sm:w-[140px]">Order Type</TableHead>
                    <TableHead className="px-2 py-1.5">Order Date</TableHead>
                    <TableHead className="px-2 py-1.5">Ship Date</TableHead>
                    <TableHead className="px-2 py-1.5">Order Status</TableHead>
                    <TableHead className="px-2 py-1.5">Address</TableHead>
                    <TableHead className="px-2 py-1.5">Phone</TableHead>
                    <TableHead className="px-2 py-1.5">Tracking ID</TableHead>
                    <TableHead className="px-2 py-1.5 text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {orders?.orders?.length > 0 ? (
                    orders.orders
                      .filter((order: any) => {
                        const hasDueDate = !!order?.orderCancellationDate;
                        const difference = hasDueDate
                          ? dayjs(order.orderCancellationDate).diff(dayjs(), "days")
                          : Infinity;

                        if (dueFilter === "lt7") return order.orderStatus !== "Shipped" && hasDueDate && difference < 7;
                        if (dueFilter === "lt14") return order.orderStatus !== "Shipped" && hasDueDate && difference < 14;
                        if (dueFilter === "shipped") return order.orderStatus === "Shipped";
                        return true;
                      })
                      .map((order: any) => {
                      const difference = order?.orderCancellationDate
                        ? dayjs(order.orderCancellationDate).diff(dayjs(), "days")
                        : Infinity;
                      const rowClass   = getRowClassName(difference, order.orderStatus);

                      return (
                        <TableRow
                          key={`${order.id}-${order.purchaeOrderNo}-${order.orderType}`}
                          className={cn("whitespace-nowrap align-middle", rowClass)}
                        >
                          {/* Delete */}
                          <TableCell className="px-2 py-1 text-center">
                            <Delete id={order.id} orderType={order.orderType} type="single" />
                          </TableCell>

                          {/* Customer */}
                          <TableCell className="px-2 py-1">
                            <span className="font-medium">{order.customer?.name}</span>
                            <span className="ml-1 opacity-50">#{order.id}</span>
                          </TableCell>

                          {/* PO# */}
                          <TableCell className="px-2 py-1 font-mono">
                            {order.purchaeOrderNo}
                          </TableCell>

                          {/* Order Type */}
                          <TableCell className="px-2 py-1">
                            {order.orderType === "Fresh" ? fresh : order.orderType}
                          </TableCell>

                          {/* Order Date */}
                          <TableCell className="px-2 py-1">
                            {dayjs(order.orderReceivedDate).format("DD MMM YYYY")}
                          </TableCell>

                          {/* Ship Date */}
                          <TableCell className="px-2 py-1">
                            {dayjs(order.orderCancellationDate).format("DD MMM YYYY")}
                          </TableCell>

                          {/* Order Status */}
                          <TableCell className="px-2 py-1">
                            <div className="flex flex-col gap-0.5">
                              <div className="text-black">
                                {order.orderSource === "retailer" ? (
                                  <UpdateRetailerOrderStatus orderData={order} />
                                ) : (
                                  <UpdateOrderStatus orderData={order} />
                                )}
                              </div>
                              <p className="text-[10px] opacity-60">
                                {order.orderSource === "retailer"
                                  ? orderStatusData(order.orderStatus.toString(), order.id)
                                  : orderStatusDataTwo(order.orderStatus.toString(), order.id)}
                              </p>
                            </div>
                          </TableCell>

                          {/* Address */}
                          <TableCell className="px-2 py-1 whitespace-normal break-words max-w-[180px]">
                            <div className="truncate">
                              <AddressCard ad={order.address} />
                            </div>
                          </TableCell>

                          {/* Phone */}
                          <TableCell className="px-2 py-1">
                            {order.customer?.phoneNumber || "N/A"}
                          </TableCell>

                          {/* Tracking ID */}
                          <TableCell className="px-2 py-1">
                            <div className="text-black">
                              {order.orderSource === "retailer" ? (
                                <UpdateRetailerTrackingId orderData={order} />
                              ) : (
                                <UpdateTrackingId trackingId={order.trackingNo} id={order.id} />
                              )}
                            </div>
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="px-2 py-1">
                            <div className="flex items-center justify-center gap-1">
                              <OrderDetailsSheet orderDetails={order} />
                              <TableActions data={order} />
                            </div>
                          </TableCell>

                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={11} className="py-12 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-1">
                          <p className="font-medium">No orders found</p>
                          <p className="text-xs">Try adjusting your search or filters.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {orders?.totalCount > 0 && (
              <div className="flex justify-end">
                <CustomPagination
                  currentPage={currentPage}
                  totalLength={orders.totalCount}
                />
              </div>
            )}
          </div>
        </div>
      </ItemsProvider>
    </ContentLayout>
  );
};

export default OrdersPage;
