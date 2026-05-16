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

  const currentPage = searchParams["cPage"]
    ? Number(searchParams["cPage"])
    : 1;

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
          
          {/* Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-xl md:text-2xl">All customers</h1>

            <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
              <AddCustomerForm
                countries={countries}
                currencies={currencies}
              />

              <ImportQuickbook />
            </div>
          </div>

          <div className="space-y-2">
            
            {/* Search */}
            <CustomSearchBar query={query} />

            {/* Table */}
            <TableScrollWrapper>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>S.No</TableHead>
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
                  {customers?.customers?.length > 0 ? (
                    customers.customers.map(
                      (customer: any, index: number) => {
                        return (
                          <TableRow key={customer.id}>
                            
                            {/* Serial Number */}
                            <TableCell>
                              {(currentPage - 1) * 100 + index + 1}
                            </TableCell>

                            {/* Customer Details */}
                            <TableCell>{customer.name}</TableCell>

                            <TableCell>{customer.email}</TableCell>

                            <TableCell>{customer.storeName}</TableCell>

                            <TableCell>{customer.website}</TableCell>

                            <TableCell>
                              {customer.phoneNumber}
                            </TableCell>

                            <TableCell>
                              {customer.contactPerson}
                            </TableCell>

                            {/* Actions */}
                            <TableActions
                              data={customer}
                              countries={countries}
                              currencies={currencies}
                            />
                          </TableRow>
                        );
                      }
                    )
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="py-10 text-center"
                      >
                        No customers found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableScrollWrapper>

            {/* Pagination */}
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