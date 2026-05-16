"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
import useHttp from "@/lib/hooks/usePost";

export default function DraftOrderActions({ orderId }: { orderId: number }) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { loading: publishLoading, executeAsync: publishOrder } = useHttp(
    `/orders/${orderId}/publish`,
    "PATCH",
  );
  const { loading: deleteLoading, executeAsync: deleteOrder } = useHttp(
    "/retailer-orders/admin/order/store/reject",
    "PATCH",
  );

  const handlePublish = async () => {
    try {
      const response = await publishOrder();
      toast.success(response.message ?? "Order published successfully");
      router.refresh();
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to publish order");
    }
  };

  const handleDelete = async () => {
    try {
      const response = await deleteOrder({ id: orderId });
      toast.success(response.msg ?? "Order deleted");
      setDeleteOpen(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to delete order");
    }
  };

  return (
    <>
      <Button
        type="button"
        size="sm"
        onClick={handlePublish}
        disabled={publishLoading}
      >
        {publishLoading ? "Publishing..." : "Publish"}
      </Button>
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogTrigger asChild>
          <Button type="button" size="sm" variant="destructive">
            Delete
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete draft order?</AlertDialogTitle>
            <AlertDialogDescription>
              This draft will be removed from the draft list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteLoading}>
              {deleteLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
