"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface StageCountDropdownOption {
  value: string;
  label: string;
  count: number;
}

export default function StageCountDropdown({
  options,
  value,
  onChange,
  className,
  headerLabel = "Stage",
  countLabel = "Quantity",
  placeholder = "Filter by stage",
}: {
  options: StageCountDropdownOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  headerLabel?: string;
  countLabel?: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((option) => option.value === value);

  const handleChange = (nextValue: string) => {
    onChange(nextValue);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "h-10 w-full justify-between gap-2 rounded-md bg-white px-3 text-sm font-normal xl:w-[220px]",
            className,
          )}
        >
          <span className="truncate">
            {selectedOption
              ? `${selectedOption.label} (${selectedOption.count})`
              : placeholder}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[320px] max-w-[92vw] p-0">
        <div className="rounded-md bg-white text-sm">
          <div className="grid grid-cols-[1fr_88px] border-b bg-slate-100 text-xs font-semibold uppercase text-slate-600">
            <div className="border-r border-slate-200 px-3 py-2">
              {headerLabel}
            </div>
            <div className="px-3 py-2 text-right">{countLabel}</div>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {options.map((option) => {
              const selected = option.value === value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleChange(option.value)}
                  className={cn(
                    "grid w-full grid-cols-[1fr_88px] border-b border-slate-200 text-left transition-colors last:border-b-0 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-inset",
                    selected && "bg-slate-900 text-white hover:bg-slate-900",
                  )}
                >
                  <span className="border-r border-slate-200 px-3 py-2 font-medium">
                    {option.label}
                  </span>
                  <span
                    className={cn(
                      "px-3 py-2 text-right font-semibold text-slate-700",
                      selected && "text-white",
                    )}
                  >
                    {option.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
