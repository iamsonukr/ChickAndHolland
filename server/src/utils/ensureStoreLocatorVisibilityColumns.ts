import db from "../db";

const VISIBILITY_COLUMNS = [
  { table: "customers", after: "storeAddress" },
  { table: "clients", after: "city_name" },
];

export const ensureStoreLocatorVisibilityColumns = async () => {
  for (const column of VISIBILITY_COLUMNS) {
    const columns = await db.query(
      `SHOW COLUMNS FROM \`${column.table}\` LIKE ?`,
      ["showOnStoreLocator"],
    );

    if (!Array.isArray(columns) || columns.length === 0) {
      await db.query(
        `ALTER TABLE \`${column.table}\` ADD COLUMN \`showOnStoreLocator\` boolean NOT NULL DEFAULT true AFTER \`${column.after}\``,
      );
    }

    await db.query(
      `UPDATE \`${column.table}\` SET \`showOnStoreLocator\` = true WHERE \`showOnStoreLocator\` IS NULL`,
    );
  }
};
