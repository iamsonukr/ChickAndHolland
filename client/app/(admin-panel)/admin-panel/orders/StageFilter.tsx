"use client";
import SingleStageFilter from "./SingleStageFilter";
import MultiOrderFilter from "./MultiOrderFilter";
import { ORDER_STAGE_FLOW } from "@/lib/stageFlow";
export default function StageFilter(props: {
  multiple?: boolean;
  query?: string;
  orderType?: string;
  due?: string;
  stage?: string;
  beader?: string;
  stageCounts?: Record<string, number>;
  allStatusCount?: number;
}) {
  if (!props.multiple) return <SingleStageFilter {...props} />;
  const total =
    props.allStatusCount ??
    ORDER_STAGE_FLOW.reduce(
      (sum, stage) => sum + (props.stageCounts?.[stage] ?? 0),
      0,
    );
  return (
    <MultiOrderFilter
      filterKey="stage"
      label="Statuses"
      allLabel={`All Status (${total})`}
      options={ORDER_STAGE_FLOW.map((value) => ({
        value,
        label: `${value} (${props.stageCounts?.[value] ?? 0})`,
      }))}
    />
  );
}
