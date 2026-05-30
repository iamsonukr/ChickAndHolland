"use client";

import { usePathname, useRouter } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const stageOptions = [
  "Pattern",
  "Khaka",
  "Issue Beading",
  "Beading",
  "Zarkan",
  "Stitching",
  "Balance Pending",
  "Ready To Delivery",
  "Shipped",
];

const buildSearch = ({
  query,
  orderType,
  due,
  stage,
}: {
  query?: string;
  orderType?: string;
  due?: string;
  stage?: string;
}) => {
  const params = new URLSearchParams();

  if (query) params.set("q", query);
  if (orderType) params.set("orderType", orderType);
  if (due) params.set("due", due);
  if (stage) params.set("stage", stage);

  params.delete("cPage");
  return params.toString();
};

export default function StageFilter({
  query,
  orderType,
  due,
  stage,
}: {
  query?: string;
  orderType?: string;
  due?: string;
  stage?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const handleStageChange = (value: string) => {
    const nextStage = value === "__all__" ? "" : value;
    const search = buildSearch({ query, orderType, due, stage: nextStage });
    router.push(search ? `${pathname}?${search}` : pathname);
  };

  return (
    <Select value={stage || "__all__"} onValueChange={handleStageChange}>
      <SelectTrigger className="w-full min-w-[180px] xl:w-[220px]">
        <SelectValue placeholder="Filter by stage" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__all__">All Stages</SelectItem>
        {stageOptions.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
