import db from "../db";
import { TABLE_NAMES } from "../constants";

const CANONICAL_ORDER_STAGES = [
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
];

const ORDER_STAGE_ENUM_SQL =
  "enum('Pattern','Khaka','Issue Beading','Beading','Zarkan','Stitching','Repair','Balance Pending','Ready To Delivery','Shipped')";

const STAGE_NORMALIZATIONS: Record<string, string> = {
  pattern: "Pattern",
  khaka: "Khaka",
  "issue beading": "Issue Beading",
  issuebeading: "Issue Beading",
  beading: "Beading",
  zarkan: "Zarkan",
  stitching: "Stitching",
  stitch: "Stitching",
  repair: "Repair",
  "balance pending": "Balance Pending",
  balancepending: "Balance Pending",
  "ready to delivery": "Ready To Delivery",
  readytodelivery: "Ready To Delivery",
  "ready to deliver": "Ready To Delivery",
  readytodeliver: "Ready To Delivery",
  "ready for delivery": "Ready To Delivery",
  readyfordelivery: "Ready To Delivery",
  shipped: "Shipped",
  shipping: "Shipped",
  delivered: "Shipped",
};

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
    `ALTER TABLE \`${tableName}\` MODIFY COLUMN \`${columnName}\` varchar(64) ${definitionSuffix}`,
  );

  await normalizeStageValues(tableName, columnName);

  await db.query(
    `ALTER TABLE \`${tableName}\` MODIFY COLUMN \`${columnName}\` ${ORDER_STAGE_ENUM_SQL} ${definitionSuffix}`,
  );
};

const normalizeStageKey = (value: unknown) =>
  String(value ?? "")
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();

const normalizeStageValues = async (tableName: string, columnName: string) => {
  const rows = await db.query(
    `SELECT id, \`${columnName}\` AS value FROM \`${tableName}\` WHERE \`${columnName}\` IS NULL OR \`${columnName}\` NOT IN (?)`,
    [CANONICAL_ORDER_STAGES],
  );

  if (!Array.isArray(rows) || rows.length === 0) {
    return;
  }

  const groupedIds = rows.reduce<Record<string, number[]>>((groups, row) => {
    const normalizedStage =
      STAGE_NORMALIZATIONS[normalizeStageKey(row.value)] ?? "Pattern";
    groups[normalizedStage] = groups[normalizedStage] ?? [];
    groups[normalizedStage].push(Number(row.id));
    return groups;
  }, {});

  const badValues = rows
    .map((row) => String(row.value ?? "NULL"))
    .filter((value, index, values) => values.indexOf(value) === index);

  console.warn(
    `[startup] Normalizing ${rows.length} legacy ${tableName}.${columnName} value(s) before adding Repair stage: ${badValues.join(", ")}`,
  );

  for (const [stage, ids] of Object.entries(groupedIds)) {
    await db.query(
      `UPDATE \`${tableName}\` SET \`${columnName}\` = ? WHERE id IN (?)`,
      [stage, ids],
    );
  }
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
