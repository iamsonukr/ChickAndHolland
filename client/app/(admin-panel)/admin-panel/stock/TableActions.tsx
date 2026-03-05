"use client";

import { TableCell } from "@/components/ui/table";
import { toast } from "sonner";
import { Delete, DeleteIcon } from "lucide-react";
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
import EditStockForm from "./EditStockForm";
import PlaceOrder from "@/components/custom/retailer-panel/PlaceOrder";
// import EditCustomerForm from "./EditCustomerForm";

const TableActions = ({ data, colours, currencies, edit, placeOrder }: any) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { executeAsync, loading } = useHttp(`/stock/${data.id}`, "DELETE");

  return (
    <>
      <div className="flex flex-col items-center space-y-2 px-2 pb-1">
        {/* <EditCategoryForm previousData={data} /> */}
        {/* <EditCustomerForm previousData={data} /> */}
        {placeOrder && (
          <PlaceOrder quantity={data.quantity} stockId={data.id} />
        )}
        {edit && <EditStockForm previousData={data} colours={colours} currencies={currencies} />}

        {edit && (
          <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
              <Button
                variant={"destructive"}
                size={"icon"}
                className="flex w-full justify-center gap-2"
              >
                Delete <DeleteIcon />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete
                  this row.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction asChild>
                  <Button
                    onClick={async () => {
                      try {
                        await executeAsync();
                        toast("Deleted Stock Successfully");
                        router.refresh();
                      } catch (err) {
                        toast.error("The Stock is Already Use", {
                          className: "bg-destructive",
                        });
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
        )}
      </div>
    </>
  );
};

export default TableActions;
