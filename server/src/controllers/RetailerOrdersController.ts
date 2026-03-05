import Stripe from "stripe";

import { Router, Request, Response, raw } from "express";
import asyncHandler from "../middleware/AsyncHandler";
import Favourites from "../models/Favourites";
import RetailerFavouritesOrders from "../models/ReailerFavouritesOrder";
import Retailer from "../models/Retailer";
import Stock from "../models/Stock";
import { RetailerOrder } from "../models/RetailerOrder";
import { OrderStatus, ShippingStatus } from "../models/Order";

import RetailerStockOrders from "../models/RetailerStockOrders";
import db from "../db";
import RetailerOrdersPayment from "../models/RetailerPaymentModal";
import { getRepository, In, MoreThan } from "typeorm";
import Order from "../models/Order";
import { convertToUSSize } from "../lib/sizeConversion";
import { generateUniquePO } from "../utils/generatePO";
import RetailerOrderStyles from "../models/RetailerOrderStyles";  
import StockOrderStyles from "../models/StockOrderStyles";
import express from "express";
import StyleProgress from "../models/StyleProgress";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

const router = Router();
// 🔥 Get Latest Purchase Order Number (Fresh Orders Only)
// Used to auto-generate the next PO number for approval page
router.get(
  "/latest-po",
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const latestOrder = await db.getRepository(RetailerOrder)
        .createQueryBuilder("order")
        .where("order.is_stock_order = :type", { type: false }) // Only Fresh Orders
        .orderBy("order.id", "DESC")
        .getOne();

      return res.json({
        success: true,
        latestPO: latestOrder?.purchaeOrderNo || null,
      });
    } catch (err) {
      console.error("Error fetching latest PO:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch latest PO number",
      });
    }
  })
);

router.post(
  "/favourites/:retailerId",
  asyncHandler(async (req: Request, res: Response) => {
    const { favourateData } = req.body;
    const { retailerId } = req.params;

    if (favourateData && favourateData.length > 0) {
      for (let index = 0; index < favourateData.length; index++) {
        const favorite = await Favourites.findOne({
          where: {
            id: favourateData[index].id,
          },
        });
        if (favorite) {
          favorite.is_order_placed = 1;
          favorite.customization = favourateData[index].customization;
          // 🔥 Add this here
   favorite.admin_us_size = convertToUSSize(
      favorite.product_size,
      favorite.size_country
   );
          await favorite.save();
        }
      }
    } else {
      const favorite = await Favourites.findOne({
        where: {
          id: favourateData.id,
        },
      });
      if (favorite) {
        favorite.is_order_placed = 1;
        favorite.customization = favourateData.customization;
        await favorite.save();
      }
    }

    const favOrders = new RetailerFavouritesOrders();

    const retailer = await Retailer.findOne({
      where: {
        id: Number(retailerId),
      },
    });
    if (favourateData && favourateData.length > 0) {
      favOrders.favourite_ids = favourateData
        .map((item: any) => item.id)
        .join(",");
    } else {
      favOrders.favourite_ids = favourateData.id;
    }
    if (retailer) {
      favOrders.retailer = retailer;
    }

    await favOrders.save();
    res.json({
      success: true,
      message: "Add to orders",
    });
  })
);
router.post(
  "/admin/address-update/:orderId",
  asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const { address } = req.body;

    const retailerOrder = await RetailerOrder.findOne({
      where: { id: Number(orderId) },
      relations: ["retailer"],
    });

    if (!retailerOrder) {
      return res.status(404).json({ success: false, msg: "Order not found" });
    }

    // Update retailer order table
    retailerOrder.address = address;
    await retailerOrder.save();

    // Update main Order Table as well
    const mainOrder = await Order.findOne({
      where: { id: retailerOrder.id },
    });

    if (mainOrder) {
      mainOrder.address = address;
      await mainOrder.save();
    }

    return res.json({
      success: true,
      message: "Address updated successfully",
      address,
    });
  })
);


router.post(
  "/stock/:retailerId/:stockId/:quantity",
  asyncHandler(async (req: Request, res: Response) => {
    const { retailerId, stockId, quantity } = req.params;
    const { currencyId } = req.body;

    const retailer = await Retailer.findOne({
      where: {
        id: Number(retailerId),
      },
      relations: ["customer", "customer.currency"],
    });

    const stock = await Stock.findOne({
      where: {
        id: Number(stockId),
      },
      relations: ["currencyPricing", "currencyPricing.currency"],
    });

    if (!stock || !retailer) {
      res.json({
        success: false,
        message: "Fail to orders",
      });
      return;
    }
    const stock_orders = new RetailerStockOrders();
    stock_orders.admin_us_size = convertToUSSize(
   stock.size,
   stock.size_country
);


    stock_orders.retailer = retailer;
    stock_orders.quantity = Number(quantity);
    stock_orders.stock = stock;
    stock_orders.mesh_color = stock.mesh_color;
    stock_orders.beading_color = stock.beading_color;
    stock_orders.lining = stock.lining;
    stock_orders.lining_color = stock.lining_color;

    // Store retailer's currency for order processing
    let retailerCurrency: any;
    if (retailer.customer && retailer.customer.currency) {
      retailerCurrency = retailer.customer.currency;
    }

    if (retailerCurrency) {
      stock_orders.currency = retailerCurrency;
      stock_orders.currencyId = retailerCurrency.id;
    }

    await stock_orders.save();
    res.json({
      success: true,
      message: "Add to orders",
    });
  })
);

router.get(
  "/customer/:id/:retailerOrderID",
  asyncHandler(async (req: Request, res: Response) => {
    const { id, retailerOrderID } = req.params;

    const retailer = await Retailer.findOneOrFail({
      where: {
        id: Number(id),
      },
    });

    const retailerOrder = await RetailerFavouritesOrders.findOneOrFail({
      where: {
        id: Number(retailerOrderID),
      },
    });

    const approvedData = await RetailerOrder.findOne({
      where: {
        favourite_order: {
          id: Number(retailerOrderID) || 0,
        },
      },
    });

    let splitValue = retailerOrder.favourite_ids.split(",");

    const fav: any = [];

    for (let index = 0; index < splitValue.length; index++) {
      const favourites = await Favourites.findOne({
        where: {
          retailer: {
            id: retailer.id,
          },
          id: Number(splitValue[index]),
          is_order_placed: 1,
        },
        relations: [
          "product",
          "product.images",
          "product.currencyPricing",
          "product.currencyPricing.currency",
          "currency",
        ],
      });

      if (favourites) {
        // Calculate currency-specific price
        let displayPrice = favourites.product.price; // Default Euro price

        if (favourites.currency) {
          // Find product price in favourite's stored currency
          const currencyPricing = favourites.product.currencyPricing.find(
            (pricing) => pricing.currency.id === favourites.currency.id
          );

          if (currencyPricing) {
            displayPrice = currencyPricing.price;
          }
        }

        // Apply size-based tiered markup
        const size = Number(favourites.product_size);
        if (size >= 48) {
          const tier = Math.floor((size - 48) / 4);
          const markup = 1 + (tier + 1) * 0.2;
          displayPrice = displayPrice * markup;
        }

        // Add currency information for frontend display
        const enhancedFavourite = {
          ...favourites,
            admin_us_size: favourites.admin_us_size, // 🔥 Add this line

          displayPrice: Math.round(displayPrice * favourites.quantity),
          unitPrice: displayPrice,
          currencyName: favourites.currency?.name || null,
          currencySymbol: favourites.currency?.symbol || null,
          regionPrice: displayPrice * favourites.quantity,
        };

        fav.push(enhancedFavourite);
      }
    }

    res.json({
      success: true,
      favourites: fav,
      // rr: favourites,
    });
  })
);

router.get(
  "/customer-stock/:id/:stockId",
  asyncHandler(async (req: Request, res: Response) => {
    const { id, stockId } = req.params;

    // Raw SQL Query with positional parameters
    const query = `
      SELECT 
          rf.id,
          rf.createdAt,
          rf.quantity as buy_quantity,
          s.*,
          CASE 
            WHEN s.size >= 60 THEN COALESCE(scp.discountedPrice, s.discountedPrice) * 1.60
            WHEN s.size >= 56 THEN COALESCE(scp.discountedPrice, s.discountedPrice) * 1.40
            WHEN s.size >= 52 THEN COALESCE(scp.discountedPrice, s.discountedPrice) * 1.40
            WHEN s.size >= 48 THEN COALESCE(scp.discountedPrice, s.discountedPrice) * 1.20
            ELSE COALESCE(scp.discountedPrice, s.discountedPrice)
          END AS unitPrice,
          p.id AS product_id,
          p.createdAt AS product_createdAt,
          p.quantity AS product_quantity,
          p.productCode,
          p.description,
          p.minSaleQuantity,
          p.hasReturnPolicy,
          p.hasDiscount,
          p.stockAlert,
          pm.id AS image_id,
          pm.createdAt AS image_createdAt,
          pm.name AS image_name,
          pm.isMain AS image_isMain,
          c.id AS color_id,
          c.createdAt AS color_createdAt,
          c.name AS color_name,
          c.hexcode AS color_hexcode,
          COALESCE(curr.symbol, '€') as currencySymbol,
          COALESCE(curr.name, 'Euro') as currencyName,
          COALESCE(curr.id, 1) as currencyId
      FROM retailer_stock_orders AS rf
      INNER JOIN stock AS s ON s.id = rf.stockId
      INNER JOIN products AS p ON p.id = s.styleNo
      INNER JOIN productimages AS pm ON pm.productId = p.id
      LEFT JOIN product_colours AS c ON c.id = s.colors
      LEFT JOIN currencies curr ON curr.id = rf.currencyId
      LEFT JOIN stock_currency_pricing scp ON scp.stockId = s.id AND scp.currencyId = rf.currencyId
      WHERE rf.id = ? AND rf.retailerId = ?
      group by rf.id
    `;

    // Execute the raw SQL query using positional parameters
    const result = await db.query(query, [stockId, id]);

    if (result.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Stock not found" });
    }
    // Transform the first row into the desired format
    // const firstRow = result[0];

    res.json({
      success: true,
      favourites: result,
    });
  })
);
router.get(
  "/admin/stock-orders",
  asyncHandler(async (req: Request, res: Response) => {
    const { retailerId, page, query } = req.query as {
      retailerId?: string;
      page?: string;
      query?: string;
    };

    const skip = (page ? Number(page) - 1 : 0) * 10;
    const take = 10;
    const params: any[] = [];
    const whereClauses: string[] = [];

    // Base SQL query
    let dataSql = `
      SELECT 
      DATE_FORMAT(rf.createdAt, '%Y-%m-%d') AS formatted_date,
        rf.id as id,
        s.id as stock_id,
        c.name,
        p.productCode,
        p.id as product_id,
        rf.quantity,
        s.size as size,
        s.size_country,
        CASE 
          WHEN s.size >= 60 THEN COALESCE(scp.discountedPrice, s.discountedPrice) * 1.60 * rf.quantity
          WHEN s.size >= 56 THEN COALESCE(scp.discountedPrice, s.discountedPrice) * 1.40 * rf.quantity
          WHEN s.size >= 52 THEN COALESCE(scp.discountedPrice, s.discountedPrice) * 1.40 * rf.quantity
          WHEN s.size >= 48 THEN COALESCE(scp.discountedPrice, s.discountedPrice) * 1.20 * rf.quantity
          ELSE COALESCE(scp.discountedPrice, s.discountedPrice) * rf.quantity
        END AS total_price,
        COALESCE(curr.symbol, '€') as currencySymbol,
        COALESCE(curr.name, 'Euro') as currencyName
      FROM retailer_stock_orders rf
      INNER JOIN stock s ON s.id = rf.stockId
      INNER JOIN products p ON p.id = s.styleNo
      INNER JOIN retailers r ON r.id = rf.retailerId
      INNER JOIN customers as c on c.id = r.customerId
      LEFT JOIN currencies curr ON curr.id = rf.currencyId
      LEFT JOIN stock_currency_pricing scp ON scp.stockId = s.id AND scp.currencyId = rf.currencyId
    `;

    // Handle retailerId condition
    if (retailerId !== "all") {
      whereClauses.push("rf.retailerId = ?");
      params.push(Number(retailerId));
    }

    // Add is_approved condition
    whereClauses.push("rf.is_approved = 0");

    // Handle search query
    if (query) {
      const likeQuery = `%${query.toLowerCase()}%`;
      whereClauses.push(
        "(LOWER(p.productCode) LIKE ? OR LOWER(r.name) LIKE ?)"
      );
      params.push(likeQuery, likeQuery);
    }

    // Add WHERE clauses
    dataSql += " WHERE " + whereClauses.join(" AND ");

    // Add ordering and pagination
    dataSql += `
      ORDER BY rf.createdAt DESC
      LIMIT ? OFFSET ?
    `;
    params.push(take, skip);

    // Total count query
    const countSql = `
      SELECT COUNT(*) AS total
      FROM retailer_stock_orders rf
      INNER JOIN stock s ON s.id = rf.stockId
      INNER JOIN products p ON p.id = s.styleNo
      INNER JOIN customers r ON r.id = rf.retailerId
      WHERE ${whereClauses.join(" AND ")}
    `;

    const stockOrders = await db.query(dataSql, params);
    const totalResult = await db.query(countSql, params.slice(0, -2)); // Remove limit/offset params

    return res.json({
      success: true,
      stockOrders: stockOrders,
      totalCount: totalResult?.[0]?.total,
    });
  })
);

router.get(
  "/admin/favorites-orders",
  asyncHandler(async (req: Request, res: Response) => {
    const { retailerId, page, query } = req.query as {
      retailerId?: string;
      page?: string;
      query?: string;
    };

    const skip = (page ? Number(page) - 1 : 0) * 100;
    const take = 100;
    const params: any[] = [];
    const whereClauses: string[] = [];

    // -----------------------------
    // BASE SQL (Correct Joins)
    // -----------------------------
    let dataSql = `
      SELECT 
        rf.id AS id,
        DATE_FORMAT(rf.createdAt, '%Y-%m-%d') AS formatted_date,
        c.name AS customer_name,
        SUM(f.quantity) AS total_quantity,
        
        -- first favourite id
        MIN(f.id) AS fav_id,

        -- Total amount with markup
        SUM(
          CASE 
            WHEN f.product_size >= 60 THEN COALESCE(pcp.price, p.price) * 1.60 * f.quantity
            WHEN f.product_size >= 56 THEN COALESCE(pcp.price, p.price) * 1.40 * f.quantity
            WHEN f.product_size >= 52 THEN COALESCE(pcp.price, p.price) * 1.40 * f.quantity
            WHEN f.product_size >= 48 THEN COALESCE(pcp.price, p.price) * 1.20 * f.quantity
            ELSE COALESCE(pcp.price, p.price) * f.quantity
          END
        ) AS total_amount,

        GROUP_CONCAT(f.admin_us_size) AS admin_us_size,
        GROUP_CONCAT(f.product_size) AS product_size,
        GROUP_CONCAT(f.size_country) AS size_country,

        rf.retailerId AS retailerId,

        MAX(curr.symbol) AS currencySymbol,
        MAX(curr.name) AS currencyName

      FROM retailer_favourites_orders rf
      INNER JOIN retailers r ON r.id = rf.retailerId
      INNER JOIN customers c ON c.id = r.customerId
      INNER JOIN favourites f ON FIND_IN_SET(f.id, rf.favourite_ids) > 0
      LEFT JOIN currencies curr ON curr.id = f.currencyId
      LEFT JOIN product_currency_pricing pcp 
            ON pcp.productId = f.productId 
           AND pcp.currencyId = f.currencyId
      INNER JOIN products p ON p.id = f.productId
    `;

    // -----------------------------
    // FILTERS
    // -----------------------------

    // Retailer filter
    if (retailerId) {
      whereClauses.push("rf.retailerId = ?");
      params.push(Number(retailerId));
    }

    // Show only pending orders
    whereClauses.push("rf.is_approved = 0");

    // Search
    if (query) {
      const likeQuery = `%${query.toLowerCase()}%`;
      whereClauses.push(
        "(LOWER(c.name) LIKE ? OR LOWER(p.productCode) LIKE ?)"
      );
      params.push(likeQuery, likeQuery);
    }

    if (whereClauses.length > 0) {
      dataSql += " WHERE " + whereClauses.join(" AND ");
    }

    // -----------------------------
    // GROUP + PAGINATION
    // -----------------------------
    dataSql += `
      GROUP BY rf.id
      ORDER BY rf.createdAt DESC
      LIMIT ? OFFSET ?
    `;

    params.push(take, skip);

    // -----------------------------
    // COUNT QUERY FIXED
    // -----------------------------
    const countSql = `
      SELECT COUNT(*) AS total
      FROM retailer_favourites_orders rf
      WHERE rf.is_approved = 0
      ${retailerId ? "AND rf.retailerId = ?" : ""}
    `;

    const countParams = retailerId ? [Number(retailerId)] : [];

    // -----------------------------
    // EXECUTION
    // -----------------------------
    const favoritesOrders = await db.query(dataSql, params);
    const totalResult = await db.query(countSql, countParams);

    return res.json({
      success: true,
      favoritesOrders,
      totalCount: totalResult?.[0]?.total || 0,
    });
  })
);


router.get(
  "/admin/stock-order/form/:id/:status",
  asyncHandler(async (req: Request, res: Response) => {
    const { id, status } = req.params;

    console.log(id, status);

   let query = `
  SELECT 
  DATE_FORMAT(rf.createdAt, '%Y-%m-%d') AS received,
  rf.id as id,
  s.id as stock_id,
  r.name,
  r.email as email,
  p.productCode,
  rf.quantity,
  s.size as size,
  rf.retailerId as retailer_id,
  COALESCE(scp.discountedPrice, s.discountedPrice) * rf.quantity as total_price,
  r.storeAddress,
  r.email,
  s.size_country,
  pm.name as image,
  rf.mesh_color,
  rf.beading_color,
  rf.lining,
  rf.lining_color,
  COALESCE(curr.symbol, '€') as currencySymbol,
  COALESCE(curr.name, 'Euro') as currencyName,
  s.styleNo as product_id,

  -- ⭐ Correct barcode source
  sos.barcode AS barcode

FROM retailer_stock_orders rf

-- 🔥 Correct join: retailer_orders
LEFT JOIN retailer_orders ro 
  ON ro.stockOrderId = rf.id

-- 🔥 Correct join: stock_order_styles
LEFT JOIN stock_order_styles sos 
  ON sos.retailerOrderId = ro.id

INNER JOIN stock s ON s.id = rf.stockId
INNER JOIN products p ON p.id = s.styleNo
INNER JOIN retailers ret ON ret.id = rf.retailerId
INNER JOIN customers r ON r.id = ret.customerId
INNER JOIN productimages pm ON pm.productId = s.styleNo
LEFT JOIN currencies curr ON curr.id = rf.currencyId
LEFT JOIN stock_currency_pricing scp 
  ON scp.stockId = s.id AND scp.currencyId = rf.currencyId

WHERE rf.id = ? 
  AND rf.is_approved = ?

GROUP BY rf.id, sos.barcode;
`;


    const dd = await db.query(query, [id, status]);

    res.json({
      success: true,
      details: dd,
    });
  })
);

router.get(
  "/admin/favorites-order/details/:id/:status",
  asyncHandler(async (req: Request, res: Response) => {
    const { id, status } = req.params;

    const sql = `
    SELECT 
        f.admin_us_size,
        f.id AS fav_id,
        f.quantity AS quantity,
        rf.id AS favouriteOrderId,

        -- 🔥 ACTUAL RETAILER ORDER ID
        ro.id AS retailerOrderId,

        p.id AS product_id,
        MIN(pm.name) AS image,
        f.retailerId AS retailerId,

        -- 🔥 BARCODE (FINAL)
        ros.barcode AS barcode,

f.admin_us_size AS size,
f.product_size AS original_size,
        c.name AS customer_name,
        c.email AS manufacturingEmailAddress,
        c.phoneNumber AS phoneNumber,
        p.productCode AS styleNo,
        DATE_FORMAT(rf.createdAt, '%Y-%m-%d') AS orderReceivedDate,
        c.storeAddress AS address,

        f.color AS color,
        f.mesh_color AS mesh_color,
        f.beading_color AS beading_color,
        f.add_lining AS add_lining,
        f.lining AS lining,
        f.lining_color AS lining_color,
        f.reference_image,
        f.customization AS comments,
        f.size_country,

        CASE 
            WHEN f.product_size >= 60 THEN COALESCE(pcp.price, p.price) * 1.60 * f.quantity
            WHEN f.product_size >= 56 THEN COALESCE(pcp.price, p.price) * 1.40 * f.quantity
            WHEN f.product_size >= 52 THEN COALESCE(pcp.price, p.price) * 1.40 * f.quantity
            WHEN f.product_size >= 48 THEN COALESCE(pcp.price, p.price) * 1.20 * f.quantity
            ELSE COALESCE(pcp.price, p.price) * f.quantity 
        END AS total_amount,

        CASE 
            WHEN f.product_size >= 60 THEN COALESCE(pcp.price, p.price) * 1.60
            WHEN f.product_size >= 56 THEN COALESCE(pcp.price, p.price) * 1.40
            WHEN f.product_size >= 52 THEN COALESCE(pcp.price, p.price) * 1.40
            WHEN f.product_size >= 48 THEN COALESCE(pcp.price, p.price) * 1.20
            ELSE COALESCE(pcp.price, p.price)
        END AS price,

        curr.symbol AS currencySymbol,
        curr.name AS currencyName

    FROM retailer_favourites_orders rf

    INNER JOIN favourites f 
        ON FIND_IN_SET(f.id, rf.favourite_ids) > 0

    INNER JOIN products p 
        ON p.id = f.productId

    INNER JOIN productimages pm 
        ON pm.productId = p.id

    INNER JOIN retailers r 
        ON r.id = f.retailerId

    INNER JOIN customers c 
        ON c.id = r.customerId

    -- 🔥 APPROVED RETAILER ORDER
    LEFT JOIN retailer_orders ro
        ON ro.favouriteOrderId = rf.id

    -- 🔥 BARCODE TABLE
    LEFT JOIN retailer_order_styles ros
        ON ros.retailerOrderId = ro.id
       AND ros.styleNo = p.productCode

    LEFT JOIN currencies curr 
        ON curr.id = f.currencyId

    LEFT JOIN product_currency_pricing pcp 
        ON pcp.productId = p.id 
       AND pcp.currencyId = f.currencyId

    WHERE rf.id = ?
      AND rf.is_approved = ?

    GROUP BY 
        f.id,
        rf.id,
        ro.id,
        p.id,
        f.product_size,
        c.name,
        c.email,
        ros.barcode;
    `;

    const data = await db.query(sql, [id, status]);

    res.json({
      success: true,
      data,
    });
  })
);


router.post(
  "/admin/accepted/stock-order",
  asyncHandler(async (req: Request, res: Response) => {
    const { data } = req.body;

    // ------------------------
    // 🔥 1. Find stock
    // ------------------------
    const stock = await Stock.findOne({
      where: { id: data.stock_id },
    });

    if (!stock) {
      return res.json({ success: false, msg: "Stock not found" });
    }

    if (stock.quantity < data.quantity) {
      return res.json({
        success: false,
        message: "No Stock Available",
      });
    }

    // ------------------------
    // 🔥 2. Find Retailer
    // ------------------------
    const retailer = await Retailer.findOne({
      where: { id: data.retailerId },
      relations: ["customer"],
    });

    if (!retailer) {
      return res.json({ success: false, msg: "Retailer not found" });
    }

    // ------------------------
    // 🔥 3. Find RetailerStockOrders (child)
    // ------------------------
    const stock_retailer = await RetailerStockOrders.findOne({
      where: { id: data.id },
    });

    if (!stock_retailer) {
      return res.json({ success: false, msg: "Stock order not found" });
    }

    // ------------------------
    // 🔥 4. CREATE MAIN ORDER (parent)
    // ------------------------
    const order = new RetailerOrder();

    order.address = data.address;
    order.phoneNumber = data.phoneNumber || retailer.customer.phoneNumber;

// 🔥 AUTO GENERATE UNIQUE PO
const customerPrefix = retailer.customer.name
  .split(" ")[0]
  .replace(/[^A-Za-z]/g, "")
  .toUpperCase();

const prefix = `PO#${customerPrefix}`;
const uniquePO = await generateUniquePO(prefix);

order.purchaeOrderNo = uniquePO;
    order.hasId = data.color;
    order.purchaseAmount = data.total_amount;
    order.is_stock_order = true;

    order.manufacturingEmailAddress =
      data.email || retailer.customer.email;

    order.orderCancellationDate = new Date(data.orderCancellationDate);
    order.orderReceivedDate = new Date(data.received_date);

    order.Stock_order = stock_retailer;
    order.retailer = retailer;

    order.Size = data.size;
    order.StyleNo = data.styleNo;
    order.size_country = data.size_country;
    order.quantity = data.quantity;

    order.invoiceNo = data.invoice;
    order.estimateNo = data.estimate;
    order.shippingAmount = data.shipping;

    stock_retailer.is_approved = 1;

    // Reduce stock quantity
    stock.quantity = stock.quantity - data.quantity;

    await order.save();

    // ------------------------
    // 🔥 5. INSERT STOCK STYLE + GENERATE BARCODE
    // ------------------------
    const stockStyle = new StockOrderStyles();
    stockStyle.retailerOrder = order;

    stockStyle.styleNo = data.styleNo;
    stockStyle.size = data.size;
    stockStyle.size_country = data.size_country;

    stockStyle.quantity = 1; // always one barcode per piece
    await stockStyle.save(); // generate ID

    stockStyle.barcode = `${order.purchaeOrderNo}-${stockStyle.id}`;
    await stockStyle.save();

    // ------------------------
    // 🔥 6. Payment Entry
    // ------------------------
    const payment = new RetailerOrdersPayment();
    payment.amount = Number(data.advance) || 0;
    payment.order = order;

    await stock_retailer.save();
    await stock.save();
    await payment.save();

    return res.json({
      success: true,
      msg: "Stock Order Accepted Successfully",
      po_number: order.purchaeOrderNo,
      barcode: stockStyle.barcode,
    });
  })
);


router.post(
  "/admin/accepted/favorites-order",
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { orderData } = req.body;

      if (!orderData) {
        return res.json({ success: false, msg: "Invalid order data" });
      }

      // -------------------------------
      // 🔹 Get Retailer + Generate Unique PO
      // -------------------------------
      const retailer = await Retailer.findOne({
        where: { id: orderData.retailerId },
        relations: ["customer"],
      });

      if (!retailer) {
        return res.json({ success: false, msg: "Retailer not found" });
      }

      const customerPrefix = retailer.customer.name
        .split(" ")[0]
        .replace(/[^A-Za-z]/g, "")
        .toUpperCase();

      const prefix = `PO#${customerPrefix}`;
      const uniquePO = await generateUniquePO(prefix);

      // -------------------------------
      // 🔹 Update favourites (price + customization)
      // -------------------------------
      for (let i = 0; i < orderData.styles.length; i++) {
        const favItem = orderData.styles[i];

        const fav = await Favourites.findOne({
          where: { id: favItem.fav_id },
        });

        if (fav) {
          fav.product_price = favItem.amount;
          fav.customization_price = favItem.customization_p || 0;
          await fav.save();
        }
      }

      // -------------------------------
      // 🔹 Approve favourite order
      // -------------------------------
      const favOrders = await RetailerFavouritesOrders.findOne({
where: { id: orderData.rfo_id }
      });

      if (!favOrders) {
        return res.json({ success: false, msg: "Favorite order not found" });
      }

      favOrders.is_approved = 1;
      await favOrders.save();

      // -------------------------------
      // 🔹 Create Main Order
      // -------------------------------
      const order = new RetailerOrder();

      order.purchaeOrderNo = uniquePO;
      order.retailer = retailer;
      order.favourite_order = favOrders;

      order.address = orderData.address;
      order.manufacturingEmailAddress = orderData.manufacturingEmailAddress;
      order.phoneNumber = orderData.phoneNumber || retailer.customer.phoneNumber;

      order.orderReceivedDate = new Date(orderData.orderReceivedDate);
      order.orderCancellationDate = new Date(orderData.orderCancellationDate);

      order.purchaseAmount = orderData.total_amount;
      order.shippingAmount = orderData.shipping;
      order.Size = orderData.size;
      order.StyleNo = orderData.styleNo;
      order.size_country = orderData.size_country;
      order.quantity = orderData.quantity;

      order.is_stock_order = false;
      order.invoiceNo = orderData.invoice;
      order.estimateNo = orderData.estimate;

      // -------------------------------
      // ⭐⭐ MOST IMPORTANT FIX ⭐⭐
      // -------------------------------
order.isApproved = true;
      order.status_id = 0;             // 👈 approved state
      order.status = 0;                // 👈 active (not deleted)
order.orderStatus = OrderStatus.Pattern;

      await order.save();

      // -------------------------------
      // 🔹 Insert styles + barcode generation
      // -------------------------------
      if (orderData.styles && orderData.styles.length > 0) {
        for (let i = 0; i < orderData.styles.length; i++) {
          const style = orderData.styles[i];

          const ros = new RetailerOrderStyles();
          ros.retailerOrder = order;
          ros.styleNo = style.styleNo;
          ros.quantity = style.quantity;
          ros.size = style.size;
          ros.size_country = style.size_country;
          ros.photoUrls = JSON.stringify([]);

          await ros.save(); // generate ID  
          ros.barcode = `${order.purchaeOrderNo}-${ros.id}`;
          await ros.save();
        }
      }

      // -------------------------------
      // 🔹 Save Payment
      // -------------------------------
      const payment = new RetailerOrdersPayment();
      payment.amount = Number(orderData.advance) || 0;
      payment.order = order;
      await payment.save();

      return res.json({
        success: true,
        msg: "Order Accepted",
        purchaseOrderNo: uniquePO,
        orderId: order.id,
      });

    } catch (err) {
      console.error("FRESH ORDER ACCEPT ERROR:", err);
      return res.json({
        success: false,
        msg: "Something went wrong while accepting order",
      });
    }
  })
);



router.patch(
  "/admin/stock-order/reject",
  asyncHandler(async (req: Request, res: Response) => {
    const { comment, id } = req.body;
    const retailerStock = await RetailerStockOrders.findOne({
      where: {
        id: Number(id),
      },
    });

    if (retailerStock) {
      retailerStock.rejected_comments = comment;
      retailerStock.is_approved = 3;
      await retailerStock.save();
    }

    res.json({
      success: true,
      msg: "Rejected Successfully",
    });
  })
);

router.patch(
  "/admin/fresh-order/reject",
  asyncHandler(async (req: Request, res: Response) => {
    const { comment, id } = req.body;
    const retailerStock = await RetailerFavouritesOrders.findOne({
      where: {
        id: Number(id),
      },
    });

    if (retailerStock) {
      retailerStock.rejected_comments = comment;
      retailerStock.is_approved = 3;
      await retailerStock.save();
    }

    res.json({
      success: true,
      msg: "Rejected Successfully",
    });
  })
);

router.get(
  "/orders/accepted/customer/:isApprovedStatus",
  asyncHandler(async (req: Request, res: Response) => {
    const { isApprovedStatus } = req.params;
    const { retailerId, page, query } = req.query as {
      retailerId?: string;
      page?: string;
      query?: string;
    };

    // Validate isApprovedStatus
    const isApproved = Number(isApprovedStatus);
    if (isNaN(isApproved) || ![0, 1].includes(isApproved)) {
      return res.status(400).json({
        success: false,
        message: "Invalid isApproved value. Must be 0 or 1",
      });
    }

    // Pagination setup
    const skip = (page ? Number(page) - 1 : 0) * 10;
    const take = 10;
    const params: any[] = [];
    const whereClauses: string[] = [];

    // Main query with LEFT JOIN optimization
    let dataSql = `
      SELECT 
      DATE_FORMAT(ro.createdAt, '%Y-%m-%d') AS formatted_date,
        ro.purchaeOrderNo as order_id,
        ro.id,
        ro.trackingNo,
        CASE 
          WHEN ro.is_stock_order = 1 THEN 'Stock' 
          ELSE 'Fresh' 
        END AS type,
       COALESCE(ro.stockOrderId , ro.favouriteOrderId) as childId,
         payments.orderId as payment_id,
        ro.purchaseAmount AS total,
        DATE_FORMAT(ro.orderReceivedDate,'%Y-%m-%d')  AS orderReceivedDate,
        DATE_FORMAT(ro.orderCancellationDate,'%Y-%m-%d')  AS orderCancellationDate,
        ro.manufacturingEmailAddress as email,
        ro.orderStatus,
          ro.favouriteOrderId,
        ro.stockOrderId,
        IFNULL(payments.paid_amount, 0) AS paid_amount,
        (ro.purchaseAmount - IFNULL(payments.paid_amount, 0)) AS balance,
        curr.symbol as currencySymbol,
        curr.name as currencyName
      FROM retailer_orders AS ro
      LEFT JOIN (
        SELECT orderId, SUM(amount) AS paid_amount 
        FROM retailer_order_payments 
        GROUP BY orderId
      ) AS payments ON payments.orderId = ro.id
      LEFT JOIN retailers r ON r.id = ro.retailerId
      LEFT JOIN customers c ON c.id = r.customerId
      LEFT JOIN currencies curr ON curr.id = c.currencyId
    `;

    // Build WHERE clauses
    if (retailerId) {
      whereClauses.push("ro.retailerId = ?");
      params.push(Number(retailerId));
    }

    whereClauses.push("ro.status_id = ?");
    whereClauses.push("ro.status = 0 ");

    params.push(isApproved);

    if (query) {
      const likeQuery = `%${query.toLowerCase()}%`;
      whereClauses.push("LOWER(ro.purchaeOrderNo) LIKE ?");
      params.push(likeQuery);
    }

    // Add WHERE conditions
    if (whereClauses.length > 0) {
      dataSql += " WHERE " + whereClauses.join(" AND ");
    }

    // Add pagination
    dataSql += " ORDER BY ro.createdAt DESC LIMIT ? OFFSET ?";
    params.push(take, skip);

    // Count query (EXCLUDE limit/offset params)
    const countSql = `
      SELECT COUNT(*) AS total
      FROM retailer_orders AS ro
     ${
       whereClauses.length > 0
         ? "WHERE " + "ro.status = 0 AND" + " " + whereClauses.join(" AND ")
         : " WHERE ro.status = 0 "
     }
    `;

    // Execute queries
    const [retailerOrders, totalResult] = await Promise.all([
      db.query(dataSql, params),
      db.query(countSql, params.slice(0, -2)), // Correct parameter slicing
    ]);

    return res.json({
      success: true,
      retailerOrders,
      totalCount: totalResult?.[0]?.total || 0,
    });
  })
);


router.get(
  "/customer/accepted/fresh/:id/:retailerOrderID/:paymentId",
  asyncHandler(async (req: Request, res: Response) => {
    const { id, retailerOrderID, paymentId } = req.params;

    // FIND RETAILER ORDER
    const retailerOrder = await RetailerOrder.findOne({
      where: { id: Number(paymentId) },
    });
    if (!retailerOrder) {
      return res.json({ success: false });
    }

    // PAYMENT HISTORY
    const paymentHis = await RetailerOrdersPayment.find({
      where: { order: { id: retailerOrder.id }, amount: MoreThan(0) },
      order: { id: "DESC" },
    });

    const paidAmount = paymentHis.reduce(
      (sum, payment) => sum + (payment.amount || 0),
      0
    );

    // FETCH APPROVED FAVOURITE ORDER
    const retailerFreshOrder = await RetailerFavouritesOrders.findOneOrFail({
      where: { id: Number(retailerOrderID) },
    });

    let splitValue = retailerFreshOrder.favourite_ids.split(",");
    const fav: any = [];

    // FETCH FAVOURITE ITEMS
    for (let index = 0; index < splitValue.length; index++) {
      const favourites = await Favourites.findOne({
        where: {
          retailer: { id: Number(id) },
          id: Number(splitValue[index]),
        },
        relations: [
          "product",
          "product.images",
          "product.currencyPricing",
          "product.currencyPricing.currency",
          "currency",
        ],
      });

      if (favourites) {
        fav.push({
          ...favourites,
          admin_us_size: favourites.admin_us_size, // USA SIZE INCLUDED
        });
      }
    }

    // CURRENCY INFO
    let currencyInfo = null;
    if (fav.length > 0 && fav[0]?.currency) {
      currencyInfo = {
        symbol: fav[0].currency.symbol,
        name: fav[0].currency.name,
        id: fav[0].currency.id,
      };
    }

    // 🔥 FETCH ALL STYLES WITH BARCODE
    const styles = await RetailerOrderStyles.find({
      where: { retailerOrder: { id: retailerOrder.id } },
    });

    console.log("STYLES WITH BARCODE →", styles);

    // FINAL RESPONSE
    res.json({
      success: true,
      favourites: fav,
      styles: styles, // 🔥 BARCODE NOW INCLUDED IN PREVIEW
      payment: paymentHis,
      bill_amount: retailerOrder.purchaseAmount,
      paidAmount: paidAmount,
      retailerOrder: retailerOrder,
      currency: currencyInfo,
    });
  })
);



// accepted stock details
router.get(
  "/customer-stock/accepted/:id/:stockId/:paymentId",
  asyncHandler(async (req: Request, res: Response) => {
    const { id, stockId, paymentId } = req.params;

    // Raw SQL Query with positional parameters
    const query = `
      SELECT 
          rf.id,
          rf.createdAt,
          rf.quantity,
          rf.quantity * COALESCE(scp.price, s.price) as product_price,
          s.size as size,
          COALESCE(scp.discountedPrice, s.discountedPrice) as price,
          p.id AS product_id,
          p.createdAt AS product_createdAt,
          p.quantity AS product_quantity,
          p.productCode,
          p.description,
          p.minSaleQuantity,
          p.hasReturnPolicy,
          p.hasDiscount,
          p.stockAlert,
          pm.id AS image_id,
          pm.createdAt AS image_createdAt,
          pm.name AS image_name,
          pm.isMain AS image_isMain,
          c.id AS color_id,
          c.createdAt AS color_createdAt,
          c.name AS color_name,
          c.hexcode AS color_hexcode,
          COALESCE(curr.symbol, '€') as currencySymbol,
          COALESCE(curr.name, 'Euro') as currencyName,
          COALESCE(curr.id, 1) as currencyId
      FROM retailer_stock_orders AS rf
      INNER JOIN stock AS s ON s.id = rf.stockId
      INNER JOIN products AS p ON p.id = s.styleNo
      INNER JOIN productimages AS pm ON pm.productId = p.id
      LEFT JOIN product_colours AS c ON c.id = s.colors
      LEFT JOIN currencies curr ON curr.id = rf.currencyId
      LEFT JOIN stock_currency_pricing scp ON scp.stockId = s.id AND scp.currencyId = rf.currencyId
      WHERE rf.id = ? AND rf.retailerId = ?
    `;

    // Execute the raw SQL query using positional parameters
    const result = await db.query(query, [stockId, id]);

    const retailerOrder = await RetailerOrder.findOne({
      where: {
        id: Number(paymentId),
      },
    });
    if (!retailerOrder) {
      return res.json({
        success: false,
      });
    }
    const paymentHis = await RetailerOrdersPayment.find({
      where: {
        order: {
          id: retailerOrder.id,
        },
        amount: MoreThan(0),
      },
      order: { id: "DESC" },
    });

    const paidAmount = paymentHis.reduce(
      (sum, payment) => sum + (payment.amount || 0),
      0
    );

    if (result.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Stock not found" });
    }

    // Transform the first row into the desired format
    const firstRow = result[0];

    const transformedData = {
      id: firstRow.id,
      createdAt: firstRow.createdAt,
      product_size: firstRow.size,
      quantity: firstRow.quantity,
      customization: firstRow.customization,
      is_order_placed: firstRow.is_order_placed,
      product_price: firstRow.price,
      product: {
        id: firstRow.product_id,
        createdAt: firstRow.product_createdAt,
        quantity: firstRow.product_quantity,
        productCode: firstRow.productCode,
        price: firstRow.price,
        description: firstRow.description,
        minSaleQuantity: firstRow.minSaleQuantity,
        hasReturnPolicy: firstRow.hasReturnPolicy,
        hasDiscount: firstRow.hasDiscount,
        stockAlert: firstRow.stockAlert,
        images: result.map((row: any) => ({
          id: row.image_id,
          createdAt: row.image_createdAt,
          name: row.image_name,
          isMain: row.image_isMain,
        })),
      },
      color: firstRow.color_id
        ? {
            id: firstRow.color_id,
            createdAt: firstRow.color_createdAt,
            name: firstRow.color_name,
            hexcode: firstRow.color_hexcode,
          }
        : null,
    };

    res.json({
      success: true,
      favourites: [transformedData],
      payment: paymentHis,
      bill_amount: retailerOrder.purchaseAmount,
      paidAmount: paidAmount,
      retailerOrder: retailerOrder,
      currency: {
        symbol: firstRow.currencySymbol,
        name: firstRow.currencyName,
        id: firstRow.currencyId,
      },
    });
  })
);

//acceptedOrders.retailerOrders
router.get(
  "/admin/orders/accepted/:isApprovedStatus", // Admin route
  asyncHandler(async (req: Request, res: Response) => {
    const { isApprovedStatus } = req.params;
    const { page, query } = req.query as {
      page?: string;
      query?: string;
    };

    // Validate isApprovedStatus
    const isApproved = Number(isApprovedStatus);

    // Pagination setup
    const skip = (page ? Number(page) - 1 : 0) * 100;
    const take = 100;
    const params: any[] = [];
    const whereClauses: string[] = [];

    // Main query with LEFT JOIN optimization
    let dataSql = `
      SELECT 
        DATE_FORMAT(ro.createdAt, '%Y-%m-%d') AS formatted_date,
        ro.purchaeOrderNo as order_id,
        CASE 
          WHEN ro.is_stock_order = 1 THEN 'Stock' 
          ELSE 'Fresh' 
        END AS type,
        payments.orderId as payment_id,
        ro.purchaseAmount AS total,
        DATE_FORMAT(ro.orderReceivedDate,'%Y-%m-%d')  AS received_date,
        ro.manufacturingEmailAddress as email,
        ro.orderStatus,
        ro.favouriteOrderId,
        ro.stockOrderId,
        ro.id as id,
        ro.retailerId as retailer_id,
        ro.invoiceNo,
        ro.estimateNo,
        ro.orderCancellationDate as orderCancellationDate,
        IFNULL(payments.paid_amount, 0) AS paid_amount,
        (ro.purchaseAmount - IFNULL(payments.paid_amount, 0)) AS balance,
        c.name as retailer_name,  
        c.email as retailer_email,
        curr.symbol as currencySymbol,
        curr.name as currencyName
      FROM retailer_orders AS ro
      LEFT JOIN (
        SELECT orderId, SUM(amount) AS paid_amount 
        FROM retailer_order_payments 
        GROUP BY orderId
      ) AS payments ON payments.orderId = ro.id
      left join retailers r on r.id = ro.retailerId
      LEFT JOIN customers c ON c.id = r.customerId 
      LEFT JOIN currencies curr ON curr.id = c.currencyId
    `;

    // Add isApproved condition
    whereClauses.push("ro.status_id = ?");
    params.push(isApproved);

    // Handle search query
    if (query) {
      const likeQuery = `%${query.toLowerCase()}%`;
      whereClauses.push(
        "(LOWER(ro.purchaeOrderNo) LIKE ? OR LOWER(c.name) LIKE ? OR LOWER(ro.orderStatus) LIKE ?)"
      );
      params.push(likeQuery, likeQuery, likeQuery);

      if (query.toLowerCase() === "stock") {
        whereClauses.push("ro.is_stock_order = 1");
      } else if (query.toLowerCase() === "fresh") {
        whereClauses.push("ro.is_stock_order = 0");
      }
    }

    // Add WHERE conditions if any
    if (whereClauses.length > 0) {
      dataSql +=
        " WHERE " + "ro.status = 0 AND" + " " + whereClauses.join(" AND ");
    } else {
      dataSql += " WHERE ro.status = 0 ";
    }

    // Add pagination
    dataSql += " ORDER BY ro.createdAt DESC LIMIT ? OFFSET ?";
    params.push(take, skip);

    // Count query (EXCLUDE limit/offset params)
    const countSql = `
      SELECT COUNT(*) AS total
      FROM retailer_orders AS ro
      LEFT JOIN customers c ON c.id = ro.retailerId
      ${
        whereClauses.length > 0
          ? "WHERE " + "ro.status = 0 AND" + " " + whereClauses.join(" AND ")
          : " WHERE ro.status = 0 "
      }
    `;

    // Execute queries
    const [retailerOrders, totalResult] = await Promise.all([
      db.query(dataSql, params),
      db.query(countSql, params.slice(0, -2)), // Correct parameter slicing
    ]);

    return res.json({
      success: true,
      retailerOrders,
      totalCount: totalResult?.[0]?.total || 0,
    });
  })
);

// payment Update
router.post(
  "/admin/payment-update/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const { amount, payment_type } = req.body;

    const order = await RetailerOrder.findOne({
      where: {
        id: Number(id),
      },
    });

    if (!order) {
      return res.json({
        success: false,
        msg: "Error",
      });
    }

    const paymentHis = await RetailerOrdersPayment.find({
      where: {
        order: {
          id: Number(id),
        },
      },
    });

    const totalAmount =
      paymentHis.reduce((sum, payment) => sum + (payment.amount || 0), 0) +
      amount;

    if (totalAmount > order.purchaseAmount) {
      return res.json({
        success: false,
        msg: "Payment is Fully Paid",
      });
    }

    const payment = new RetailerOrdersPayment();

    payment.amount = amount;
    payment.paymentMethod = payment_type;

    if (order) {
      payment.order = order;
      await payment.save();
    }

    res.json({
      success: true,
      msg: "Payment Updated",
    });
  })
);

router.post(
  "/admin/status-update/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, track_id, shipping } = req.body;

    const order = await RetailerOrder.findOne({
      where: { id: Number(id) },
    });

    if (!order)
      return res.json({ success: false, msg: "Order Not Found" });

    // /* ------------------------------------------
    //    🔥 PAYMENT VALIDATION BEFORE STATUS UPDATE
    // ------------------------------------------ */
    // const payments = await RetailerOrdersPayment.find({
    //   where: { order: { id: order.id } },
    // });

    // const paidAmount = payments.reduce(
    //   (sum, p) => sum + Number(p.amount || 0),
    //   0
    // );

    // const remaining = Number(order.purchaseAmount) - paidAmount;

    // if (
    //   order.orderStatus === OrderStatus.Balance_Pending &&
    //   status !== OrderStatus.Balance_Pending &&
    //   remaining > 0
    // ) {
    //   return res.json({
    //     success: false,
    //     msg: "Cannot move forward! Payment still pending.",
    //     remaining,
    //   });
    // }

    // if (
    //   order.orderStatus === OrderStatus.Ready_To_Delivery &&
    //   status === OrderStatus.Shipped &&
    //   remaining > 0
    // ) {
    //   return res.json({
    //     success: false,
    //     msg: "Payment pending! Cannot mark as Shipped.",
    //     remaining,
    //   });
    // }

   

    /* ------------------------------------------
       ⭐ LOWEST STAGE VALIDATION (manual cannot jump)
    ------------------------------------------ */
  

    /* ------------------------------------------
       🔥 NOW UPDATE ORDER STATUS
    ------------------------------------------ */
    /* NOW UPDATE ORDER STATUS */
const now = new Date();

// Convert frontend value to DB ENUM format
let finalStatus = status;

// Replace underscores
finalStatus = finalStatus.replace(/_/g, " ");

// Split camelCase or PascalCase into words (IssueBeading → Issue Beading)
finalStatus = finalStatus.replace(/([a-z])([A-Z])/g, "$1 $2");

console.log("Converted finalStatus:", finalStatus);

order.orderStatus = finalStatus as OrderStatus;


    switch (status) {
      case OrderStatus.Pattern:
        order.pattern = now;
        break;
      case OrderStatus.Khaka:
        order.khaka = now;
        break;
      case OrderStatus.Issue_Beading:
        order.issue_beading = now;
        break;
      case OrderStatus.Beading:
        order.beading = now;
        break;
      case OrderStatus.Zarkan:
        order.zarkan = now;
        break;
      case OrderStatus.Stitching:
        order.stitching = now;
        break;
      case OrderStatus.Balance_Pending:
        order.balance_pending = now;
        break;
      case OrderStatus.Ready_To_Delivery:
        order.ready_to_delivery = now;
        break;
      case OrderStatus.Shipped:
        order.shipped = now;
        order.shippingStatus = ShippingStatus.Shipped;
        order.shippingDate = now;
        order.status_id = 1;
        break;
    }

    if (track_id) order.trackingNo = track_id;

    if (shipping > 0) {
      const base =
        Number(order.purchaseAmount) -
        Number(order.shippingAmount);
      order.shippingAmount = shipping;
      order.purchaseAmount = base + shipping;
    }

    /* ------------------------------------------
       🔥 INSERT STYLE PROGRESS (same as barcode)
    ------------------------------------------ */
    const styles = await RetailerOrderStyles.find({
      where: { retailerOrder: { id: order.id } },
    });

    for (const s of styles) {
      const progress = new StyleProgress();
      progress.barcode = s.barcode;
progress.stage = finalStatus as any;
      progress.qty = 1;
      await progress.save();
    }

    await order.save();

    return res.json({
      success: true,
      msg: "Status Updated Successfully",
    });
  })
);




router.patch(
  "/admin/editPayment/:id/:amount",
  asyncHandler(async (req: Request, res: Response) => {
    const { id, amount } = req.params;

    const payment = await RetailerOrdersPayment.findOne({
      where: {
        id: Number(id),
      },
    });

    if (!payment) {
      return res.json({
        success: false,
      });
    }

    payment.amount = Number(amount);

    await payment.save();
    return res.json({
      success: true,
    });
  })
);

router.delete(
  "/admin/deletePayment/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const payment = await RetailerOrdersPayment.findOne({
      where: {
        id: Number(id),
      },
    });

    if (!payment) {
      return res.json({
        success: false,
      });
    }

    payment.remove();

    await payment.save();
    return res.json({
      success: true,
    });
  })
);

router.get(
  "/orderStatusDates/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

const qa = `SELECT 
  pattern,
  khaka,
  issue_beading,
  beading,
  zarkan,
  stitching,
  ready_to_delivery,
  shipped
FROM retailer_orders WHERE id = ?`;

    const [result] = await db.query(qa, [id]);

    res.json({
      success: true,
      data: result,
    });
  })
);

router.get(
  "/orderStatusDates/stock/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const qa = `select pattern , beading , stitching , ready_to_delivery from orders as r where r.id = ? `;

    const [result] = await db.query(qa, [id]);

    res.json({
      success: true,
      data: result,
    });
  })
);
router.get(
  "/customization/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const retailerOrder = await RetailerOrder.createQueryBuilder(
      "retailerOrder"
    )
      .leftJoinAndSelect("retailerOrder.favourite_order", "favourite_order")
      .select(["retailerOrder.id", "favourite_order.favourite_ids"]) // Specify only needed fields
      .where("retailerOrder.id = :id", { id: Number(id) })
      .getOne();

    if (!retailerOrder) {
      res.json({
        success: false,
      });
      return;
    }

    let ids = retailerOrder.favourite_order.favourite_ids
      .split(",")
      .map((item) => Number(item));

    const favorites = await Favourites.createQueryBuilder("favourites")
      .leftJoinAndSelect("favourites.product", "product") // Join the product relation
      .select([
        "favourites.id",
        "favourites.product_size",
        "favourites.quantity",
        "favourites.customization",
        "favourites.size_country",
        "favourites.customization_price",
        "favourites.color",
        "favourites.mesh_color",
        "favourites.beading_color",
        "favourites.lining",
        "favourites.lining_color",
        "product.productCode",
      ]) // Select specific fields
      .where("favourites.id IN (:...ids)", { ids })
      .getMany();

    res.json({
      success: true,
      data: favorites,
    });
  })
);

router.patch(
  "/customization/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { data } = req.body;

    const { id } = req.params;

    const orders = await RetailerOrder.findOne({
      where: {
        id: Number(id),
      },
    });

    if (!orders) {
      return;
    }

    let oldPrice = 0;
    let newPrice = 0;

    for (let index = 0; index < data.length; index++) {
      const fav = await Favourites.findOne({
        where: {
          id: Number(data[index].id),
        },
      });
      if (!fav) {
        return;
      }
      const multiplyOld =
        Number(fav.customization_price) * Number(fav.quantity);
      oldPrice = oldPrice + Number(multiplyOld);

      fav.customization_price = data[index].customization_price;
      await fav.save();

      const multiplyNew =
        Number(data[index].customization_price) * Number(data[index].quantity);
      newPrice = newPrice + multiplyNew;
    }
    const minus = orders.purchaseAmount - oldPrice;
    orders.purchaseAmount = minus + newPrice;

    await orders.save();

    res.json({
      success: true,
      message: "Customization Edited successfully",
    });
  })
);

router.patch(
  "/admin/order/reject",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.body;
    const stock = await RetailerOrder.findOne({
      where: {
        id: Number(id),
      },
    });

    if (stock) {
      stock.status = 1;
      await stock.save();
    }

    res.json({
      success: true,
      msg: "Order Deleted",
    });
  })
);

router.patch(
  "/admin/order/store/reject",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.body;
    const stock = await Order.findOne({
      where: {
        id: Number(id),
      },
    });

    if (stock) {
      stock.status = 1;
      await stock.save();
    }

    res.json({
      success: true,
      msg: "Order Deleted",
    });
  })
);

router.patch(
  "/admin/bulkOrder/reject",
  asyncHandler(async (req: Request, res: Response) => {
    const { bulk } = req.body;

    let freshBulk: any = [];
    let storeBulk: any = [];

    bulk.forEach((i: any) => {
      if (i.orderType == "Fresh" || i.orderType == "Stock") {
        freshBulk = [...freshBulk, i];
      } else {
        storeBulk = [...storeBulk, i];
      }
    });

    if (freshBulk.length > 0) {
      for (let index = 0; index < freshBulk.length; index++) {
        const stocks = await RetailerOrder.findOne({
          where: {
            id: freshBulk[index].id,
          },
        });
        if (stocks) {
          stocks.status = 1;
          await stocks.save();
        }
      }
    }

    if (storeBulk.length > 0) {
      for (let index = 0; index < storeBulk.length; index++) {
        const stocks = await Order.findOne({
          where: {
            id: storeBulk[index].id,
          },
        });
        if (stocks) {
          stocks.status = 1;
          await stocks.save();
        }
      }
    }

    res.json({
      success: true,
      msg: "Order Deleted",
    });
  })
);

//soft delete in reject
router.patch(
  "/admin/bulkOrder/delete",
  asyncHandler(async (req: Request, res: Response) => {
    const { bulk } = req.body;

    let freshBulk: any = [];
    let storeBulk: any = [];

    bulk.forEach((i: any) => {
      if (i.orderType == "Fresh") {
        freshBulk = [...freshBulk, i];
      } else {
        storeBulk = [...storeBulk, i];
      }
    });

    if (freshBulk.length > 0) {
      for (let index = 0; index < freshBulk.length; index++) {
        const stocks = await RetailerFavouritesOrders.findOne({
          where: {
            id: freshBulk[index].id,
          },
        });
        if (stocks) {
          stocks.isDeleted = true;
          await stocks.save();
        }
      }
    }

    if (storeBulk.length > 0) {
      for (let index = 0; index < storeBulk.length; index++) {
        const stocks = await RetailerStockOrders.findOne({
          where: {
            id: storeBulk[index].id,
          },
        });
        if (stocks) {
          stocks.isDeleted = true;
          await stocks.save();
        }
      }
    }

    res.json({
      success: true,
      msg: "Rejected Order Deleted",
    });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    // Fetch both possible relations safely
    const order = await RetailerOrder.findOne({
      where: { id: Number(id), status: 0 },
      relations: {
        favourite_order: true,
        Stock_order: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    let styles = [];

    if (order.is_stock_order) {
      styles = await StockOrderStyles.find({
        where: { retailerOrder: { id: order.id } },
      });
    } else {
      styles = await RetailerOrderStyles.find({
        where: { retailerOrder: { id: order.id } },
      });
    }

    return res.json({
      success: true,
      data: {
        ...order,
        styles,
      },
    });
  })
);


router.put(
  "/qr-scan-update/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const order = await RetailerOrder.findOne({
      where: { id: Number(id), status: 0 }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

  const workflow = [
  OrderStatus.Pattern,
  OrderStatus.Khaka,
  OrderStatus.Issue_Beading,
  OrderStatus.Beading,
  OrderStatus.Zarkan,
  OrderStatus.Stitching,
  OrderStatus.Balance_Pending,
];

const currentStatus: OrderStatus = order.orderStatus as OrderStatus;

    const currentIndex = workflow.indexOf(order.orderStatus);
    const now = new Date();
// ⛔ QR STOP — Balance Pending
if (currentStatus === OrderStatus.Balance_Pending) {
  return res.json({
    success: false,
    code: "WAIT_ADMIN",
    message:
      "Order Balance Pending hai. Admin ne Ready To Delivery nahi kiya.",
    nextAction: "WAIT_ADMIN_READY",
  });
}

// 🟡 Admin Ready To Delivery kar chuka hai
if (currentStatus === OrderStatus.Ready_To_Delivery) {
  return res.json({
    success: true,
    code: "READY_FOR_SHIP",
    message:
      "Admin ne Ready To Delivery kar diya hai. Last scan karke Shipped karein.",
    nextAction: "SHIP",
  });
}

// ❌ Already shipped
if (order.orderStatus === OrderStatus.Shipped) {
  return res.json({
    success: false,
    message: "Order already shipped",
  });
}

// 🚚 FINAL QR CONFIRM → SHIP ORDER
if (
  order.orderStatus === OrderStatus.Ready_To_Delivery &&
  req.body.confirmShip === true
) {
  const now = new Date();

  order.orderStatus = OrderStatus.Shipped;
  order.shipped = now;
  order.shippingStatus = ShippingStatus.Shipped;
  order.shippingDate = now;
  order.status_id = 1;

  await order.save();

  return res.json({
    success: true,
    code: "SHIPPED",
    message: "Order shipped successfully",
    orderStatus: OrderStatus.Shipped,
    shippedAt: now,
  });
}



    if (currentIndex < 0) {
      return res.status(400).json({
        success: false,
        message: "Order status not in workflow",
      });
    }

    if (currentIndex === workflow.length - 1) {
      return res.json({
        success: true,
        message: "Order already completed!",
        orderStatus: order.orderStatus,
      });
    }

   const nextStatus = workflow[currentIndex + 1];


    const field = nextStatus.toLowerCase().replace(/\s+/g, "_");
    (order as any)[field] = now;

    // If shipped update shipping fields too
    if (nextStatus === OrderStatus.Shipped) {
      order.shippingStatus = ShippingStatus.Shipped;
      order.shippingDate = now;
      order.status_id = 1; // Mark completed
    }

    await order.save();

    return res.json({
      success: true,
      message: `Status moved to ${nextStatus}`,
      orderId: order.id,
      orderStatus: nextStatus,
      updatedAt: now,
    });
  })
);




router.post("/create-checkout", async (req, res) => {
  try {
    const { orderId } = req.body;

    console.log("🟦 Incoming Request — Create Checkout for Order:", orderId);

    // Fetch order
    const order = await RetailerOrder.findOne({
      where: { id: Number(orderId) },
    });

    if (!order) {
      console.log("❌ Order not found:", orderId);
      return res.json({ success: false, message: "Order not found" });
    }

    console.log("🟩 Order Found:", order.id, "Amount:", order.purchaseAmount);

    const amount = Number(order.purchaseAmount) * 100;

    console.log("💰 Stripe Amount (in cents):", amount);

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: amount,
            product_data: {
              name: `Order ${order.purchaeOrderNo}`,
            },
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/payment-success/${orderId}`,
      cancel_url: `${process.env.CLIENT_URL}/payment-cancel/${orderId}`,

      // SEND METADATA
      metadata: {
        orderId: String(orderId),
      },
    });

    console.log("🟨 Stripe Session Created:");
    console.log("👉 Session ID:", session.id);
    console.log("👉 Session URL:", session.url);
    console.log("👉 Metadata:", session.metadata);

    return res.json({ success: true, url: session.url });

  } catch (err) {
    console.log("❌ STRIPE SESSION ERROR:", err);
    return res.json({ success: false, message: "Stripe error" });
  }
});

router.post("/admin-panel/request", asyncHandler(async (req:Request,res:Response)=> {
  const { orderId } = req.body;

  const order = await RetailerOrder.findOne({
    where: { id: Number(orderId) },
    relations: ["favourite_order", "Stock_order"]
  });

  if (!order) {
    return res.status(404).json({ success:false });
  }

  let styles = [];

  if (order.is_stock_order) {
    styles = await StockOrderStyles.find({
      where: { retailerOrder: { id: order.id } }
    });
  } else {
    styles = await RetailerOrderStyles.find({
      where: { retailerOrder: { id: order.id } }
    });
  }

  return res.json({
    success: true,
    data: { ...order, styles }
  });
}));





router.get(
  "/retailer/admin-orders",
  asyncHandler(async (req: Request, res: Response) => {
    const retailerId = Number(req.query.retailerId);

    if (!retailerId) {
      return res.json({ success: false, message: "RetailerId missing" });
    }

    // 1️⃣ Get retailer + customerId
    const retailer = await Retailer.findOne({
      where: { id: retailerId },
      relations: ["customer"],
    });

    if (!retailer) {
      return res.json({ success: false, message: "Retailer not found" });
    }

    // 2️⃣ FULL DETAILED ADMIN ORDERS QUERY
   const SQL = `
  SELECT 
    o.id,
    o.purchaeOrderNo AS order_id,
    o.orderType,
    o.orderStatus,
    o.trackingNo,
    o.createdAt,
    o.orderReceivedDate,

    -- Total order amount (from payments table OR 0 if no payment)
    COALESCE(total_pay.total_amount, 0) AS total,

    -- Paid amount
    COALESCE(paid_pay.paid_amount, 0) AS paid_amount,

    -- Balance = total - paid
    (COALESCE(total_pay.total_amount, 0) - COALESCE(paid_pay.paid_amount, 0)) AS balance

  FROM orders o

  -- Total amount (sum of all payments)
  LEFT JOIN (
    SELECT orderId, SUM(amount) AS total_amount
    FROM retailer_order_payments
    GROUP BY orderId
  ) total_pay ON total_pay.orderId = o.id

  -- Paid amount (same as total for now)
  LEFT JOIN (
    SELECT orderId, SUM(amount) AS paid_amount
    FROM retailer_order_payments
    GROUP BY orderId
  ) paid_pay ON paid_pay.orderId = o.id

  WHERE o.customerId = ?
  ORDER BY o.id DESC;
`;


    const rows = await db.query(SQL, [retailer.customer.id]);

    return res.json({
      success: true,
      orders: rows,
    });
  })
);



export default router;