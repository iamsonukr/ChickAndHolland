"use client";

import { usePathname, useRouter } from "next/navigation";

import StageCountDropdown from "@/components/custom/admin-panel/StageCountDropdown";
import { ORDER_STAGE_FLOW } from "@/lib/stageFlow";

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

export default function StageFilter({
  query,
  orderType,
  due,
  stage,
  beader,
  stageCounts,
}: {
  query?: string;
  orderType?: string;
  due?: string;
  stage?: string;
  beader?: string;
  stageCounts?: Record<string, number>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const totalStageCount = ORDER_STAGE_FLOW.reduce(
    (total, option) => total + (stageCounts?.[option] ?? 0),
    0,
  );
  const selectedStage = stage || "__all__";
  const stageOptions = [
    {
      value: "__all__",
      label: "All Status",
      count: totalStageCount,
    },
    ...ORDER_STAGE_FLOW.map((option) => ({
      value: option,
      label: option,
      count: stageCounts?.[option] ?? 0,
    })),
  ];

  const handleStageChange = (value: string) => {
    const nextStage = value === "__all__" ? "" : value;
    const search = buildSearch({ query, orderType, due, stage: nextStage, beader });
    const nextPath = pathname ?? "/admin-panel/orders";
    router.push(search ? `${nextPath}?${search}` : nextPath);
  };

  return (
    <StageCountDropdown
      options={stageOptions}
      value={selectedStage}
      onChange={handleStageChange}
    />
  );
}
