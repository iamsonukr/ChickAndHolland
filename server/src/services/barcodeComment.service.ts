import db from "../db";

export type BarcodeCommentOrderType = "STORE" | "RETAILER" | "STOCK";

export const getBarcodeComment = async (
  barcode: string,
  orderType: BarcodeCommentOrderType,
) => {
  const rows = await db.query(
    "SELECT `comment` FROM `barcode_comments` WHERE `barcode` = ? AND `orderType` = ? LIMIT 1",
    [barcode, orderType],
  );

  return String(rows?.[0]?.comment ?? "");
};

export const saveBarcodeComment = async ({
  barcode,
  orderType,
  comment,
}: {
  barcode: string;
  orderType: BarcodeCommentOrderType;
  comment: string;
}) => {
  await db.query(
    `
      INSERT INTO \`barcode_comments\` (\`barcode\`, \`orderType\`, \`comment\`)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE
        \`comment\` = VALUES(\`comment\`),
        \`updatedAt\` = CURRENT_TIMESTAMP
    `,
    [barcode, orderType, comment],
  );
};
