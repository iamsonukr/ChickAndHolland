"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import useHttp from "@/lib/hooks/usePost";

type DraftOrderSelectionItem = {
  id: number;
  orderType: string;
};

type DraftOrderSelectionContextValue = {
  selectedItems: DraftOrderSelectionItem[];
  isSelected: (id: number) => boolean;
  toggleItem: (item: DraftOrderSelectionItem, checked: boolean) => void;
  clearSelection: () => void;
};

const DraftOrderSelectionContext =
  createContext<DraftOrderSelectionContextValue | null>(null);

const useDraftOrderSelection = () => {
  const context = useContext(DraftOrderSelectionContext);
  if (!context) {
    throw new Error(
      "Draft order selection components must be used inside DraftOrderSelectionProvider",
    );
  }

  return context;
};

export function DraftOrderSelectionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [selectedItems, setSelectedItems] = useState<
    DraftOrderSelectionItem[]
  >([]);

  const value = useMemo<DraftOrderSelectionContextValue>(
    () => ({
      selectedItems,
      isSelected: (id) => selectedItems.some((item) => item.id === id),
      toggleItem: (item, checked) => {
        setSelectedItems((current) => {
          if (checked) {
            return current.some((selected) => selected.id === item.id)
              ? current
              : [...current, item];
          }

          return current.filter((selected) => selected.id !== item.id);
        });
      },
      clearSelection: () => setSelectedItems([]),
    }),
    [selectedItems],
  );

  return (
    <DraftOrderSelectionContext.Provider value={value}>
      {children}
    </DraftOrderSelectionContext.Provider>
  );
}

export function DraftOrderSelectAll({
  items,
}: {
  items: DraftOrderSelectionItem[];
}) {
  const { selectedItems, toggleItem, clearSelection } = useDraftOrderSelection();
  const selectableIds = new Set(items.map((item) => item.id));
  const selectedVisibleCount = selectedItems.filter((item) =>
    selectableIds.has(item.id),
  ).length;
  const allSelected = items.length > 0 && selectedVisibleCount === items.length;
  const partiallySelected =
    selectedVisibleCount > 0 && selectedVisibleCount < items.length;

  const handleChange = (checked: boolean) => {
    if (!checked) {
      clearSelection();
      return;
    }

    items.forEach((item) => toggleItem(item, true));
  };

  return (
    <input
      type="checkbox"
      aria-label="Select all draft orders"
      checked={allSelected}
      ref={(input) => {
        if (input) input.indeterminate = partiallySelected;
      }}
      onChange={(event) => handleChange(event.target.checked)}
      disabled={items.length === 0}
      className="h-4 w-4"
    />
  );
}

export function DraftOrderRowCheckbox({
  item,
}: {
  item: DraftOrderSelectionItem;
}) {
  const { isSelected, toggleItem } = useDraftOrderSelection();

  return (
    <input
      type="checkbox"
      aria-label={`Select draft order ${item.id}`}
      checked={isSelected(item.id)}
      onChange={(event) => toggleItem(item, event.target.checked)}
      className="h-4 w-4"
    />
  );
}

export function DraftDeleteSelectedButton() {
  const router = useRouter();
  const { selectedItems, clearSelection } = useDraftOrderSelection();
  const [open, setOpen] = useState(false);
  const { loading, executeAsync } = useHttp(
    "/retailer-orders/admin/bulkOrder/reject",
    "PATCH",
  );

  if (selectedItems.length === 0) return null;

  const handleDelete = async () => {
    try {
      const response = await executeAsync({ bulk: selectedItems });
      toast.success(response.msg ?? "Draft orders deleted");
      clearSelection();
      setOpen(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to delete selected drafts");
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="destructive" size="sm">
          Delete Selected ({selectedItems.length})
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete selected draft orders?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove {selectedItems.length} selected draft order
            {selectedItems.length === 1 ? "" : "s"} from the draft list.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={loading}>
            {loading ? "Deleting..." : "Delete Selected"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
