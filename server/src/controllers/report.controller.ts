// import { Router, Request, Response } from "express";
// import asyncHandler from "../middleware/AsyncHandler";
// import StyleProgress from "../models/StyleProgress";
// import db from "../db";

// const router = Router();

// /**
//  * ======================================================
//  *  📌 1. FRESH ORDER STATUS REPORT
//  *  /api/report/status/report/:orderId
//  * ======================================================
//  */
// router.get(
//   "/status/report/:orderId",
//   asyncHandler(async (req: Request, res: Response) => {
//     const { orderId } = req.params;

//     const rows = await db.query(
//       `
//       SELECT
//         ros.id               AS styleId,
//         ros.styleNo          AS styleNo,
//         ros.barcode          AS barcode,

//         -- 🔥 RAW VALUES ONLY
//         ros.size             AS size,
//         ros.quantity         AS quantity,

//         ro.purchaeOrderNo    AS purchaseOrderNo,

//         -- SAME AS PREVIEW
//         f.color              AS color,
//         f.admin_us_size      AS admin_us_size

//       FROM retailer_order_styles ros
//       INNER JOIN retailer_orders ro
//         ON ro.id = ros.retailerOrderId

//       LEFT JOIN retailer_favourites_orders rfo
//         ON rfo.id = ro.favouriteOrderId

//       LEFT JOIN favourites f
//         ON FIND_IN_SET(f.id, rfo.favourite_ids) > 0

//       WHERE ro.id = ?
//       ORDER BY ros.id ASC
//       `,
//       [orderId]
//     );

//     if (!rows.length) {
//       return res.json({ success: false, message: "No style data found" });
//     }

//     const data = [];

//     for (const row of rows) {
//       const progress = await StyleProgress.find({
//         where: { barcode: row.barcode },
//         order: { id: "ASC" },
//       });

//       const completed = progress.reduce(
//         (sum, p) => sum + (p.qty || 0),
//         0
//       );

//       data.push({
//         styleId: row.styleId,
//         styleNo: row.styleNo,
//         barcode: row.barcode,

//         // ✅ LABEL DATA (RAW)
//         size: row.admin_us_size ?? row.size,
//         quantity: row.quantity ?? 1,
//         color: row.color,
//         purchaseOrderNo: row.purchaseOrderNo,

//         completed,
//         remaining: (row.quantity ?? 1) - completed,
//         progress,
//       });
//     }

//     return res.json({ success: true, data });
//   })
// );

// /**
//  * ======================================================
//  *  📌 2. STOCK ORDER STATUS REPORT
//  *  /api/report/stock-status/report/:orderId
//  * ======================================================
//  */
// router.get(
//   "/stock-status/report/:orderId",
//   asyncHandler(async (req: Request, res: Response) => {
//     const { orderId } = req.params;

//     const rows = await db.query(
//       `
//       SELECT
//         sos.id              AS styleId,
//         sos.styleNo         AS styleNo,
//         sos.barcode         AS barcode,

//         -- 🔥 RAW VALUES ONLY
//         sos.size            AS size,
//         sos.quantity        AS quantity,

//         ro.purchaeOrderNo   AS purchaseOrderNo,

//         -- SAME AS PREVIEW
//         s.mesh_color        AS color

//       FROM stock_order_styles sos
//       INNER JOIN retailer_orders ro
//         ON ro.id = sos.retailerOrderId

//       INNER JOIN retailer_stock_orders rso
//         ON rso.id = ro.stockOrderId

//       INNER JOIN stock s
//         ON s.id = rso.stockId

//       WHERE ro.id = ?
//       ORDER BY sos.id ASC
//       `,
//       [orderId]
//     );

//     if (!rows.length) {
//       return res.json({ success: false, message: "No stock style data found" });
//     }

//     const data = [];

//     for (const row of rows) {
//       const logs = await StyleProgress.find({
//         where: { barcode: row.barcode },
//         order: { id: "ASC" },
//       });

//       const completedQty = logs.reduce(
//         (sum: number, r: any) => sum + (r.qty || 0),
//         0
//       );

//       data.push({
//         styleId: row.styleId,
//         styleNo: row.styleNo,
//         barcode: row.barcode,

//         // ✅ LABEL DATA (RAW)
//         size: row.size,
//         quantity: row.quantity ?? 1,
//         color: row.color,
//         purchaseOrderNo: row.purchaseOrderNo,

//         completedQty,
//         remainingQty: (row.quantity ?? 1) - completedQty,
//         progress: logs,
//       });
//     }

//     return res.json({ success: true, data });
//   })
// );

// export default router;
import { Router, Request, Response } from "express";
import asyncHandler from "../middleware/AsyncHandler";
import StyleProgress from "../models/StyleProgress";
import db from "../db";
import { convertToUSSize } from "../lib/sizeConversion";

const router = Router();

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

    const rows = await db.query(
      `
      SELECT
  ros.id              AS styleId,
  ros.styleNo         AS styleNo,
  ros.barcode         AS barcode,

  ros.size            AS size,
  ros.quantity        AS quantity,

  ro.purchaeOrderNo   AS purchaseOrderNo,
  f.admin_us_size     AS admin_us_size,

  -- ✅ REAL FIX
  CONCAT(
    'SAS(',
    COALESCE(pc.name, f.mesh_color),
    ')'
  ) AS meshColor

FROM retailer_order_styles ros
INNER JOIN retailer_orders ro
  ON ro.id = ros.retailerOrderId

LEFT JOIN retailer_favourites_orders rfo
  ON rfo.id = ro.favouriteOrderId

LEFT JOIN favourites f
  ON FIND_IN_SET(f.id, rfo.favourite_ids) > 0

-- 🔥 JOIN WITH EXISTING COLOR MASTER
LEFT JOIN product_colours pc
  ON LOWER(pc.hexcode) = LOWER(f.mesh_color)

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

        // ✅ LABEL DATA (RAW)
        size: row.admin_us_size ?? row.size,
        quantity: row.quantity ?? 1,
        color: row.color,
        purchaseOrderNo: row.purchaseOrderNo,
  meshColor: row.meshColor,   // ✅ ADD THIS

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

  // ✅ CORRECT FIX
  size: convertToUSSize(row.size, row.size_country),

  quantity: row.quantity ?? 1,
  color: row.color,
  purchaseOrderNo: row.purchaseOrderNo,
    meshColor: row.meshColor, // ✅ USE THIS ONLY


  completedQty,
  remainingQty: (row.quantity ?? 1) - completedQty,
  progress: logs,
});


    }

    return res.json({ success: true, data });
  })
);

export default router;
