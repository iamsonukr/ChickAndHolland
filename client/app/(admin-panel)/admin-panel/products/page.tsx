import { ContentLayout } from "@/components/custom/admin-panel/contentLayout";
import CustomPagination from "@/components/custom/admin-panel/customPagination";
import CustomSearchBar from "@/components/custom/admin-panel/customSearchBar";
import ProductCard from "@/components/custom/ProductCard";
import {
  getCategories,
  getCurrencies,
  getProductCategories,
  getProductCollection,
  getProductsNew,
} from "@/lib/data";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import TableActions from "./TableActions";
import AddProductForm from "./AddProductForm";
import BulkPriceIncrease from "./BulkPriceIncrease";

const ProductPage = async (props: {
  searchParams: Promise<Record<string, string>>;
}) => {
  const searchParams = await props.searchParams;
  const currentPage = searchParams["cPage"] ? Number(searchParams["cPage"]) : 1;
  const query = searchParams["q"] ? searchParams["q"] : "";

  const products = await getProductsNew({
    page: currentPage,
    query,
  });

  const productCategories = await getProductCategories({});

  const collection = await getProductCollection({
    // page: currentPage,
    // query,
  });

  const currencies = await getCurrencies();

  // console.log(currencies);

  return (
    <ContentLayout title="Produts">
      <div className="flex flex-col gap-8">
        <div className="flex flex-row items-center justify-between">
          <h1 className="text-xl md:text-2xl">Products</h1>
          <div className="flex gap-2">
            <BulkPriceIncrease subCategories={collection.subCategories} />
            <AddProductForm
              categories={productCategories.categories}
              subCategories={collection.subCategories}
currencies={currencies?.currencies ?? currencies}
            />
          </div>
        </div>

        <div className="space-y-2">
          <CustomSearchBar query={query} />
          {/* <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {products.products?.map((product: any) => (
              <div className="space-y-2" key={product.id}>
                <ProductCard
                  key={product.id}
                  product={product}
                  openInDifferentTab
                />
              </div>
            ))}
          </div> */}

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
              {products.products?.map((product: any) => {
                return (
                  <TableRow key={product.id}>
                    <TableCell>{product.productCode}</TableCell>
                    <TableCell>
                      {product.subCategory?.name}{" "}
                      <span className="text-muted-foreground">
                        ({product.category?.name})
                      </span>
                    </TableCell>
                    <TableCell>{product.price} </TableCell>
                    {/* <TableActions
                      data={product}
                      categories={productCategories.categories}
                    /> */}
                    <TableActions
                      data={product}
                      categories={productCategories.categories}
                      subCategories={collection.subCategories}
  currencies={currencies?.currencies ?? currencies}
                    />
                  </TableRow>
                );
              })}
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
