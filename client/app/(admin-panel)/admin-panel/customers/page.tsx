import { ContentLayout } from "@/components/custom/admin-panel/contentLayout";
import CustomSearchBar from "@/components/custom/admin-panel/customSearchBar";
import { getCountries, getCurrencies, getCustomers } from "@/lib/data";
import AddCustomerForm from "./AddCustomerForm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import TableActions from "./TableActions";
import CustomPagination from "@/components/custom/admin-panel/customPagination";
import MapProvider from "@/components/custom/map-provider";
import ImportQuickbook from "@/app/(admin-panel)/admin-panel/customers/ImportQuickbook";
import TableScrollWrapper from "@/components/TableScrollWrapper";

const Customers = async (props: {
  searchParams: Promise<Record<string, string>>;
}) => {
  const searchParams = await props.searchParams;
  const currentPage = searchParams["cPage"] ? Number(searchParams["cPage"]) : 1;
  const query = searchParams["q"] ? searchParams["q"] : "";

  const customers = await getCustomers({
    page: currentPage,
    query,
  });

  const countries = await getCountries();
  const currencies = await getCurrencies();

  return (
    <ContentLayout title="Customers">
      <MapProvider>
        <div className="flex flex-col gap-8">
          <div className="flex flex-row items-center justify-between">
            <h1 className="text-xl md:text-2xl">All customers</h1>
            <div className={"space-x-2"}>
<AddCustomerForm 
   countries={countries} 
   currencies={currencies} 
/>
              <ImportQuickbook />
            </div>
          </div>

          <div className="space-y-2">
            <CustomSearchBar query={query} />
<TableScrollWrapper>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Store Name</TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers?.customers?.map((customer: any) => {
                  return (
                    <TableRow key={customer.id}>
                      <TableCell>{customer.name}</TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell>{customer.storeName}</TableCell>
                      {/*<TableCell>{customer.address}</TableCell>*/}
                      <TableCell>{customer.website}</TableCell>
                      <TableCell>{customer.phoneNumber}</TableCell>
                      <TableCell>{customer.contactPerson}</TableCell>
<TableActions 
   data={customer} 
   countries={countries} 
   currencies={currencies} 
/>

                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            </TableScrollWrapper>

            <CustomPagination
              currentPage={currentPage}
              totalLength={customers?.totalCount}
            />
          </div>
        </div>
      </MapProvider>
    </ContentLayout>
  );
};

export default Customers;
