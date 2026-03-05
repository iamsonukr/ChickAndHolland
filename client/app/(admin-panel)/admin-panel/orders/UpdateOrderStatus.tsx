"use client";

import React, { useEffect, useState } from "react";
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
  OrderStatus,
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
import useHttp from "@/lib/hooks/usePost";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { getOrderStatusDatesStockDetails } from "@/lib/data";
import dayjs from "dayjs";
import { API_URL } from "@/lib/constants";

interface StatusDateTypes {
  pattern: string | null;
  khaka: string | null;
  issue_beading: string | null;
  beading: string | null;
  zarkan: string | null;
  stitching: string | null;
  balance_pending: string | null;   // ✅ ADD THIS
  ready_to_delivery: string | null;
  shipped: string | null;
}
interface ProgressLog {
  stage?: string;
  status?: string;
  createdAt: string;
}


const statusFieldMap: Record<string, keyof StatusDateTypes | null> = {
  "Pattern": "pattern",
  "Khaka": "khaka",
  "Issue Beading": "issue_beading",
  "Beading": "beading",
  "Zarkan": "zarkan",
  "Stitching": "stitching",
  "Balance Pending": "balance_pending", // 🔥 FIX
  "Ready to Delivery": "ready_to_delivery",
  "Shipped": "shipped",
};


const UpdateOrderStatus = ({ orderData }: { orderData: any }) => {
  const [open, setOpen] = useState(false);
const [storeProgress, setStoreProgress] = useState<ProgressLog[]>([]);

  const [datesOfStatus, setDatesOfStatus] = useState<StatusDateTypes>({
    pattern: null,
    khaka: null,
    issue_beading: null,
    beading: null,
    zarkan: null,
    stitching: null,
    balance_pending: null,   
    ready_to_delivery: null,
    shipped: null,
  });

  const form = useForm<UpdateOrderStatusForm>({
    resolver: zodResolver(updateOrderStatusFormSchema),
    defaultValues: {
      status: orderData.orderStatus,
    },
  });

  const { loading, executeAsync } = useHttp("/orders/orderStatus", "PUT");
  const router = useRouter();

  const fetchOrderDates = async () => {
  try {
    const res = await getOrderStatusDatesStockDetails(orderData.id);
    if (res?.data) {
      setDatesOfStatus(res.data);
    }
  } catch (err) {
    console.error("Failed to fetch order status dates", err);
  }
};


const fetchStoreProgress = async () => {
  try {
    const res = await fetch(
      `${API_URL}/orders/store-status/report/${orderData.id}`
    );
    const json = await res.json();

    if (json.success && json.data?.length) {
      // sab styles ka progress merge kar do
      const allProgress = json.data.flatMap((s: any) => s.progress || []);
      setStoreProgress(allProgress);
    }
  } catch (err) {
    console.error("Failed to fetch store progress", err);
  }
};


const onOpenChange = (val: boolean) => {
  setOpen(val);
  if (val) {
    fetchOrderDates();     // existing
    fetchStoreProgress(); // 🔥 NEW
  }
};

  const onSubmit = async (values: UpdateOrderStatusForm) => {
    try {
      const response = await executeAsync({
  barcode: orderData.styles[0].barcode, // or selected style barcode
  status: values.status,
});


      if (!response.success) {
        return toast.error("Failed to update order status");
      }

      toast.success(response.message || "Order status updated successfully");
      router.refresh();
      setOpen(false);
    } catch (err: any) {
      toast.error("Error updating status");
    }
  };
const orderStatusArray = Object.values(OrderStatus).map((statusLabel) => {
  const dbField = statusFieldMap[statusLabel];

  const date =
    (dbField && datesOfStatus[dbField]) ??
    storeProgress
.filter((p: any) => (p.stage || p.status) === statusLabel)
      .slice(-1)[0]
      ?.createdAt ??
    null;

  return {
    label: statusLabel,
    value: statusLabel,
    date,
  };
});

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <div className="cursor-pointer underline">{orderData.orderStatus}</div>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Order Status</DialogTitle>
          <DialogDescription>
            Order No: <strong>{orderData.purchaeOrderNo}</strong>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {orderStatusArray.map((status, i) => (
                        <SelectItem key={i} value={status.label}>
                          <div className="flex w-[350px] justify-between">
                            {status.label}
                            {status.date && (
                              <span className="text-gray-500">
                                {dayjs(status.date).format("DD MMM YYYY")}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" loading={loading} className="mt-4 w-full">
              Update
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateOrderStatus;
