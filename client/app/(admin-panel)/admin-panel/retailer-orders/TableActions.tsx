"use client";

import { useState } from "react";
import { TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import useHttp from "@/lib/hooks/usePost";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const TableActions = ({ row }: any) => {
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState<string | null>(null);

  const { executeAsync, loading } = useHttp(
    `/retailers/orders/${row.id}/status-change`,
    "PATCH"
  );

  const handleStatusChange = async () => {
    if (!action) return;
    const res = await executeAsync({ status: action }, {}, (error) => {
      console.log(error);
      toast.error("Failed to change status", { description: error.message || "Something went wrong" });
    });
    if (res.success) {
      row.isApproved = action === "approve";
      row.isRejected = action === "reject";
    }
    setOpen(false);
  };

  return (
    <TableCell className={"flex items-center gap-2"}>
      {row.isApproved ? (
        <p className={"text-green-500"}>Approved</p>
      ) : row.isRejected ? (
        <p className={"text-red-500"}>Rejected</p>
      ) : (
        <div className={"flex gap-2"}>
          <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
              <Button
                variant={"default"}
                onClick={() => setAction("approve")}
                disabled={loading}
              >
                Approve <Check />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogTrigger asChild>
              <Button
                variant={"destructive"}
                onClick={() => setAction("reject")}
                disabled={loading}
              >
                Reject <X />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  {action === "approve"
                    ? "This will approve the request. Do you want to continue?"
                    : "This will reject the request. Do you want to continue?"}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction asChild>
                  <Button onClick={handleStatusChange} loading={loading}>
                    Continue
                  </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </TableCell>
  );
};

export default TableActions;
