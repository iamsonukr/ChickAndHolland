"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function DueFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <Select
      value={searchParams.get("due") || "all"}
      onValueChange={(value) => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("cPage");
        if (value === "all") params.delete("due");
        else params.set("due", value);
        router.push(`?${params.toString()}`, { scroll: false });
      }}
    >
      <SelectTrigger className="w-[190px]" aria-label="Order due date or shipping filter">
        <SelectValue placeholder="All Orders" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Orders</SelectItem>
        <SelectItem value="lt14">🔴 Due in 14 Days</SelectItem>
        <SelectItem value="lt28">🟡 Due in 28 Days</SelectItem>
        <SelectItem value="shipped">🟢 Shipped</SelectItem>
      </SelectContent>
    </Select>
  );
}
