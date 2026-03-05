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

  return (
    <>
      <Select
        defaultValue="All"
        onValueChange={(value) => {
          router.push(`?orderType=${value}`, { scroll: false });
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
