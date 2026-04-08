import db from "../db";

const GLOBAL_PO_SEQUENCE_NAME = "global_po";

type Queryable = {
  query: (query: string, parameters?: any[]) => Promise<any>;
};

function normalizePrefix(prefix: string) {
  return prefix.trim().replace(/\s+/g, " ");
}

export function buildPurchaseOrderPrefix(customerName: string) {
  const customerPrefix = String(customerName ?? "")
    .split(" ")[0]
    .replace(/[^A-Za-z]/g, "")
    .toUpperCase();

  return `PO#${customerPrefix || "ORDER"}`;
}

async function ensureSequenceTable(queryable: Queryable = db) {
  await queryable.query(`
    CREATE TABLE IF NOT EXISTS order_sequence (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) UNIQUE NOT NULL,
      nextNumber INT NOT NULL DEFAULT 1,
      createdAt datetime(6) DEFAULT CURRENT_TIMESTAMP(6),
      updatedAt datetime(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
      deletedAt datetime(6) DEFAULT NULL
    )
  `);

  try {
    await queryable.query(
      "ALTER TABLE order_sequence ADD COLUMN IF NOT EXISTS deletedAt datetime(6) NULL AFTER updatedAt"
    );
  } catch {
    try {
      await queryable.query(
        "ALTER TABLE order_sequence ADD COLUMN deletedAt datetime(6) NULL AFTER updatedAt"
      );
    } catch {}
  }
}

async function ensureSequenceRow(queryable: Queryable = db, initialNextNumber = 1) {
  await queryable.query(
    `
      INSERT INTO order_sequence (name, nextNumber, createdAt, updatedAt)
      VALUES (?, ?, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6))
      ON DUPLICATE KEY UPDATE
        updatedAt = CURRENT_TIMESTAMP(6)
    `,
    [GLOBAL_PO_SEQUENCE_NAME, Math.max(initialNextNumber, 1)],
  );
}

export async function peekGlobalNextPoNumber() {
  await ensureSequenceTable();
  await ensureSequenceRow();

  const rows = await db.query(
    "SELECT nextNumber FROM order_sequence WHERE name = ? LIMIT 1",
    [GLOBAL_PO_SEQUENCE_NAME],
  );

  return Math.max(Number(rows?.[0]?.nextNumber) || 1, 1);
}

async function reserveGlobalNextPoNumber() {
  await ensureSequenceTable();

  const queryRunner = db.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    await ensureSequenceRow(queryRunner);

    const rows = await queryRunner.query(
      "SELECT id, nextNumber FROM order_sequence WHERE name = ? FOR UPDATE",
      [GLOBAL_PO_SEQUENCE_NAME],
    );

    const currentNext = Math.max(Number(rows?.[0]?.nextNumber) || 1, 1);

    await queryRunner.query(
      "UPDATE order_sequence SET nextNumber = ?, updatedAt = CURRENT_TIMESTAMP(6) WHERE id = ?",
      [currentNext + 1, rows[0].id],
    );

    await queryRunner.commitTransaction();
    return currentNext;
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}

export async function generateUniquePO(prefix: string) {
  const nextNumber = await reserveGlobalNextPoNumber();
  return `${normalizePrefix(prefix)} ${nextNumber}`;
}

export async function previewUniquePO(prefix: string) {
  const nextNumber = await peekGlobalNextPoNumber();
  return `${normalizePrefix(prefix)} ${nextNumber}`;
}

export async function setGlobalPoSequence(target: number) {
  await ensureSequenceTable();

  const queryRunner = db.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const safeTarget = Math.max(target, 1);

    await queryRunner.query(
      `
        INSERT INTO order_sequence (name, nextNumber, createdAt, updatedAt)
        VALUES (?, ?, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6))
        ON DUPLICATE KEY UPDATE
          nextNumber = VALUES(nextNumber),
          updatedAt = CURRENT_TIMESTAMP(6)
      `,
      [GLOBAL_PO_SEQUENCE_NAME, safeTarget],
    );

    await queryRunner.commitTransaction();
    return safeTarget;
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}
