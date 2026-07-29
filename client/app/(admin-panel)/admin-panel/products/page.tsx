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
import { formatDateOnlyDisplay } from "@/lib/dateOnly";

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
  subCategory?: { id?: number | string; name: string };
  category?: { name: string };
}

interface PriceIncreaseHistory {
  id?: number | string;
  percentage: number | string;
  createdAt: string | Date;
}

interface SubCategory {
  id: number | string;
  name: string;
  lastPriceIncrease?: PriceIncreaseHistory | null;
  priceIncreaseHistory?: PriceIncreaseHistory[];
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

const historyColorClassNames = [
  "border-blue-200 bg-blue-50 text-blue-700",
  "border-emerald-200 bg-emerald-50 text-emerald-700",
  "border-amber-200 bg-amber-50 text-amber-700",
  "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700",
  "border-cyan-200 bg-cyan-50 text-cyan-700",
  "border-rose-200 bg-rose-50 text-rose-700",
];

const getPriceIncreaseHistory = (subCategory?: SubCategory) => {
  const history = subCategory?.priceIncreaseHistory ?? [];
  if (history.length) return history;
  return subCategory?.lastPriceIncrease ? [subCategory.lastPriceIncrease] : [];
};

const getIncreaseLabel = (history: PriceIncreaseHistory) => {
  const date = formatDateOnlyDisplay(history.createdAt);
  const percentageValue = Number(history.percentage);
  const percentageLabel = Number.isFinite(percentageValue)
    ? `${percentageValue}%`
    : `${history.percentage}%`;

  return `${date || "-"} - ${percentageLabel}`;
};

const PriceIncreaseHistoryBadges = ({
  history,
}: {
  history: PriceIncreaseHistory[];
}) => {
  if (!history.length) return null;

  return (
    <div className="flex max-w-[260px] flex-wrap gap-1.5">
      {history.map((item, index) => (
        <span
          key={`${item.id ?? item.createdAt}-${index}`}
          className={`rounded border px-2 py-0.5 text-xs font-medium ${
            historyColorClassNames[index % historyColorClassNames.length]
          }`}
        >
          {getIncreaseLabel(item)}
        </span>
      ))}
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

  const subCategories: SubCategory[] = collection?.subCategories ?? [];
  const { categories } = productCategories;
  const productColours: ProductColour[] =
    productColoursResponse?.productColours ?? [];
  const colourMap = new Map(
    productColours.map((colour) => [
      colour.hexcode.toLowerCase(),
      colour.name,
    ]),
  );
  const subCategoryHistoryById = new Map(
    subCategories.map((subCategory) => [
      String(subCategory.id),
      getPriceIncreaseHistory(subCategory),
    ]),
  );
  const subCategoryHistoryByName = new Map(
    subCategories.map((subCategory) => [
      subCategory.name.trim().toLowerCase(),
      getPriceIncreaseHistory(subCategory),
    ]),
  );
  const getProductHistory = (product: Product) => {
    const subCategoryId = product.subCategory?.id;
    if (subCategoryId) {
      return subCategoryHistoryById.get(String(subCategoryId)) ?? [];
    }

    const subCategoryName = product.subCategory?.name?.trim().toLowerCase();
    return subCategoryName
      ? subCategoryHistoryByName.get(subCategoryName) ?? []
      : [];
  };

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
                <TableHead>Recent Increase</TableHead>
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
                  <TableCell>
                    <PriceIncreaseHistoryBadges
                      history={getProductHistory(product)}
                    />
                  </TableCell>
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
