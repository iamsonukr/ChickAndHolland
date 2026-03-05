import { ContentLayout } from "@/components/custom/admin-panel/contentLayout";
import AllStoresMap from "@/components/custom/map/AllStoresMap";
import { getClients } from "@/lib/data";
import MapProvider from "@/components/custom/map-provider";
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

const StoreLocators = async (
  props: {
    searchParams: Promise<Record<string, string>>;
  }
) => {
  const searchParams = await props.searchParams;
  const currentPage = searchParams["cPage"] ? Number(searchParams["cPage"]) : 1;
  const query = searchParams["q"] ? searchParams["q"] : "";

  const clients = await getClients({
    page: currentPage,
    query,
  });

  return (
    <ContentLayout title="Store Locators">
      <MapProvider>
        <div className="flex flex-col gap-8">
          <div className="flex flex-row items-center justify-between">
            <h1 className="text-xl md:text-2xl">Store Locators</h1>
            {/* <AddExpenseForm /> */}
            {/*<AddLocator />*/}
          </div>

<AllStoresMap storeLocations={clients.mapClients ?? []} />

          <div className="space-y-2">
            <CustomSearchBar query={query} />

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Store Address</TableHead>
                  <TableHead>Proximity (miles)</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients?.clients?.map((client: any) => {
                  return (
                    <TableRow key={client.id}>
                      <TableCell>{client.name}</TableCell>
                      <TableCell>{client.address}</TableCell>
                      <TableCell>{client.proximity}</TableCell>
                      <TableActions data={client} />
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            <CustomPagination
              currentPage={currentPage}
              totalLength={clients?.totalCount}
            />
          </div>
        </div>
      </MapProvider>
    </ContentLayout>
  );
};

export default StoreLocators;
