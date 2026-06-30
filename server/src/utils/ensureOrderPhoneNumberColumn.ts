import db from "../db";
import { TABLE_NAMES } from "../constants";

export const ensureOrderPhoneNumberColumn = async () => {
  const columns = await db.query(
    `SHOW COLUMNS FROM \`${TABLE_NAMES.ORDERS}\` LIKE ?`,
    ["phoneNumber"],
  );

  if (!Array.isArray(columns) || columns.length === 0) {
    await db.query(
      `ALTER TABLE \`${TABLE_NAMES.ORDERS}\` ADD COLUMN \`phoneNumber\` varchar(225) NULL AFTER \`address\``,
    );
  }
};
