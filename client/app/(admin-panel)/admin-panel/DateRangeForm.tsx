"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarDays, Check } from "lucide-react";
import { subDays, startOfDay, endOfDay, format, parse } from "date-fns";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const PRESETS = [
  {
    label: "Today",
    getValue: () => ({
      startDate: startOfDay(new Date()),
      endDate: endOfDay(new Date()),
    }),
  },
  {
    label: "Yesterday",
    getValue: () => ({
      startDate: startOfDay(subDays(new Date(), 1)),
      endDate: endOfDay(subDays(new Date(), 1)),
    }),
  },
  {
    label: "Last 7 Days",
    getValue: () => ({
      startDate: startOfDay(subDays(new Date(), 6)),
      endDate: endOfDay(new Date()),
    }),
  },
  {
    label: "Last 30 Days",
    getValue: () => ({
      startDate: startOfDay(subDays(new Date(), 29)),
      endDate: endOfDay(new Date()),
    }),
  },
  {
    label: "This Month",
    getValue: () => ({
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      endDate: endOfDay(new Date()),
    }),
  },
  {
    label: "This Year",
    getValue: () => ({
      startDate: new Date(new Date().getFullYear(), 0, 1),
      endDate: endOfDay(new Date()),
    }),
  },
];

export const DateRangeForm = ({
  startDateValue,
  endDateValue,
}: {
  startDateValue: string;
  endDateValue: string;
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [startDate, setStartDate] = useState(() =>
    parse(startDateValue, "yyyy-MM-dd", new Date()),
  );
  const [endDate, setEndDate] = useState(() =>
    parse(endDateValue, "yyyy-MM-dd", new Date()),
  );

  useEffect(() => {
    setStartDate(parse(startDateValue, "yyyy-MM-dd", new Date()));
    setEndDate(parse(endDateValue, "yyyy-MM-dd", new Date()));
  }, [startDateValue, endDateValue]);

  const [isStartOpen, setIsStartOpen] = useState(false);
  const [isEndOpen, setIsEndOpen] = useState(false);

  const onPresetSelect = (preset: string) => {
    const selectedPreset = PRESETS.find((p) => p.label === preset);
    if (selectedPreset) {
      const { startDate: newStartDate, endDate: newEndDate } =
        selectedPreset.getValue();
      setStartDate(newStartDate);
      setEndDate(newEndDate);
      updateURL(newStartDate, newEndDate);
    }
  };

  const updateURL = (start: Date, end: Date) => {
    const params = new URLSearchParams(searchParams?.toString());
    params.set("startDate", format(start, "yyyy-MM-dd"));
    params.set("endDate", format(end, "yyyy-MM-dd"));
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const onDateSelect = (date: Date | undefined, isStart: boolean) => {
    if (!date) return;
    const nextStart = isStart ? date : date < startDate ? date : startDate;
    const nextEnd = isStart ? (date > endDate ? date : endDate) : date;
    setStartDate(nextStart);
    setEndDate(nextEnd);
    if (isStart) setIsStartOpen(false);
    else setIsEndOpen(false);
    updateURL(nextStart, nextEnd);
  };

  const selectedPreset = PRESETS.find(
    (preset) =>
      format(startDate, "yyyy-MM-dd") ===
        format(preset.getValue().startDate, "yyyy-MM-dd") &&
      format(endDate, "yyyy-MM-dd") ===
        format(preset.getValue().endDate, "yyyy-MM-dd"),
  )?.label;

  return (
    <div className="mb-8 flex flex-col gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-lg sm:p-6 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex items-center gap-3">
        <CalendarDays className="h-5 w-5 text-blue-500" />
        <span className="text-lg font-semibold text-gray-800">Date Range</span>
      </div>

      <Select
        value={selectedPreset || "Custom Range"}
        onValueChange={onPresetSelect}
      >
        <SelectTrigger className="w-full border-gray-200 bg-gray-50 transition-colors hover:bg-gray-100 sm:w-[200px]">
          <SelectValue
            placeholder="Select a preset"
            className="text-gray-700"
          />
        </SelectTrigger>
        <SelectContent className="border-gray-200 bg-white shadow-md">
          <SelectItem value="Custom Range" disabled>
            Custom Range
          </SelectItem>
          {PRESETS.map((preset) => (
            <SelectItem
              key={preset.label}
              value={preset.label}
              className="cursor-pointer transition-colors hover:bg-blue-50"
            >
              <div className="flex w-full items-center justify-between">
                {preset.label}
                {format(startDate, "yyyy-MM-dd") ===
                  format(preset.getValue().startDate, "yyyy-MM-dd") &&
                  format(endDate, "yyyy-MM-dd") ===
                    format(preset.getValue().endDate, "yyyy-MM-dd") && (
                    <Check className="h-4 w-4 text-blue-500" />
                  )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <span className="text-sm font-medium text-gray-600">Custom Range:</span>

        <Popover open={isStartOpen} onOpenChange={setIsStartOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start bg-gray-50 text-left font-medium text-gray-700 transition-colors hover:bg-gray-100 sm:w-[170px]",
                !startDate && "text-gray-400",
              )}
            >
              <CalendarDays className="mr-2 h-4 w-4 text-blue-500" />
              {startDate ? format(startDate, "MMM dd, yyyy") : "Start Date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto rounded-lg border-gray-200 bg-white p-0 shadow-xl">
            <Calendar
              mode="single"
              selected={startDate}
              defaultMonth={startDate}
              onSelect={(date) => onDateSelect(date, true)}
              className="rounded-lg"
            />
          </PopoverContent>
        </Popover>

        <span className="hidden text-sm font-medium text-gray-500 sm:inline">
          to
        </span>

        <Popover open={isEndOpen} onOpenChange={setIsEndOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start bg-gray-50 text-left font-medium text-gray-700 transition-colors hover:bg-gray-100 sm:w-[170px]",
                !endDate && "text-gray-400",
              )}
            >
              <CalendarDays className="mr-2 h-4 w-4 text-blue-500" />
              {endDate ? format(endDate, "MMM dd, yyyy") : "End Date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto rounded-lg border-gray-200 bg-white p-0 shadow-xl">
            <Calendar
              mode="single"
              selected={endDate}
              defaultMonth={endDate}
              onSelect={(date) => onDateSelect(date, false)}
              className="rounded-lg"
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};
