import { ContentLayout } from "@/components/custom/admin-panel/contentLayout";
import AddCategoryForm from "./AddCollection";
import { getProductCategories, getProductCollection } from "@/lib/data";
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

const Categories = async (props: {
  searchParams: Promise<Record<string, string>>;
}) => {
  const searchParams = await props.searchParams;
  const currentPage = searchParams["cPage"]
    ? Number(searchParams["cPage"])
    : 1;
  const query = searchParams["q"] ?? "";

  // Fetch categories (parent list)
  const productCategories = await getProductCategories({}) ?? {
    categories: [],
    totalCount: 0,
  };

  // Fetch collection (subCategories)
  const collection = await getProductCollection({
    page: currentPage,
    query,
  }) ?? {
    subCategories: [],
    totalCount: 0,
  };

  const subCategories = collection?.subCategories ?? [];
  const categoriesList = productCategories?.categories ?? [];

  // Group By Category Id
  const groupByCollection = subCategories.reduce((acc: any, item: any) => {
    const key = item.category?.id;
    if (!key) return acc;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <ContentLayout title="Product Collections">
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-row items-center justify-between">
          <h1 className="text-xl md:text-2xl">Product Collections</h1>
          <AddCategoryForm categories={categoriesList} />
        </div>

        {/* Search */}
        <div className="space-y-2">
          <CustomSearchBar query={query} />

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Collection Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {/* Render grouped collections */}
              {Object.keys(groupByCollection || {})
                .sort((a, b) => {
                  const catA =
                    categoriesList.find((cat: any) => cat.id === Number(a))
                      ?.priority ?? 9999;
                  const catB =
                    categoriesList.find((cat: any) => cat.id === Number(b))
                      ?.priority ?? 9999;
                  return catA - catB;
                })
                .map((key) => {
                  const collections = groupByCollection[key];

                  return collections
                    .sort((a: any, b: any) => a.priority - b.priority)
                    .map((collection: any) => (
                      <TableRow key={collection.id}>
                        <TableCell>{collection.name}</TableCell>
                        <TableCell>{collection.category?.name}</TableCell>
                        <TableCell>{collection.priority}</TableCell>

                        <TableActions
                          data={collection}
                          categories={categoriesList}
                        />
                      </TableRow>
                    ));
                })}
            </TableBody>
          </Table>

          {/* Pagination */}
          <CustomPagination
            currentPage={currentPage}
            totalLength={collection?.totalCount ?? 0}
          />
        </div>
      </div>
    </ContentLayout>
  );
};

export default Categories;
