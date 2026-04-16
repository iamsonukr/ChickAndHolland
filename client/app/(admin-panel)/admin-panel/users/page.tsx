import { ContentLayout } from "@/components/custom/admin-panel/contentLayout";
// import AddUserForm from "./AddUser";
import { getUserRoles, getUsers } from "@/lib/data";
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
import AddUserForm from "./AddUser";
import TableActions from "./TableActions";
import TableScrollWrapper from "@/components/TableScrollWrapper";
// import TableActions from "./TableActions";

const Users = async (
  props: {
    searchParams: Promise<Record<string, string>>;
  }
) => {
  const searchParams = await props.searchParams;
  const currentPage = searchParams["cPage"] ? Number(searchParams["cPage"]) : 1;
  const query = searchParams["q"] ? searchParams["q"] : "";

  const { users, totalCount } = await getUsers({
    page: currentPage,
    query,
  });

  console.log("🚀 ~ file: page.tsx:24 ~ Users ~ users:", users, totalCount);


  return (
    <ContentLayout title="Users">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl md:text-2xl">Users</h1>
          {/* <AddCustomerForm /> */}

          {/* <AddUserForm /> */}

          <div className="w-full sm:w-auto sm:text-right">
            <AddUserForm />
          </div>
        </div>

        <div className="space-y-2">
          <CustomSearchBar query={query} />

          <TableScrollWrapper>
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                 <TableHead>User role</TableHead>
                 <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((user: any) => {
                return (
                  <TableRow key={user.id}>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>
                      {/*{getReadablePermissions(user.permissions || [])}*/}
                      {user.roleName}
                    </TableCell>
                     <TableActions data={user} />
                  </TableRow>
                );
              })}
            </TableBody>
            </Table>
          </TableScrollWrapper>


          <CustomPagination
            currentPage={currentPage}
            totalLength={Number(totalCount)}
            itemsPerPage={10}
          />
        </div>
      </div>
    </ContentLayout>
  );
};

export default Users;
