import db from "../db";

export const ensureStockSourceLocationColumn = async () => {
  const columns = await db.query("SHOW COLUMNS FROM `stock` LIKE ?", [
    "sourceLocation",
  ]);

  if (!Array.isArray(columns) || columns.length === 0) {
    await db.query(
      "ALTER TABLE `stock` ADD COLUMN `sourceLocation` varchar(255) NULL AFTER `styleNo`",
    );
  }
};
