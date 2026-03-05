import { ContentLayout } from "@/components/custom/admin-panel/contentLayout";
import { getReadablePermissions } from "@/lib/menuList";
import AddUserRoleForm from "./AddUserRole";
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
import TableActions from "./TableActions";

const UserRoles = async (
  props: {
    searchParams: Promise<Record<string, string>>;
  }
) => {
  const searchParams = await props.searchParams;
  const currentPage = searchParams["cPage"] ? Number(searchParams["cPage"]) : 1;
  const query = searchParams["q"] ? searchParams["q"] : "";

  const userRoles = await getUserRoles({
    page: currentPage,
    query,
  });

  const users = await getUsers({});

  return (
    <ContentLayout title="User Roles">
      <div className="flex flex-col gap-8">
        <div className="flex flex-row items-center justify-between">
          <h1 className="text-xl md:text-2xl">User Roles</h1>

          <AddUserRoleForm />
        </div>

        <div className="space-y-2">
          <CustomSearchBar query={query} />

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role Name</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userRoles?.userRoles?.map((userRole: any) => {
                return (
                  <TableRow key={userRole.id}>
                    <TableCell>{userRole.roleName}</TableCell>
                    <TableCell>
                      {getReadablePermissions(userRole.permissions || [])}
                    </TableCell>
                    <TableActions data={{ userRole, users }} />
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <CustomPagination
            currentPage={currentPage}
            totalLength={userRoles?.totalCount}
          />
        </div>
      </div>
    </ContentLayout>
  );
};

export default UserRoles;
