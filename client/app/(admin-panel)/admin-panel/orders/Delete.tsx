"use client";

import { useState, useEffect, createContext, useContext } from "react";
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
// Create context to manage selected items across components
const ItemsContext = createContext<{
  items: Array<{ id: number; orderType: string }>;
  setItems: React.Dispatch<
    React.SetStateAction<Array<{ id: number; orderType: string }>>
  >;
}>({
  items: [],
  setItems: () => {},
});

export const ItemsProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<Array<{ id: number; orderType: string }>>(
    [],
  );

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
  type,
  bulk,
}: {
  id?: number;
  orderType?: string;
  type: "single" | "bulk";
  bulk?: Array<{ id: number; orderType: string }>;
}) => {
  const { items, setItems } = useItems();
  const [isChecked, setIsChecked] = useState(false);

  useEffect(() => {
    if (type === "single" && id && orderType) {
      const isSelected = items.some(
        (item) => item.id === id && item.orderType === orderType,
      );
      setIsChecked(isSelected);
    }
  }, [items, id, orderType, type]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      if (type === "single" && id && orderType) {
        setItems((prev) => [...prev, { id, orderType }]);
      } else if (type === "bulk" && bulk) {
        setItems(bulk);
      }
    } else {
      if (type === "single" && id) {
        // Remove single item
        setItems((prev) => prev.filter((item) => item.id !== id));
      } else if (type === "bulk") {
        // Clear all items
        setItems([]);

        // Uncheck all checkboxes
        const checkboxes = document.querySelectorAll("#check");
        checkboxes.forEach((el) => {
          (el as HTMLInputElement).checked = false;
        });
      }
    }

    setIsChecked(e.target.checked);
  };

  return (
    <input
      type="checkbox"
      id="check"
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
      const checkboxes = document.querySelectorAll("#check");
      checkboxes.forEach((el) => {
        (el as HTMLInputElement).checked = false;
      });

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
