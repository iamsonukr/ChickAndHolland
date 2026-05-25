import { ContentLayout } from "@/components/custom/admin-panel/contentLayout";
import Link from "next/link";
import CreateOrder from "./CreateOrder";
import { getCustomers, getOrders } from "@/lib/data";
import CustomSearchBar from "@/components/custom/admin-panel/customSearchBar";
import CustomPagination from "@/components/custom/admin-panel/customPagination";
import dayjs from "dayjs";
import TableActions from "./TableActions";
import { cn, fresh } from "@/lib/utils";
import { formatDateOnly, formatDateOnlyDisplay } from "@/lib/dateOnly";
import UpdateOrderStatus from "@/app/(admin-panel)/admin-panel/orders/UpdateOrderStatus";
import OrderTypeFilter from "@/app/(admin-panel)/admin-panel/orders/OrderTypeFilter";
import UpdateTrackingId from "./UpdateTrackingId";
import UpdateRetailerOrderStatus from "./UpdateRetailerOrderStatus";
import UpdateRetailerTrackingId from "./UpdateRetailerTrackingId";
import AddressCard from "./AddressCard";
import { cookies } from "next/headers";
import { API_URL } from "@/lib/constants";
import Delete, { DeleteButton, ItemsProvider } from "./Delete";
import TableScrollWrapper from "@/components/TableScrollWrapper";
import OrderDetailsSheet from "./OrderDetails";
import AdjustSequenceButton from "./AdjustSequenceButton";
import { Button } from "@/components/ui/button";
import ResetScanButton from "./ResetScanButton";
import EditOrderAction from "./EditOrderAction";

const statusToDbField: Record<string, string | null> = {
  "Pattern/Khaka": "pattern",
  "Pattern": "pattern",
  "Khaka": "khaka",
  "Issue Beading": "issue_beading",
  "Beading": "beading",
  "Zarkan": "zarkan",
  "Stitching": "stitching",
  "Ready To Delivery": "ready_to_delivery",
  "Shipped": "shipped",
  "Balance Pending": "balance_pending",
};

const getRowClassName = (difference: number, orderStatus: string) => {
  if (orderStatus === "Shipped") return "bg-green-500 text-black hover:bg-green-600";
  if (difference < 7) return "bg-red-600 text-white hover:bg-red-500";
  if (difference >= 7 && difference < 14) {
    return "bg-yellow-400 text-black hover:bg-yellow-500";
  }
  return "";
};

const filterButtonClassName =
  "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted";

const tableHeadClassName =
  "border border-border px-2 py-1.5 text-center text-[15px] font-semibold text-foreground align-middle";

const tableCellClassName =
  "border border-border px-2 py-1.5 text-sm md:text-[15px] align-middle";

const buildOrdersFilterHref = ({
  query,
  orderType,
  due,
}: {
  query: string;
  orderType: string;
  due?: string;
}) => {
  const params = new URLSearchParams();

  if (query) params.set("q", query);
  if (orderType) params.set("orderType", orderType);
  if (due) params.set("due", due);

  const search = params.toString();
  return search ? `?${search}` : "?";
};

const OrdersPage = async (props: {
  searchParams: Promise<Record<string, string>>;
}) => {
  const searchParams = await props.searchParams;
  const currentPage = searchParams["cPage"] ? Number(searchParams["cPage"]) : 1;
  const query = searchParams["q"] ?? "";
  const orderType = searchParams["orderType"] ?? "";
  const dueFilter = searchParams["due"] ?? "";

  const orders = await getOrders({
    page: currentPage,
    query,
    orderType: orderType === "All" ? "" : orderType,
  });

  const getStatusDate = (status: string, order: any) => {
    const dbField = statusToDbField[status];
    if (!dbField) return "";
    return order?.[dbField] ? dayjs(order[dbField]).format("MMM D, YYYY") : "";
  };

  const customers = await getCustomers({});
  // determine whether to show address/phone based on current user's role
  const cookieStore = await cookies();
  const userType = cookieStore.get("userType")?.value;
  const token = cookieStore.get("token")?.value;
  const userId = cookieStore.get("userId")?.value;
  const userRole = cookieStore.get("accountUsername")?.value;

  let showContact = false;
  if (userType === "ADMIN" && token && userId) {
    try {
      const res = await fetch(`${API_URL}/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });




      const data = await res.json();
      const userData = data?.data ?? data?.user ?? data;
      const roleName = String(userData?.roleName || userData?.role || "").trim().toLowerCase();
      // const allowed = [
      //   "admin",
      //   "shipping-master",
      //   "ready-to-delivery-master",
      // ];
      const man = String(
        cookieStore.get("accountUsername")?.value || ""
      )
        .trim()
        .toLowerCase();

      const allowed = [
        "balancepending",
        "admin",
        "ready-to-delivery",
      ];

      showContact = allowed.includes(man);

      console.log({
        userType,
        role: userData?.role,
        roleName: userData?.roleName,
      });

    } catch (e) {
      // silently ignore and keep showContact = false
      console.error("Failed to fetch user data for contact info visibility", {
        error: e instanceof Error ? e.message : e,
        userId,
      });
    }
  }
  const arr_ = orders?.orders?.[0]?.purchaeOrderNo.split(" ");
  const latestOrderPurchaseOrderNo =
    Number(arr_?.[arr_?.length - 1]) || orders?.totalCount;

  const bulkData = orders?.orders?.map((i: any) => ({
    id: i.id,
    orderType: i.orderType,
  }));
  const filteredOrders =
    orders?.orders?.filter((order: any) => {
      const hasDueDate = !!order?.orderCancellationDate;
      const difference = hasDueDate
        ? dayjs(formatDateOnly(order.orderCancellationDate)).diff(
            dayjs().startOf("day"),
            "days",
          )
        : Infinity;

      if (dueFilter === "lt14") {
        return order.orderStatus !== "Shipped" && hasDueDate && difference < 7;
      }

      if (dueFilter === "lt28") {
        return (
          order.orderStatus !== "Shipped" &&
          hasDueDate &&
          difference >= 7 &&
          difference < 14
        );
      }

      if (dueFilter === "shipped") {
        return order.orderStatus === "Shipped";
      }

      return true;
    }) ?? [];

  return (
    <ContentLayout title="All Orders">
      <ItemsProvider>
        <div className="flex flex-col gap-4">

          {/* Page Header */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <h1 className="text-lg md:text-xl font-semibold">All Orders</h1>
            <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:justify-end">
              <DeleteButton />
              <AdjustSequenceButton />
              <Link href="/admin-panel/orders/qr-scan">
                <Button variant="outline">Global QR Scan</Button>
              </Link>
              <CreateOrder
                customers={customers.customers}
                ordersTotalCount={latestOrderPurchaseOrderNo}
              />
            </div>
          </div>

          <div className="space-y-2">

            {/* Search + Filter */}
            <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
              <CustomSearchBar query={query} />
              <OrderTypeFilter />
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={buildOrdersFilterHref({
                    query,
                    orderType,
                    due: "lt14",
                  })}
                  className={cn(
                    filterButtonClassName,
                    dueFilter === "lt14" ? "bg-red-100 border-red-300" : ""
                  )}
                >
                  <span className="inline-flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="h-2.5 w-2.5 rounded-full bg-red-500"
                    />
                    <span>Due in 14 Days</span>
                  </span>
                </a>
                <a
                  href={buildOrdersFilterHref({
                    query,
                    orderType,
                    due: "lt28",
                  })}
                  className={cn(
                    filterButtonClassName,
                    dueFilter === "lt28" ? "bg-yellow-100 border-yellow-300" : ""
                  )}
                >
                  <span className="inline-flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="h-2.5 w-2.5 rounded-full bg-yellow-400"
                    />
                    <span>Due in 28 Days</span>
                  </span>
                </a>
                <a
                  href={buildOrdersFilterHref({
                    query,
                    orderType,
                    due: "shipped",
                  })}
                  className={cn(
                    filterButtonClassName,
                    dueFilter === "shipped" ? "bg-green-100 border-green-300" : ""
                  )}
                >
                  <span className="inline-flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="h-2.5 w-2.5 rounded-full bg-green-500"
                    />
                    <span>Shipped</span>
                  </span>
                </a>
                <a
                  href={buildOrdersFilterHref({
                    query,
                    orderType,
                  })}
                  className={cn(
                    filterButtonClassName,
                    !dueFilter ? "bg-muted" : "",
                  )}
                >
                  All Orders
                </a>
              </div>
            </div>

            {/* Table */}
            <div className="w-full rounded-lg border border-border">
              <TableScrollWrapper>
                <table className="w-full min-w-[1240px] border-collapse text-sm">
                <thead className="bg-muted/50">
                  <tr className="whitespace-nowrap [&>th]:align-middle">
                    <th className={cn(tableHeadClassName, "w-12 text-center")}>
                      <Delete bulk={bulkData} type="bulk" />
                    </th>
                    <th className={tableHeadClassName}>Customer</th>
                    <th className={cn(tableHeadClassName, "w-[150px]")}>PO#</th>
                    <th className={cn(tableHeadClassName, "w-[140px]")}>Order Type</th>
                    <th className={cn(tableHeadClassName, "w-[130px]")}>Order Date</th>
                    <th className={cn(tableHeadClassName, "w-[130px]")}>Ship Date</th>
                    <th className={cn(tableHeadClassName, "w-[170px]")}>Order Status</th>
                    {showContact && (
                      <th className={cn(tableHeadClassName, "w-[220px]")}>Address</th>
                    )}
                    {showContact && (
                      <th className={cn(tableHeadClassName, "w-[140px]")}>Phone</th>
                    )}
                    <th className={cn(tableHeadClassName, "w-[170px]")}>Tracking ID</th>
                    <th className={cn(tableHeadClassName, "w-[260px] text-center")}>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((order: any) => {
                      const difference = order?.orderCancellationDate
                        ? dayjs(formatDateOnly(order.orderCancellationDate)).diff(
                            dayjs().startOf("day"),
                            "days",
                          )
                        : Infinity;
                      const rowClass = getRowClassName(difference, order.orderStatus);

                      return (
                        <tr
                          key={`${order.id}-${order.purchaeOrderNo}-${order.orderType}`}
                          className={cn(
                            "whitespace-nowrap align-middle [&>td]:align-middle",
                            rowClass,
                          )}
                        >
                          {/* Delete */}
                          <td className={cn(tableCellClassName, "text-center")}>
                            <Delete id={order.id} orderType={order.orderType} type="single" />
                          </td>

                          {/* Customer */}
                          <td className={tableCellClassName}>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold">{order.customer?.name}</span>
                              <span className="opacity-50">#{order.id}</span>
                            </div>
                          </td>

                          {/* PO# */}
                          <td className={cn(tableCellClassName, "font-mono")}>
                            {order.purchaeOrderNo}
                          </td>

                          {/* Order Type */}
                          <td className={tableCellClassName}>
                            {order.orderType === "Fresh" ? fresh : order.orderType}
                          </td>

                          {/* Order Date */}
                          <td className={tableCellClassName}>
                            {formatDateOnlyDisplay(order.orderReceivedDate)}
                          </td>

                          {/* Ship Date */}
                          <td className={tableCellClassName}>
                            {formatDateOnlyDisplay(order.orderCancellationDate)}
                          </td>

                          {/* Order Status */}
                          <td className={tableCellClassName}>
                            <div className="flex flex-col gap-1">
                              <div className="text-black">
                                {order.orderSource === "retailer" ? (
                                  <UpdateRetailerOrderStatus orderData={order} />
                                ) : (
                                  <UpdateOrderStatus orderData={order} />
                                )}
                              </div>
                              <p className="text-xs opacity-70">
                                {getStatusDate(order.orderStatus.toString(), order)}
                              </p>
                            </div>
                          </td>

                          {/* Address */}
                          {showContact && (
                            <td className={cn(tableCellClassName, "max-w-[220px] whitespace-normal break-words")}>
                              <div className="whitespace-normal break-words leading-5">
                                <AddressCard ad={order.address} />
                              </div>
                            </td>
                          )}

                          {/* Phone */}
                          {showContact && (
                            <td className={tableCellClassName}>
                              {order.customer?.phoneNumber || "N/A"}
                            </td>
                          )}

                          {/* Tracking ID */}
                          <td className={tableCellClassName}>
                            <div className="text-black">
                              {order.orderSource === "retailer" ? (
                                <UpdateRetailerTrackingId orderData={order} />
                              ) : (
                                <UpdateTrackingId trackingId={order.trackingNo} id={order.id} />
                              )}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className={cn(tableCellClassName, "text-center")}>
                            <div className="flex items-center justify-center gap-2">
                              <OrderDetailsSheet orderDetails={order} />
                              <EditOrderAction
                                order={order}
                                customers={customers.customers}
                              />
                              <TableActions data={order} />
                              <ResetScanButton order={order} />
                            </div>
                          </td>

                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={showContact ? 11 : 9}
                        className="border border-border py-10 text-center text-base text-muted-foreground"
                      >
                        <div className="flex flex-col items-center gap-1">
                          <p className="font-medium">No orders found</p>
                          <p className="text-sm">Try adjusting your search or filters.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
                </table>
              </TableScrollWrapper>
            </div>

            {/* Pagination */}
            {orders?.totalCount > 0 && (
              <div className="flex justify-end">
                <CustomPagination
                  currentPage={currentPage}
                  totalLength={orders.totalCount}
                  itemsPerPage={50}
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
