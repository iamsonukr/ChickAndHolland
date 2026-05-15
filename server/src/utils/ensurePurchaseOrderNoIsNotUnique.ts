import db from "../db";

const TABLES_WITH_PURCHASE_ORDER_NO = ["orders", "retailer_orders"];
const PURCHASE_ORDER_COLUMN = "purchaeOrderNo";

function escapeIdentifier(identifier: string) {
  return identifier.replace(/`/g, "``");
}

async function getSingleColumnUniqueIndexes(tableName: string) {
  return db.query(
    `
      SELECT s.INDEX_NAME
      FROM INFORMATION_SCHEMA.STATISTICS s
      JOIN (
        SELECT INDEX_NAME, COUNT(*) AS columnCount
        FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
        GROUP BY INDEX_NAME
      ) i ON i.INDEX_NAME = s.INDEX_NAME
      WHERE s.TABLE_SCHEMA = DATABASE()
        AND s.TABLE_NAME = ?
        AND s.COLUMN_NAME = ?
        AND s.NON_UNIQUE = 0
        AND s.INDEX_NAME <> 'PRIMARY'
        AND i.columnCount = 1
    `,
    [tableName, tableName, PURCHASE_ORDER_COLUMN],
  );
}

export async function ensurePurchaseOrderNoIsNotUnique() {
  for (const tableName of TABLES_WITH_PURCHASE_ORDER_NO) {
    const indexes = await getSingleColumnUniqueIndexes(tableName);

    for (const index of indexes) {
      const indexName = String(index.INDEX_NAME ?? "").trim();
      if (!indexName) continue;

      console.log(
        `Dropping unique index ${indexName} on ${tableName}.${PURCHASE_ORDER_COLUMN}`,
      );

      await db.query(
        `ALTER TABLE \`${escapeIdentifier(tableName)}\` DROP INDEX \`${escapeIdentifier(indexName)}\``,
      );
    }
  }
}
