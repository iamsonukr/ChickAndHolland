import { ContentLayout } from "@/components/custom/admin-panel/contentLayout";
import AddStockForm from "./AddStockForm";
import {
  getProductColours,
  getStock,
  getCurrencies,
} from "@/lib/data";
import CustomSearchBar from "@/components/custom/admin-panel/customSearchBar";
import CustomPagination from "@/components/custom/admin-panel/customPagination";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import TableActions from "./TableActions";
import StyleNoImage from "@/app/(admin-panel)/admin-panel/stock/StyleNoImage";
import ExpandStockDetails from "./ExpandStockDetails";

const Stock = async (props: {
  searchParams: Promise<Record<string, string>>;
}) => {
  const searchParams = await props.searchParams;
  const currentPage = searchParams["cPage"]
    ? Number(searchParams["cPage"])
    : 1;
  const query = searchParams["q"] || "";

  const stock = await getStock({
    page: currentPage,
    query,
  });

  const colours = await getProductColours({});
  const currencies = await getCurrencies();

  const getColourBasedOnhex = (hex: string) =>
    colours.productColours.find(
      (c: any) => c.hexcode === hex,
    )?.name;

  return (
    <ContentLayout title="Stock">
      <div className="space-y-4">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-semibold">
            Stock data
          </h1>

          <AddStockForm
            colours={colours.productColours}
            currencies={currencies?.currencies ?? currencies}
          />
        </div>

        {/* SEARCH */}
        <CustomSearchBar query={query} />

        {/* GRID */}
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-2">
          {stock.stock?.map((item: any) => {
            if (!item.product) return null;

            return (
              <div
                key={item.id}
                className="flex flex-col rounded-md border shadow-sm hover:shadow-md p-2"
              >
                {/* IMAGE */}
<div className="aspect-[3/3.8] w-[auto] overflow-hidden rounded-md">
                  <StyleNoImage details={item} />
                </div>

                {/* DETAILS */}
<div className="flex flex-col flex-1 p-0 text-sm">
                  {/* QTY + PRICE */}
                  <div className="mb-6 flex items-center justify-between">
                    <span className="rounded bg-gray-100 px-1 py-[1px]">
                      Qty: {item.quantity}
                    </span>

                    <div className="flex items-baseline gap-0">
                      <span
                        className={
                          item.price !== item.discountedPrice
                            ? "line-through text-gray-400"
                            : ""
                        }
                      >
                        €{item.price}
                      </span>

                      {item.price !== item.discountedPrice && (
                        <span className="font-semibold text-green-600">
                          €{item.discountedPrice}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* TABLE */}
                  <div className="border-t pt-0 text-gray-600">
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium py-0 text-xs">
                            Size
                          </TableCell>
                          <TableCell className="py-0 text-xs">
                            {item.size} ({item.size_country})
                          </TableCell>
                        </TableRow>

                        <TableRow>
                          <TableCell className="font-medium py-0 text-xs">
                            Mesh
                          </TableCell>
                          <TableCell className="py-1 text-xs">
                            <div className="flex items-center gap-1">
                              <span
                                className="h-3 w-3 rounded-full"
                                style={{
                                  backgroundColor: item.mesh_color,
                                }}
                              />
                              {item.mesh_color ===
                              item.product.mesh_color
                                ? `SAS(${getColourBasedOnhex(
                                    item.product.mesh_color,
                                  )})`
                                : getColourBasedOnhex(
                                    item.mesh_color,
                                  )}
                            </div>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>

                    {/* EXPAND DETAILS */}
                    <ExpandStockDetails
                      item={item}
                      beadingColourName={getColourBasedOnhex(
                        item.beading_color,
                      )}
                      liningColourName={getColourBasedOnhex(
                        item.lining_color,
                      )}
                    />
                  </div>
                </div>

                {/* ACTIONS */}
                <TableActions
                  data={item}
                  colours={colours.productColours}
                  currencies={currencies?.currencies ?? currencies}
                  edit={true}
                  placeOrder={false}
                  className="mt-auto scale-95 "
                />
              </div>
            );
          })}
        </div>

        {/* PAGINATION */}
        <CustomPagination
          currentPage={currentPage}
          totalLength={stock?.totalCount}
        />
      </div>
    </ContentLayout>
  );
};

export default Stock;
