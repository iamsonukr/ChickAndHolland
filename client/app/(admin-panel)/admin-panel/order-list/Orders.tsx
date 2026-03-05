"use client";

import React, { useState } from "react";
import dayjs from "dayjs";
import { cn, fresh } from "@/lib/utils";
import Preview from "./Preview";
import Details from "../../retailer-panel/my-orders/Details";
import { Reject } from "./Reject";
import useHttp from "@/lib/hooks/usePost";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";

function formatDateTime(date: Date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${day}-${month}-${year}`;
}

const Orders = ({ data }: { data: any }) => {
  const [selectedOrders, setSelectedOrders] = useState<
    { id: number; orderType: string }[]
  >([]);
  const [open, setOpen] = useState(false);

  const router = useRouter();
  const { loading, error, executeAsync } = useHttp(
    "/retailer-orders/admin/bulkOrder/reject",
    "PATCH",
  );

  const isAllSelected =
    data.length > 0 && selectedOrders.length === data.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedOrders([]);
    } else {
      const all = data.map((order: any) => ({
        id: order.id,
        orderType: order.type,
      }));
      setSelectedOrders(all);
    }
  };

  const toggleSelectOne = (id: number, orderType: string) => {
    const exists = selectedOrders.find((o) => o.id === id);
    if (exists) {
      setSelectedOrders((prev) => prev.filter((o) => o.id !== id));
    } else {
      setSelectedOrders((prev) => [...prev, { id, orderType }]);
    }
  };

  const handleDelete = async () => {
    const res = await executeAsync({ bulk: selectedOrders });
    if (res) {
      toast.success(res.msg);

      const checkboxes = document.querySelectorAll("#check");
      checkboxes.forEach((el) => {
        (el as HTMLInputElement).checked = false;
      });

      router.refresh();
      setOpen(false);
    } else {
      toast.error(res.msg);
    }
  };
  return (
    <>
      {selectedOrders.length > 0 && (
        <div className="mb-4 flex justify-end">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">
                Delete Selected ({selectedOrders.length})
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. Are you sure you want to delete{" "}
                  {selectedOrders.length} orders?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="secondary" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleDelete} variant="destructive">
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow className="text-center text-lg">
            <TableHead>
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={toggleSelectAll}
              />
            </TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-nowrap">Name</TableHead>
            <TableHead className="text-nowrap">Order Id</TableHead>
            <TableHead className="text-nowrap">Estimate Id</TableHead>
            <TableHead className="text-nowrap">Invoice Id</TableHead>
            <TableHead className="text-nowrap">Order Type</TableHead>
            <TableHead className="text-nowrap">Status</TableHead>
            <TableHead className="text-nowrap">Order Date</TableHead>
            <TableHead className="text-nowrap">Shipping Date</TableHead>
            <TableHead className="text-nowrap">Paid</TableHead>
            <TableHead className="text-nowrap">Balance</TableHead>
            <TableHead>Details</TableHead>
            <TableHead>Preview</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item: any, index: number) => {
            const difference = dayjs(item?.orderCancellationDate).diff(
              dayjs(),
              "days",
            );
            const isSelected = selectedOrders.some((o) => o.id === item.id);

            return (
              <TableRow
                key={index}
                className={cn(
                  "text-nowrap text-lg",
                  difference < 7
                    ? "bg-red-600 text-gray-200 hover:bg-red-500"
                    : difference < 14
                      ? "bg-yellow-400 text-black hover:bg-yellow-500"
                      : "",
                )}
              >
                <TableCell>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleSelectOne(item.id, item.type)}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  {dayjs(item.formatted_date).format("DD-MM-YYYY")}
                </TableCell>
                <TableCell>{item.retailer_name}</TableCell>
                <TableCell>{item.order_id}</TableCell>
                <TableCell>{item.estimateNo}</TableCell>
                <TableCell>{item.invoiceNo}</TableCell>
                <TableCell>
                  {item.type === "Fresh" ? fresh : item.type}
                </TableCell>
                <TableCell>{item.orderStatus}</TableCell>
                <TableCell>
                  {dayjs(item.received_date).format("DD-MM-YYYY")}
                </TableCell>
                <TableCell>
                  {formatDateTime(item.orderCancellationDate)}
                </TableCell>
                <TableCell>
                  {item.currencySymbol
                    ? `${item.currencySymbol} ${parseFloat(item.paid_amount).toFixed(0)}`
                    : `€ ${parseFloat(item.paid_amount).toFixed(0)}`}
                </TableCell>
                <TableCell>
                  {item.currencySymbol
                    ? `${item.currencySymbol} ${parseFloat(item.balance).toFixed(0)}`
                    : `€ ${parseFloat(item.balance).toFixed(0)}`}
                </TableCell>

                <TableCell>
                  <Details
                    id={item.stockOrderId || item.favouriteOrderId}
                    retailerId={item.retailer_id}
                    type={item.type}
                    paymentId={item.payment_id}
                    orderId={item.id}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex gap-4">
                    <Preview
                      id={item.favouriteOrderId || item.stockOrderId}
                      type={item.type}
                      order={item}
                    />
                    {/* <Reject id={item.id} type="retailer" /> */}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </>
  );
};

export default Orders;
