"use client";

import {
  Table,
  TableBody,
  TableCaption,
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
import useHttp from "@/lib/hooks/usePost";
import { toast } from "sonner";
import ActionButtons from "../../retailer-panel/pending-orders/ActionButtons";
import { getRetailersOrders } from "@/lib/data";
import CustomPagination from "@/components/custom/admin-panel/customPagination";
import { fresh } from "@/lib/utils";
import dayjs from "dayjs";
import { useState } from "react";

const RejectedOrders = ({
  searchParams,
  myOrders,
}: {
  myOrders: any;
  searchParams: Record<string, string>;
}) => {
  const currentPage = searchParams["cPage"] ? Number(searchParams["cPage"]) : 1;
  const query = searchParams["q"] ? searchParams["q"] : "";

  const [selectedOrders, setSelectedOrders] = useState<
    { id: number; orderType: string }[]
  >([]);
  const [open, setOpen] = useState(false);

  const router = useRouter();

  const { loading, error, executeAsync } = useHttp(
    "/retailer-orders/admin/bulkOrder/delete",
    "PATCH",
  );

  console.log(myOrders);
  console.log(selectedOrders);

  const isAllSelected =
    myOrders.length > 0 && selectedOrders.length === myOrders.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedOrders([]);
    } else {
      const all = myOrders.map((order: any) => ({
        id: order.id,
        orderType: order.order_type,
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
          <TableRow className="text-lg">
            <TableHead>
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={toggleSelectAll}
              />
            </TableHead>
            <TableHead className="">Date</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Total Amount</TableHead>
            <TableHead className="text-right">Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {myOrders?.map((item: any) => {
            const isSelected = selectedOrders.some((o) => o.id === item.id);

            return (
              <TableRow key={item.id} className="text-lg">
                <TableCell>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() =>
                      toggleSelectOne(item.id, item.order_type)
                    }
                  />
                </TableCell>
                <TableCell className="font-medium">
                  {dayjs(item.formatted_date).format("DD-MM-YYYY")}
                </TableCell>
                <TableCell>{item.name}</TableCell>

                <TableCell>
                  {item.order_type == "Fresh" ? fresh : item.order_type}
                </TableCell>
                <TableCell>{item.Total}</TableCell>
                <TableCell>
                  {item.currencySymbol
                    ? `${item.currencySymbol} ${parseFloat(item.total_price).toFixed(0)}`
                    : `€ ${parseFloat(item.total_price).toFixed(0)}`}
                </TableCell>
                <TableCell className="text-right">
                  <ActionButtons
                    id={item.id}
                    retailerId={item.retailerId}
                    is_approved={item.is_approved}
                    type={item.order_type}
                    comments={item.rejected_comments}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <CustomPagination
        currentPage={currentPage}
        totalLength={myOrders?.totalCount}
      />
    </>
  );
};

export default RejectedOrders;
