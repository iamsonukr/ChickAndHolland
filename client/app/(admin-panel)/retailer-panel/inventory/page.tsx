import { ContentLayout } from "@/components/custom/admin-panel/contentLayout";
import { getProductColours, getStock } from "@/lib/data";
import CustomSearchBar from "@/components/custom/admin-panel/customSearchBar";
import CustomPagination from "@/components/custom/admin-panel/customPagination";
import { cookies } from "next/headers";

import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";

import StyleNoImage from "@/app/(admin-panel)/admin-panel/stock/StyleNoImage";
import TableActions from "../../admin-panel/stock/TableActions";
import SizeSelector from "./SizeSelector";

// ------------------------------------
// SIZE CHART
// ------------------------------------
const sizeChart = [
  { EU: 32, US: 0, UK: 4 },
  { EU: 34, US: 2, UK: 6 },
  { EU: 36, US: 4, UK: 8 },
  { EU: 38, US: 6, UK: 10 },
  { EU: 40, US: 8, UK: 12 },
  { EU: 42, US: 10, UK: 14 },
  { EU: 44, US: 12, UK: 16 },
  { EU: 46, US: 14, UK: 18 },
  { EU: 48, US: 16, UK: 20 },
  { EU: 50, US: 18, UK: 22 },
  { EU: 52, US: 20, UK: 24 },
  { EU: 54, US: 22, UK: 26 },
  { EU: 56, US: 24, UK: 28 },
  { EU: 58, US: 26, UK: 30 },
  { EU: 60, US: 28, UK: 32 },
];

// ------------------------------------
// SERVER SIDE CONVERTER
// ------------------------------------
function convertSize(value: number, from: string, to: string) {
  if (from === to) return value;

  const row = sizeChart.find((r) => r[from] === value);
  if (!row) return value;

  return row[to];
}

export default async function Inventory(props) {
  const searchParams = await props.searchParams;
  const currentPage = searchParams["cPage"] ? Number(searchParams["cPage"]) : 1;
  const query = searchParams["q"] || "";

  // Retailer Currency
  const currencyId = cookies().get("currencyId")?.value;

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

        {/* SIZE DROPDOWN (CLIENT COMPONENT) */}
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

                <div className="flex flex-col p-2 text-sm">

                  {/* Qty + Price */}
                  <div className="mb-2 flex items-center justify-between">
                    <span className="max-w-[45%] truncate bg-gray-100 px-2 py-1 rounded-md">
                      Qty: {item.quantity}
                    </span>

                    <div className="flex items-baseline gap-2">
                      <span
                        className={
                          item.price !== item.discountedPrice
                            ? "line-through text-gray-400"
                            : ""
                        }
                      >
                        {item.currencySymbol || "€"}
                        {item.price}
                      </span>

                      {item.price !== item.discountedPrice && (
                        <span className="text-green-600 font-semibold">
                          {item.currencySymbol || "€"}
                          {item.discountedPrice}
                          <span className="text-xs ml-1">
                            (-{item.discount}%)
                          </span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* SIZE + COLOR */}
                  <div className="mt-1 border-t pt-2 text-gray-700">
                    <Table>
                      <TableBody>
                        {/* SIZE */}
                        <TableRow>
                          <TableCell className="font-medium">Size</TableCell>

                          {/* SERVER CALCULATED SIZE */}
                          <TableCell className="size-convert" data-eu={item.size} data-from={item.size_country}>
                            {item.size} ({item.size_country})
                          </TableCell>
                        </TableRow>

                        {/* COLOR */}
                        <TableRow>
                          <TableCell className="font-medium">Color</TableCell>

                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span
                                className="h-5 w-5 rounded-full"
                                style={{ backgroundColor: item.mesh_color }}
                              />

                              {item.mesh_color === item.product.mesh_color
                                ? `SAS(${getColourName(item.product.mesh_color)})`
                                : getColourName(item.mesh_color)}
                            </div>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
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
