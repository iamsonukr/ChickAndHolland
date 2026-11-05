import { ORDER_STAGE_FLOW } from "@/lib/stageFlow";

export const ORDER_TABLE_STAGES = ORDER_STAGE_FLOW.slice(
  ORDER_STAGE_FLOW.indexOf("Balance Pending"),
);

export const getOrderTableStatus = (status?: string | null): string => {
  const stage = String(status ?? "").trim();
  const index = ORDER_STAGE_FLOW.findIndex((item) => item === stage);
  return !stage || (index >= 0 && index <= ORDER_STAGE_FLOW.indexOf("Balance Pending"))
    ? "Balance Pending"
    : stage;
};
