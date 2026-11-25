"use client";
import MultiOrderFilter from "./MultiOrderFilter";
export default function BeaderFilter(props: {
  query?: string;
  orderType?: string;
  due?: string;
  stage?: string;
  beader?: string;
  beaders: string[];
  counts: Record<string, number>;
  allCount?: number;
}) {
  return (
    <MultiOrderFilter
      filterKey="beader"
      label="Beaders"
      allLabel={`All Beaders${props.allCount !== undefined ? ` (${props.allCount} pcs)` : ""}`}
      options={props.beaders.map((value) => ({
        value,
        label: `${value} (${props.counts[value.toLowerCase()] ?? 0} pcs)`,
      }))}
    />
  );
}
