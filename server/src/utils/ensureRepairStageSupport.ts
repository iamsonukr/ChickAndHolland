import db from "../db";
import { TABLE_NAMES } from "../constants";

const ORDER_STAGE_ENUM_SQL =
  "enum('Pattern','Khaka','Issue Beading','Beading','Zarkan','Stitching','Repair','Balance Pending','Ready To Delivery','Shipped')";

const ensureDateColumn = async (tableName: string) => {
  const columns = await db.query(
    `SHOW COLUMNS FROM \`${tableName}\` LIKE ?`,
    ["repair"],
  );

  if (!Array.isArray(columns) || columns.length === 0) {
    await db.query(
      `ALTER TABLE \`${tableName}\` ADD COLUMN \`repair\` datetime NULL AFTER \`stitching\``,
    );
  }
};

const ensureEnumContainsRepair = async (
  tableName: string,
  columnName: string,
  definitionSuffix: string,
) => {
  const columns = await db.query(
    `SHOW COLUMNS FROM \`${tableName}\` LIKE ?`,
    [columnName],
  );

  if (!Array.isArray(columns) || columns.length === 0) {
    return;
  }

  const columnType = String(columns[0]?.Type ?? "");
  if (columnType.includes("'Repair'")) {
    return;
  }

  await db.query(
    `ALTER TABLE \`${tableName}\` MODIFY COLUMN \`${columnName}\` ${ORDER_STAGE_ENUM_SQL} ${definitionSuffix}`,
  );
};

export const ensureRepairStageSupport = async () => {
  await ensureDateColumn(TABLE_NAMES.ORDERS);
  await ensureDateColumn("retailer_orders");
  await ensureEnumContainsRepair(
    TABLE_NAMES.ORDERS,
    "orderStatus",
    "NOT NULL DEFAULT 'Pattern'",
  );
  await ensureEnumContainsRepair(
    "retailer_orders",
    "orderStatus",
    "NOT NULL DEFAULT 'Pattern'",
  );
  await ensureEnumContainsRepair("styleProgress", "stage", "NOT NULL");
};
