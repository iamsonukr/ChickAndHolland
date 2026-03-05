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
import EditCustomerForm from "./EditCustomerForm";
import CreateRetailerLoginForm from "./CreateRetailerLoginForm";
import UpdateRetailerLoginForm from "./UpdateRetailerLoginForm";
import CustomerBankDetails from "./CustomerBankDetails";

const TableActions = ({ 
  data, 
  countries, 
  currencies 
}: { 
  data: any; 
  countries: any; 
  currencies: any; 
}) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const { executeAsync, loading } = useHttp(`/customers/${data.id}`, "DELETE");

  return (
    <>
      <TableCell className="flex items-center gap-2">
        {/* <EditCategoryForm previousData={data} /> */}
        <EditCustomerForm previousData={data} countries={countries} currencies={currencies} />

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
                      toast("Deleted Customer Successfully");
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
        <CustomerBankDetails data={data} />
        {!data.retailer && <CreateRetailerLoginForm customerData={data} />}

        {data.retailer && <UpdateRetailerLoginForm customerData={data} />}
      </TableCell>
    </>
  );
};

export default TableActions;
