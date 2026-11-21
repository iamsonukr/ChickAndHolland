"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useHttp from "@/lib/hooks/usePost";

const SelectionContext = createContext<{
  selected: Set<number>;
  toggle: (id: number) => void;
  loading: boolean;
} | null>(null);

export function StockDiscountCheckbox({ id }: { id: number }) {
  const selection = useContext(SelectionContext);
  if (!selection) return null;
  return (
    <label className="mb-2 flex items-center gap-2 text-sm">
      <input type="checkbox" checked={selection.selected.has(id)}
        onChange={() => selection.toggle(id)} disabled={selection.loading}
        aria-label={`Select stock ${id}`} className="h-4 w-4" />
      Select
    </label>
  );
}

export default function BulkStockDiscount({ ids, children }: {
  ids: number[];
  children: ReactNode;
}) {
  const [selection, setSelected] = useState<Set<number>>(new Set());
  const selected = new Set(ids.filter(id => selection.has(id)));
  const [discount, setDiscount] = useState("");
  const { loading, executeAsync } = useHttp("/stock/bulk-discount", "PUT");
  const router = useRouter();
  const allSelected = ids.length > 0 && ids.every(id => selected.has(id));

  async function applyDiscount(event: React.FormEvent) {
    event.preventDefault();
    const percentage = Number(discount);
    if (!selected.size || discount.trim() === "" || !Number.isInteger(percentage) || percentage < 0 || percentage > 100) {
      toast.error("Select stock and enter a whole percentage from 0 to 100");
      return;
    }
    try {
      const response = await executeAsync({ ids: [...selected], discount: percentage });
      toast.success(`${percentage}% discount applied to ${response.updatedCount} stock items`);
      setSelected(new Set());
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to apply discount");
    }
  }

  return (
    <SelectionContext.Provider value={{ selected, loading, toggle: id => {
      setSelected(previous => {
        const next = new Set(previous);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
      });
    } }}>
      <form onSubmit={applyDiscount} className="flex flex-wrap items-center gap-3 rounded-md border p-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={allSelected} disabled={loading || !ids.length}
            onChange={() => setSelected(allSelected ? new Set() : new Set(ids))} className="h-4 w-4" />
          Select all on this page
        </label>
        <span className="text-sm">{selected.size} selected</span>
        <label htmlFor="bulk-stock-discount" className="text-sm font-medium">Bulk discount (%)</label>
        <Input id="bulk-stock-discount" type="number" min="0" max="100" step="1"
          required value={discount} onChange={event => setDiscount(event.target.value)}
          placeholder="10" disabled={loading} className="w-24" />
        <Button type="submit" disabled={loading || !selected.size || discount === ""}>
          {loading ? "Applying…" : "Apply discount"}
        </Button>
        <p className="w-full text-xs text-muted-foreground">Replaces the discount on selected items in all currencies. Enter 0 to remove it.</p>
      </form>
      {children}
    </SelectionContext.Provider>
  );
}
