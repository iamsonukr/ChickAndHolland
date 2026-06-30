
import { Router, Request, Response } from "express";
import asyncHandler from "../middleware/AsyncHandler";
import StyleProgress from "../models/StyleProgress";
import db from "../db";
import { getBarcodeComment } from "../services/barcodeComment.service";

const router = Router();
let productsBeaderColumnAvailable: boolean | null = null;

async function hasProductsBeaderColumn() {
  if (productsBeaderColumnAvailable !== null) {
    return productsBeaderColumnAvailable;
  }

  const columns = await db.query("SHOW COLUMNS FROM `products` LIKE ?", [
    "beader",
  ]);
  productsBeaderColumnAvailable =
    Array.isArray(columns) && columns.length > 0;

  return productsBeaderColumnAvailable;
}

async function buildProductsBeaderSelect(alias?: string) {
  const prefix = alias ? `${alias}.` : "";

  return (await hasProductsBeaderColumn())
    ? `${prefix}beader AS beader`
    : "NULL AS beader";
}

/**
 * ======================================================
 *  📌 1. FRESH ORDER STATUS REPORT
 *  /api/report/status/report/:orderId
 * ======================================================
 */
router.get(
  "/status/report/:orderId",
  asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const productsBeaderSelect = await buildProductsBeaderSelect("p");

    const rows = await db.query(
      `
      SELECT
        ros.id            AS styleId,
        ros.styleNo       AS styleNo,
        ros.barcode       AS barcode,
        ros.size          AS size,
        ros.size_country  AS size_country,
        ros.quantity      AS quantity,
        ro.purchaeOrderNo AS purchaseOrderNo,
        ${productsBeaderSelect},
        matchedFavourite.mesh_color AS meshColorRaw,
        CONCAT(
          'SAS(',
          COALESCE(pc.name, matchedFavourite.mesh_color),
          ')'
        ) AS meshColor

      FROM retailer_order_styles ros
      INNER JOIN retailer_orders ro
        ON ro.id = ros.retailerOrderId

      LEFT JOIN retailer_favourites_orders rfo
        ON rfo.id = ro.favouriteOrderId

      LEFT JOIN products p
        ON p.productCode = ros.styleNo

      LEFT JOIN favourites matchedFavourite
        ON FIND_IN_SET(matchedFavourite.id, rfo.favourite_ids) > 0
       AND matchedFavourite.productId = p.id
       AND (
            ros.size = CAST(matchedFavourite.admin_us_size AS CHAR)
         OR ros.size = CAST(matchedFavourite.product_size AS CHAR)
         OR ros.size = CONCAT(
              CAST(matchedFavourite.product_size AS CHAR),
              ' (',
              matchedFavourite.size_country,
              ')'
            )
       )
       AND (
            ros.size_country = matchedFavourite.size_country
         OR ros.size_country IS NULL
         OR ros.size_country = ''
       )

      LEFT JOIN product_colours pc
        ON LOWER(pc.hexcode) = LOWER(matchedFavourite.mesh_color)

      WHERE ro.id = ?
      ORDER BY ros.id ASC;
      `,
      [orderId]
    );

    if (!rows.length) {
      return res.json({ success: false, message: "No style data found" });
    }

    const data = [];

    for (const row of rows) {
      const progress = await StyleProgress.find({
        where: { barcode: row.barcode },
        order: { id: "ASC" },
      });

      const completed = progress.reduce(
        (sum, p) => sum + (p.qty || 0),
        0
      );

      data.push({
        styleId: row.styleId,
        styleNo: row.styleNo,
        barcode: row.barcode,
        comment: await getBarcodeComment(row.barcode, "RETAILER"),

        // ✅ LABEL DATA (RAW)
        size: row.size,
        size_country: row.size_country,
        quantity: row.quantity ?? 1,
        color: row.color,
        purchaseOrderNo: row.purchaseOrderNo,
        beader: row.beader ?? "",
        meshColor: row.meshColor,   // ✅ ADD THIS
        meshColorRaw: row.meshColorRaw,

        completed,
        remaining: (row.quantity ?? 1) - completed,
        progress,
      });
    }

    return res.json({ success: true, data });
  })
);

/**
 * ======================================================
 *  📌 2. STOCK ORDER STATUS REPORT
 *  /api/report/stock-status/report/:orderId
 * ======================================================
 */
router.get(
  "/stock-status/report/:orderId",
  asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const productsBeaderSelect = await buildProductsBeaderSelect("p");

    const rows = await db.query(
      `
     SELECT
  sos.id        AS styleId,
  sos.styleNo   AS styleNo,
  sos.barcode   AS barcode,

  sos.size      AS size,
  sos.quantity  AS quantity,

  s.size_country AS size_country,
  ro.purchaeOrderNo AS purchaseOrderNo,
  ${productsBeaderSelect},
  s.mesh_color AS meshColorRaw,

  -- ✅ SAME COLOR FIX AS RETAILER
  CONCAT(
    'SAS(',
    COALESCE(pc.name, s.mesh_color),
    ')'
  ) AS meshColor

FROM stock_order_styles sos
INNER JOIN retailer_orders ro
  ON ro.id = sos.retailerOrderId

INNER JOIN retailer_stock_orders rso
  ON rso.id = ro.stockOrderId

INNER JOIN stock s
  ON s.id = rso.stockId

LEFT JOIN products p
  ON p.productCode = sos.styleNo

-- 🔥 JOIN COLOR MASTER
LEFT JOIN product_colours pc
  ON LOWER(pc.hexcode) = LOWER(s.mesh_color)

WHERE ro.id = ?
ORDER BY sos.id ASC;


      `,
      [orderId]
    );

    if (!rows.length) {
      return res.json({ success: false, message: "No stock style data found" });
    }

    const data = [];

    for (const row of rows) {
      const logs = await StyleProgress.find({
        where: { barcode: row.barcode },
        order: { id: "ASC" },
      });

      const completedQty = logs.reduce(
        (sum: number, r: any) => sum + (r.qty || 0),
        0
      );

      data.push({
        styleId: row.styleId,
        styleNo: row.styleNo,
        barcode: row.barcode,
        comment: await getBarcodeComment(row.barcode, "STOCK"),

        // ✅ CORRECT FIX
        size: row.size,
        size_country: row.size_country,

        quantity: row.quantity ?? 1,
        color: row.color,
        purchaseOrderNo: row.purchaseOrderNo,
        beader: row.beader ?? "",
        meshColor: row.meshColor, // ✅ USE THIS ONLY
        meshColorRaw: row.meshColorRaw,


        completedQty,
        remainingQty: (row.quantity ?? 1) - completedQty,
        progress: logs,
      });
    }
    return res.json({ success: true, data });
  })
);

export default router;
