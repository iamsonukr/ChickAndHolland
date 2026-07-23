export const ORDER_STAGE_FLOW = [
  "Pattern",
  "Khaka",
  "Issue Beading",
  "Beading",
  "Zarkan",
  "Stitching",
  "Repair",
  "Balance Pending",
  "Ready To Delivery",
  "Shipped",
] as const;

export type OrderStage = (typeof ORDER_STAGE_FLOW)[number];

export const DEFAULT_ORDER_STAGE = ORDER_STAGE_FLOW[0];

export const ORDER_STAGE_PRIORITY: Record<OrderStage, number> =
  ORDER_STAGE_FLOW.reduce(
    (priority, stage, index) => {
      priority[stage] = index + 1;
      return priority;
    },
    {} as Record<OrderStage, number>,
  );

export const ORDER_STAGE_DATE_FIELD_MAP: Record<OrderStage, string> = {
  Pattern: "pattern",
  Khaka: "khaka",
  "Issue Beading": "issue_beading",
  Beading: "beading",
  Zarkan: "zarkan",
  Stitching: "stitching",
  Repair: "repair",
  "Balance Pending": "balance_pending",
  "Ready To Delivery": "ready_to_delivery",
  Shipped: "shipped",
};

export const normalizeStage = (stage?: string | null): OrderStage =>
  ORDER_STAGE_FLOW.find((item) => item === String(stage ?? "").trim()) ??
  DEFAULT_ORDER_STAGE;
