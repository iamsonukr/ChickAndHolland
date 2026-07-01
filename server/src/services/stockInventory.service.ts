import db from "../db";
import { OrderStatus, ShippingStatus } from "../models/Order";

type StockInventoryMode = "release" | "reserve";

type StockOrderInventoryRow = {
  orderId: number;
  orderStatus: string | null;
  shippingStatus: string | null;
  stockId: number | null;
  orderedQuantity: number | null;
  stockQuantity: number | null;
};

const uniquePositiveIds = (ids: number[]) => [
  ...new Set(ids.map(Number).filter((id) => Number.isFinite(id) && id > 0)),
];

export async function adjustStockInventoryForDeletedRetailerOrders(
  orderIds: number[],
  mode: StockInventoryMode,
) {
  const ids = uniquePositiveIds(orderIds);
  if (!ids.length) return { adjustedOrders: 0, adjustedQuantity: 0 };

  const expectedStatus = mode === "release" ? 0 : 1;
  const rows = (await db.query(
    `
    SELECT
      ro.id AS orderId,
      ro.orderStatus AS orderStatus,
      ro.shippingStatus AS shippingStatus,
      rso.stockId AS stockId,
      rso.quantity AS orderedQuantity,
      s.quantity AS stockQuantity
    FROM retailer_orders ro
    INNER JOIN retailer_stock_orders rso ON rso.id = ro.stockOrderId
    INNER JOIN stock s ON s.id = rso.stockId
    WHERE ro.id IN (?)
      AND ro.status = ?
      AND ro.is_stock_order = 1
    `,
    [ids, expectedStatus],
  )) as StockOrderInventoryRow[];

  const quantityByStockId = new Map<number, number>();
  const stockQuantityByStockId = new Map<number, number>();
  let adjustedOrders = 0;

  rows.forEach((row) => {
    const stockId = Number(row.stockId);
    const quantity = Number(row.orderedQuantity || 0);
    const isShipped =
      row.orderStatus === OrderStatus.Shipped ||
      row.shippingStatus === ShippingStatus.Shipped;

    if (!stockId || quantity <= 0 || isShipped) return;

    adjustedOrders += 1;
    quantityByStockId.set(
      stockId,
      (quantityByStockId.get(stockId) ?? 0) + quantity,
    );
    stockQuantityByStockId.set(stockId, Number(row.stockQuantity || 0));
  });

  let adjustedQuantity = 0;

  for (const [stockId, quantity] of quantityByStockId.entries()) {
    if (mode === "reserve") {
      const availableQuantity = stockQuantityByStockId.get(stockId) ?? 0;
      if (availableQuantity < quantity) {
        throw new Error(
          `Not enough stock available to restore order. Available: ${availableQuantity}, required: ${quantity}`,
        );
      }
    }

    await db.query(
      "UPDATE stock SET quantity = quantity + ? WHERE id = ?",
      [mode === "release" ? quantity : -quantity, stockId],
    );
    adjustedQuantity += quantity;
  }

  return { adjustedOrders, adjustedQuantity };
}
