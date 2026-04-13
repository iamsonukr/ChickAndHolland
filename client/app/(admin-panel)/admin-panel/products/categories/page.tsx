import { ContentLayout } from "@/components/custom/admin-panel/contentLayout";
import AddCategoryForm from "./AddCategoryForm";
import { getProductCategories } from "@/lib/data";
import CustomSearchBar from "@/components/custom/admin-panel/customSearchBar";
import CustomPagination from "@/components/custom/admin-panel/customPagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import TableActions from "./TableActions";
import TableScrollWrapper from "@/components/TableScrollWrapper";

const Categories = async (
  props: {
    searchParams: Promise<Record<string, string>>;
  }
) => {
  const searchParams = await props.searchParams;
  const currentPage = searchParams["cPage"] ? Number(searchParams["cPage"]) : 1;
  const query = searchParams["q"] ? searchParams["q"] : "";

  const productCategories = await getProductCategories({
    page: currentPage,
    query,
  });

  return (
    <ContentLayout title="Product Categories">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl md:text-2xl">Product Categories</h1>
          <div className="w-full sm:w-auto sm:text-right">
            <AddCategoryForm />
          </div>
        </div>

        <div className="space-y-2">
          <CustomSearchBar query={query} />

          <TableScrollWrapper>
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productCategories?.categories?.map((productCategory: any) => {
                return (
                  <TableRow key={productCategory.id}>
                    <TableCell>{productCategory.name}</TableCell>
                    <TableCell>{productCategory.priority}</TableCell>
                    <TableActions data={productCategory} />
                  </TableRow>
                );
              })}
            </TableBody>
            </Table>
          </TableScrollWrapper>

          <CustomPagination
            currentPage={currentPage}
            totalLength={productCategories?.totalCount}
          />
        </div>
      </div>
    </ContentLayout>
  );
};

export default Categories;
