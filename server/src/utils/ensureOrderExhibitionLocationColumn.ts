import db from "../db";
import { TABLE_NAMES } from "../constants";

export const ensureOrderExhibitionLocationColumn = async () => {
  const columns = await db.query(
    `SHOW COLUMNS FROM \`${TABLE_NAMES.ORDERS}\` LIKE ?`,
    ["exhibitionLocation"],
  );

  if (!Array.isArray(columns) || columns.length === 0) {
    await db.query(
      `ALTER TABLE \`${TABLE_NAMES.ORDERS}\` ADD COLUMN \`exhibitionLocation\` varchar(225) NULL AFTER \`orderType\``,
    );
  }
};
