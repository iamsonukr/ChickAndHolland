import db from "../db";

const GLOBAL_PO_SEQUENCE_NAME = "global_po";
const SAMPLE_ORDER_SEQUENCE_NAME = "sample_order_ns";
const SAMPLE_ORDER_INITIAL_NEXT_NUMBER = 110064;

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

async function ensureSequenceRow(
  queryable: Queryable = db,
  sequenceName = GLOBAL_PO_SEQUENCE_NAME,
  initialNextNumber = 1,
) {
  await queryable.query(
    `
      INSERT INTO order_sequence (name, nextNumber, createdAt, updatedAt)
      VALUES (?, ?, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6))
      ON DUPLICATE KEY UPDATE
        nextNumber = GREATEST(nextNumber, VALUES(nextNumber)),
        updatedAt = CURRENT_TIMESTAMP(6)
    `,
    [sequenceName, Math.max(initialNextNumber, 1)],
  );
}

export async function peekSequenceNumber(
  sequenceName = GLOBAL_PO_SEQUENCE_NAME,
  initialNextNumber = 1,
) {
  await ensureSequenceTable();
  await ensureSequenceRow(db, sequenceName, initialNextNumber);

  const rows = await db.query(
    "SELECT nextNumber FROM order_sequence WHERE name = ? LIMIT 1",
    [sequenceName],
  );

  return Math.max(Number(rows?.[0]?.nextNumber) || 1, 1);
}

export async function peekGlobalNextPoNumber() {
  return peekSequenceNumber(GLOBAL_PO_SEQUENCE_NAME);
}

async function reserveSequenceNumber(
  sequenceName = GLOBAL_PO_SEQUENCE_NAME,
  initialNextNumber = 1,
) {
  await ensureSequenceTable();

  const queryRunner = db.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    await ensureSequenceRow(queryRunner, sequenceName, initialNextNumber);

    const rows = await queryRunner.query(
      "SELECT id, nextNumber FROM order_sequence WHERE name = ? FOR UPDATE",
      [sequenceName],
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
  const nextNumber = await reserveSequenceNumber(GLOBAL_PO_SEQUENCE_NAME);
  return `${normalizePrefix(prefix)} ${nextNumber}`;
}

export async function previewUniquePO(prefix: string) {
  const nextNumber = await peekGlobalNextPoNumber();
  return `${normalizePrefix(prefix)} ${nextNumber}`;
}

export async function setGlobalPoSequence(target: number) {
  return setSequenceNumber(GLOBAL_PO_SEQUENCE_NAME, target);
}

export async function setSequenceNumber(
  sequenceName: string,
  target: number,
) {
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
      [sequenceName, safeTarget],
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

export function formatSampleOrderStyleNo(sequenceNumber: number) {
  return `NS${String(Math.max(Number(sequenceNumber) || 1, 1)).padStart(6, "0")}`;
}

export async function peekNextSampleOrderStyleNo() {
  const nextNumber = await peekSequenceNumber(
    SAMPLE_ORDER_SEQUENCE_NAME,
    SAMPLE_ORDER_INITIAL_NEXT_NUMBER,
  );

  return {
    nextNumber,
    styleNo: formatSampleOrderStyleNo(nextNumber),
  };
}

export async function generateNextSampleOrderStyleNo() {
  const nextNumber = await reserveSequenceNumber(
    SAMPLE_ORDER_SEQUENCE_NAME,
    SAMPLE_ORDER_INITIAL_NEXT_NUMBER,
  );

  return {
    nextNumber,
    styleNo: formatSampleOrderStyleNo(nextNumber),
  };
}

export async function setSampleOrderSequence(target: number) {
  const nextNumber = await setSequenceNumber(
    SAMPLE_ORDER_SEQUENCE_NAME,
    Math.max(target, SAMPLE_ORDER_INITIAL_NEXT_NUMBER),
  );

  return {
    nextNumber,
    styleNo: formatSampleOrderStyleNo(nextNumber),
  };
}
