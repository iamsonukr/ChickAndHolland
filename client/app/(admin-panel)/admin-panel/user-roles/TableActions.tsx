"use client";

import { useRouter } from "next/navigation";
import ApplyToUser from "./ApplyToUser";
import { useState } from "react";
import useHttp from "@/lib/hooks/usePost";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/custom/button";
import { Delete } from "lucide-react";
import { toast } from "sonner";
import { TableCell } from "@/components/ui/table";
import EditUserRoleForm from "@/app/(admin-panel)/admin-panel/user-roles/EditUserRoleForm";

const TableActions = ({ data }: { data: any }) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { executeAsync, loading } = useHttp(
    `/user-roles/${data.userRole.id}`,
    "DELETE",
  );

  return (
    <TableCell className="flex items-center gap-2">
      <EditUserRoleForm previousData={data.userRole} />
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button variant={"destructive"} size={"icon"}>
            <Delete />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {/*This action cannot be undone. This will permanently delete this*/}
              {/*row.*/}
              This role has been <b>
                assigned to {data.userRole.totalCount}
              </b>{" "}
              users. This action cannot be undone. This will permanently delete
              this role.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant={"destructive"}
                onClick={async () => {
                  try {
                    await executeAsync();
                    toast("Deleted User Successfully");
                    router.refresh();
                  } catch (err) {
                    toast.error(
                      "Something went wrong, please try again later",
                      {
                        className: "bg-destructive",
                      },
                    );
                  }
                }}
                loading={loading}
              >
                Continue
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ApplyToUser userRoleData={data} />
    </TableCell>
  );
};

export default TableActions;
