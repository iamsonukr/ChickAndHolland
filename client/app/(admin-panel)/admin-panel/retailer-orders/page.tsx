import { getProductColours, getRetailersOrders } from "@/lib/data";
import { cookies } from "next/headers";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import CustomPagination from "@/components/custom/admin-panel/customPagination";
import { ContentLayout } from "@/components/custom/admin-panel/contentLayout";
import StyleNoImage from "@/app/(admin-panel)/admin-panel/stock/StyleNoImage";
import TableActions from "./TableActions";
import CustomSearchBar from "@/components/custom/admin-panel/customSearchBar";

const RetailerOrder = async (
  props: {
    searchParams: Promise<Record<string, string>>;
  }
) => {
  const searchParams = await props.searchParams;
  const currentPage = searchParams["cPage"] ? Number(searchParams["cPage"]) : 1;
  const query = searchParams["q"] ? searchParams["q"] : "";

  const myOrders = await getRetailersOrders({
    page: currentPage,
    query,
    isApproved: 0,
  });
  const colours = await getProductColours({});

  const getColourName = (color: number) => {
    // const id = colors.split(",").map((Number));
    // const readableColors = id.map((id) => {
    //   return colours.find((colour) => colour.id === id)?.name;
    // });
    // return readableColors.join(", ");
    return colours.productColours?.find((colour) => colour.id === color)?.name;
  };

  const getColourHex = (color: number) => {
    return colours.productColours?.find((colour) => colour.id === color)
      ?.hexcode;
  };

  return (
    <ContentLayout title="Retailer Orders">
      <div className="space-y-2">
        <CustomSearchBar query={query} />

        {/*<pre>*/}
        {/*  {JSON.stringify(myOrders, null, 2)}*/}
        {/*</pre>*/}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Style NO</TableHead>
              <TableHead>Customer</TableHead>
              {/*<TableHead>Address</TableHead>*/}
              <TableHead>Quantity</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Status</TableHead>
              {/*<TableHead>Due</TableHead>*/}
            </TableRow>
          </TableHeader>
          <TableBody>
            {myOrders?.retailerOrders?.map((order: any) => {
              return (
                <TableRow key={order.id}>
                  {/*<TableCell>{order.stock.styleNo}</TableCell>*/}
                  <StyleNoImage details={order.stock} />
                  <TableCell>{order.retailer.customer?.name}</TableCell>
                  <TableCell>{order.quantity}</TableCell>
                  <TableCell
                    style={{
                      backgroundColor: getColourHex(order.color),
                    }}
                  >
                    {getColourName(order.color)}
                  </TableCell>
                  <TableCell>
                    {order.currencySymbol || "€"} {order.purchaseAmount}
                  </TableCell>
                  <TableActions row={order} />
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <CustomPagination
          currentPage={currentPage}
          totalLength={myOrders?.totalCount}
        />
      </div>
    </ContentLayout>
  );
};

export default RetailerOrder;
