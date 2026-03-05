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
import CustomSearchBar from "@/components/custom/admin-panel/customSearchBar";
import { formatDate } from "date-fns/format";
import ActionButtons from "./ActionButtons";
import { fresh } from "@/lib/utils";
import dayjs from "dayjs";

const MyOrders = async (props: {
  searchParams: Promise<Record<string, string>>;
}) => {
  const searchParams = await props.searchParams;
  const retailerId = (await cookies()).get("retailerId")?.value;
  const currentPage = searchParams["cPage"] ? Number(searchParams["cPage"]) : 1;
  const query = searchParams["q"] ? searchParams["q"] : "";

  const myOrders = await getRetailersOrders({
    retailerId: Number(retailerId),
    page: currentPage,
    query,
    isApproved: 0,
  });



  return (
    <ContentLayout title="My Orders">
      <div className="space-y-2">
        {/* <CustomSearchBar query={query} /> */}

        <Table>
          <TableHeader>
            <TableRow>
              {/* <TableHead>Style NO</TableHead> */}
              <TableHead>Ordered on</TableHead>
              <TableHead>Order Type</TableHead>
              <TableHead>Quantity</TableHead>
              {/* <TableHead>Color</TableHead> */}
              <TableHead>Total Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {myOrders?.orders?.map((order: any, index: number) => {
              return (
                <TableRow key={index}>
                  <TableCell className="text-nowrap">
                    {dayjs(order.formatted_date).format("DD-MM-YYYY")}
                  </TableCell>
                  <TableCell className="text-nowrap">
                    {order.order_type == "Fresh" ? fresh : order.order_type}
                  </TableCell>

                  <TableCell className="text-nowrap">{order.Total}</TableCell>

                  <TableCell>
                    {order.currencySymbol
                      ? `${order.currencySymbol} ${parseFloat(order.total_price).toFixed(0)}`
                      : `€ ${parseFloat(order.total_price).toFixed(0)}`}
                  </TableCell>
                  <TableCell
                    className={
                      order.is_approved
                        ? "text-green-500"
                        : order.is_approved
                          ? "text-red-500"
                          : "text-yellow-700"
                    }
                  >
                    {order.is_approved
                      ? "Approved"
                      : order.is_approved
                        ? "Rejected"
                        : "Pending"}
                  </TableCell>
                  <TableCell>
                    {retailerId && (
                      <ActionButtons
                        id={order.id}
                        retailerId={Number(retailerId)}
                        is_approved={order.is_approved}
                        type={order.order_type}
                      />
                    )}
                  </TableCell>
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

export default MyOrders;
