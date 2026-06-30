import { ContentLayout } from "@/components/custom/admin-panel/contentLayout";
import CustomPagination from "@/components/custom/admin-panel/customPagination";
import CustomSearchBar from "@/components/custom/admin-panel/customSearchBar";
import TableScrollWrapper from "@/components/TableScrollWrapper";
import { Button } from "@/components/ui/button";
import { getOrders } from "@/lib/data";
import { formatDateOnlyDisplay } from "@/lib/dateOnly";
import { cn, fresh } from "@/lib/utils";
import Link from "next/link";
import OrderTypeFilter from "../orders/OrderTypeFilter";

const tableHeadClassName =
  "border border-border px-2 py-1.5 text-center text-[15px] font-semibold text-foreground align-middle";

const tableCellClassName =
  "border border-border px-2 py-1.5 text-sm md:text-[15px] align-middle";

const DeletedOrdersPage = async (props: {
  searchParams: Promise<Record<string, string>>;
}) => {
  const searchParams = await props.searchParams;
  const currentPage = searchParams["cPage"] ? Number(searchParams["cPage"]) : 1;
  const query = searchParams["q"] ?? "";
  const orderType = searchParams["orderType"] ?? "";

  const orders = await getOrders({
    page: currentPage,
    query,
    orderType: orderType === "All" ? "" : orderType,
    deletedOnly: true,
  });

  const deletedOrders = orders?.orders ?? [];

  return (
    <ContentLayout title="Deleted Orders">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="text-lg font-semibold md:text-xl">Deleted Orders</h1>
          <Link href="/admin-panel/orders">
            <Button variant="outline">All Orders</Button>
          </Link>
        </div>

        <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
          <CustomSearchBar query={query} placeholder="Search deleted orders" />
          <OrderTypeFilter />
        </div>

        <div className="w-full rounded-lg border border-border">
          <TableScrollWrapper>
            <table className="w-full min-w-[1040px] border-collapse text-sm">
              <thead className="bg-muted/50">
                <tr className="whitespace-nowrap [&>th]:align-middle">
                  <th className={cn(tableHeadClassName, "w-[220px]")}>
                    Customer
                  </th>
                  <th className={cn(tableHeadClassName, "w-[150px]")}>PO#</th>
                  <th className={cn(tableHeadClassName, "w-[140px]")}>
                    Order Type
                  </th>
                  <th className={cn(tableHeadClassName, "w-[130px]")}>
                    Order Date
                  </th>
                  <th className={cn(tableHeadClassName, "w-[130px]")}>
                    Ship Date
                  </th>
                  <th className={cn(tableHeadClassName, "w-[170px]")}>
                    Order Status
                  </th>
                  <th className={cn(tableHeadClassName, "w-[120px]")}>
                    Total Quantity
                  </th>
                  <th className={cn(tableHeadClassName, "w-[170px]")}>
                    Tracking ID
                  </th>
                  <th className={cn(tableHeadClassName, "w-[140px]")}>
                    Source
                  </th>
                </tr>
              </thead>

              <tbody>
                {deletedOrders.length > 0 ? (
                  deletedOrders.map((order: any) => (
                    <tr
                      key={`${order.orderSource}-${order.id}-${order.purchaeOrderNo}`}
                      className="whitespace-nowrap align-middle [&>td]:align-middle"
                    >
                      <td className={tableCellClassName}>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold">
                            {order.customer?.name ?? "N/A"}
                          </span>
                          <span className="opacity-50">#{order.id}</span>
                        </div>
                      </td>
                      <td className={cn(tableCellClassName, "font-mono")}>
                        {order.purchaeOrderNo}
                      </td>
                      <td className={tableCellClassName}>
                        {order.orderType === "Fresh" ? fresh : order.orderType}
                      </td>
                      <td className={tableCellClassName}>
                        {formatDateOnlyDisplay(order.orderReceivedDate)}
                      </td>
                      <td className={tableCellClassName}>
                        {formatDateOnlyDisplay(order.orderCancellationDate)}
                      </td>
                      <td className={tableCellClassName}>
                        {order.orderStatus ?? "-"}
                      </td>
                      <td className={cn(tableCellClassName, "text-center")}>
                        {order.totalQuantity ?? 0}
                      </td>
                      <td className={tableCellClassName}>
                        {order.trackingNo || "-"}
                      </td>
                      <td className={tableCellClassName}>
                        {order.orderSource === "retailer"
                          ? "Retailer"
                          : "Regular"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={9}
                      className="border border-border py-10 text-center text-base text-muted-foreground"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <p className="font-medium">No deleted orders found</p>
                        <p className="text-sm">
                          Deleted orders will appear here after removal.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </TableScrollWrapper>
        </div>

        {orders?.totalCount > 0 && (
          <div className="flex justify-end">
            <CustomPagination
              currentPage={currentPage}
              totalLength={orders.totalCount}
              itemsPerPage={100}
            />
          </div>
        )}
      </div>
    </ContentLayout>
  );
};

export default DeletedOrdersPage;
