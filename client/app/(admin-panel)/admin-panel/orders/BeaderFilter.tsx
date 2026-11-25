"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL_BEADERS = "__all__";

const buildSearch = ({
  query,
  orderType,
  due,
  stage,
  beader,
}: {
  query?: string;
  orderType?: string;
  due?: string;
  stage?: string;
  beader?: string;
}) => {
  const params = new URLSearchParams();

  if (query) params.set("q", query);
  if (orderType) params.set("orderType", orderType);
  if (due) params.set("due", due);
  if (stage) params.set("stage", stage);
  if (beader) params.set("beader", beader);

  params.delete("cPage");
  return params.toString();
};

export default function BeaderFilter({
  beaders,
  counts,
  allCount,
  query,
  orderType,
  due,
  stage,
  beader,
}: {
  beaders: string[];
  counts: Record<string, number>;
  allCount?: number;
  query?: string;
  orderType?: string;
  due?: string;
  stage?: string;
  beader?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const saveBeader = (value: string) => {
    document.cookie = `orders-beader=${encodeURIComponent(value)}; Path=/; Max-Age=${value ? 31536000 : 0}; SameSite=Lax`;
  };

  useEffect(() => {
    saveBeader(beader || "");
  }, [beader]);

  // Keep the selected option visible even when other filters give it no results.
  const options = beader && !beaders.includes(beader) ? [beader, ...beaders] : beaders;

  const handleChange = (value: string) => {
    const nextBeader = value === ALL_BEADERS ? "" : value;
    saveBeader(nextBeader);
    const search = buildSearch({
      query,
      orderType,
      due,
      stage,
      beader: nextBeader,
    });
    const params = new URLSearchParams(search);
    for (const key of ["dateFrom", "dateTo", "exhibitionLocation"]) {
      const value = searchParams?.get(key);
      if (value) params.set(key, value);
    }
    const nextSearch = params.toString();
    const nextPath = pathname ?? "/admin-panel/orders";

    router.push(nextSearch ? `${nextPath}?${nextSearch}` : nextPath);
  };

  return (
    <Select value={beader || ALL_BEADERS} onValueChange={handleChange}>
      <SelectTrigger className="w-[240px]">
        <SelectValue placeholder="Beader" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_BEADERS}>All Beaders{allCount !== undefined ? ` (${allCount} pcs)` : ""}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option} ({counts[option.toLowerCase()] ?? 0} pcs)
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
