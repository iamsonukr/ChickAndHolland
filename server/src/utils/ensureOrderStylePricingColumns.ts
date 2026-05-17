import db from "../db";

const ORDER_STYLES_TABLE = "orderStyles";

const PRICING_COLUMNS = [
  {
    name: "unitPrice",
    definition: "decimal(10,2) NULL",
  },
  {
    name: "subtotal",
    definition: "decimal(10,2) NULL",
  },
  {
    name: "discount",
    definition: "decimal(10,2) NOT NULL DEFAULT 0",
  },
  {
    name: "totalPrice",
    definition: "decimal(10,2) NULL",
  },
  {
    name: "currencyId",
    definition: "int NULL",
  },
  {
    name: "currencyCode",
    definition: "varchar(10) NULL",
  },
  {
    name: "currencySymbol",
    definition: "varchar(10) NULL",
  },
];

export const ensureOrderStylePricingColumns = async () => {
  for (const column of PRICING_COLUMNS) {
    const existingColumns = await db.query(
      `SHOW COLUMNS FROM \`${ORDER_STYLES_TABLE}\` LIKE ?`,
      [column.name],
    );

    if (Array.isArray(existingColumns) && existingColumns.length > 0) {
      continue;
    }

    await db.query(
      `ALTER TABLE \`${ORDER_STYLES_TABLE}\` ADD COLUMN \`${column.name}\` ${column.definition}`,
    );
  }
};
