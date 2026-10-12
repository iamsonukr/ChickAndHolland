"use client";

import { useState, useEffect, useRef, createContext, useContext } from "react";
import { Button } from "@/components/ui/button";
import useHttp from "@/lib/hooks/usePost";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export type SelectedOrderItem = {
  id: number;
  orderType: string;
  orderSource?: string;
};

// Create context to manage selected items across components
const ItemsContext = createContext<{
  items: SelectedOrderItem[];
  setItems: React.Dispatch<React.SetStateAction<SelectedOrderItem[]>>;
}>({
  items: [],
  setItems: () => {},
});

export const ItemsProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<SelectedOrderItem[]>([]);

  return (
    <ItemsContext.Provider value={{ items, setItems }}>
      {children}
    </ItemsContext.Provider>
  );
};

export const useItems = () => useContext(ItemsContext);

// Checkbox component for selecting items to delete
const Delete = ({
  id,
  orderType,
  orderSource,
  type,
  bulk,
}: {
  id?: number;
  orderType?: string;
  orderSource?: string;
  type: "single" | "bulk";
  bulk?: SelectedOrderItem[];
}) => {
  const { items, setItems } = useItems();
  const checkboxRef = useRef<HTMLInputElement>(null);
  const matches = (item: SelectedOrderItem, candidate: SelectedOrderItem) =>
    item.id === candidate.id &&
    item.orderType === candidate.orderType &&
    item.orderSource === candidate.orderSource;
  const pageItems = bulk ?? [];
  const isSelected = (candidate: SelectedOrderItem) =>
    items.some((item) => matches(item, candidate));
  const isChecked =
    type === "bulk"
      ? pageItems.length > 0 && pageItems.every(isSelected)
      : id !== undefined &&
        !!orderType &&
        isSelected({ id, orderType, orderSource });
  const isIndeterminate =
    type === "bulk" && !isChecked && pageItems.some(isSelected);

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    const candidates =
      type === "bulk"
        ? pageItems
        : id !== undefined && orderType
          ? [{ id, orderType, orderSource }]
          : [];

    setItems((previous) =>
      checked
        ? [
            ...previous,
            ...candidates.filter(
              (candidate) => !previous.some((item) => matches(item, candidate)),
            ),
          ]
        : previous.filter(
            (item) => !candidates.some((candidate) => matches(item, candidate)),
          ),
    );
  };

  return (
    <input
      ref={checkboxRef}
      type="checkbox"
      aria-label={
        type === "bulk" ? "Select all orders on this page" : "Select order"
      }
      checked={isChecked}
      onChange={handleChange}
    />
  );
};

export default Delete;

// Button component to execute the delete action
export const DeleteButton = () => {
  const { items, setItems } = useItems();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const { loading, error, executeAsync } = useHttp(
    "/retailer-orders/admin/bulkOrder/reject",
    "PATCH",
  );

  const handleDelete = async () => {
    const res = await executeAsync({ bulk: items });
    if (res) {
      toast.success(res.msg);
      setItems([]);

      router.refresh();
    } else {
      toast.error(res.msg);
    }
  };

  return (
    <>
      {items.length > 0 && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" className="ml-2">
              {" "}
              Delete Selected ({items.length})
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                {" "}
                This action cannot be undone. Are you sure you want to delete{" "}
                {items.length} orders?
              </DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <div className="flex justify-end gap-3">
                <Button
                  variant="secondary"
                  className="ml-2"
                  onClick={() => {
                    setOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDelete}
                  variant="destructive"
                  className="ml-2"
                >
                  Delete Selected ({items.length})
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export const ClearSelectionButton = () => {
  const { items, setItems } = useItems();

  return items.length > 0 ? (
    <Button variant="outline" onClick={() => setItems([])}>
      Clear Selection ({items.length})
    </Button>
  ) : null;
};
