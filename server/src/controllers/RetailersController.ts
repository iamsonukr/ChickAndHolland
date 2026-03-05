import { Request, Response, Router } from "express";
import asyncHandler from "../middleware/AsyncHandler";
import { In, Like } from "typeorm";
import Retailer from "../models/Retailer";
import CONFIG from "../config";
import jwt from "jsonwebtoken";
import { RetailerOrder } from "../models/RetailerOrder";
import Stock from "../models/Stock";
import Product from "../models/Product";
import { Brackets } from "typeorm";
import OrderPayments from "../models/OrderPayments";
import Favourites from "../models/Favourites";
import db from "../db";
import { log } from "console";
import Customer from "../models/Customer";
import Clients from "../models/ClientsModel";
import AdminBank from "../models/AdminBank";

const router = Router();

router.post(
  "/login",
  asyncHandler(async (req: Request, res: Response) => {
    const { userName: username, password } = req.body;

    // console.log(req.bo)

    const retailer = await Retailer.findOne({
      where: {
        username,
        password,
        isDeleted: false,
      },
      relations: ["customer", "customer.currency"],
    });

    if (!retailer || retailer.customer.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    // console.log(retailer.customer)

    const tokenData = {
      id: retailer.id,
      name: retailer.customer.name,
      storeName: retailer.customer.storeName,
      username: retailer.username,
      countryId: retailer.customer.countryId,
      currencyId: retailer.customer.currencyId,
      type: "RETAILER",
    };

    const token = jwt.sign(tokenData, CONFIG.JWT_SECRET, {
      expiresIn: CONFIG.JWT_EXPIRES_IN,
    });

   res.json({
  success: true,
  message: "Retailer logged in successfully",
  token,
  retailerId: retailer.id,
  countryId: retailer.customer.countryId,
  currencyId: retailer.customer.currencyId,
  phoneNumber: retailer.customer.phoneNumber,   // <-- ADD THIS
});

  })
);

// router.post(
//   "/place-order",
//   asyncHandler(async (req: any, res: Response) => {
//     const { retailerId, productId, quantity, size, color } = req.body;

//     const retailer = await Retailer.findOne({
//       where: {
//         id: Number(retailerId),
//       },
//     });

//     if (!retailer) {
//       return res.status(404).json({
//         success: false,
//         message: "Retailer not found",
//       });
//     }

//     const product = await Product.findOne({
//       where: {
//         id: Number(productId),
//       },
//     });

//     if (!product) {
//       return res.status(404).json({
//         success: false,
//         message: "Product not found",
//       });
//     }

//     const stock = await Stock.findOne({
//       where: {
//         // product: {
//         //   id: product.id,
//         // },
//         styleNo: product.productCode,
//         size: size,
//         // colors: Like(`%${colors}%`),
//       },
//     });

//     if (!stock) {
//       return res.status(404).json({
//         success: false,
//         message: "Stock not found",
//       });
//     }

//     // check if quantity is available
//     if (stock.quantity < Number(quantity)) {
//       return res.status(400).json({
//         success: false,
//         message: `Only ${stock.quantity} items are available`,
//       });
//     }

//     const retailerOrder = new RetailerOrder();
//     retailerOrder.retailer = retailer;
//     // retailerOrder.stock = stock;
//     // retailerOrder.quantity = Number(quantity);
//     // retailerOrder.color = Number(color);
//     retailerOrder.isApproved = false;
//     // retailerOrder.orderStatus = "PATTERN_KHAKA";
//     // retailerOrder.shippingStatus = "NOT_SHIPPED";
//     retailerOrder.purchaseAmount = stock.discountedPrice
//       ? stock.discountedPrice * Number(quantity)
//       : stock.price * Number(quantity);

//     const newOrder = await retailerOrder.save();

//     res.json({
//       success: true,
//       message: "Order placed successfully",
//       orderId: newOrder.id,
//     });

//     // console.log(stock, "stock");

//     //
//     // const stock = await Stock.findOne({
//     //   where: {
//     //     id: Number(stockId),
//     //   },
//     // });
//     //
//     // if (!stock) {
//     //   return res.status(404).json({
//     //     success: false,
//     //     message: "Stock not found",
//     //   });
//     // }
//     //
//     // // check quantity
//     //
//     // // first get all retailerORders for this stock
//     // const retailerOrders = await RetailerOrder.find({
//     //   where: {
//     //     stock: {
//     //       id: stock.id,
//     //     },
//     //   },
//     // });
//     //
//     // // count total quantity ordered
//     // const totalQuantityOrdered = retailerOrders.reduce(
//     //   (acc, retailerOrder) => acc + retailerOrder.quantity,
//     //   0
//     // );
//     //
//     // // check if total quantity ordered + new quantity is greater than stock quantity
//     // if (totalQuantityOrdered + Number(quantity) > stock.quantity) {
//     //   return res.status(400).json({
//     //     success: false,
//     //     message: `Only ${
//     //       stock.quantity - totalQuantityOrdered
//     //     } items are available`,
//     //   });
//     // }
//     //
//     // const retailerOrder = new RetailerOrder();
//     //
//     // retailerOrder.address = address;
//     // retailerOrder.quantity = Number(quantity);
//     // retailerOrder.retailer = retailer;
//     // retailerOrder.stock = stock;
//     // retailerOrder.color = color;
//     // if (stock.discountedPrice) {
//     //   retailerOrder.purchaseAmount = stock.discountedPrice * Number(quantity);
//     // } else {
//     //   retailerOrder.purchaseAmount = stock.price * Number(quantity);
//     // }
//     //
//     // await retailerOrder.save();

//     // res.json({
//     //   success: false,
//     //   message: "Order placed failfully"
//     // });
//   })
// );

router.get(
  "/dashboard-data",
  asyncHandler(async (req: Request, res: Response) => {
    // total orders, total spend, total due, total favs

    const { retailerId } = req.query;

    const yearReport = await db.query(
      `SELECT 
    YEAR(ro.createdAt) AS created_year, 
    COUNT(ro.id) AS orders,  
    SUM(ro.purchaseAmount) AS price, 
    SUM((SELECT SUM(rp.amount) 
        FROM retailer_order_payments AS rp 
        WHERE rp.orderId = ro.id)) AS paid,
    MAX(curr.symbol) as currencySymbol,
    MAX(curr.name) as currencyName
FROM retailer_orders AS ro 
LEFT JOIN retailers r ON r.id = ro.retailerId
LEFT JOIN customers c ON c.id = r.customerId
LEFT JOIN currencies curr ON curr.id = c.currencyId
WHERE ro.retailerId = ?
GROUP BY created_year
ORDER BY created_year;
`,
      [retailerId]
    );
    const totalBalance = await db.query(
      `SELECT 
 SUM(ro.purchaseAmount) - SUM((SELECT SUM(rp.amount) 
        FROM retailer_order_payments AS rp 
        WHERE rp.orderId = ro.id)) as vv,
 MAX(curr.symbol) as currencySymbol,
 MAX(curr.name) as currencyName
FROM retailer_orders AS ro 
LEFT JOIN retailers r ON r.id = ro.retailerId
LEFT JOIN customers c ON c.id = r.customerId
LEFT JOIN currencies curr ON curr.id = c.currencyId
WHERE ro.retailerId = ?`,
      [retailerId]
    );

    res.json({
      success: true,
      data: yearReport,
      // totalOrders,
      // totalDue,
      // favouritesCount,
      total: totalBalance,
    });
  })
);

router.get(
  "/orders/:isApproved",
  asyncHandler(async (req: Request, res: Response) => {
    const { isApproved } = req.params;
    const { retailerId, page, query } = req.query as {
      retailerId?: string;
      page?: string;
      query?: string;
    };

    const skip = (page ? Number(page) - 1 : 0) * 10;
    const take = 10;
    const params: any[] = [];
    const whereClauses: { favorites: string[]; stock: string[] } = {
      favorites: [],
      stock: [],
    };

    // Add is_approved = false condition by default
    whereClauses.favorites.push(`rf.is_approved = ${isApproved}`);
    whereClauses.favorites.push(`rf.isDeleted = false`);
    whereClauses.stock.push(`nrf.is_approved = ${isApproved}`);
    whereClauses.stock.push(`nrf.isDeleted = false`);

    // Base SQL query for favorites
    let favoritesSql = `
      SELECT 
        rf.createdAt AS createdAt,
        DATE_FORMAT(rf.createdAt, '%Y-%m-%d') AS formatted_date,
        rf.is_approved,
        SUM(f.quantity) AS Total,
        SUM(CASE 
          WHEN f.product_size >= 60 THEN COALESCE(pcp.price, p.price) * 1.60 * f.quantity
          WHEN f.product_size >= 56 THEN COALESCE(pcp.price, p.price) * 1.40 * f.quantity
          WHEN f.product_size >= 52 THEN COALESCE(pcp.price, p.price) * 1.40 * f.quantity
          WHEN f.product_size >= 48 THEN COALESCE(pcp.price, p.price) * 1.20 * f.quantity
          ELSE COALESCE(pcp.price, p.price) * f.quantity 
        END) AS total_price,
        rf.id as id,
         rf.rejected_comments,
         c.name as name,
         rf.retailerId as retailerId,
        'Fresh' as order_type,
        MAX(curr.symbol) as currencySymbol,
        MAX(curr.name) as currencyName
      FROM retailer_favourites_orders rf
      INNER JOIN favourites f ON FIND_IN_SET(f.id, rf.favourite_ids) > 0
      INNER JOIN products p ON f.productId = p.id
      LEFT JOIN product_currency_pricing pcp ON pcp.productId = p.id AND pcp.currencyId = f.currencyId
      LEFT JOIN currencies curr ON curr.id = f.currencyId
      left join retailers as r on r.id =  rf.retailerId
      right join  customers as c on c.id = r.customerId
    `;

    // Base SQL query for stock orders
    let stockSql = `
      SELECT 
        nrf.createdAt AS createdAt,
        DATE_FORMAT(nrf.createdAt, '%Y-%m-%d') AS formatted_date,       
        nrf.is_approved,
        SUM(nrf.quantity) AS Total,
        SUM(CASE 
          WHEN s.size >= 60 THEN COALESCE(scp.discountedPrice, s.discountedPrice) * 1.60 * nrf.quantity
          WHEN s.size >= 56 THEN COALESCE(scp.discountedPrice, s.discountedPrice) * 1.40 * nrf.quantity
          WHEN s.size >= 52 THEN COALESCE(scp.discountedPrice, s.discountedPrice) * 1.40 * nrf.quantity
          WHEN s.size >= 48 THEN COALESCE(scp.discountedPrice, s.discountedPrice) * 1.20 * nrf.quantity
          ELSE COALESCE(scp.discountedPrice, s.discountedPrice) * nrf.quantity
        END) AS total_price,
        nrf.id as id,
         nrf.rejected_comments,
         c.name as name,
         nrf.retailerId as retailerId,
         'Stock' as order_type,
         COALESCE(curr.symbol, '€') as currencySymbol,
         COALESCE(curr.name, 'Euro') as currencyName
      FROM retailer_stock_orders nrf
      INNER JOIN stock s ON s.id = nrf.stockId
      INNER JOIN products p ON p.id = s.styleNo
      LEFT JOIN currencies curr ON curr.id = nrf.currencyId
      LEFT JOIN stock_currency_pricing scp ON scp.stockId = s.id AND scp.currencyId = nrf.currencyId
      left join retailers as r on r.id =  nrf.retailerId
      right join  customers as c on c.id = r.customerId
    `;

// '' AS rejected_comments
    
    // Handle retailerId condition
    if (retailerId && retailerId !== "all") {
      whereClauses.favorites.push("f.retailerId = ?");
      whereClauses.stock.push("nrf.retailerId = ?");
      params.push(Number(retailerId), Number(retailerId));
    }

    // Handle search query
    // if (query) {
    //   const likeQuery = `%${query.toLowerCase()}%`;
    //   whereClauses.favorites.push(
    //     "(LOWER(f.customer_name) LIKE ? OR LOWER(p.styleNo) LIKE ?)"
    //   );
    //   whereClauses.stock.push(
    //     "(LOWER(s.customer_name) LIKE ? OR LOWER(p.styleNo) LIKE ?)"
    //   );
    //   params.push(likeQuery, likeQuery, likeQuery, likeQuery);
    // }

    // Add WHERE clauses
    favoritesSql += " WHERE " + whereClauses.favorites.join(" AND ");
    stockSql += " WHERE " + whereClauses.stock.join(" AND ");

    // Add grouping clauses
    favoritesSql += " GROUP BY rf.createdAt, rf.is_approved, rf.id";
    stockSql += " GROUP BY nrf.createdAt, nrf.is_approved, nrf.id";

    // Combine queries with UNION ALL

    // const combinedSql = `
    //   (${favoritesSql})
    //   UNION ALL
    //   (${stockSql})
    //   ORDER BY formatted_date DESC
    //   LIMIT ? OFFSET ?
    // `;

    // const combinedSql = `
    //   (${favoritesSql})
    //   UNION ALL
    //   (${stockSql})
    //  ORDER BY formatted_date DESC, id DESC
    //   LIMIT ? OFFSET ?
    // `;

    const combinedSql = `
      (${favoritesSql})
      UNION ALL
      (${stockSql})
     ORDER BY createdAt  DESC
      LIMIT ? OFFSET ?
    `;

    // Add pagination parameters
    params.push(take, skip);

    // Total count query
    const countSql = `
      SELECT COUNT(*) AS total FROM (
        (
          SELECT rf.createdAt
          FROM retailer_favourites_orders rf
          INNER JOIN favourites f ON FIND_IN_SET(f.id, rf.favourite_ids) > 0
          INNER JOIN products p ON f.productId = p.id
          WHERE ${whereClauses.favorites.join(" AND ")}
          GROUP BY rf.createdAt, rf.is_approved, rf.id
        )
        UNION ALL
        (
          SELECT nrf.createdAt
          FROM retailer_stock_orders nrf
          INNER JOIN stock s ON s.id = nrf.stockId
          INNER JOIN products p ON p.id = s.styleNo
          WHERE ${whereClauses.stock.join(" AND ")}
          GROUP BY nrf.createdAt, nrf.is_approved, nrf.id
        )
      ) AS combined_counts
    `;

    // Execute queries
    const orders = await db.query(combinedSql, params);
    const totalResult = await db.query(countSql, params.slice(0, -2));

    return res.json({
      success: true,
      orders: orders,
      totalCount: totalResult?.[0]?.total,
    });
  })
);

// router.patch(
//   `/orders/:orderId/status-change`,
//   asyncHandler(async (req: Request, res: Response) => {
//     const { orderId } = req.params;
//     const { status } = req.body;

//     const retailerOrder = await RetailerOrder.findOne({
//       where: {
//         id: Number(orderId)
//       },
//       relations: ["stock"]
//     });

//     if (!retailerOrder) {
//       return res.status(404).json({
//         success: false,
//         message: "Order not found"
//       });
//     }

//     if (status === "approve") {

//       console.log(retailerOrder, "retailerOrder");

//       const stock = await Stock.findOne({
//         where: {
//           id: retailerOrder.stock.id
//         }
//       });

//       if (!stock) {
//         return res.status(404).json({
//           success: false,
//           message: "Stock not found"
//         });
//       }

//       // check quantity of stock
//       if (stock.quantity < retailerOrder.quantity) {
//         return res.status(400).json({
//           success: false,
//           message: `Only ${stock.quantity} items are available`
//         });
//       }

//       // reduce stock quantity
//       stock.quantity -= retailerOrder.quantity;
//       await stock.save();

//       retailerOrder.isApproved = true;
//       // retailerOrder.isRejected = false;
//     } else if (status === "reject") {
//       // retailerOrder.isRejected = true;
//       retailerOrder.isApproved = false;
//     }

//     await retailerOrder.save();

//     res.json({
//       success: true,
//       message: "Order status updated successfully"
//     });
//   })
// );

router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const retailer = await Retailer.findOne({
      where: {
        id: Number(id),
        isDeleted: false,
      },
      relations: ["customer"],
    });

    if (!retailer || retailer.customer.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Retailer not found",
      });
    }

    res.json({
  success: true,
  retailer: {
    id: retailer.id,
    username: retailer.username,
    countryId: retailer.customer.countryId,
    currencyId: retailer.customer.currencyId,

    // CUSTOMER FIELDS
    name: retailer.customer.name,
    storeName: retailer.customer.storeName,
        storeAddress: retailer.customer.storeAddress,   // <-- ADD HERE

    email: retailer.customer.email,
    phoneNumber: retailer.customer.phoneNumber, // FIXED
  }
});

  })
);

router.patch(
  "/retailer/personal/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const { phoneNumber, email, storeName, name } = req.body;

    const customer = await Customer.findOne({
      where: {
        id: Number(id),
        isDeleted: false,
      },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Retailer not found",
      });
    }

    customer.email = email;
    customer.phoneNumber = phoneNumber;
    customer.storeName = storeName;
    customer.name = name;

    await customer.save();

    res.json({
      success: true,
      message: "sd",
    });
  })
);

router.get(
  "/matched-banks",
  asyncHandler(async (req: any, res: Response) => {

    const retailerId = req.user?.id;

    if (!retailerId) {
      return res.status(401).json({
        success: false,
        msg: "Unauthorized",
      });
    }

    const retailer = await Retailer.findOne({
      where: { id: retailerId },
      relations: ["customer"],
    });

    if (!retailer?.customer) {
      return res.status(404).json({
        success: false,
        msg: "Retailer customer not found",
      });
    }

    const currencyId = retailer.customer.currencyId;

    const bankDetails = await AdminBank.find({
      where: {
        is_active: 1,
        currencyId: Number(currencyId),
      },
      relations: ["currency"],
    });

    const data = bankDetails.map((item) => ({
      id: item.id,
      bankName: item.decryptedBankName,
      accountHolder: item.decryptedAccountHolder,
      accountNumber: item.decryptedAccountNumber,
      ifscCode: item.decryptedIfscCode,
      swiftCode: item.decryptedSwiftCode,

      address: item.address,
      currency: item.currency
        ? {
            code: item.currency.code,
            symbol: item.currency.symbol,
          }
        : null,
    }));

    res.json({
      success: true,
      msg: "Currency matched banks fetched",
      data,
    });
  })
);


export default router;
