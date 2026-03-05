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

const page = async (props: {
  searchParams: Promise<Record<string, string>>;
}) => {
  const searchParams = await props.searchParams;
  const currentPage = searchParams["cPage"] ? Number(searchParams["cPage"]) : 1;
  const query = searchParams["q"] ? searchParams["q"] : "";

  const myStockOrders = await getAdminRetailersStockOrders({
    page: currentPage,
    query,
  });

  const myFreshOrders = await getAdminRetailersFreshOrders({
    page: currentPage,
    query,
  });



  return (
    <ContentLayout title="Order Request">
      <CustomSearchBar query={query} />
      <Tabs defaultValue="fresh" className="mt-3 w-full">
        <TabsList className="grid w-full grid-cols-2 text-lg">
          <TabsTrigger value="fresh">{fresh}</TabsTrigger>
          <TabsTrigger value="stock">Stock</TabsTrigger>
        </TabsList>
        <TabsContent value="fresh">
          {myFreshOrders && (
            <>
              <FreshTable data={myFreshOrders.favoritesOrders} />
              <CustomPagination
                currentPage={currentPage}
                totalLength={myFreshOrders?.totalCount}
                resetOtherFields={false}
              />
            </>
          )}
        </TabsContent>
        <TabsContent value="stock">
          {myStockOrders && (
            <>
              <StockTable data={myStockOrders.stockOrders} />
              <CustomPagination
                currentPage={currentPage}
                totalLength={myStockOrders?.totalCount}
                resetOtherFields={false}
              />
            </>
          )}
        </TabsContent>
      </Tabs>
    </ContentLayout>
  );
};

export default page;
