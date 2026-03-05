"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/custom/button";
import { useForm } from "react-hook-form";
import {
  UpdateOrderStatusForm,
  updateOrderStatusFormSchema,
} from "@/lib/formSchemas";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OrderStatus } from "@/lib/formSchemas";
import useHttp from "@/lib/hooks/usePost";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import * as z from "zod";
import { Input } from "@/components/ui/input";
const updateFormSchema = z.object({
  id: z.string().optional(),
});
const UpdateRetailerTrackingId = ({ orderData }: { orderData: any }) => {
  const [open, setOpen] = useState(false);
  const updateForm = useForm<z.infer<typeof updateFormSchema>>({
    resolver: zodResolver(updateFormSchema),
    defaultValues: {
      id: "", // Ensure it's at least an empty string
    },
  });

  const router = useRouter();
  const { executeAsync: statusChange, loading } = useHttp(
    `/retailer-orders/admin/status-update/${orderData.id}`,
    "POST",
  );
  const statusUpdate = async (data: any) => {
    try {
      if (data.status == "Delivered" && data.id == "") {
        return toast.error("Tracking Id is Required");
      }
      await statusChange({
        track_id: data.id,
      });
      toast.success("Order Status Updated");

      router.refresh();
      setOpen(false);
    } catch (error) {
      toast.error("Error at Order Status Payment");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div
          className="cursor-pointer"
          onClick={() => {
            updateForm.setValue("id", orderData.trackingNo);
          }}>
          {orderData.trackingNo
            ? orderData.trackingNo
            : "Add Tracking ID"}
        </div>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Order Status</DialogTitle>
          <DialogDescription>
            Update Order Status for order: {orderData.purchaeOrderNo}
          </DialogDescription>
        </DialogHeader>

        <Form {...updateForm}>
          <form onSubmit={updateForm.handleSubmit(statusUpdate)}>
            <FormField
              control={updateForm.control}
              name="id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tracking ID</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter tracking ID" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button type="submit" className={"mt-4 w-full"} loading={loading}>
              Update
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateRetailerTrackingId;
