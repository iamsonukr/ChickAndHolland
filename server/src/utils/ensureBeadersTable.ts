import db from "../db";
import { TABLE_NAMES } from "../constants";
import { ORDER_BEADERS_TABLE } from "./ensureOrderBeadersTable";

export const ensureBeadersTable = async () => {
  await db.query(
    `
    CREATE TABLE IF NOT EXISTS \`${TABLE_NAMES.BEADERS}\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`name\` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
      \`createdAt\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`deletedAt\` datetime NULL,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`uniq_beaders_name\` (\`name\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `,
  );

  await db.query(
    `
    INSERT IGNORE INTO \`${TABLE_NAMES.BEADERS}\` (\`name\`)
    SELECT MIN(beaderName) AS name
    FROM (
      SELECT TRIM(\`beader\`) AS beaderName FROM \`${ORDER_BEADERS_TABLE}\`
      UNION ALL
      SELECT TRIM(\`beader\`) AS beaderName FROM \`products\`
      UNION ALL
      SELECT TRIM(\`beader\`) AS beaderName FROM \`orderStyles\`
    ) existingBeaders
    WHERE beaderName IS NOT NULL
      AND beaderName <> ''
    GROUP BY LOWER(beaderName)
    `,
  );
};
