"use client";
import MultiOrderFilter from "./MultiOrderFilter";
export default function DueFilter() {
  return (
    <MultiOrderFilter
      filterKey="due"
      label="Order filters"
      allLabel="All Orders"
      options={[
        { value: "lt14", label: "Due in 14 Days" },
        { value: "lt28", label: "Due in 28 Days" },
        { value: "shipped", label: "Shipped" },
      ]}
    />
  );
}
