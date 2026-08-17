import { ContentLayout } from "@/components/custom/admin-panel/contentLayout";
import { getProductColours, getStock, getStockSourceLocations } from "@/lib/data";
import CustomSearchBar from "@/components/custom/admin-panel/customSearchBar";
import CustomPagination from "@/components/custom/admin-panel/customPagination";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { cookies } from "next/headers";
import { getRetailerDetails } from "@/lib/data";

import StyleNoImage from "@/app/(admin-panel)/admin-panel/stock/StyleNoImage";
import ExpandStockDetails from "@/app/(admin-panel)/admin-panel/stock/ExpandStockDetails";
import TableActions from "../../admin-panel/stock/TableActions";
import SizeSelector from "./SizeSelector";
import StockSourceFilter from "../../admin-panel/stock/StockSourceFilter";

// ------------------------------------
// TYPES
// ------------------------------------
interface SearchParams {
  cPage?: string;
  q?: string;
  source?: string;
}

interface InventoryProps {
  searchParams: Promise<SearchParams>;
}

export default async function Inventory({ searchParams }: InventoryProps) {
  const { cPage, q, source } = await searchParams;

  const currentPage = cPage ? Number(cPage) : 1;
  const query = q || "";
  const selectedSource = source || "";

  const cookieStore = await cookies();
  let currencyId = cookieStore.get("currencyId")?.value;
  const retailerId = cookieStore.get("retailerId")?.value;

  // Pull the latest retailer currency so inventory pricing reacts instantly to changes.
  if (retailerId) {
    const latestRetailer = await getRetailerDetails(Number(retailerId));
    const latestCurrencyId =
      latestRetailer?.currencyId ||
      latestRetailer?.retailer?.currencyId ||
      latestRetailer?.retailer?.customer?.currencyId;
    if (latestCurrencyId) {
      currencyId = String(latestCurrencyId);
    }
  }

  const stock = await getStock({
    page: currentPage,
    query,
    currencyId: currencyId ? Number(currencyId) : undefined,
    source: selectedSource,
  });

  const colours = await getProductColours({});
  const stockSourceResponse = await getStockSourceLocations();
  const sourceLocations = stockSourceResponse?.sourceLocations ?? [];

  const getColourName = (hex: string) => {
    return colours.productColours.find((c: any) => c.hexcode === hex)?.name;
  };

  const getResolvedColourName = (colourValue?: string) => {
    if (!colourValue) return "-";
    return getColourName(colourValue) || colourValue;
  };

  return (
    <ContentLayout title="Inventory">
      <div className="space-y-3">

        {/* SIZE DROPDOWN */}
        <SizeSelector />

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <CustomSearchBar query={query} />
          <StockSourceFilter
            sourceLocations={sourceLocations}
            selectedSource={selectedSource}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
          {stock.stock?.map((item: any) => {
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

                  {/* SIZE + MESH */}
                  <div className="border-t pt-0 text-gray-600">
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell className="py-0 text-xs font-medium">
                            Size
                          </TableCell>
                          <TableCell className="py-0 text-xs whitespace-normal break-words">
                            <span
                              className="size-convert whitespace-normal break-words"
                              data-eu={item.size}
                              data-from={item.size_country}
                            >
                              {item.size} ({item.size_country})
                            </span>
                          </TableCell>
                        </TableRow>

                        <TableRow>
                          <TableCell className="py-0 text-xs font-medium">
                            Source
                          </TableCell>
                          <TableCell className="py-0 text-xs whitespace-normal break-words">
                            {item.sourceLocation || "-"}
                          </TableCell>
                        </TableRow>

                        <TableRow>
                          <TableCell className="py-0 text-xs font-medium">
                            Mesh
                          </TableCell>
                          <TableCell className="py-1 text-xs whitespace-normal break-words">
                            <div className="flex items-center gap-1.5">
                              <span
                                className="h-3 w-3 shrink-0 rounded-full"
                                style={{ backgroundColor: item.mesh_color }}
                              />
                              <span className="whitespace-normal break-words">
                                {item.mesh_color === item.product.mesh_color
                                  ? `SAS(${getResolvedColourName(item.product.mesh_color)})`
                                  : getResolvedColourName(item.mesh_color)}
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>

                    <ExpandStockDetails
                      item={item}
                      beadingColourName={getResolvedColourName(item.beading_color)}
                      liningColourName={getResolvedColourName(item.lining_color)}
                    />
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
          itemsPerPage={100}
        />
      </div>
    </ContentLayout>
  );
}
