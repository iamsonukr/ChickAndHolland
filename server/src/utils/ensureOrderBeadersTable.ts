import db from "../db";

export const ORDER_BEADERS_TABLE = "order_beaders";

export const ensureOrderBeadersTable = async () => {
  await db.query(
    `
    CREATE TABLE IF NOT EXISTS \`${ORDER_BEADERS_TABLE}\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`orderId\` int NOT NULL,
      \`styleId\` int NOT NULL,
      \`productCode\` varchar(225) NULL,
      \`beader\` varchar(255) NOT NULL,
      \`createdAt\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`uniq_order_beaders_style\` (\`styleId\`),
      KEY \`idx_order_beaders_order\` (\`orderId\`),
      KEY \`idx_order_beaders_beader\` (\`beader\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `,
  );

  await db.query(
    `
    INSERT INTO \`${ORDER_BEADERS_TABLE}\` (
      \`orderId\`,
      \`styleId\`,
      \`productCode\`,
      \`beader\`
    )
    SELECT
      s.orderId,
      s.id,
      s.styleNo,
      TRIM(COALESCE(NULLIF(TRIM(s.beader), ''), p.beader)) AS beader
    FROM orderStyles s
    INNER JOIN orders o ON o.id = s.orderId
    LEFT JOIN products p ON p.productCode = s.styleNo
    WHERE o.status = 0
      AND COALESCE(o.publishStatus, 'published') = 'published'
      AND COALESCE(NULLIF(TRIM(s.beader), ''), p.beader) IS NOT NULL
      AND TRIM(COALESCE(NULLIF(TRIM(s.beader), ''), p.beader)) <> ''
    ON DUPLICATE KEY UPDATE
      \`orderId\` = VALUES(\`orderId\`),
      \`productCode\` = VALUES(\`productCode\`),
      \`beader\` = VALUES(\`beader\`),
      \`updatedAt\` = CURRENT_TIMESTAMP
    `,
  );
};
