import { ContentLayout } from "@/components/custom/admin-panel/contentLayout";
import CustomPagination from "@/components/custom/admin-panel/customPagination";
import CustomSearchBar from "@/components/custom/admin-panel/customSearchBar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getCurrencies,
  getProductColours,
  getProductCategories,
  getProductCollection,
  getProductsNew,
} from "@/lib/data";
import AddProductForm from "./AddProductForm";
import BulkPriceIncrease from "./BulkPriceIncrease";
import TableActions from "./TableActions";
import TableScrollWrapper from "@/components/TableScrollWrapper";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Product {
  id: string;
  productCode: string;
  price: number | string;
  mesh_color?: string | null;
  beading_color?: string | null;
  lining?: string | null;
  lining_color?: string | null;
  beader?: string | null;
  subCategory?: { name: string };
  category?: { name: string };
}

interface ProductColour {
  id: string | number;
  name: string;
  hexcode: string;
}

interface PageProps {
  searchParams: Promise<Record<string, string>>;
}

const getColourLabel = (
  value: string | null | undefined,
  colourMap: Map<string, string>,
) => {
  if (!value) return "-";

  return colourMap.get(value.toLowerCase()) ?? value;
};

const ColourItem = ({
  label,
  value,
  colourMap,
}: {
  label: string;
  value: string | null | undefined;
  colourMap: Map<string, string>;
}) => {
  const colourName = getColourLabel(value, colourMap);
  const canShowSwatch = Boolean(value && value.startsWith("#"));

  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className="w-12 text-muted-foreground">{label}</span>
      {canShowSwatch && (
        <span
          className="h-3 w-3 shrink-0 rounded-full border"
          style={{ backgroundColor: value ?? undefined }}
        />
      )}
      <span className="max-w-[140px] truncate" title={colourName}>
        {colourName}
      </span>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const ProductPage = async ({ searchParams }: PageProps) => {
  const params = await searchParams;
  const currentPage = Number(params["cPage"] ?? 1);
  const query = params["q"] ?? "";

  // Fetch all data in parallel — eliminates sequential waterfall
  const [
    products,
    productCategories,
    collection,
    currenciesResponse,
    productColoursResponse,
  ] =
    await Promise.all([
      getProductsNew({ page: currentPage, query }),
      getProductCategories({}),
      getProductCollection({}),
      getCurrencies(),
      getProductColours({}),
    ]);

  // Normalise currencies once; avoids repeated inline `?? `expressions
  const currencies =
    currenciesResponse?.currencies ?? currenciesResponse ?? [];

  const { subCategories } = collection;
  const { categories } = productCategories;
  const productColours: ProductColour[] =
    productColoursResponse?.productColours ?? [];
  const colourMap = new Map(
    productColours.map((colour) => [
      colour.hexcode.toLowerCase(),
      colour.name,
    ]),
  );

  return (
    <ContentLayout title="Products">
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl md:text-2xl">Products</h1>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
            <BulkPriceIncrease subCategories={subCategories} />
            <AddProductForm
              categories={categories}
              subCategories={subCategories}
              currencies={currencies}
            />
          </div>
        </div>

        {/* Table */}
        <div className="space-y-2">
          <CustomSearchBar query={query} />

          <TableScrollWrapper>
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Code</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Colours</TableHead>
                <TableHead>Beader</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.products?.map((product: Product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.productCode}</TableCell>
                  <TableCell>
                    {product.subCategory?.name}{" "}
                    <span className="text-muted-foreground">
                      ({product.category?.name})
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <ColourItem
                        label="Mesh"
                        value={product.mesh_color}
                        colourMap={colourMap}
                      />
                      <ColourItem
                        label="Beading"
                        value={product.beading_color}
                        colourMap={colourMap}
                      />
                      <ColourItem
                        label="Lining"
                        value={
                          product.lining === "No Lining"
                            ? "No Color"
                            : product.lining_color
                        }
                        colourMap={colourMap}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    {product.beader?.trim() || "-"}
                  </TableCell>
                  <TableCell>{product.price}</TableCell>
                  <TableActions
                    data={product}
                    categories={categories}
                    subCategories={subCategories}
                    currencies={currencies}
                  />
                </TableRow>
              ))}
            </TableBody>
            </Table>
          </TableScrollWrapper>

          <CustomPagination
            currentPage={currentPage}
            totalLength={products?.totalCount}
          />
        </div>
      </div>
    </ContentLayout>
  );
};

export default ProductPage;
