import db from "../db";
import { TABLE_NAMES } from "../constants";

export const ensureProductQueriesTable = async () => {
  console.log("Ensuring product_queries table exists...");
  await db.query(`
    CREATE TABLE IF NOT EXISTS \`${TABLE_NAMES.PRODUCT_QUERIES}\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      \`deletedAt\` datetime DEFAULT NULL,
      \`firstName\` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
      \`lastName\` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
      \`email\` varchar(225) COLLATE utf8mb4_unicode_ci NOT NULL,
      \`contactNumber\` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
      \`city\` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
      \`country\` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
      \`message\` text COLLATE utf8mb4_unicode_ci NOT NULL,
      \`productCodes\` text COLLATE utf8mb4_unicode_ci NOT NULL,
      \`page\` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
      \`isRead\` tinyint NOT NULL DEFAULT '0',
      PRIMARY KEY (\`id\`),
      KEY \`IDX_product_queries_createdAt\` (\`createdAt\`),
      KEY \`IDX_product_queries_isRead\` (\`isRead\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  const ensureColumn = async (columnName: string, definition: string) => {
    const columns = await db.query(
      `SHOW COLUMNS FROM \`${TABLE_NAMES.PRODUCT_QUERIES}\` LIKE ?`,
      [columnName]
    );

    if (Array.isArray(columns) && columns.length > 0) {
      return;
    }

    console.log("Adding missing product_queries column:", columnName);
    await db.query(
      `ALTER TABLE \`${TABLE_NAMES.PRODUCT_QUERIES}\` ADD COLUMN ${definition}`
    );
  };

  await ensureColumn(
    "createdAt",
    "`createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)"
  );
  await ensureColumn(
    "deletedAt",
    "`deletedAt` datetime DEFAULT NULL"
  );
  await ensureColumn(
    "firstName",
    "`firstName` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL"
  );
  await ensureColumn(
    "lastName",
    "`lastName` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL"
  );
  await ensureColumn(
    "email",
    "`email` varchar(225) COLLATE utf8mb4_unicode_ci NOT NULL"
  );
  await ensureColumn(
    "contactNumber",
    "`contactNumber` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL"
  );
  await ensureColumn(
    "city",
    "`city` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL"
  );
  await ensureColumn(
    "country",
    "`country` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL"
  );
  await ensureColumn("message", "`message` text COLLATE utf8mb4_unicode_ci NOT NULL");
  await ensureColumn(
    "productCodes",
    "`productCodes` text COLLATE utf8mb4_unicode_ci NOT NULL"
  );
  await ensureColumn(
    "page",
    "`page` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL"
  );
  await ensureColumn("isRead", "`isRead` tinyint NOT NULL DEFAULT '0'");
  console.log("product_queries table is ready.");
};
