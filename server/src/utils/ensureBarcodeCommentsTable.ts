import db from "../db";

export const ensureBarcodeCommentsTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS \`barcode_comments\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`barcode\` varchar(255) NOT NULL,
      \`orderType\` enum('STORE','RETAILER','STOCK') NOT NULL,
      \`comment\` text NULL,
      \`createdAt\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`uniq_barcode_comment_type\` (\`barcode\`, \`orderType\`)
    )
  `);
};
