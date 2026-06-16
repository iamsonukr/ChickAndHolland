import db from "../db";

export const ensureFavouriteProductSizeTextColumn = async () => {
  const columns = await db.query(
    "SHOW COLUMNS FROM `favourites` LIKE ?",
    ["product_size"],
  );

  const column = Array.isArray(columns) ? columns[0] : null;
  const type = String(column?.Type ?? "").toLowerCase();

  if (!type.startsWith("varchar")) {
    await db.query(
      "ALTER TABLE `favourites` MODIFY COLUMN `product_size` varchar(255) NOT NULL",
    );
  }
};
