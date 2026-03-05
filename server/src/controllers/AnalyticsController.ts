// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-nocheck

import { Request, Response, Router } from "express";
import db from "../db";
import asyncHandler from "../middleware/AsyncHandler";
import { PRC_NAMES } from "../constants";
import {
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subMonths,
} from "date-fns";
import { RetailerOrder } from "../models/RetailerOrder";
import { Between } from "typeorm";
import Colours from "../models/ProductColours";

const router = Router();

router.get(
  "/sales/subcategory",
  asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query as {
      startDate: string;
      endDate: string;
    };

    let { subCategory } = req.query as {
      subCategory: string;
    };

    if (!subCategory) subCategory = "ALL";

    const [subCategories] = await db.query(
      `CALL ${PRC_NAMES.SALES_BY_SUB_CATEGORY}(? , ? , ?)`,
      [subCategory, startDate, endDate]
    );
    res.json(subCategories);
  })
);

router.get(
  "/sales/summary",
  asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate, format } = req.query as {
      startDate: string;
      endDate: string;
      format: string;
    };
    let dateFormat = "";
    if (!format) {
      dateFormat = "%M %D";
    } else {
      dateFormat = format;
    }

    const [salesSummary] = await db.query(
      `CALL ${PRC_NAMES.SALES_SUMMARY}(? , ?, ?)`,
      [startDate, endDate, dateFormat]
    );
    res.json(salesSummary);
  })
);

// analytics - world map
router.get(
  "/sales/region",
  asyncHandler(async (req: Request, res: Response) => {
    let { region } = req.query as {
      region: string;
    };

    if (!region) region = "ALL";

    const [salesSummary] = await db.query(
      `CALL ${PRC_NAMES.SALES_BY_REGION}(?)`,
      [region]
    );
    res.json(salesSummary);
  })
);

router.get(
  "/orders/grouped",
  asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query as {
      startDate: string;
      endDate: string;
    };

    const [orders] = await db.query(`CALL ${PRC_NAMES.ORDERS_GROUPED}(? , ?)`, [
      startDate,
      endDate,
    ]);
    res.json(orders);
  })
);

router.get(
  "/orders/recent",
  asyncHandler(async (req: Request, res: Response) => {
    let { status } = req.query as { status: string };
    if (!status) status = "ALL";

    const [orders] = await db.query(
      `CALL ${PRC_NAMES.RECENT_DASHBOARD}(? , ? , ?)`,
      [10, 0, status]
    );
    res.json(orders);
  })
);

const getDateRange = (period: string, date?: string) => {
  const baseDate = date ? new Date(date) : new Date();
  const previousDate = subMonths(baseDate, 1); // For comparison with previous period

  switch (period) {
    case "daily":
      return {
        start: startOfDay(baseDate),
        end: endOfDay(baseDate),
        previousStart: startOfDay(previousDate),
        previousEnd: endOfDay(previousDate),
      };
    case "monthly":
      return {
        start: startOfMonth(baseDate),
        end: endOfMonth(baseDate),
        previousStart: startOfMonth(previousDate),
        previousEnd: endOfMonth(previousDate),
      };
    case "yearly":
      return {
        start: startOfYear(baseDate),
        end: endOfYear(baseDate),
        previousStart: startOfYear(previousDate),
        previousEnd: endOfYear(previousDate),
      };
    default:
      return {
        start: startOfDay(baseDate),
        end: endOfDay(baseDate),
        previousStart: startOfDay(previousDate),
        previousEnd: endOfDay(previousDate),
      };
  }
};

// router.get('/dashboard', async (req, res) => {
//   const { period = 'monthly', date } = req.query;
//   const { start, end, previousStart, previousEnd } = getDateRange(period as string, date as string);
//
//   try {
//     // 1. Current Period Overview Metrics
//     const currentPeriodMetrics = await db.query(`
//         SELECT
//           COUNT(DISTINCT o.id) as totalOrders,
//           COUNT(DISTINCT o.customerId) as totalCustomers,
//           COUNT(DISTINCT CASE WHEN o.shippingStatus = 'Shipped' THEN o.id END) as shippedOrders,
//           COUNT(DISTINCT CASE WHEN o.orderCancellationDate IS NOT NULL THEN o.id END) as cancelledOrders,
//           COUNT(DISTINCT CASE WHEN o.orderType = 'Store' THEN o.id END) as storeOrders,
//           COUNT(DISTINCT CASE WHEN o.orderType = 'Online' THEN o.id END) as onlineOrders,
//           COUNT(DISTINCT CASE WHEN o.orderType = 'Retail' THEN o.id END) as retailOrders
//         FROM orders o
//         WHERE o.orderReceivedDate BETWEEN ? AND ?
//       `, [start, end]);
//
//     // 2. Previous Period Metrics (for comparison)
//     const previousPeriodMetrics = await db.query(`
//         SELECT
//           COUNT(DISTINCT o.id) as totalOrders,
//           COUNT(DISTINCT o.customerId) as totalCustomers
//         FROM orders o
//         WHERE o.orderReceivedDate BETWEEN ? AND ?
//       `, [previousStart, previousEnd]);
//
//     // 3. Order Status Distribution
//     const orderStatusDistribution = await db.query(`
//         SELECT
//           orderStatus,
//           COUNT(*) as count,
//           (COUNT(*) * 100.0 / (
//             SELECT COUNT(*)
//             FROM orders
//             WHERE orderReceivedDate BETWEEN ? AND ?
//           )) as percentage
//         FROM orders
//         WHERE orderReceivedDate BETWEEN ? AND ?
//         GROUP BY orderStatus
//       `, [start, end, start, end]);
//
//     // 4. Style Performance
//     const stylePerformance = await db.query(`
//         SELECT
//           os.styleNo,
//           COUNT(DISTINCT o.id) as orderCount,
//           SUM(os.quantity) as totalQuantity,
//           GROUP_CONCAT(DISTINCT os.colorType) as colors,
//           GROUP_CONCAT(DISTINCT os.size) as sizes,
//           s.quantity as currentStock,
//           s.price as currentPrice
//         FROM orderStyles os
//         JOIN orders o ON o.id = os.orderId
//         LEFT JOIN stock s ON os.styleNo = s.styleNo AND s.isActive = 1
//         WHERE o.orderReceivedDate BETWEEN ? AND ?
//         GROUP BY os.styleNo, s.quantity, s.price
//         ORDER BY orderCount DESC
//         LIMIT 10
//       `, [start, end]);
//
//     // 5. Time Series Data (for trend charts)
//     const timeSeriesTrends = await db.query(`
//         SELECT
//           DATE(o.orderReceivedDate) as date,
//           COUNT(DISTINCT o.id) as orderCount,
//           COUNT(DISTINCT o.customerId) as customerCount,
//           COUNT(DISTINCT CASE WHEN o.shippingStatus = 'Shipped' THEN o.id END) as shippedCount
//         FROM orders o
//         WHERE o.orderReceivedDate BETWEEN ? AND ?
//         GROUP BY DATE(o.orderReceivedDate)
//         ORDER BY date
//       `, [start, end]);
//
//     // 6. Top Customers
//     const topCustomers = await db.query(`
//         SELECT
//           o.customerId,
//           COUNT(DISTINCT o.id) as orderCount,
//           SUM(os.quantity) as totalItems,
//           COUNT(DISTINCT os.styleNo) as uniqueStyles,
//           GROUP_CONCAT(DISTINCT o.orderType) as orderTypes
//         FROM orders o
//         JOIN orderStyles os ON o.id = os.orderId
//         WHERE o.orderReceivedDate BETWEEN ? AND ?
//         GROUP BY o.customerId
//         ORDER BY orderCount DESC
//         LIMIT 5
//       `, [start, end]);
//
//     // 7. Processing and Shipping Metrics
//     const processingMetrics = await db.query(`
//         SELECT
//           AVG(CASE
//             WHEN o.orderCancellationDate IS NOT NULL
//             THEN DATEDIFF(o.orderCancellationDate, o.orderReceivedDate)
//             ELSE DATEDIFF(CURRENT_TIMESTAMP, o.orderReceivedDate)
//           END) as avgProcessingDays,
//           COUNT(CASE WHEN o.shippingStatus = 'Shipped' THEN 1 END) * 100.0 / COUNT(*) as shippingRate,
//           COUNT(CASE WHEN o.orderCancellationDate IS NOT NULL THEN 1 END) * 100.0 / COUNT(*) as cancellationRate
//         FROM orders o
//         WHERE o.orderReceivedDate BETWEEN ? AND ?
//       `, [start, end]);
//
//     // Calculate period-over-period changes
//     const calculateGrowth = (current: number, previous: number) => {
//       return previous > 0 ? ((current - previous) / previous) * 100 : 0;
//     };
//
//     const periodComparison = {
//       orderGrowth: calculateGrowth(
//         currentPeriodMetrics[0].totalOrders,
//         previousPeriodMetrics[0].totalOrders
//       ),
//       customerGrowth: calculateGrowth(
//         currentPeriodMetrics[0].totalCustomers,
//         previousPeriodMetrics[0].totalCustomers
//       )
//     };
//
//     // Combine all metrics into a single response
//     res.json({
//       overview: {
//         current: currentPeriodMetrics[0],
//         previous: previousPeriodMetrics[0],
//         growth: periodComparison
//       },
//       orderStatus: orderStatusDistribution,
//       styles: {
//         topPerformers: stylePerformance,
//       },
//       trends: timeSeriesTrends,
//       customers: {
//         topCustomers: topCustomers,
//       },
//       performance: {
//         processing: processingMetrics[0]
//       },
//       periodInfo: {
//         start: start,
//         end: end,
//         period: period
//       }
//     });
//
//   } catch (error:any) {
//     console.error('Analytics Error:', error);
//     res.status(500).json({
//       error: 'Failed to fetch analytics data',
//       details: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// });

interface CustomSizeQuantity {
  size: string;
  quantity: string;
}

// Helper functions for JSON parsing
const parseJSON = (jsonString: string) => {
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    console.error("JSON Parse Error:", e);
    return [];
  }
};

const calculateTotalQuantity = (orderStyle: any) => {
  if (orderStyle.colorType === "Custom") {
    const customSizesQuantity: CustomSizeQuantity[] = parseJSON(
      orderStyle.customSizesQuantity
    );
    return customSizesQuantity.reduce(
      (total, item) => total + parseInt(item.quantity, 10),
      0
    );
  }
  return parseInt(orderStyle.quantity, 10) || 0;
};

const processOrderStyle = (orderStyle: any) => {
  const colors =
    orderStyle.colorType === "Custom"
      ? parseJSON(orderStyle.customColor)
      : [orderStyle.colorType];

  const sizes =
    orderStyle.size === "Custom"
      ? parseJSON(orderStyle.customSizesQuantity).map(
          (item: CustomSizeQuantity) => `${item.size} (${item.quantity})`
        )
      : [`${orderStyle.size} (${orderStyle.quantity})`];

  return {
    ...orderStyle,
    totalQuantity: calculateTotalQuantity(orderStyle),
    colors,
    sizes,
  };
};

router.get(
  "/dashboard",
  asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    const totalsQa = `SELECT 
    (
        (SELECT COUNT(ro.id) FROM retailer_orders AS ro 
         WHERE ro.orderReceivedDate BETWEEN ? AND ? AND ro.status = 0)
        +
        (SELECT COUNT(o.id) FROM orders AS o 
         WHERE o.orderReceivedDate BETWEEN ? AND ? AND o.status = 0)
    ) AS orders, 

    (
        SELECT COUNT(DISTINCT buyer_id) FROM (
            SELECT DISTINCT ro.retailerId AS buyer_id
            FROM retailer_orders ro
            WHERE ro.orderReceivedDate BETWEEN ? AND ? AND ro.status = 0
            
            UNION
            
            SELECT DISTINCT o.customerId AS buyer_id
            FROM orders o
            WHERE o.orderReceivedDate BETWEEN ? AND ? AND o.status = 0
        ) unique_buyers
    ) AS customers,

    (
        (SELECT COUNT(ro.id) FROM retailer_orders AS ro 
         WHERE ro.orderReceivedDate BETWEEN ? AND ? AND ro.status = 0)
        +
        (SELECT COUNT(o.id) FROM orders AS o 
         WHERE o.orderReceivedDate BETWEEN ? AND ? AND o.status = 0)
    ) AS total_quantity
;`;

    const [total] = await db.query(totalsQa, [
      startDate, endDate,
      startDate, endDate,
      startDate, endDate,
      startDate, endDate,
      startDate, endDate,
      startDate, endDate,
    ]);

    const graphDataQA = `SELECT 
    order_date, 
    SUM(total_quantity) AS total_quantity
    FROM (
        SELECT DATE(ro.orderReceivedDate) AS order_date, COUNT(ro.id) AS total_quantity
        FROM retailer_orders ro
        WHERE ro.orderReceivedDate BETWEEN ? AND ? AND ro.status = 0
        GROUP BY DATE(ro.orderReceivedDate)
        
        UNION ALL
        
        SELECT DATE(o.orderReceivedDate) AS order_date, COUNT(o.id) AS total_quantity
        FROM orders o
        WHERE o.orderReceivedDate BETWEEN ? AND ? AND o.status = 0
        GROUP BY DATE(o.orderReceivedDate)
    ) combined_orders
    GROUP BY order_date
    ORDER BY order_date ASC;
    `;

    const graphData = await db.query(graphDataQA, [
      startDate, endDate,
      startDate, endDate,
    ]);

    const productsQa = `
    SELECT 
        product_id,
        SUM(total_quantity) AS total_quantity,
        GROUP_CONCAT(DISTINCT combined_sizes SEPARATOR ', ') AS combined_sizes,  
        GROUP_CONCAT(DISTINCT combined_country SEPARATOR ', ') AS combined_country
    FROM (
        SELECT 
            ro.StyleNo AS product_id,
            COUNT(ro.id) AS total_quantity,
            ro.Size AS combined_sizes,
            ro.size_country AS combined_country
        FROM retailer_orders ro
        WHERE ro.orderReceivedDate BETWEEN ? AND ? AND ro.status = 0 AND ro.StyleNo IS NOT NULL
        GROUP BY ro.StyleNo, ro.Size, ro.size_country
        
        UNION ALL
        
        SELECT 
            os.styleNo AS product_id,
            SUM(os.quantity) AS total_quantity,
            os.size AS combined_sizes,
            os.sizeCountry AS combined_country
        FROM orders o
        INNER JOIN orderStyles os ON o.id = os.orderId
        WHERE o.orderReceivedDate BETWEEN ? AND ? AND o.status = 0 AND os.styleNo IS NOT NULL
        GROUP BY os.styleNo, os.size, os.sizeCountry
    ) combined_products
    GROUP BY product_id
    HAVING total_quantity > 0
    ORDER BY total_quantity DESC
    LIMIT 20;
    `;

    const productData = await db.query(productsQa, [
      startDate, endDate,
      startDate, endDate,
    ]);


// ✅ REAL PAID AMOUNT
const paidQuery = `
  SELECT COALESCE(SUM(amount), 0) AS paid
  FROM retailer_order_payments
`;

const [paidResult] = await db.query(paidQuery);
const paidRevenue = Number(paidResult?.paid || 0);

// ✅ REAL PENDING AMOUNT
const pendingQuery = `
  SELECT 
    COALESCE(SUM(ro.purchaseAmount - IFNULL(p.total_paid, 0)), 0) AS pending
  FROM retailer_orders ro
  LEFT JOIN (
    SELECT orderId, SUM(amount) AS total_paid
    FROM retailer_order_payments
    GROUP BY orderId
  ) p ON p.orderId = ro.id
`;

const [pendingResult] = await db.query(pendingQuery);
const pendingRevenue = Number(pendingResult?.pending || 0);

// ✅ TOTAL
const totalRevenue = paidRevenue + pendingRevenue;


// 🔥 response me include 
res.json({
  success: true,
  productData,
  total,
  graphData,
  revenue: {
    paid: paidRevenue,
    pending: pendingRevenue,
    total: totalRevenue,
  },
});

   
  })
);


export default router;
