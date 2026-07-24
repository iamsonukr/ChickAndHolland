import { ContentLayout } from "@/components/custom/admin-panel/contentLayout";
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StockTable from "./StockTable";
import { FreshTable } from "./FreshTable";
import {
  getAdminRetailersFreshOrders,
  getAdminRetailersStockOrders,
} from "@/lib/data";
import CustomPagination from "@/components/custom/admin-panel/customPagination";
import CustomSearchBar from "@/components/custom/admin-panel/customSearchBar";
import { fresh } from "@/lib/utils";
import TableScrollWrapper from "@/components/TableScrollWrapper";

const page = async (props: {
  searchParams: Promise<Record<string, string>>;
}) => {
  const searchParams = await props.searchParams;
  const currentPage = searchParams["cPage"] ? Number(searchParams["cPage"]) : 1;
  const query = searchParams["q"] ? searchParams["q"] : "";
  const activeTab =
    searchParams["tab"] === "stock"
      ? "stock"
      : searchParams["tab"] === "sample"
        ? "sample"
        : "fresh";

  const myStockOrders = await getAdminRetailersStockOrders({
    page: currentPage,
    query,
  });

  const myFreshOrders = await getAdminRetailersFreshOrders({
    page: currentPage,
    query,
    requestType: "fresh",
  });

  const mySampleOrders = await getAdminRetailersFreshOrders({
    page: currentPage,
    query,
    requestType: "sample",
  });



  return (
    <ContentLayout title="Order Request">
      <CustomSearchBar query={query} />
      <Tabs defaultValue={activeTab} className="mt-3 w-full">
        <TabsList className="grid h-auto w-full grid-cols-1 text-base sm:grid-cols-3 sm:text-lg">
          <TabsTrigger value="fresh" className="relative">
            {fresh}
            {myFreshOrders?.totalCount > 0 && (
              <span className="absolute -right-2 -top-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-600 px-1.5 text-[11px] font-semibold text-white">
                {myFreshOrders.totalCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="sample" className="relative">
            Sample Orders
            {mySampleOrders?.totalCount > 0 && (
              <span className="absolute -right-2 -top-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-600 px-1.5 text-[11px] font-semibold text-white">
                {mySampleOrders.totalCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="stock" className="relative">
            Stock
            {myStockOrders?.totalCount > 0 && (
              <span className="absolute -right-2 -top-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-600 px-1.5 text-[11px] font-semibold text-white">
                {myStockOrders.totalCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="fresh">
          {myFreshOrders && (
            <TableScrollWrapper>
              <FreshTable data={myFreshOrders.favoritesOrders} />
              <CustomPagination
                currentPage={currentPage}
                totalLength={myFreshOrders?.totalCount}
                resetOtherFields={false}
              />
            </TableScrollWrapper>
          )}
        </TabsContent>
        <TabsContent value="sample">
          {mySampleOrders && (
            <TableScrollWrapper>
              <FreshTable data={mySampleOrders.favoritesOrders} />
              <CustomPagination
                currentPage={currentPage}
                totalLength={mySampleOrders?.totalCount}
                resetOtherFields={false}
              />
            </TableScrollWrapper>
          )}
        </TabsContent>
        <TabsContent value="stock">
          {myStockOrders && (
            <TableScrollWrapper>
              <StockTable data={myStockOrders.stockOrders} />
              <CustomPagination
                currentPage={currentPage}
                totalLength={myStockOrders?.totalCount}
                resetOtherFields={false}
              />
            </TableScrollWrapper>
          )}
        </TabsContent>
      </Tabs>
    </ContentLayout>
  );
};

export default page;
