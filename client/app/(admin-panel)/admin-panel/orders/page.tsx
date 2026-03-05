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
import UpdateShippingStatus from "./UpdateShippingStatus";
import UpdateTrackingId from "./UpdateTrackingId";
import UpdateRetailerOrderStatus from "./UpdateRetailerOrderStatus";
import UpdateRetailerTrackingId from "./UpdateRetailerTrackingId";
import UpdatingRetailerShippingStatus from "./UpdatingRetailerShippingStatus";
import AddressCard from "./AddressCard";
import Delete, { DeleteButton, ItemsProvider } from "./Delete";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import OrderDetailsSheet from "./OrderDetails";
import TableScrollWrapper from "@/components/TableScrollWrapper";

// ✅ STATUS → DB FIELD MAPPING
const statusToDbField: Record<string, string | null> = {
  "Pattern": "pattern",
  "Khaka": "khaka",
  "Issue Beading": "issue_beading",
  "Beading": "beading",
  "Zarkan": "zarkan",
  "Stitching": "stitching",
  "Ready to Delivery": "ready_to_delivery",
  "Shipped": "shipped",
  "Balance Pending": null,
};

const OrdersPage = async (props: {
  searchParams: Promise<Record<string, string>>;
}) => {
  const searchParams = await props.searchParams;
  const currentPage = searchParams["cPage"] ? Number(searchParams["cPage"]) : 1;
  const query = searchParams["q"] ? searchParams["q"] : "";
  const orderType = searchParams["orderType"] ? searchParams["orderType"] : "";

  const orders = await getOrders({
    page: currentPage,
    query,
    orderType: orderType === "All" ? "" : orderType,
  });

  const orderStatusData = async (status: string, id: number) => {
    const res = await getDates(id);

    const data = res.data;

    if (status == "Pattern/Khaka") {
      if (res.data.pattern != "") {
        return dayjs(res.data.pattern).format("MMM D, YYYY");
      } else {
        return "";
      }
    }

    return dayjs(res.data[status]).format("MMM D, YYYY");
  };
const orderStatusDataTwo = async (status: string, id: number) => {
  const res = await getOrderDates(id);
  const data = res.data;

  if (!data) return "";

  const dbField = statusToDbField[status];

  // Balance Pending ya unknown status
  if (!dbField) return "";

  // Agar date present hai
  if (data[dbField]) {
    return dayjs(data[dbField]).format("MMM D, YYYY");
  }

  return "";
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
        <div className="flex flex-col gap-8">
         <div className="flex flex-row items-center justify-between">
  <h1 className="text-xl md:text-2xl">All Orders</h1>
  <div className="flex items-center gap-3">

    {/* QR Scan Button */}
    {/* <Link href="/admin-panel/orders/qr-scan">
      <Button variant="outline" className="text-sm">
        📷 QR Scan
      </Button>
    </Link> */}

    <DeleteButton />

    <CreateOrder
      customers={customers.customers}
      ordersTotalCount={latestOrderPurchaseOrderNo}
    />
  </div>
</div>

          <div className="space-y-2">
            <div className={"flex items-center gap-2"}>
              <CustomSearchBar query={query} />
              <OrderTypeFilter />
            </div>
<TableScrollWrapper>

            <Table className="">
              <TableHeader>
                <TableRow className="text-nowrap text-lg">
                  <TableHead>
                    <Delete bulk={bulkData} type="bulk" />
                  </TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>PO#</TableHead>
                  <TableHead>Order Type</TableHead>
                  <TableHead>Order Date</TableHead>
                  <TableHead>Shipping Date</TableHead>
                  <TableHead>Order Status</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Phone</TableHead>

                  {/* <TableHead>Shipping Status</TableHead> */}
                  <TableHead>Tracking ID</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders?.orders?.map((order: any) => {
                  const difference = dayjs(order?.orderCancellationDate).diff(
                    dayjs(),
                    "days",
                  );

                  const formattedshippingDate = order.shippingDate
                    ? dayjs(order.shippingDate).format("DD MMM YYYY HH:mm A")
                    : null;

                  return (
//                     <TableRow
// key={`${order.id}-${order.purchaeOrderNo}-${order.orderType}`}
//                       className={`${cn(
//                         difference < 7 && order.orderStatus !== "shipped"
//                           ? "bg-red-600 text-white hover:bg-red-500"
//                           : difference < 14 && order.orderStatus !== "shipped"
//                             ? "bg-yellow-400 text-black hover:bg-yellow-500"
//                             : "",
//                       )} ${order.orderStatus == "Shipped" && "bg-green-500 text-black hover:bg-green-600"} text-nowrap text-lg`}
//                     >
<TableRow
  key={`${order.id}-${order.purchaeOrderNo}-${order.orderType}`}
  className={`${cn(
    // RED: less than 7 days & NOT shipped
    difference < 7 && order.orderStatus !== "Shipped"
      ? "bg-red-600 text-white hover:bg-red-500"
      : 
      // YELLOW: between 7–14 days & NOT shipped
      difference < 14 && order.orderStatus !== "Shipped"
      ? "bg-yellow-400 text-black hover:bg-yellow-500"
      : "",
  )} 
  ${
    // GREEN: shipped
    order.orderStatus === "Shipped" 
      ? "bg-green-500 text-black hover:bg-green-600" 
      : ""
  } 
  text-nowrap text-lg`}
>

                      <TableCell className="">
                        <Delete
                          id={order.id}
                          orderType={order.orderType}
                          type="single"
                        />
                      </TableCell>
                      <TableCell className="">
                        {order.customer?.name} {order.id}
                      </TableCell>
                      <TableCell>{order.purchaeOrderNo}</TableCell>
                      <TableCell>
                        {order.orderType == "Fresh" ? fresh : order.orderType}{" "}
                      </TableCell>
                      <TableCell>
                        {dayjs(order.orderReceivedDate).format("DD MMM YYYY")}
                      </TableCell>
                      <TableCell>
                        {dayjs(order.orderCancellationDate).format(
                          "DD MMM YYYY",
                        )}
                      </TableCell>

                      <TableCell className="cursor-pointer">
                        <div className="flex w-full flex-col">
                          <div className="flex w-full justify-between gap-2">
                            {/* {order.orderSource} */}

                            <div className="!text-black">
                              {order.orderSource == "retailer" ? (
                                <UpdateRetailerOrderStatus orderData={order} />
                              ) : (
                                <UpdateOrderStatus orderData={order} />
                              )}
                            </div>
                          </div>
                          <p>
                            {order.orderSource == "retailer"
                              ? orderStatusData(
                                  order.orderStatus.toString(),
                                  order.id,
                                )
                              : orderStatusDataTwo(
                                  order.orderStatus.toString(),
                                  order.id,
                                )}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell className="w-[100px] cursor-pointer truncate">
                        <div className="w-[100px] truncate">
                          <AddressCard ad={order.address} />
                          
                        </div>
                      </TableCell>
                      <TableCell className="cursor-pointer">
  {order.customer?.phoneNumber || "N/A"}
</TableCell>


                      {/* shipping status */}

                      {/* <TableCell>
                        {order.orderSource == "retailer" ? (
                          <UpdatingRetailerShippingStatus
                            orderData={{
                              ...order,
                              formattedshippingDate,
                            }}
                          />
                        ) : (
                          <UpdateShippingStatus
                            orderData={order.shippingStatus}
                            id={order.id}
                            orderStatus={order.className}
                            formattedshippingDate={formattedshippingDate}
                          />
                        )}
                      </TableCell> */}

                      {/* <TableCell>
                        {order.orderSource == "retailer" ? (
                          <div className="flex w-full justify-between">
                            {order.trackingNo
                              ? order.trackingNo
                              : "Add Tracking ID"}
                            <div className="text-black">
                              <UpdateRetailerTrackingId orderData={order} />
                            </div>
                          </div>
                        ) : (
                          <div className="flex w-full justify-between">
                            {order.trackingNo
                              ? order.trackingNo
                              : "Add Tracking ID"}
                            <div className="text-black">
                              <UpdateTrackingId
                                trackingId={order.trackingNo}
                                id={order.id}
                              />
                            </div>
                          </div>
                        )}
                      </TableCell> */}

                      <TableCell className="cursor-pointer">
                        <div className="text-black">
                          {order.orderSource == "retailer" ? (
                            <UpdateRetailerTrackingId orderData={order} />
                          ) : (
                            <UpdateTrackingId
                              trackingId={order.trackingNo}
                              id={order.id}
                            />
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="flex gap-2 items-center">
  <OrderDetailsSheet orderDetails={order} />
  <TableActions data={order} />
</TableCell>

                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
</TableScrollWrapper>

            <CustomPagination
              currentPage={currentPage}
              totalLength={orders?.totalCount}
            />
          </div>
        </div>
      </ItemsProvider>
    </ContentLayout>
  );
};

export default OrdersPage;
