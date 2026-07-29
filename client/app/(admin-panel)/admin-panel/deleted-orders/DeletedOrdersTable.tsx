"use client";

import { useMemo, useState } from "react";
import { RotateCcw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import TableScrollWrapper from "@/components/TableScrollWrapper";
import { Button } from "@/components/ui/button";
import useHttp from "@/lib/hooks/usePost";
import { formatDateOnlyDisplay } from "@/lib/dateOnly";
import { cn, fresh } from "@/lib/utils";

const tableHeadClassName =
  "border border-border px-2 py-1.5 text-center text-[15px] font-semibold text-foreground align-middle";

const tableCellClassName =
  "border border-border px-2 py-1.5 text-sm md:text-[15px] align-middle";

const getOrderKey = (order: any) =>
  `${order.orderSource ?? "regular"}-${order.id}`;

export default function DeletedOrdersTable({ orders }: { orders: any[] }) {
  const router = useRouter();
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [restoringKeys, setRestoringKeys] = useState<Set<string>>(new Set());
  const [deletingKeys, setDeletingKeys] = useState<Set<string>>(new Set());
  const { executeAsync: restoreDeletedOrders } = useHttp(
    "/orders/restore",
    "PATCH",
  );
  const { executeAsync: permanentlyDeleteDeletedOrders } = useHttp(
    "/orders/permanent-delete",
    "PATCH",
  );

  const orderKeys = useMemo(() => orders.map(getOrderKey), [orders]);
  const selectedOrders = orders.filter((order) =>
    selectedKeys.has(getOrderKey(order)),
  );
  const allSelected =
    orderKeys.length > 0 && orderKeys.every((key) => selectedKeys.has(key));

  const buildOrderPayload = (items: any[]) =>
    items.map((order) => ({
      id: Number(order.id),
      orderSource: order.orderSource,
      orderType: order.orderType,
    }));

  const restoreOrders = async (items: any[]) => {
    if (!items.length) return;

    const keys = items.map(getOrderKey);
    setRestoringKeys((current) => new Set([...current, ...keys]));

    try {
      const response = await restoreDeletedOrders({
        bulk: buildOrderPayload(items),
      });

      toast.success(
        response?.msg ??
          `${items.length} order${items.length === 1 ? "" : "s"} restored`,
      );
      setSelectedKeys(new Set());
      router.refresh();
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to restore order");
    } finally {
      setRestoringKeys((current) => {
        const next = new Set(current);
        keys.forEach((key) => next.delete(key));
        return next;
      });
    }
  };

  const permanentlyDeleteOrders = async (items: any[]) => {
    if (!items.length) return;

    const confirmed = window.confirm(
      `Permanently delete ${items.length} order${
        items.length === 1 ? "" : "s"
      }? This cannot be undone.`,
    );
    if (!confirmed) return;

    const keys = items.map(getOrderKey);
    setDeletingKeys((current) => new Set([...current, ...keys]));

    try {
      const response = await permanentlyDeleteDeletedOrders({
        bulk: buildOrderPayload(items),
      });

      toast.success(
        response?.msg ??
          `${items.length} order${
            items.length === 1 ? "" : "s"
          } permanently deleted`,
      );
      setSelectedKeys(new Set());
      router.refresh();
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to permanently delete order");
    } finally {
      setDeletingKeys((current) => {
        const next = new Set(current);
        keys.forEach((key) => next.delete(key));
        return next;
      });
    }
  };

  const toggleAll = (checked: boolean) => {
    setSelectedKeys(checked ? new Set(orderKeys) : new Set());
  };

  const toggleOrder = (key: string, checked: boolean) => {
    setSelectedKeys((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(key);
      } else {
        next.delete(key);
      }
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex min-h-10 flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {selectedOrders.length
            ? `${selectedOrders.length} selected`
            : `${orders.length} deleted order${orders.length === 1 ? "" : "s"}`}
        </p>
        {selectedOrders.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              onClick={() => restoreOrders(selectedOrders)}
              disabled={restoringKeys.size > 0 || deletingKeys.size > 0}
              className="gap-1.5 bg-red-600 text-white hover:bg-red-700"
            >
              <RotateCcw className="h-4 w-4" />
              Restore Selected ({selectedOrders.length})
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => permanentlyDeleteOrders(selectedOrders)}
              disabled={restoringKeys.size > 0 || deletingKeys.size > 0}
              className="gap-1.5"
            >
              <Trash2 className="h-4 w-4" />
              Delete Permanent ({selectedOrders.length})
            </Button>
          </div>
        )}
      </div>

      <div className="w-full rounded-lg border border-border">
        <TableScrollWrapper>
          <table className="w-full min-w-[1250px] border-collapse text-sm">
            <thead className="bg-muted/50">
              <tr className="whitespace-nowrap [&>th]:align-middle">
                <th className={cn(tableHeadClassName, "w-[70px]")}>
                  <input
                    type="checkbox"
                    aria-label="Select all deleted orders"
                    checked={allSelected}
                    onChange={(event) => toggleAll(event.target.checked)}
                  />
                </th>
                <th className={cn(tableHeadClassName, "w-[220px]")}>
                  Customer
                </th>
                <th className={cn(tableHeadClassName, "w-[150px]")}>PO#</th>
                <th className={cn(tableHeadClassName, "w-[140px]")}>
                  Order Type
                </th>
                <th className={cn(tableHeadClassName, "w-[130px]")}>
                  Order Date
                </th>
                <th className={cn(tableHeadClassName, "w-[130px]")}>
                  Ship Date
                </th>
                <th className={cn(tableHeadClassName, "w-[170px]")}>
                  Order Status
                </th>
                <th className={cn(tableHeadClassName, "w-[120px]")}>
                  Total Quantity
                </th>
                <th className={cn(tableHeadClassName, "w-[170px]")}>
                  Tracking ID
                </th>
                <th className={cn(tableHeadClassName, "w-[140px]")}>
                  Source
                </th>
                <th className={cn(tableHeadClassName, "w-[260px]")}>
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {orders.length > 0 ? (
                orders.map((order: any) => {
                  const key = getOrderKey(order);
                  const isRestoring = restoringKeys.has(key);
                  const isDeleting = deletingKeys.has(key);

                  return (
                    <tr
                      key={`${order.orderSource}-${order.id}-${order.purchaeOrderNo}`}
                      className="whitespace-nowrap align-middle [&>td]:align-middle"
                    >
                      <td className={cn(tableCellClassName, "text-center")}>
                        <input
                          type="checkbox"
                          aria-label={`Select order ${order.purchaeOrderNo}`}
                          checked={selectedKeys.has(key)}
                          onChange={(event) =>
                            toggleOrder(key, event.target.checked)
                          }
                        />
                      </td>
                      <td className={tableCellClassName}>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold">
                            {order.customer?.name ?? "N/A"}
                          </span>
                          <span className="opacity-50">#{order.id}</span>
                        </div>
                      </td>
                      <td className={cn(tableCellClassName, "font-mono")}>
                        {order.purchaeOrderNo}
                      </td>
                      <td className={tableCellClassName}>
                        {order.orderType === "Fresh" ? fresh : order.orderType}
                      </td>
                      <td className={tableCellClassName}>
                        {formatDateOnlyDisplay(order.orderReceivedDate)}
                      </td>
                      <td className={tableCellClassName}>
                        {formatDateOnlyDisplay(order.orderCancellationDate)}
                      </td>
                      <td className={tableCellClassName}>
                        {order.orderStatus ?? "-"}
                      </td>
                      <td className={cn(tableCellClassName, "text-center")}>
                        {order.totalQuantity ?? 0}
                      </td>
                      <td className={tableCellClassName}>
                        {order.trackingNo || "-"}
                      </td>
                      <td className={tableCellClassName}>
                        {order.orderSource === "retailer"
                          ? "Retailer"
                          : "Regular"}
                      </td>
                      <td className={cn(tableCellClassName, "text-center")}>
                        <div className="flex justify-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => restoreOrders([order])}
                            disabled={isRestoring || isDeleting}
                            className="gap-1.5"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            {isRestoring ? "Restoring..." : "Restore"}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => permanentlyDeleteOrders([order])}
                            disabled={isRestoring || isDeleting}
                            className="gap-1.5"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            {isDeleting ? "Deleting..." : "Delete Permanent"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={11}
                    className="border border-border py-10 text-center text-base text-muted-foreground"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <p className="font-medium">No deleted orders found</p>
                      <p className="text-sm">
                        Deleted orders will appear here after removal.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </TableScrollWrapper>
      </div>
    </div>
  );
}
