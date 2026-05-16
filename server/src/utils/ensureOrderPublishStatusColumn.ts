import db from "../db";
import { TABLE_NAMES } from "../constants";

export const ensureOrderPublishStatusColumn = async () => {
  const columns = await db.query(
    `SHOW COLUMNS FROM \`${TABLE_NAMES.ORDERS}\` LIKE ?`,
    ["publishStatus"],
  );

  if (!Array.isArray(columns) || columns.length === 0) {
    await db.query(
      `ALTER TABLE \`${TABLE_NAMES.ORDERS}\` ADD COLUMN \`publishStatus\` enum('published','draft') NOT NULL DEFAULT 'published'`,
    );
  }

  await db.query(
    `UPDATE \`${TABLE_NAMES.ORDERS}\` SET \`publishStatus\` = 'published' WHERE \`publishStatus\` IS NULL OR \`publishStatus\` NOT IN ('published', 'draft')`,
  );
};
