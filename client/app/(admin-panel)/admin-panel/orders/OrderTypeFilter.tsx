"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { OrderTypeKeys } from "@/lib/formSchemas";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const OrderTypeFilter = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <>
      <Select
        defaultValue={searchParams.get("orderType") || "All"}
        onValueChange={(value) => {
          const params = new URLSearchParams(searchParams.toString());
          params.delete("cPage");

          if (value === "All") {
            params.delete("orderType");
          } else {
            params.set("orderType", value);
          }

          const search = params.toString();
          router.push(search ? `?${search}` : "?", { scroll: false });
        }}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Order Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All">All</SelectItem>
          {OrderTypeKeys.map((key) => (
          <SelectItem key={key} value={key}>
            {key}
          </SelectItem>
        ))}
        </SelectContent>
      </Select>
    </>
  );
};

export default OrderTypeFilter;
