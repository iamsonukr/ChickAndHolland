"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

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
  allStatusCount,
}: {
  query?: string;
  orderType?: string;
  due?: string;
  stage?: string;
  beader?: string;
  stageCounts?: Record<string, number>;
  allStatusCount?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const summedStageCount = ORDER_STAGE_FLOW.reduce(
    (total, option) => total + (stageCounts?.[option] ?? 0),
    0,
  );
  const totalStageCount =
    typeof allStatusCount === "number" ? allStatusCount : summedStageCount;
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
    const search = buildSearch({
      query,
      orderType,
      due,
      stage: nextStage,
      beader,
    });
    const params = new URLSearchParams(search);
    for (const key of ["dateFrom", "dateTo"]) {
      const value = searchParams?.get(key);
      if (value) params.set(key, value);
    }
    const nextSearch = params.toString();
    const nextPath = pathname ?? "/admin-panel/orders";
    router.push(nextSearch ? `${nextPath}?${nextSearch}` : nextPath);
  };

  return (
    <StageCountDropdown
      options={stageOptions}
      value={selectedStage}
      onChange={handleStageChange}
    />
  );
}
