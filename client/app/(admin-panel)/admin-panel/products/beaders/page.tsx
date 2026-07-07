import { ContentLayout } from "@/components/custom/admin-panel/contentLayout";
import CustomPagination from "@/components/custom/admin-panel/customPagination";
import CustomSearchBar from "@/components/custom/admin-panel/customSearchBar";
import TableScrollWrapper from "@/components/TableScrollWrapper";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getProductBeaders } from "@/lib/data";
import BeaderForm from "./BeaderForm";
import DeleteBeader from "./DeleteBeader";

const BeadersPage = async (props: {
  searchParams: Promise<Record<string, string>>;
}) => {
  const searchParams = await props.searchParams;
  const currentPage = searchParams["cPage"] ? Number(searchParams["cPage"]) : 1;
  const query = searchParams["q"] ?? "";
  const beadersResponse = await getProductBeaders({
    page: currentPage,
    query,
  });
  const beaders = beadersResponse?.beaders ?? [];

  return (
    <ContentLayout title="Beaders">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl md:text-2xl">Product Beaders</h1>
          <div className="w-full sm:w-auto sm:text-right">
            <BeaderForm />
          </div>
        </div>

        <div className="space-y-2">
          <CustomSearchBar query={query} />

          <TableScrollWrapper>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {beaders.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={2}
                      className="py-6 text-center text-sm text-muted-foreground"
                    >
                      No beaders found.
                    </TableCell>
                  </TableRow>
                ) : (
                  beaders.map((beader: any) => (
                    <TableRow key={beader.id}>
                      <TableCell>{beader.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <BeaderForm beader={beader} />
                          <DeleteBeader beaderId={beader.id} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableScrollWrapper>

          <CustomPagination
            currentPage={currentPage}
            totalLength={beadersResponse?.totalCount ?? 0}
          />
        </div>
      </div>
    </ContentLayout>
  );
};

export default BeadersPage;
