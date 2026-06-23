"use client";
import React, { useState } from "react";
import {
  Table,
  TableBody,
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
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDateOnlyDisplay } from "@/lib/dateOnly";
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

  const selectableOrders = data.filter((order: any) => order.orderSource !== "regular");
  const isAllSelected =
    selectableOrders.length > 0 && selectedOrders.length === selectableOrders.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedOrders([]);
    } else {
      const all = selectableOrders.map((order: any) => ({
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

      <Table className="w-max min-w-full table-auto lg:w-full lg:min-w-[1040px] lg:table-fixed">
        <TableHeader>
          <TableRow className="whitespace-nowrap text-center text-sm sm:text-base lg:whitespace-normal">
            <TableHead className="w-[48px] min-w-[48px]">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={toggleSelectAll}
              />
            </TableHead>
            <TableHead className="min-w-[110px]">Date</TableHead>
            <TableHead className="min-w-[180px] whitespace-nowrap">Name</TableHead>
            <TableHead className="min-w-[140px] whitespace-nowrap">Order Id</TableHead>
            <TableHead className="min-w-[130px] whitespace-nowrap">Order Type</TableHead>
            <TableHead className="min-w-[130px] whitespace-nowrap">Status</TableHead>
            <TableHead className="min-w-[130px] whitespace-nowrap">Order Date</TableHead>
            <TableHead className="min-w-[110px] whitespace-nowrap">Paid</TableHead>
            <TableHead className="min-w-[110px] whitespace-nowrap">Balance</TableHead>
            <TableHead className="min-w-[100px]">Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data &&
            data.map((item: any) => {
              const isRegularAdminOrder = item.orderSource === "regular";
              const isSelected = selectedOrders.some((o) => o.id === item.id);
              const orderTypeValue = item.type ?? item.orderType;
              const formattedDate =
                formatDateOnlyDisplay(
                  item.formatted_date ?? item.createdAt,
                  "DD-MM-YYYY",
                ) || "-";
              const receivedDate =
                formatDateOnlyDisplay(
                  item.received_date ?? item.orderReceivedDate ?? item.createdAt,
                  "DD-MM-YYYY",
                ) || "-";
              const orderDetailId = isRegularAdminOrder
                ? item.id
                : item.stockOrderId || item.favouriteOrderId;

              return (
                <TableRow
                  key={`${item.orderSource || "retailer"}-${item.id}`}
                  className="whitespace-nowrap text-sm sm:text-base lg:whitespace-normal"
                >
                  <TableCell className="w-[48px] min-w-[48px]">
                    {!isRegularAdminOrder && (
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() =>
                          toggleSelectOne(item.id, orderTypeValue)
                        }
                      />
                    )}
                  </TableCell>
                  <TableCell className="min-w-[110px] font-medium">
                    {formattedDate}
                  </TableCell>
                  <TableCell className="min-w-[180px]">{item.customerStoreName || item.retailer_name}</TableCell>

                  <TableCell className="min-w-[140px]">{item.order_id}</TableCell>
                  <TableCell className="min-w-[130px]">
                    {orderTypeValue == "Fresh" ? fresh : orderTypeValue}
                  </TableCell>
                  <TableCell className="min-w-[130px]">{item.orderStatus}</TableCell>
                  <TableCell className="min-w-[130px]">
                    {receivedDate}
                  </TableCell>
                  <TableCell className="min-w-[110px]">
                    {item.currencySymbol
                      ? `${item.currencySymbol} ${parseFloat(item.paid_amount).toFixed(0)}`
                      : `€ ${parseFloat(item.paid_amount).toFixed(0)}`}
                  </TableCell>
                  <TableCell className="min-w-[110px]">
                    {item.currencySymbol
                      ? `${item.currencySymbol} ${parseFloat(item.balance).toFixed(0)}`
                      : `€ ${parseFloat(item.balance).toFixed(0)}`}
                  </TableCell>

                  <TableCell className="min-w-[100px]">
                    <Details
                      id={orderDetailId}
                      retailerId={item.retailer_id ?? 0}
                      type={orderTypeValue}
                      paymentId={isRegularAdminOrder ? 0 : item.id}
                      orderId={item.id}
                      orderSource={isRegularAdminOrder ? "regular" : "retailer"}
                      order={item}
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
