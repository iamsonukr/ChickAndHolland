"use client";

import React, { useState } from "react";
import dayjs from "dayjs";
import { cn, fresh } from "@/lib/utils";
import { formatDateOnly, formatDateOnlyDisplay } from "@/lib/dateOnly";
import Preview from "./Preview";
import Details from "../../retailer-panel/my-orders/Details";
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

const ACCEPTED_ORDER_COLUMN_WIDTHS = [
  56, 112, 240, 150, 140, 140, 140, 170, 126, 124, 132, 112, 116, 116, 116,
];

const ACCEPTED_ORDER_TABLE_WIDTH = ACCEPTED_ORDER_COLUMN_WIDTHS.reduce(
  (total, width) => total + width,
  0,
);

const getCellTitle = (value: unknown) =>
  value === null || value === undefined || value === ""
    ? undefined
    : String(value);

const TruncatedTableCell = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof TableCell>) => (
  <TableCell className={cn("overflow-hidden", className)} {...props}>
    <span className="block truncate">{children}</span>
  </TableCell>
);

const Orders = ({ data }: { data: any[] }) => {
  const [selectedOrders, setSelectedOrders] = useState<
    { id: number; orderType: string }[]
  >([]);

  const [open, setOpen] = useState(false);

  const router = useRouter();

  const { executeAsync } = useHttp(
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
    const res = await executeAsync({
      bulk: selectedOrders,
    });

    if (res?.success) {
      toast.success(res.msg);

      setSelectedOrders([]);
      setOpen(false);

      router.refresh();
    } else {
      toast.error(res?.msg || "Something went wrong");
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

      <Table
        className="w-full table-fixed"
        style={{ minWidth: ACCEPTED_ORDER_TABLE_WIDTH }}
      >
        <colgroup>
          {ACCEPTED_ORDER_COLUMN_WIDTHS.map((width, index) => (
            <col key={index} style={{ width }} />
          ))}
        </colgroup>
        <TableHeader>
          <TableRow className="text-sm sm:text-base">
            <TableHead>
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={toggleSelectAll}
              />
            </TableHead>

            <TableHead>Date</TableHead>
            <TableHead className="whitespace-nowrap">Name</TableHead>
            <TableHead className="whitespace-nowrap">Order Id</TableHead>
            <TableHead className="whitespace-nowrap">Estimate Id</TableHead>
            <TableHead className="whitespace-nowrap">Invoice Id</TableHead>
            <TableHead className="whitespace-nowrap">Order Type</TableHead>
            <TableHead className="whitespace-nowrap">Status</TableHead>
            <TableHead className="whitespace-nowrap">Total Quantity</TableHead>
            <TableHead className="whitespace-nowrap">Order Date</TableHead>
            <TableHead className="whitespace-nowrap">Shipping Date</TableHead>
            <TableHead className="whitespace-nowrap">Paid</TableHead>
            <TableHead className="whitespace-nowrap">Balance</TableHead>
            <TableHead>Details</TableHead>
            <TableHead>Preview</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {data.map((item: any, index: number) => {
            const orderShippingDateValue =
              item.shipping_date ?? item.orderCancellationDate;
            const difference = dayjs(formatDateOnly(orderShippingDateValue)).diff(
              dayjs().startOf("day"),
              "days",
            );

            const isSelected = selectedOrders.some((o) => o.id === item.id);
            const formattedDate =
              formatDateOnlyDisplay(item.formatted_date, "DD-MM-YYYY") || "-";
            const customerName =
              item.customerStoreName || item.retailer_name || "-";
            const orderId = item.order_id || "-";
            const estimateNo = item.estimateNo || "-";
            const invoiceNo = item.invoiceNo || "-";
            const orderType = item.type === "Fresh" ? fresh : item.type || "-";
            const orderStatus = item.orderStatus || "-";
            const totalQuantity = item.totalQuantity ?? item.total_quantity ?? 0;
            const receivedDate =
              formatDateOnlyDisplay(
                item.received_date ?? item.orderReceivedDate,
                "DD-MM-YYYY",
              ) || "-";
            const shippingDate = orderShippingDateValue
              ? formatDateOnlyDisplay(orderShippingDateValue, "DD-MM-YYYY")
              : "-";
            const currencySymbol = item.currencySymbol || "\u20ac";
            const paidAmount = `${currencySymbol} ${parseFloat(
              item.paid_amount || 0,
            ).toFixed(0)}`;
            const balanceAmount = `${currencySymbol} ${parseFloat(
              item.balance ?? item.balance_amount ?? 0,
            ).toFixed(0)}`;
            const orderDetailId = item.stockOrderId || item.favouriteOrderId || item.id;

            return (
              <TableRow
                key={item.id ?? index}
                className={cn(
                  "whitespace-nowrap text-sm sm:text-base",
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

                <TruncatedTableCell
                  className="font-medium"
                  title={formattedDate}
                >
                  {formattedDate}
                </TruncatedTableCell>

                <TruncatedTableCell title={getCellTitle(customerName)}>
                  {customerName}
                </TruncatedTableCell>

                <TruncatedTableCell title={getCellTitle(orderId)}>
                  {orderId}
                </TruncatedTableCell>

                <TruncatedTableCell title={getCellTitle(estimateNo)}>
                  {estimateNo}
                </TruncatedTableCell>

                <TruncatedTableCell title={getCellTitle(invoiceNo)}>
                  {invoiceNo}
                </TruncatedTableCell>

                <TruncatedTableCell title={getCellTitle(orderType)}>
                  {orderType}
                </TruncatedTableCell>

                <TruncatedTableCell title={getCellTitle(orderStatus)}>
                  {orderStatus}
                </TruncatedTableCell>

                <TruncatedTableCell title={getCellTitle(totalQuantity)}>
                  {totalQuantity}
                </TruncatedTableCell>

                <TruncatedTableCell title={receivedDate}>
                  {receivedDate}
                </TruncatedTableCell>

                <TruncatedTableCell title={shippingDate}>
                  {shippingDate}
                </TruncatedTableCell>

                <TruncatedTableCell title={paidAmount}>
                  {paidAmount}
                </TruncatedTableCell>

                <TruncatedTableCell title={balanceAmount}>
                  {balanceAmount}
                </TruncatedTableCell>

                <TableCell>
                  <Details
                    id={orderDetailId}
                    retailerId={item.retailer_id}
                    type={item.type}
                    paymentId={item.id}
                    orderId={item.id}
                    order={item}
                  />
                </TableCell>

                <TableCell>
                  <div className="flex gap-4">
                    <Preview
                      id={item.favouriteOrderId || item.stockOrderId}
                      type={item.type}
                      order={item}
                    />
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
