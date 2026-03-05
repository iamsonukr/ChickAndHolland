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
  getRetailerAcceptedAdminFreshOrderDetails,
  getRetailersOrders,
} from "@/lib/data";

import RejectedOrders from "./RejectedOrders";
import AdminDeliveredOrders from "./AdminDeliveredOrders";
import CustomPagination from "@/components/custom/admin-panel/customPagination";
import Orders from "./Orders";
import TableScrollWrapper from "@/components/TableScrollWrapper";

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
const page = async (props: {
  searchParams: Promise<Record<string, string>>;
}) => {
  const searchParams = await props.searchParams;
  const currentPage = searchParams["cPage"] ? Number(searchParams["cPage"]) : 1;
  const query = searchParams["q"] ? searchParams["q"] : "";
  
  const acceptedOrders = await getRetailerAcceptedAdminFreshOrderDetails({
    page: currentPage,
    query,
    id: 0,
  });

  const myOrders = await getRetailersOrders({
    page: currentPage,
    isApproved: 3,
    query,
  });

  const deliveredOrder = await getRetailerAcceptedAdminFreshOrderDetails({
    page: currentPage,
    query,
    id: 1,
  });

  return (
    <ContentLayout title="Order List">
      <div className="mb-2">
        <CustomSearchBar query={query} />
      </div>
      {/* <div className="flex justify-end">
        <DeleteButton />
        hh
      </div> */}
      <TableScrollWrapper>
      <Tabs defaultValue="accepted" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="accepted">Accepted</TabsTrigger>
          <TabsTrigger value="delivered">Delivered</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
        <TabsContent value="accepted">
          <Orders data={acceptedOrders.retailerOrders} />
          <CustomPagination
            currentPage={currentPage}
            totalLength={acceptedOrders?.totalCount}
          />
        </TabsContent>
        <TabsContent value="delivered">
          <AdminDeliveredOrders data={deliveredOrder.retailerOrders} />
          <CustomPagination
            currentPage={currentPage}
            totalLength={deliveredOrder?.totalCount}
          />
        </TabsContent>
        <TabsContent value="rejected">
          <RejectedOrders searchParams={searchParams} myOrders={myOrders.orders} />
        </TabsContent>
      </Tabs>
      </TableScrollWrapper>
    </ContentLayout>
  );
};

export default page;
