import { cookies } from "next/headers";

import { ContentLayout } from "@/components/custom/admin-panel/contentLayout";
import CustomPagination from "@/components/custom/admin-panel/customPagination";
import { getRetailersOrders } from "@/lib/data";
import RejectedOrders from "../my-orders/RejectedOrders";

const RejectedOrdersPage = async (props: {
  searchParams: Promise<Record<string, string>>;
}) => {
  const searchParams = await props.searchParams;
  const retailerId = (await cookies()).get("retailerId")?.value;
  const currentPage = searchParams["cPage"] ? Number(searchParams["cPage"]) : 1;

  const rejectedOrders = await getRetailersOrders({
    retailerId: Number(retailerId),
    page: currentPage,
    isApproved: 3,
  });
  const orders = rejectedOrders?.orders ?? [];

  return (
    <ContentLayout title="Rejected Orders">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {orders.length > 0
              ? `Showing ${orders.length} rejected order${
                  orders.length !== 1 ? "s" : ""
                }`
              : "No rejected orders"}
          </p>
        </div>

        <RejectedOrders data={orders} retailerId={Number(retailerId)} />

        {rejectedOrders?.totalCount > 0 && (
          <div className="flex justify-end">
            <CustomPagination
              currentPage={currentPage}
              totalLength={rejectedOrders.totalCount}
            />
          </div>
        )}
      </div>
    </ContentLayout>
  );
};

export default RejectedOrdersPage;
