import db from "../db";

const BEADER_COLUMNS = [
  {
    table: "products",
    definition: "varchar(255) NULL AFTER `beading_color`",
  },
  {
    table: "orderStyles",
    definition: "varchar(255) NULL AFTER `beading_color`",
  },
];

export const ensureBeaderColumns = async () => {
  for (const column of BEADER_COLUMNS) {
    const existingColumns = await db.query(
      `SHOW COLUMNS FROM \`${column.table}\` LIKE ?`,
      ["beader"],
    );

    if (Array.isArray(existingColumns) && existingColumns.length > 0) {
      continue;
    }

    await db.query(
      `ALTER TABLE \`${column.table}\` ADD COLUMN \`beader\` ${column.definition}`,
    );
  }
};
