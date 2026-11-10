import { DEFAULT_ORDER_STAGE, ORDER_STAGE_FLOW } from "@/lib/stageFlow";

type OrderStatusContext = {
  orderSource?: string;
  orderType?: string;
  is_stock_order?: boolean | number | string;
};

export const isInventoryStockOrder = (order: OrderStatusContext): boolean =>
  order.is_stock_order === true ||
  order.is_stock_order === 1 ||
  order.is_stock_order === "1" ||
  (order.orderSource === "retailer" && order.orderType === "Stock");

export const ORDER_TABLE_STAGES = ORDER_STAGE_FLOW.slice(
  ORDER_STAGE_FLOW.indexOf("Balance Pending"),
);

export const getOrderTableStages = (order: OrderStatusContext) =>
  isInventoryStockOrder(order) ? ORDER_TABLE_STAGES : ORDER_STAGE_FLOW;

export const getOrderTableStatus = (
  status: string | null | undefined,
  order: OrderStatusContext,
): string => {
  const stage = String(status ?? "").trim();
  if (!isInventoryStockOrder(order)) return stage || DEFAULT_ORDER_STAGE;
  const index = ORDER_STAGE_FLOW.findIndex((item) => item === stage);
  return !stage || (index >= 0 && index <= ORDER_STAGE_FLOW.indexOf("Balance Pending"))
    ? "Balance Pending"
    : stage;
};
