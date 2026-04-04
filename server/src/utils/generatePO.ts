import { RetailerOrder } from "../models/RetailerOrder";
import OrderSequence from "../models/OrderSequence";
import db from "../db";

async function ensureSequenceTable() {
  // Create if missing
  await db.query(`
    CREATE TABLE IF NOT EXISTS order_sequence (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) UNIQUE NOT NULL,
      nextNumber INT NOT NULL DEFAULT 1,
      createdAt datetime(6) DEFAULT CURRENT_TIMESTAMP(6),
      updatedAt datetime(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
      deletedAt datetime(6) DEFAULT NULL
    )
  `);
  // Patch old tables missing deletedAt / updatedAt
  try {
    await db.query(
      "ALTER TABLE order_sequence ADD COLUMN IF NOT EXISTS deletedAt datetime(6) NULL AFTER updatedAt"
    );
  } catch {
    // Older MySQL may not support IF NOT EXISTS; attempt a plain add and ignore error if exists.
    try {
      await db.query(
        "ALTER TABLE order_sequence ADD COLUMN deletedAt datetime(6) NULL AFTER updatedAt"
      );
    } catch {}
  }
}

async function getGlobalNextNumber(): Promise<number> {
  await ensureSequenceTable();

  // Max numeric part across all orders
  const rawMax = await db.query(`
    SELECT MAX(CAST(REGEXP_REPLACE(purchaeOrderNo, '[^0-9]', '') AS UNSIGNED)) AS maxNum
    FROM retailer_orders
  `);
  const maxInOrders = Number(rawMax?.[0]?.maxNum) || 0;

  let seq = await OrderSequence.findOne({ where: { name: "global_po" } });
  if (!seq) {
    seq = OrderSequence.create({
      name: "global_po",
      nextNumber: maxInOrders + 1 || 1,
    });
    await seq.save();
  }

  // Ensure we never go below existing max
  seq.nextNumber = Math.max(seq.nextNumber, maxInOrders + 1);
  await seq.save();

  return seq.nextNumber;
}

async function bumpGlobalNextNumber(next: number) {
  let seq = await OrderSequence.findOne({ where: { name: "global_po" } });
  if (!seq) {
    seq = OrderSequence.create({ name: "global_po", nextNumber: next + 1 });
  } else {
    seq.nextNumber = next + 1;
  }
  await seq.save();
}

export async function generateUniquePO(prefix: string) {
  const nextNumber = await getGlobalNextNumber();

  // Persist increment for next call
  await bumpGlobalNextNumber(nextNumber);

  return `${prefix}${String(nextNumber).padStart(5, "0")}`;
}

export async function setGlobalPoSequence(target: number) {
  await ensureSequenceTable();

  const rawMax = await db.query(`
    SELECT MAX(CAST(REGEXP_REPLACE(purchaeOrderNo, '[^0-9]', '') AS UNSIGNED)) AS maxNum
    FROM retailer_orders
  `);
  const maxInOrders = Number(rawMax?.[0]?.maxNum) || 0;
  const safeTarget = Math.max(target, maxInOrders + 1);

  let seq = await OrderSequence.findOne({ where: { name: "global_po" } });
  if (!seq) {
    seq = OrderSequence.create({ name: "global_po", nextNumber: safeTarget });
  } else {
    seq.nextNumber = safeTarget;
  }
  await seq.save();

  return seq.nextNumber;
}
