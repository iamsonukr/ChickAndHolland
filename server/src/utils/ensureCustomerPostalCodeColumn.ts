import db from "../db";

export const ensureCustomerPostalCodeColumn = async () => {
  const columns = await db.query(
    "SHOW COLUMNS FROM `customers` LIKE ?",
    ["postalCode"],
  );

  if (!Array.isArray(columns) || columns.length === 0) {
    await db.query(
      "ALTER TABLE `customers` ADD COLUMN `postalCode` varchar(30) NULL AFTER `storeAddress`",
    );
  }
};
