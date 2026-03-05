"use client";
import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import useHttp from "@/lib/hooks/usePost";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Details from "../../retailer-panel/my-orders/Details";
import { fresh } from "@/lib/utils";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { OrderType } from "@/lib/formSchemas";
const AdminDeliveredOrders = ({ data }: { data: any[] }) => {
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
            <TableHead className="">Date</TableHead>
            <TableHead className="text-nowrap">Name</TableHead>
            <TableHead className="text-nowrap">Order Id</TableHead>
            <TableHead className="text-nowrap">Order Type</TableHead>
            <TableHead className="text-nowrap">Status</TableHead>
            <TableHead className="text-nowrap">Order Date</TableHead>
            <TableHead className="text-nowrap">Paid</TableHead>
            <TableHead className="text-nowrap">Balance</TableHead>
            <TableHead>Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data &&
            data.map((item: any) => {
              const isSelected = selectedOrders.some((o) => o.id === item.id);
              return (
                <TableRow className="text-nowrap text-lg">
                  <TableCell>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() =>
                        toggleSelectOne(item.id, item.type)
                      }
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {dayjs(item.formatted_date).format("DD-MM-YYYY")}
                  </TableCell>
                  <TableCell>{item.retailer_name}</TableCell>

                  <TableCell>{item.order_id}</TableCell>
                  <TableCell>
                    {item.type == "Fresh" ? fresh : item.type}
                  </TableCell>
                  <TableCell>{item.orderStatus}</TableCell>
                  <TableCell>
                    {dayjs(item.received_date).format("DD-MM-YYYY")}
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
                      id={
                        item.stockOrderId
                          ? item.stockOrderId
                          : item.favouriteOrderId
                      }
                      retailerId={item.retailer_id}
                      type={item.type}
                      paymentId={item.payment_id}
                      orderId={item.id}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
        </TableBody>
      </Table>
    </>
  );
};

export default AdminDeliveredOrders;
