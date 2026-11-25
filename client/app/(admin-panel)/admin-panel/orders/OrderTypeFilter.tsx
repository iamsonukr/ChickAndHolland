"use client";
import { OrderTypeKeys } from "@/lib/formSchemas";
import SingleOrderTypeFilter from "./SingleOrderTypeFilter";
import MultiOrderFilter from "./MultiOrderFilter";
export default function OrderTypeFilter({ multiple = false }: { multiple?: boolean }) {
  if (!multiple) return <SingleOrderTypeFilter />;
  return (
    <MultiOrderFilter
      filterKey="orderType"
      label="Order types"
      allLabel="All"
      options={OrderTypeKeys.map((value) => ({ value, label: value }))}
    />
  );
}
