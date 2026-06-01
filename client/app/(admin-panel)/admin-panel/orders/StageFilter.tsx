"use client";

import { usePathname, useRouter } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ORDER_STAGE_FLOW } from "@/lib/stageFlow";

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
    const nextPath = pathname ?? "/admin-panel/orders";
    router.push(search ? `${nextPath}?${search}` : nextPath);
  };

  return (
    <Select value={stage || "__all__"} onValueChange={handleStageChange}>
      <SelectTrigger className="w-full min-w-[180px] xl:w-[220px]">
        <SelectValue placeholder="Filter by stage" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__all__">All Status</SelectItem>
        {ORDER_STAGE_FLOW.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
