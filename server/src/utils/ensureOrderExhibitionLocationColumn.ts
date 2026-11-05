import db from "../db";
import { TABLE_NAMES } from "../constants";

export const ensureOrderExhibitionLocationColumn = async () => {
  for (const table of [
    TABLE_NAMES.ORDERS,
    TABLE_NAMES.RETAILERFAVOURITESORDERS,
    TABLE_NAMES.RETAILERSTOCKORDERS,
    "retailer_orders",
  ]) {
    const columns = await db.query(`SHOW COLUMNS FROM \`${table}\` LIKE ?`, [
      "exhibitionLocation",
    ]);

    if (!Array.isArray(columns) || columns.length === 0) {
      await db.query(
        `ALTER TABLE \`${table}\` ADD COLUMN \`exhibitionLocation\` varchar(225) NULL`,
      );
    }
  }
};
