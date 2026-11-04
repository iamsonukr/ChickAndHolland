import db from "../db";
import { OrderStatus, ShippingStatus } from "../models/Order";
import Stock from "../models/Stock";
import { EntityManager } from "typeorm";

type StockInventoryMode = "release" | "reserve";

type StockOrderInventoryRow = {
  orderId: number;
  stockOrderId: number;
  orderStatus: string | null;
  shippingStatus: string | null;
  stockId: number | null;
  orderedQuantity: number | null;
  reservedQuantity: number | null;
  stockQuantity: number | null;
};

const uniquePositiveIds = (ids: number[]) => [
  ...new Set(ids.map(Number).filter((id) => Number.isFinite(id) && id > 0)),
];

/** Atomically adjust inventory so concurrent orders cannot oversell stock. */
async function adjustStockQuantityWithManager(
  manager: EntityManager,
  stockId: number,
  delta: number,
) {
  const quantity = Math.abs(Math.trunc(Number(delta)));
  if (!Number.isFinite(quantity) || quantity <= 0) return delta === 0;

  const update = manager
    .getRepository(Stock)
    .createQueryBuilder()
    .update(Stock)
    .set({
      quantity: () =>
        delta < 0 ? `quantity - ${quantity}` : `quantity + ${quantity}`,
    })
    .where("id = :stockId", { stockId });

  if (delta < 0) update.andWhere("quantity >= :quantity", { quantity });

  const result = await update.execute();
  return Number(result.affected || 0) > 0;
}

export async function adjustStockQuantity(stockId: number, delta: number) {
  return adjustStockQuantityWithManager(db.manager, stockId, delta);
}

/** Release inventory held by a pending retailer stock request. */
export async function releaseStockRequestReservations(requestIds: number[]) {
  const ids = uniquePositiveIds(requestIds);
  if (!ids.length) return { adjustedRequests: 0, adjustedQuantity: 0 };

  return db.transaction(async (manager) => {
    const requests = (await manager.query(
      `
      SELECT id, stockId, reservedQuantity
      FROM retailer_stock_orders
      WHERE id IN (?)
        AND is_approved <> 1
        AND NOT EXISTS (
          SELECT 1
          FROM retailer_orders ro
          WHERE ro.stockOrderId = retailer_stock_orders.id
            AND ro.status = 0
        )
      FOR UPDATE
      `,
      [ids],
    )) as Array<{
      id: number;
      stockId: number;
      reservedQuantity: number;
    }>;

    let adjustedRequests = 0;
    let adjustedQuantity = 0;

    for (const request of requests) {
      const stockId = Number(request.stockId);
      const quantity = Number(request.reservedQuantity || 0);
      if (!stockId || quantity <= 0) continue;

      const released = await adjustStockQuantityWithManager(
        manager,
        stockId,
        quantity,
      );
      if (!released) {
        throw new Error(`Could not release ${quantity} units for stock request ${request.id}`);
      }

      await manager.query(
        "UPDATE retailer_stock_orders SET reservedQuantity = 0 WHERE id = ?",
        [request.id],
      );
      adjustedRequests += 1;
      adjustedQuantity += quantity;
    }

    return { adjustedRequests, adjustedQuantity };
  });
}

export async function adjustStockInventoryForDeletedRetailerOrders(
  orderIds: number[],
  mode: StockInventoryMode,
) {
  const ids = uniquePositiveIds(orderIds);
  if (!ids.length) return { adjustedOrders: 0, adjustedQuantity: 0 };

  const expectedStatus = mode === "release" ? 0 : 1;
  return db.transaction(async (manager) => {
    const rows = (await manager.query(
      `
    SELECT
      ro.id AS orderId,
      ro.orderStatus AS orderStatus,
      ro.shippingStatus AS shippingStatus,
      rso.id AS stockOrderId,
      rso.stockId AS stockId,
      rso.quantity AS orderedQuantity,
      rso.reservedQuantity AS reservedQuantity,
      s.quantity AS stockQuantity
    FROM retailer_orders ro
    INNER JOIN retailer_stock_orders rso ON rso.id = ro.stockOrderId
    INNER JOIN stock s ON s.id = rso.stockId
    WHERE ro.id IN (?)
      AND ro.status = ?
      AND ro.is_stock_order = 1
      FOR UPDATE
      `,
      [ids, expectedStatus],
    )) as StockOrderInventoryRow[];

  if (mode === "reserve") {
    const requiredByStockId = new Map<number, number>();
    const availableByStockId = new Map<number, number>();

    rows.forEach((row) => {
      const stockId = Number(row.stockId);
      const isShipped =
        row.orderStatus === OrderStatus.Shipped ||
        row.shippingStatus === ShippingStatus.Shipped;
      if (Number(row.reservedQuantity || 0) > 0) return;
      const quantity = Math.trunc(Number(row.orderedQuantity || 0));
      if (!stockId || isShipped || quantity <= 0) return;
      requiredByStockId.set(
        stockId,
        (requiredByStockId.get(stockId) ?? 0) + quantity,
      );
      availableByStockId.set(stockId, Number(row.stockQuantity || 0));
    });

    for (const [stockId, required] of requiredByStockId.entries()) {
      const available = availableByStockId.get(stockId) ?? 0;
      if (available < required) {
        throw new Error(
          `Not enough stock available to restore order. Available: ${available}, required: ${required}`,
        );
      }
    }
  }

    let adjustedOrders = 0;
    let adjustedQuantity = 0;

    for (const row of rows) {
      const stockId = Number(row.stockId);
      const isShipped =
        row.orderStatus === OrderStatus.Shipped ||
        row.shippingStatus === ShippingStatus.Shipped;
      if (!stockId || isShipped) continue;

      const currentReservation = Math.trunc(
        Number(row.reservedQuantity || 0),
      );
      if (mode === "release" && currentReservation <= 0) continue;
      if (mode === "reserve" && currentReservation > 0) continue;

      const quantity = Math.trunc(
        Number(
          mode === "release"
            ? currentReservation
            : row.orderedQuantity,
        ) || 0,
      );
      if (quantity <= 0) continue;

      const adjusted = await adjustStockQuantityWithManager(
        manager,
        stockId,
        mode === "release" ? quantity : -quantity,
      );
      if (!adjusted) {
        if (mode === "reserve")
          throw new Error("Inventory changed while restoring the order. Retry the restore.");
        throw new Error(`Could not release inventory for order ${row.orderId}`);
      }

      await manager.query(
        "UPDATE retailer_stock_orders SET reservedQuantity = ? WHERE id = ?",
        [mode === "release" ? 0 : quantity, row.stockOrderId],
      );
      adjustedOrders += 1;
      adjustedQuantity += quantity;
    }

    return { adjustedOrders, adjustedQuantity };
  });
}
