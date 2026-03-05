"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import useHttp from "@/lib/hooks/usePost";
import { DialogDescription, DialogTrigger } from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export const Reject = ({ id, type }: { id: number; type: string }) => {
  const { loading, error, executeAsync } = useHttp(
    type == "retailer"
      ? "/retailer-orders/admin/order/reject"
      : "/retailer-orders/admin/order/store/reject",
    "PATCH",
  );
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const reject = async () => {
    try {
      const res = await executeAsync({ id: id });
      setOpen(false);
      toast.success(res.msg);
      router.refresh();
    } catch (error) {
      toast.error("Failed To Reject Order");
      console.log(error);
    }
  };

  return (
    <div>
      <Dialog open={open}>
        <DialogTrigger asChild>
          <Button variant="destructive" onClick={() => setOpen(true)}>
            Cancel
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Are You Sure</DialogTitle>
            <DialogDescription>This Cannot Be Undo</DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="destructive" onClick={() => reject()}>
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
