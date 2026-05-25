import { ContentLayout } from "@/components/custom/admin-panel/contentLayout";
import CustomPagination from "@/components/custom/admin-panel/customPagination";
import CustomSearchBar from "@/components/custom/admin-panel/customSearchBar";
import TableScrollWrapper from "@/components/TableScrollWrapper";
import { getCustomers, getOrders } from "@/lib/data";
import { cn, fresh } from "@/lib/utils";
import AddressCard from "../orders/AddressCard";
import CreateOrder from "../orders/CreateOrder";
import OrderDetailsSheet from "../orders/OrderDetails";
import DraftOrderActions from "./DraftOrderActions";
import { formatDateOnlyDisplay } from "@/lib/dateOnly";

const tableHeadClassName =
  "border border-border px-2 py-1.5 text-center text-[15px] font-semibold text-foreground align-middle";

const tableCellClassName =
  "border border-border px-2 py-1.5 text-sm md:text-[15px] align-middle";

const DraftOrdersPage = async (props: {
  searchParams: Promise<Record<string, string>>;
}) => {
  const searchParams = await props.searchParams;
  const currentPage = searchParams["cPage"] ? Number(searchParams["cPage"]) : 1;
  const query = searchParams["q"] ?? "";

  const [orders, customers] = await Promise.all([
    getOrders({
      page: currentPage,
      query,
      publishStatus: "draft",
    }),
    getCustomers({}),
  ]);

  const draftOrders = orders?.orders ?? [];
  return (
    <ContentLayout title="Draft Orders">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="text-lg font-semibold md:text-xl">Draft Orders</h1>
        </div>

        <CustomSearchBar query={query} />

        <TableScrollWrapper>
          <table className="w-full min-w-[1040px] border-collapse text-sm">
            <thead className="bg-muted/50">
              <tr className="whitespace-nowrap [&>th]:align-middle">
                <th className={tableHeadClassName}>Customer</th>
                <th className={cn(tableHeadClassName, "w-[150px]")}>PO#</th>
                <th className={cn(tableHeadClassName, "w-[140px]")}>Order Type</th>
                <th className={cn(tableHeadClassName, "w-[130px]")}>Order Date</th>
                <th className={cn(tableHeadClassName, "w-[130px]")}>Ship Date</th>
                <th className={cn(tableHeadClassName, "w-[240px]")}>Address</th>
                <th className={cn(tableHeadClassName, "w-[280px] text-center")}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {draftOrders.length > 0 ? (
                draftOrders.map((order: any) => (
                  <tr
                    key={`${order.id}-${order.purchaeOrderNo}`}
                    className="whitespace-nowrap align-middle [&>td]:align-middle"
                  >
                    <td className={tableCellClassName}>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold">{order.customer?.name}</span>
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
                      {order.orderCancellationDate
                        ? formatDateOnlyDisplay(order.orderCancellationDate)
                        : "-"}
                    </td>
                    <td
                      className={cn(
                        tableCellClassName,
                        "max-w-[240px] whitespace-normal break-words",
                      )}
                    >
                      <AddressCard ad={order.address} />
                    </td>
                    <td className={cn(tableCellClassName, "text-center")}>
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <OrderDetailsSheet
                          orderDetails={order}
                          showStatusActions={false}
                        />
                        <CreateOrder
                          customers={customers.customers ?? []}
                          ordersTotalCount={0}
                          editOrder={order}
                          triggerLabel="Edit"
                        />
                        <DraftOrderActions orderId={order.id} />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="border border-border py-10 text-center text-base text-muted-foreground"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <p className="font-medium">No draft orders found</p>
                      <p className="text-sm">Saved drafts will appear here.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </TableScrollWrapper>

        {orders?.totalCount > 0 && (
          <div className="flex justify-end">
            <CustomPagination
              currentPage={currentPage}
              totalLength={orders.totalCount}
            />
          </div>
        )}
      </div>
    </ContentLayout>
  );
};

export default DraftOrdersPage;
