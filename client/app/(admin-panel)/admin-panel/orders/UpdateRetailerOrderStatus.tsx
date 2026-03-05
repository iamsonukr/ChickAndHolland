"use client";

import React, { useState, useEffect } from "react";
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
import { getOrderStatusDatesDetails } from "@/lib/data";
import { API_URL } from "@/lib/constants";
import dayjs from "dayjs";

/* ================= SCHEMA ================= */

const updateFormSchema = z.object({
  status: z.string().min(1, { message: "Status is required" }),
});

/* ================= TYPES ================= */

interface DateTypes {
  pattern: string | null;
  khaka: string | null;
  issue_beading: string | null;
  beading: string | null;
  zarkan: string | null;
  stitching: string | null;
  balance_pending: string | null;
  ready_to_delivery: string | null;
  shippingStatus: string | null;
}

interface ProgressLog {
  stage?: string;
  status?: string;
  createdAt: string;
}

/* ================= STATUS → DB FIELD ================= */

const statusToDateField: Record<string, keyof DateTypes | null> = {
  Pattern: "pattern",
  Khaka: "khaka",
  "Issue Beading": "issue_beading",
  Beading: "beading",
  Zarkan: "zarkan",
  Stitching: "stitching",
  "Balance Pending": "balance_pending",
  "Ready To Delivery": "ready_to_delivery",
  Shipped: "shippingStatus",
};

/* ================= COMPONENT ================= */

const UpdateRetailerOrderStatus = ({ orderData }: { orderData: any }) => {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [datesOfStatus, setDatesOfStatus] = useState<DateTypes>({
    pattern: null,
    khaka: null,
    issue_beading: null,
    beading: null,
    zarkan: null,
    stitching: null,
    balance_pending: null,
    ready_to_delivery: null,
    shippingStatus: null,
  });

  const [progressLogs, setProgressLogs] = useState<ProgressLog[]>([]);

  const form = useForm<z.infer<typeof updateFormSchema>>({
    resolver: zodResolver(updateFormSchema),
    defaultValues: {
      status: "",
    },
  });

  const { executeAsync: statusChange, loading } = useHttp(
    `/retailer-orders/admin/status-update/${orderData.id}`,
    "POST"
  );

  /* ================= FETCH DB DATES ================= */

  const fetchOrderDates = async () => {
    try {
      const res = await getOrderStatusDatesDetails(orderData.id);
      if (res?.data) setDatesOfStatus(res.data);
    } catch (err) {
      console.error("Failed to fetch order dates", err);
    }
  };

  /* ================= FETCH RETAILER PROGRESS ================= */

  const fetchRetailerProgress = async () => {
    try {
      const res = await fetch(
        `${API_URL}/report/status/report/${orderData.id}`
      );
      const json = await res.json();

      if (json.success && json.data?.length) {
        const allProgress = json.data.flatMap(
          (s: any) => s.progress || []
        );
        setProgressLogs(allProgress);
      }
    } catch (err) {
      console.error("Failed to fetch retailer progress", err);
    }
  };

  /* ================= OPEN HANDLER ================= */

  const onOpenChange = (val: boolean) => {
    setOpen(val);
    if (val) {
      fetchOrderDates();
      fetchRetailerProgress();
    }
  };

  /* ================= SUBMIT ================= */

  const statusUpdate = async (data: any) => {
    try {
      const res = await statusChange({ status: data.status });

      if (!res.success) {
        toast.error(res.msg || "Failed to update status");
        return;
      }

      toast.success("Order Status Updated");
      router.refresh();
      setOpen(false);
    } catch {
      toast.error("Error while updating order status");
    }
  };

  /* ================= VISIBILITY RULES ================= */

  const canShowReadyToDelivery =
    orderData.orderStatus === "Ready To Delivery";

  const canShowShipped =
    orderData.orderStatus === "Ready To Delivery" ||
    orderData.orderStatus === "Shipped";

  /* ================= FINAL STATUS ARRAY (🔥 MAIN LOGIC) ================= */

  const orderStatusArray = Object.entries(OrderStatus)
    .filter(([_, label]) => {
      if (
        label.toLowerCase() === "ready to delivery" &&
        !canShowReadyToDelivery
      ) return false;

      if (label === "Shipped" && !canShowShipped) return false;

      return true;
    })
    .map(([key, label]) => {
      const dbField = statusToDateField[label];

      const date =
        (dbField && datesOfStatus[dbField]) ??
        progressLogs
          .filter(
            (p) => (p.stage || p.status) === label
          )
          .slice(-1)[0]
          ?.createdAt ??
        null;

      return {
        value: key,
        label,
        date,
      };
    });

  /* ================= UI ================= */

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <div className="flex w-full cursor-pointer justify-between">
          {orderData.orderStatus}
        </div>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Order Status</DialogTitle>
          <DialogDescription>
            Order No: <strong>{orderData.purchaeOrderNo}</strong>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(statusUpdate)}>
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
                      {orderStatusArray.map((status) => (
                        <SelectItem
                          key={status.value}
                          value={status.value}
                        >
                          <div className="flex w-[350px] justify-between">
                            <span>{status.label}</span>
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

export default UpdateRetailerOrderStatus;
