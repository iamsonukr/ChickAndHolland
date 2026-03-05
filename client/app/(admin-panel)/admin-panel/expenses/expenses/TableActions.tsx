"use client";

import { TableCell } from "@/components/ui/table";
import { toast } from "sonner";
import { Delete } from "lucide-react";
import { useRouter } from "next/navigation";
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
import { useState } from "react";
import useHttp from "@/lib/hooks/usePost";
import { Button } from "@/components/custom/button";
// import EditCustomerForm from "./EditCustomerForm";

const TableActions = ({ data }: { data: any }) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { executeAsync, loading } = useHttp(`expenses/${data.id}`, "DELETE");

  return (
    <>
      <TableCell className="flex items-center gap-2">
        {/* <EditCategoryForm previousData={data} /> */}
        {/* <EditCustomerForm previousData={data} /> */}

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
                This action cannot be undone. This will permanently delete this
                row.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button
                  onClick={async () => {
                    try {
                      await executeAsync();
                      toast("Deleted Expense Successfully");
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
      </TableCell>
    </>
  );
};

export default TableActions;
