import db from "../db";
import { TABLE_NAMES } from "../constants";

const ensureColumn = async (columnName: string, afterColumn: string) => {
  const columns = await db.query(
    `SHOW COLUMNS FROM \`${TABLE_NAMES.ORDERS}\` LIKE ?`,
    [columnName],
  );

  if (!Array.isArray(columns) || columns.length === 0) {
    await db.query(
      `ALTER TABLE \`${TABLE_NAMES.ORDERS}\` ADD COLUMN \`${columnName}\` varchar(225) NULL AFTER \`${afterColumn}\``,
    );
  }
};

export const ensureOrderInvoiceEstimateColumns = async () => {
  await ensureColumn("invoiceNo", "phoneNumber");
  await ensureColumn("estimateNo", "invoiceNo");
};
