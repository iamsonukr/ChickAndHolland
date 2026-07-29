import { ContentLayout } from "@/components/custom/admin-panel/contentLayout";
import React from "react";
import CustomSearchBar from "@/components/custom/admin-panel/customSearchBar";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getAcceptedRetailersOrders,
  getOrderStageCounts,
  getRetailerAcceptedAdminFreshOrderDetails,
  getRetailersOrders,
  getAdminOrders,
} from "@/lib/data";

import RejectedOrders from "./RejectedOrders";
import AdminDeliveredOrders from "./AdminDeliveredOrders";
import CustomPagination from "@/components/custom/admin-panel/customPagination";
import Orders from "./Orders";
import TableScrollWrapper from "@/components/TableScrollWrapper";
import Preview from "./Preview";
import Details from "../../retailer-panel/my-orders/Details";
import { formatDateOnlyDisplay } from "@/lib/dateOnly";
import StageFilter from "../orders/StageFilter";
import TrackingIdText from "../orders/TrackingIdText";

// import AdminDeliveredOrders from

function formatDateTime(date: Date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day} `;
}

function formatMoney(item: any, value: any) {
  return `${item.currencySymbol || "\u20ac"} ${parseFloat(value || 0).toFixed(0)}`;
}

const page = async (props: {
  searchParams: Promise<Record<string, string>>;
}) => {
  const searchParams = await props.searchParams;
  const currentPage = searchParams["cPage"] ? Number(searchParams["cPage"]) : 1;
  const query = searchParams["q"] ? searchParams["q"] : "";
  const stage = searchParams["stage"] ?? "";
  
  const [
    acceptedOrders,
    myOrders,
    deliveredOrder,
    adminOrders,
    deliveredAdminOrders,
    orderStageCounts,
  ] = await Promise.all([
    getRetailerAcceptedAdminFreshOrderDetails({
      page: currentPage,
      query,
      stage,
      id: 0,
    }),
    getRetailersOrders({
      page: currentPage,
      isApproved: 3,
      query,
    }),
    getRetailerAcceptedAdminFreshOrderDetails({
      page: currentPage,
      query,
      stage,
      id: 1,
    }),
    getAdminOrders(0, stage, "active"),
    getAdminOrders(0, stage, "delivered"),
    getOrderStageCounts({
      query,
    }),
  ]);
  const deliveredRows = [
    ...(deliveredOrder?.retailerOrders ?? []),
    ...(deliveredAdminOrders?.orders ?? []),
  ];

  return (
    <ContentLayout title="Order List">
      <div className="mb-2">
        <CustomSearchBar query={query} />
        <div className="mt-2">
          <StageFilter
            query={query}
            stage={stage}
            stageCounts={orderStageCounts?.stageCounts ?? acceptedOrders?.stageCounts}
          />
        </div>
      </div>
      {/* <div className="flex justify-end">
        <DeleteButton />
        hh
      </div> */}
      <Tabs defaultValue="accepted" className="w-full">
        <div className="w-full overflow-x-auto pb-1">
          <TabsList className="flex h-auto w-max min-w-max flex-nowrap gap-1 sm:grid sm:w-full sm:min-w-0 sm:grid-cols-4">
            <TabsTrigger className="flex-none px-4 sm:flex-1" value="accepted">
              Accepted
            </TabsTrigger>
            <TabsTrigger className="flex-none px-4 sm:flex-1" value="delivered">
              Delivered
            </TabsTrigger>
            <TabsTrigger className="flex-none px-4 sm:flex-1" value="rejected">
              Rejected
            </TabsTrigger>
            <TabsTrigger className="flex-none px-4 sm:flex-1" value="adminOrders">
              Admin Orders
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="accepted">
          <TableScrollWrapper>
            <Orders data={acceptedOrders.retailerOrders} />
          </TableScrollWrapper>
          <CustomPagination
            currentPage={currentPage}
            totalLength={acceptedOrders?.totalCount}
          />
        </TabsContent>
        <TabsContent value="delivered">
          <TableScrollWrapper>
            <AdminDeliveredOrders data={deliveredRows} />
          </TableScrollWrapper>
          <CustomPagination
            currentPage={currentPage}
            totalLength={
              Number(deliveredOrder?.totalCount || 0) +
              Number(deliveredAdminOrders?.orders?.length || 0)
            }
          />
        </TabsContent>
        <TabsContent value="rejected">
          <RejectedOrders searchParams={searchParams} myOrders={myOrders.orders} />
        </TabsContent>
        <TabsContent value="adminOrders">
          <div className="mt-0">
            <TableScrollWrapper>
              <Table className="w-full min-w-[1220px] table-auto border md:table-fixed">
                <TableHeader className="bg-muted/50">
                  <TableRow className="whitespace-nowrap md:whitespace-normal">
                    <TableHead className="text-center">Date</TableHead>
                    <TableHead className="text-center">Order Id</TableHead>
                    <TableHead className="text-center">Order Type</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Total Quantity</TableHead>
                    <TableHead className="w-[260px] text-center">Tracking ID</TableHead>
                    <TableHead className="text-center">Order Date</TableHead>
                    <TableHead className="text-center">Paid</TableHead>
                    <TableHead className="text-center">Balance</TableHead>
                    <TableHead className="text-center">Preview</TableHead>
                    <TableHead className="text-center">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminOrders?.orders?.map((item: any) => (
                    <TableRow
                      key={item.id}
                      className="whitespace-nowrap text-center hover:bg-muted/20 md:whitespace-normal"
                    >
                      <TableCell>{formatDateTime(new Date(item.createdAt))}</TableCell>
                      <TableCell className="font-medium">{item.order_id}</TableCell>
                      <TableCell>{item.orderType === "Store" ? "Store Web Order" : item.orderType}</TableCell>
                      <TableCell>{item.orderStatus}</TableCell>
                      <TableCell>{item.totalQuantity ?? item.total_quantity ?? 0}</TableCell>
                      <TableCell className="w-[260px] whitespace-normal">
                        <TrackingIdText trackingId={item.trackingNo} />
                      </TableCell>
                      <TableCell>
                        {formatDateOnlyDisplay(
                          item.orderReceivedDate || item.createdAt,
                          "YYYY-MM-DD",
                        )}
                      </TableCell>
                      <TableCell>{formatMoney(item, item.paid_amount)}</TableCell>
                      <TableCell>{formatMoney(item, item.balance)}</TableCell>
                      <TableCell>
                        {/* Preview component available in this folder */}
                        <Preview id={item.id} type={item.orderType} order={item} orderSource="regular" />
                      </TableCell>
                      <TableCell>
                        <Details
                          id={item.id}
                          retailerId={item.retailer_id ?? 0}
                          type={item.orderType}
                          paymentId={item.payment_id ?? 0}
                          orderId={item.id}
                          orderSource="regular"
                          order={item}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableScrollWrapper>
          </div>
        </TabsContent>
      </Tabs>
    </ContentLayout>
  );
};

export default page;
