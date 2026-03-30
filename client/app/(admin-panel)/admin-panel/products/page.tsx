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
  getCategories,
  getCurrencies,
  getProductCategories,
  getProductCollection,
  getProductsNew,
} from "@/lib/data";
import AddProductForm from "./AddProductForm";
import BulkPriceIncrease from "./BulkPriceIncrease";
import TableActions from "./TableActions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Product {
  id: string;
  productCode: string;
  price: number | string;
  subCategory?: { name: string };
  category?: { name: string };
}

interface PageProps {
  searchParams: Promise<Record<string, string>>;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const ProductPage = async ({ searchParams }: PageProps) => {
  const params = await searchParams;
  const currentPage = Number(params["cPage"] ?? 1);
  const query = params["q"] ?? "";

  // Fetch all data in parallel — eliminates sequential waterfall
  const [products, productCategories, collection, currenciesResponse] =
    await Promise.all([
      getProductsNew({ page: currentPage, query }),
      getProductCategories({}),
      getProductCollection({}),
      getCurrencies(),
    ]);

  // Normalise currencies once; avoids repeated inline `?? `expressions
  const currencies =
    currenciesResponse?.currencies ?? currenciesResponse ?? [];

  const { subCategories } = collection;
  const { categories } = productCategories;

  return (
    <ContentLayout title="Products">
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-row items-center justify-between">
          <h1 className="text-xl md:text-2xl">Products</h1>
          <div className="flex gap-2">
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

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Code</TableHead>
                <TableHead>Category</TableHead>
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