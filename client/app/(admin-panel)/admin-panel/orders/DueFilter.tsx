"use client";
import MultiOrderFilter from "./MultiOrderFilter";
export default function DueFilter() {
  return (
    <MultiOrderFilter
      filterKey="due"
      label="Order filters"
      allLabel="All Orders"
      options={[
        { value: "lt14", label: "Due in 14 Days", dotColor: "#ff2d63" },
        { value: "lt28", label: "Due in 28 Days", dotColor: "#ffff00" },
        { value: "shipped", label: "Shipped", dotColor: "#8cff24" },
      ]}
    />
  );
}
