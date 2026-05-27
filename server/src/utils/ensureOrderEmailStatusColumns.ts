import db from "../db";
import { TABLE_NAMES } from "../constants";

const EMAIL_STATUS_COLUMNS = [
  {
    name: "emailStatus",
    definition: "varchar(32) NULL",
  },
  {
    name: "emailFailureReason",
    definition: "text NULL",
  },
  {
    name: "emailLastAttemptAt",
    definition: "datetime NULL",
  },
];

export const ensureOrderEmailStatusColumns = async () => {
  for (const column of EMAIL_STATUS_COLUMNS) {
    const existingColumns = await db.query(
      `SHOW COLUMNS FROM \`${TABLE_NAMES.ORDERS}\` LIKE ?`,
      [column.name],
    );

    if (Array.isArray(existingColumns) && existingColumns.length > 0) {
      continue;
    }

    await db.query(
      `ALTER TABLE \`${TABLE_NAMES.ORDERS}\` ADD COLUMN \`${column.name}\` ${column.definition}`,
    );
  }
};
