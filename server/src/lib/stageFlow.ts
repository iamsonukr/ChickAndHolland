export const ORDER_STAGE_FLOW = [
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

export const DEFAULT_ORDER_STAGE = ORDER_STAGE_FLOW[0];

const SHIPPING_STAGE_KEYS = new Set(["shipping", "ship", "shipped"]);

export const normalizeStageKey = (value?: string | null) => {
  const normalized = String(value ?? "")
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");

  if (SHIPPING_STAGE_KEYS.has(normalized)) {
    return "shipped";
  }

  return normalized;
};

export const normalizeStageLabel = (value?: string | null) =>
  String(value ?? "").trim();

export const getStageIndex = (
  stage?: string | null,
  flowStages: string[] = ORDER_STAGE_FLOW,
) => {
  const normalizedStage = normalizeStageKey(stage);

  if (!normalizedStage) {
    return -1;
  }

  return flowStages.findIndex(
    (flowStage) => normalizeStageKey(flowStage) === normalizedStage,
  );
};

export const getCanonicalStage = (
  stage?: string | null,
  flowStages: string[] = ORDER_STAGE_FLOW,
) => {
  const index = getStageIndex(stage, flowStages);
  return index === -1 ? null : flowStages[index];
};

export const getStageDateField = (stage?: string | null) => {
  switch (normalizeStageKey(stage)) {
    case "pattern":
      return "pattern";
    case "khaka":
      return "khaka";
    case "issue-beading":
      return "issue_beading";
    case "beading":
      return "beading";
    case "zarkan":
      return "zarkan";
    case "stitching":
      return "stitching";
    case "balance-pending":
      return "balance_pending";
    case "ready-to-delivery":
      return "ready_to_delivery";
    case "shipped":
      return "shipped";
    default:
      return null;
  }
};

export const isShippingStage = (stage?: string | null) =>
  normalizeStageKey(stage) === "shipped";
