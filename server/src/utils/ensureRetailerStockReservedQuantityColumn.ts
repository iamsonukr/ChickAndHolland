import db from "../db";

export const ensureRetailerStockReservedQuantityColumn = async () => {
  const columns = await db.query(
    "SHOW COLUMNS FROM `retailer_stock_orders` LIKE ?",
    ["reservedQuantity"],
  );

  if (!Array.isArray(columns) || columns.length === 0) {
    await db.query(
      "ALTER TABLE `retailer_stock_orders` ADD COLUMN `reservedQuantity` int NOT NULL DEFAULT 0 AFTER `quantity`",
    );
  }

  // Accepted stock orders already reduced inventory before reservation tracking
  // existed. Mark those quantities so later deletes and restores remain balanced.
  await db.query(`
    UPDATE retailer_stock_orders rso
    INNER JOIN retailer_orders ro ON ro.stockOrderId = rso.id
    SET rso.reservedQuantity = rso.quantity
    WHERE rso.reservedQuantity = 0
      AND ro.is_stock_order = 1
      AND ro.status = 0
  `);
};
