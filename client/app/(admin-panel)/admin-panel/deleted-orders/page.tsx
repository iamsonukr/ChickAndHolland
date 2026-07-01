import { ContentLayout } from "@/components/custom/admin-panel/contentLayout";
import CustomPagination from "@/components/custom/admin-panel/customPagination";
import CustomSearchBar from "@/components/custom/admin-panel/customSearchBar";
import { Button } from "@/components/ui/button";
import { getOrders } from "@/lib/data";
import Link from "next/link";
import OrderTypeFilter from "../orders/OrderTypeFilter";
import DeletedOrdersTable from "./DeletedOrdersTable";

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

        <DeletedOrdersTable orders={deletedOrders} />

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
