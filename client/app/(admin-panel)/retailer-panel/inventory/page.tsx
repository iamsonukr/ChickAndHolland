import { ContentLayout } from "@/components/custom/admin-panel/contentLayout";
import { getProductColours, getStock } from "@/lib/data";
import CustomSearchBar from "@/components/custom/admin-panel/customSearchBar";
import CustomPagination from "@/components/custom/admin-panel/customPagination";
import { cookies } from "next/headers";

import StyleNoImage from "@/app/(admin-panel)/admin-panel/stock/StyleNoImage";
import TableActions from "../../admin-panel/stock/TableActions";
import SizeSelector from "./SizeSelector";

// ------------------------------------
// TYPES
// ------------------------------------
interface SearchParams {
  cPage?: string;
  q?: string;
}

interface InventoryProps {
  searchParams: Promise<SearchParams>;
}

export default async function Inventory({ searchParams }: InventoryProps) {
  const { cPage, q } = await searchParams;

  const currentPage = cPage ? Number(cPage) : 1;
  const query = q || "";

  const cookieStore = await cookies();
  const currencyId = cookieStore.get("currencyId")?.value;

  const stock = await getStock({
    page: currentPage,
    query,
    currencyId: currencyId ? Number(currencyId) : undefined,
  });

  const colours = await getProductColours({});

  const getColourName = (hex: string) => {
    return colours.productColours.find((c) => c.hexcode === hex)?.name;
  };

  return (
    <ContentLayout title="Inventory">
      <div className="space-y-3">

        {/* SIZE DROPDOWN */}
        <SizeSelector />

        <CustomSearchBar query={query} />

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
          {stock.stock?.map((item) => {
            if (item.quantity < 1) return null;
            if (!item.product) return null;

            return (
              <div
                key={item.id}
                className="flex flex-col rounded-md border shadow-sm hover:shadow-md p-2"
              >
                {/* IMAGE */}
                <div className="aspect-[3/4] w-full overflow-hidden rounded-md">
                  <StyleNoImage details={item} />
                </div>

                <div className="flex flex-col p-1 sm:p-2 text-xs sm:text-sm">

                  {/* Qty + Price */}
                  <div className="mb-2 flex flex-col gap-1">
                    <span className="bg-gray-100 px-2 py-1 rounded-md w-fit">
                      Qty: {item.quantity}
                    </span>

                    <div className="flex items-baseline gap-1 flex-wrap">
                      <span
                        className={
                          item.price !== item.discountedPrice
                            ? "line-through text-gray-400"
                            : ""
                        }
                      >
                        {item.currencySymbol || "€"}{item.price}
                      </span>

                      {item.price !== item.discountedPrice && (
                        <span className="text-green-600 font-semibold">
                          {item.currencySymbol || "€"}{item.discountedPrice}
                          <span className="text-xs ml-1">
                            (-{item.discount}%)
                          </span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* SIZE + COLOR */}
                  <div className="mt-1 border-t pt-2 text-gray-700">
                    <div className="flex flex-col gap-1">

                      {/* SIZE */}
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-medium shrink-0">Size</span>
                        <span
                          className="size-convert truncate text-right"
                          data-eu={item.size}
                          data-from={item.size_country}
                        >
                          {item.size} ({item.size_country})
                        </span>
                      </div>

                      {/* COLOR */}
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-medium shrink-0">Color</span>
                        <div className="flex items-center gap-1 min-w-0">
                          <span
                            className="h-4 w-4 shrink-0 rounded-full border"
                            style={{ backgroundColor: item.mesh_color }}
                          />
                          <span className="truncate max-w-[70px] sm:max-w-[90px]">
                            {item.mesh_color === item.product.mesh_color
                              ? `SAS(${getColourName(item.product.mesh_color)})`
                              : getColourName(item.mesh_color)}
                          </span>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

                <TableActions
                  data={item}
                  colours={colours.productColours}
                  edit={false}
                  placeOrder={true}
                />
              </div>
            );
          })}
        </div>

        <CustomPagination
          currentPage={currentPage}
          totalLength={stock.totalCount}
        />
      </div>
    </ContentLayout>
  );
}