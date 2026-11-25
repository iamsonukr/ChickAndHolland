"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { parseOrderFilter } from "@/lib/orderFilters";

export default function MultiOrderFilter({
  filterKey,
  label,
  allLabel,
  options,
}: {
  filterKey: string;
  label: string;
  allLabel: string;
  options: { value: string; label: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const value = params?.get(filterKey) || "";
  const selected = parseOrderFilter(value);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(selected);
  useEffect(() => {
    document.cookie = `orders-${filterKey}=${encodeURIComponent(value)}; Path=/; Max-Age=${value ? 31536000 : 0}; SameSite=Lax`;
  }, [filterKey, value]);
  const available = [
    ...options,
    ...selected
      .filter((item) => !options.some((option) => option.value === item))
      .map((item) => ({ value: item, label: item })),
  ];
  const title = selected.length
    ? selected
        .map(
          (item) =>
            available.find((option) => option.value === item)?.label || item,
        )
        .join(", ")
    : allLabel;
  const apply = (values: string[]) => {
    const next = new URLSearchParams(params?.toString());
    const encoded =
      values.length > 1 ? JSON.stringify(values) : values[0] || "";
    document.cookie = `orders-${filterKey}=${encodeURIComponent(encoded)}; Path=/; Max-Age=${encoded ? 31536000 : 0}; SameSite=Lax`;
    next.set(filterKey, encoded);
    next.delete("cPage");
    setOpen(false);
    router.push(`${pathname ?? "/admin-panel/orders"}?${next.toString()}`, {
      scroll: false,
    });
  };
  return (
    <DropdownMenu
      open={open}
      onOpenChange={(next) => {
        if (next) setDraft(selected);
        setOpen(next);
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-[220px] justify-between font-normal"
          aria-label={label}
          title={title}
        >
          <span className="truncate">
            {selected.length > 1
              ? `${label} (${selected.length} selected)`
              : title}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[280px]">
        <DropdownMenuCheckboxItem
          checked={!draft.length}
          onSelect={(event) => event.preventDefault()}
          onCheckedChange={() => setDraft([])}
        >
          {allLabel}
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <div className="max-h-72 overflow-y-auto">
          {available.map((option) => (
            <DropdownMenuCheckboxItem
              key={option.value}
              checked={draft.includes(option.value)}
              onSelect={(event) => event.preventDefault()}
              onCheckedChange={(checked) =>
                setDraft((current) =>
                  checked
                    ? [...new Set([...current, option.value])]
                    : current.filter((item) => item !== option.value),
                )
              }
            >
              {option.label}
            </DropdownMenuCheckboxItem>
          ))}
        </div>
        <DropdownMenuSeparator />
        <div className="flex justify-between gap-2 p-2">
          <Button size="sm" variant="outline" onClick={() => apply([])}>
            Clear
          </Button>
          <Button size="sm" onClick={() => apply(draft)}>
            Apply
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
