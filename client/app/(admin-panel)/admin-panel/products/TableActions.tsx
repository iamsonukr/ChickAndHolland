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
import ViewImages from "./ViewImages";
import EditProductForm from "./EditProductForm";
// import EditCollectionForm from "./EditCollectionForm";
// import EditCustomerForm from "./EditCustomerForm";

const TableActions = ({
  data,
  categories,
  subCategories,
  currencies,
}: {
  data: any;
  categories: any;
  subCategories: any;
  currencies: any;
}) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { executeAsync, loading } = useHttp(`/products/${data.id}`, "DELETE");

  // console.log(data);

  return (
    <>
      <TableCell className="flex items-center gap-2">
        {/* <EditCustomerForm previousData={data} /> */}
        {/* <EditCollectionForm previousData={data} categories={categories} /> */}
        <ViewImages productData={data} />
        <EditProductForm
          categories={categories}
          subCategories={subCategories}
          data={data}
          currencies={currencies}
        />

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
                      toast("Deleted Product Successfully");
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
