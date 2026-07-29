import { ContentLayout } from "@/components/custom/admin-panel/contentLayout";
import CustomSearchBar from "@/components/custom/admin-panel/customSearchBar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  getAcceptedRetailersOrders, 
  getRetailersOrders, 
  getAdminOrders 
} from "@/lib/data";
import { cookies } from "next/headers";
import Details from "./Details";
import RejectedOrders from "./RejectedOrders";
import DeliveredOrders from "./DeliveredOrders";
import CustomPagination from "@/components/custom/admin-panel/customPagination";
import Preview from "../../admin-panel/order-list/Preview";
import { fresh } from "@/lib/utils";
import dayjs from "dayjs";
import TableScrollWrapper from "@/components/TableScrollWrapper";
import { formatDateOnlyDisplay } from "@/lib/dateOnly";
import TrackingIdText from "../../admin-panel/orders/TrackingIdText";

/**
 * Shared column widths to ensure perfect alignment across different tabs.
 * Using fixed widths with table-fixed prevents columns from shifting based on content.
 */
const COL_WIDTHS = {
  date: "w-[110px]",
  orderId: "w-[130px]",
  type: "w-[150px]",
  status: "w-[130px]",
  tracking: "w-[260px]",
  amount: "w-[100px]",
  actions: "w-[100px]",
};

const formatMoney = (item: any, value: any) =>
  `${item.currencySymbol || "\u20ac"} ${parseFloat(value || 0).toFixed(0)}`;

const Page = async (props: { searchParams: Promise<Record<string, string>> }) => {
  const searchParams = await props.searchParams;
  const retailerId = (await cookies()).get("retailerId")?.value;

  const currentPage = searchParams["cPage"] ? Number(searchParams["cPage"]) : 1;
  const query = searchParams["q"] ? searchParams["q"] : "";

  // Fetch all data in parallel for better performance
  const [acceptedOrders, deliverOrders, myOrders, adminOrders] = await Promise.all([
    getAcceptedRetailersOrders({
      retailerId: Number(retailerId),
      page: currentPage,
      query,
      id: 0,
    }),
    getAcceptedRetailersOrders({
      retailerId: Number(retailerId),
      page: currentPage,
      query,
      id: 1,
    }),
    getRetailersOrders({
      retailerId: Number(retailerId),
      page: currentPage,
      isApproved: 3,
    }),
    getAdminOrders(Number(retailerId)),
  ]);

  return (
    <ContentLayout title="Order List">
      <div className="mb-4">
        <CustomSearchBar query={query} />
      </div>

      <Tabs defaultValue="accepted" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="accepted">Accepted</TabsTrigger>
          <TabsTrigger value="delivered">Delivered</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="adminOrders">Admin Orders</TabsTrigger>
        </TabsList>

        <TableScrollWrapper>
          {/* --- ACCEPTED ORDERS TAB --- */}
          <TabsContent value="accepted" className="mt-0">
            <Table className="table-fixed w-full border">
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className={`${COL_WIDTHS.date} text-center`}>Date</TableHead>
                  <TableHead className={`${COL_WIDTHS.orderId} text-center`}>Order Id</TableHead>
                  <TableHead className={`${COL_WIDTHS.type} text-center`}>Order Type</TableHead>
                  <TableHead className={`${COL_WIDTHS.status} text-center`}>Status</TableHead>
                  <TableHead className={`${COL_WIDTHS.tracking} text-center`}>Tracking ID</TableHead>
                  <TableHead className={`${COL_WIDTHS.date} text-center`}>Order Date</TableHead>
                  <TableHead className={`${COL_WIDTHS.amount} text-center`}>Paid</TableHead>
                  <TableHead className={`${COL_WIDTHS.amount} text-center`}>Balance</TableHead>
                  <TableHead className={`${COL_WIDTHS.actions} text-center`}>Payment</TableHead>
                  <TableHead className={`${COL_WIDTHS.actions} text-center`}>Details</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {acceptedOrders?.retailerOrders?.map((item: any) => (
                  <TableRow key={item.order_id || item.stockOrderId} className="text-center hover:bg-muted/20">
                    <TableCell className="truncate">
                      {formatDateOnlyDisplay(item.formatted_date, "DD-MM-YYYY")}
                    </TableCell>
                    <TableCell className="font-medium">{item.order_id}</TableCell>
                    <TableCell>{item.type === "Fresh" ? fresh : item.type}</TableCell>
                    <TableCell>
                      {["Pattern", "Khaka", "Issue Beading", "Beading", "Zarkan", "Stitching", "Repair"].includes(item.orderStatus)
                        ? "In Process"
                        : item.orderStatus}
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      <TrackingIdText trackingId={item.trackingNo} />
                    </TableCell>
                    <TableCell>
                      {formatDateOnlyDisplay(
                        item.orderReceivedDate ?? item.received_date,
                        "DD-MM-YYYY",
                      )}
                    </TableCell>
                    <TableCell>
                      {item.currencySymbol || "€"} {parseFloat(item.paid_amount || 0).toFixed(0)}
                    </TableCell>
                    <TableCell>
                      {item.currencySymbol || "€"} {parseFloat(item.balance || 0).toFixed(0)}
                    </TableCell>
                    <TableCell>
                      <Details
                        id={item.stockOrderId || item.favouriteOrderId}
                        retailerId={Number(retailerId)}
                        type={item.type}
                        paymentId={item.payment_id}
                        orderId={item.order_id}
                      />
                    </TableCell>
                    <TableCell>
                      <Preview
                        order={item}
                        type={item.type}
                        id={item.favouriteOrderId || item.stockOrderId}
                        showShippingDate={false}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4">
              <CustomPagination
                currentPage={currentPage}
                totalLength={acceptedOrders?.totalCount}
              />
            </div>
          </TabsContent>

          {/* --- ADMIN ORDERS TAB --- */}
          <TabsContent value="adminOrders" className="mt-0">
            <Table className="table-fixed w-full border">
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className={`${COL_WIDTHS.date} text-center`}>Date</TableHead>
                  <TableHead className={`${COL_WIDTHS.orderId} text-center`}>Order Id</TableHead>
                  <TableHead className={`${COL_WIDTHS.type} text-center`}>Order Type</TableHead>
                  <TableHead className={`${COL_WIDTHS.status} text-center`}>Status</TableHead>
                  <TableHead className={`${COL_WIDTHS.tracking} text-center`}>Tracking ID</TableHead>
                  <TableHead className={`${COL_WIDTHS.date} text-center`}>Order Date</TableHead>
                  <TableHead className={`${COL_WIDTHS.amount} text-center`}>Paid</TableHead>
                  <TableHead className={`${COL_WIDTHS.amount} text-center`}>Balance</TableHead>
                  <TableHead className={`${COL_WIDTHS.actions} text-center`}>Payment</TableHead>
                  <TableHead className={`${COL_WIDTHS.actions} text-center`}>Details</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {adminOrders?.orders?.map((item: any) => (
                  <TableRow key={item.id} className="text-center hover:bg-muted/20">
                    <TableCell>{dayjs(item.createdAt).format("DD-MM-YYYY")}</TableCell>
                    <TableCell className="font-medium">{item.order_id}</TableCell>
                    <TableCell>{item.orderType === "Store" ? "Store Web Order" : item.orderType}</TableCell>
                    <TableCell>{item.orderStatus}</TableCell>
                    <TableCell className="whitespace-normal">
                      <TrackingIdText trackingId={item.trackingNo} />
                    </TableCell>
                    <TableCell>
                      {formatDateOnlyDisplay(item.orderReceivedDate, "DD-MM-YYYY")}
                    </TableCell>
                    <TableCell>{formatMoney(item, item.paid_amount)}</TableCell>
                    <TableCell>{formatMoney(item, item.balance)}</TableCell>
                    <TableCell>
                      <Details
                        id={item.id}
                        retailerId={Number(retailerId)}
                        type={item.orderType}
                        paymentId={item.payment_id}
                        orderId={item.id}
                        orderSource="regular"
                        order={item}
                      />
                    </TableCell>
                    <TableCell>
                      <Preview
                        order={item}
                        type={item.orderType}
                        id={item.id}
                        orderSource="regular"
                        showShippingDate={false}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
        </TableScrollWrapper>

        {/* --- DELIVERED ORDERS TAB --- */}
        <TabsContent value="delivered">
          <DeliveredOrders
            data={deliverOrders.retailerOrders}
            id={Number(retailerId)}
          />
          <div className="mt-4">
            <CustomPagination
              currentPage={currentPage}
              totalLength={deliverOrders?.totalCount}
            />
          </div>
        </TabsContent>

        {/* --- REJECTED ORDERS TAB --- */}
        <TabsContent value="rejected">
          <RejectedOrders 
            data={myOrders.orders} 
            retailerId={Number(retailerId)} 
          />
        </TabsContent>
      </Tabs>
    </ContentLayout>
  );
};

export default Page;
