"use client";

import { useRouter, useSearchParams } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL_SOURCES_VALUE = "__all_sources__";

type StockSourceFilterProps = {
  sourceLocations: string[];
  selectedSource?: string;
};

const StockSourceFilter = ({
  sourceLocations,
  selectedSource = "",
}: StockSourceFilterProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const normalizedSelectedSource = selectedSource.trim();
  const sourceOptions = normalizedSelectedSource
    ? Array.from(new Set([normalizedSelectedSource, ...sourceLocations]))
    : sourceLocations;

  const handleSourceChange = (value: string) => {
    const nextParams = new URLSearchParams(searchParams?.toString());

    if (value === ALL_SOURCES_VALUE) {
      nextParams.delete("source");
    } else {
      nextParams.set("source", value);
    }

    nextParams.delete("cPage");
    router.push(`?${nextParams.toString()}`, { scroll: false });
  };

  return (
    <div className="w-full sm:max-w-xs">
      <Select
        value={normalizedSelectedSource || ALL_SOURCES_VALUE}
        onValueChange={handleSourceChange}
      >
        <SelectTrigger>
          <SelectValue placeholder="Source" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_SOURCES_VALUE}>All Sources</SelectItem>
          {sourceOptions.map((sourceLocation) => (
            <SelectItem key={sourceLocation} value={sourceLocation}>
              {sourceLocation}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default StockSourceFilter;
