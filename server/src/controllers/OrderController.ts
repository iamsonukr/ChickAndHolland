
import { raw, Request, Response, Router } from "express";
import asyncHandler from "../middleware/AsyncHandler";
import Order, { OrderType, OrderStatus, ShippingStatus } from "../models/Order";
import { Equal, In, Like } from "typeorm";
import Busboy from "busboy";
import sharp from "sharp";
import { storeFileInS3 } from "../lib/s3";
import Style from "../models/OrderStyle";
import Customer from "../models/Customer";
import CONFIG from "../config";
import Product from "../models/Product";
import fetch from "node-fetch";
import { imageCache, productCache } from "../lib/cache.service";
import db from "../db";
import { RetailerOrder } from "../models/RetailerOrder";
import { createStyleBarcode } from "../services/style.service";
import { updateOrderByBarcode } from "../services/orderStatus.service";

import StoreStyleProgress from "../models/StoreStyleProgress";  // ⬅ top me import add karna
// import { updateOrderAndStyleStatus } from "../services/orderStatus.service";

const router = Router();
// ----------------------
// SAFE ARRAY FIX
// ----------------------
function safeArray(value: any) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  }
  return [];
}



interface Field {
  [key: string]: string;
}

interface FileData {
  fieldname: string;
  filename: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
}


router.post(
  "/",
  raw({
    type: "multipart/form-data",
    limit: "100mb",
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const busboy = Busboy({ headers: req.headers });
    const fields: Field = {};
    const filePromises: Promise<FileData>[] = [];

    busboy.on("field", (fieldname: string, val: string) => {
      fields[fieldname] = val;
    });

    // @ts-ignore
    busboy.on(
      "file",
      (
        fieldname: string,
        file: NodeJS.ReadableStream,
        filename: string,
        encoding: string,
        mimetype: string
      ) => {
        const buffers: Buffer[] = [];

        const filePromise = new Promise<FileData>((resolve, reject) => {
          file.on("data", (data: Buffer) => {
            buffers.push(data);
          });

          file.on("end", () => {
            const fileBuffer = Buffer.concat(buffers);
            resolve({
              fieldname,
              filename,
              encoding,
              mimetype,
              buffer: fileBuffer,
            });
          });

          file.on("error", (error: Error) => {
            reject(error);
          });
        });

        filePromises.push(filePromise);
      }
    );

    busboy.on("finish", async () => {
      try {
        const files = await Promise.all(filePromises);

        const purchaseOrderNo = fields["purchaseOrderNo"];
        const manufacturingEmailAddress = fields["manufacturingEmailAddress"];
        const orderType = fields["orderType"];
        const orderReceivedDate = new Date(fields["orderReceivedDate"]);
        const orderCancellationDate = new Date(fields["orderCancellationDate"]);
        const address = fields["address"];
        const customerId = Number(fields["customerId"]);

        const styles: any = [];

        // PARSE STYLES
        for (const key in fields) {
          if (key.startsWith("styles[")) {
            const matches = key.match(/\[(\d+)\]\.(.+)/);
            if (matches) {
              const index = Number(matches[1]);
              const field = matches[2];

              if (!styles[index]) styles[index] = {};
              styles[index][field] = fields[key];
            }
          }
        }

        const customer = await Customer.findOneOrFail({
          where: { id: customerId },
        });

        // CREATE ORDER
        const order = new Order();
        order.purchaeOrderNo = purchaseOrderNo;
        order.manufacturingEmailAddress = manufacturingEmailAddress;
        order.orderType = orderType as OrderType;
        order.orderReceivedDate = orderReceivedDate;
        order.orderCancellationDate = orderCancellationDate;
        order.address = address;
        order.customer = customer;

        await order.save(); // ⬅ MUST SAVE BEFORE STYLES
        

        const latestOrderId = await Order.createQueryBuilder("order")
          .select("MAX(order.id)", "max")
          .getRawOne();
        const orderID = latestOrderId.max;

        // ================================
        // PROCESS ALL STYLES
        // ================================
        for (let i = 0; i < styles.length; i++) {
          const s = styles[i];

          const newStyle = new Style();
          newStyle.order = order;
          newStyle.styleNo = s.styleNo;
          newStyle.customColor = s.customColor;
          newStyle.comments = s.comments;
          newStyle.customSize = s.customSize;
          newStyle.customSizesQuantity = s.customSizesQuantity;
          newStyle.colorType = s.colorType;
          newStyle.sizeCountry = s.sizeCountry;
          newStyle.size = s.size;
          newStyle.mesh_color = s.mesh;
          newStyle.beading_color = s.beading;
          newStyle.lining = s.lining;
          newStyle.lining_color =
            s.lining === "No Lining" ? null : s.liningColor;
newStyle.quantity = s.quantity ? Number(s.quantity) : 0;

          // STEP 1 — SAVE FIRST (GETS ID)
          await newStyle.save();

          // STEP 2 — CREATE FINAL BARCODE USING ID
          newStyle.barcode = `${order.purchaeOrderNo}-${newStyle.styleNo}-${newStyle.id}`;
          await newStyle.save();

          // STEP 3 — UPLOAD IMAGES
          const styleImages = files.filter(
            (file) => file.fieldname === `styles[${i}].modifiedPhotoImage`
          );

          const imageUrls = await Promise.all(
            styleImages.map(async (file) => {
              if (!file) return null;

              const fileName = `orders/${orderID}/${Math.random()
                .toString(36)
                .substring(7)}.jpeg`;

              const compressedImage = await sharp(file.buffer)
                .jpeg()
                .toBuffer();

              return await storeFileInS3(compressedImage, fileName);
            })
          );

          newStyle.photoUrls = JSON.stringify(
            imageUrls.filter((x) => x).map((x) => x?.fileName)
          );

          // STEP 4 — SAVE FINAL STYLE
          await newStyle.save();
        }

        res.json({
          success: true,
          message: "Order created with barcode successfully",
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({
          error: "An error occurred while processing order",
        });
      }
    });

    busboy.end(req.body);
  })
);


export async function convertImageToBase64Jpeg(
  imageUrl: string
): Promise<string | null> {
  try {
    if (!imageUrl) return null;

    const cachedImage = imageCache.get(imageUrl);
    if (cachedImage) {
      return cachedImage;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(imageUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const imageBufferFromURL = await response.arrayBuffer();

      // Increased size limit to 50MB
      if (imageBufferFromURL.byteLength > 50 * 1024 * 1024) {
        throw new Error("Image size too large (max 50MB)");
      }

      const processedBuffer = await sharp(imageBufferFromURL)
        .jpeg({
          quality: 80,
          mozjpeg: true,
        })
        .resize({
          width: 1200,
          height: 1200,
          fit: "inside",
          withoutEnlargement: true,
        })
        .toBuffer();

      const base64Image = `data:image/jpeg;base64,${processedBuffer.toString(
        "base64"
      )}`;

      imageCache.set(imageUrl, base64Image);
      return base64Image;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  } catch (error) {
    console.error(`Error converting image (${imageUrl}):`, error);
    return null;
  }
}

async function fetchProductsMap(styles: any[]) {
  const styleNos = [
    ...new Set(styles.map((style) => style.styleNo.toLowerCase())),
  ];

  // Create a map to store products we'll need to fetch
  const productsToFetch = new Set<string>();
  const productsMap = new Map();

  // Check cache first for each product
  for (const styleNo of styleNos) {
    const cachedProduct = productCache.get(styleNo);
    if (cachedProduct) {
      productsMap.set(styleNo, cachedProduct);
    } else {
      productsToFetch.add(styleNo);
    }
  }

  // If we have products to fetch, get them from database
  if (productsToFetch.size > 0) {
    const products = await Product.find({
      where: { productCode: In([...productsToFetch]) },
      relations: ["images"],
    });

    // Add fetched products to cache and map
    for (const product of products) {
      const productCode = product.productCode.toLowerCase();
      productCache.set(productCode, product);
      productsMap.set(productCode, product);
    }
  }

  return productsMap;
}

async function processOrders(orders: any[]) {
  try {
    // Extract all styles from all orders
    const allStyles = orders.flatMap((order) => order.styles);

    // Fetch all products at once
    const productsMap = await fetchProductsMap(allStyles);

    const newOrders = await Promise.all(
      orders.map(async (order) => {
        const processedStyles = await Promise.all(
          order.styles.map(
            async (style: { styleNo: string; photoUrls: any }) => {
              const product = productsMap.get(style.styleNo.toLowerCase());

              if (!product) {
                console.warn(
                  `No product found with productCode: ${style.styleNo.toLowerCase()}`
                );
                // return {
                //     ...style,
                //     product: null,
                //     convertedFirstProductImage: null,
                //     photoUrl: null,
                //     convertedPhotoUrl: null,
                // };
              }

              // Process images in parallel
              let convertFirstProductImage;
              // const [base64FirstProductImage] = await Promise.all([
              //     product.images[0] ? convertImageToBase64Jpeg(product.images[0].name) : null
              // ]);

              if (product?.images[0]) {
                convertFirstProductImage = await convertImageToBase64Jpeg(
                  product.images[0].name
                );
              }

              // const photoUrls = style.photoUrls ? style.photoUrls.map((path: string) => `https://${CONFIG.S3_BUCKET}.${CONFIG.S3_AWS_ENDPOINT}/${path}`) : null;
              // const photoUrls = order.isPreview
              //   ? style.photoUrls
              //   : style.photoUrls
              //   ? style.photoUrls.map(
              //       (path: string) =>
              //         `https://${CONFIG.S3_BUCKET}.${CONFIG.S3_AWS_ENDPOINT}/${path}`
              //     )
              //   : null;
              // 🔥 SAFE FIX FOR photoUrls
let rawPhotoUrls = [];

try {
  rawPhotoUrls = style.photoUrls
    ? Array.isArray(style.photoUrls)
      ? style.photoUrls
      : typeof style.photoUrls === "string"
        ? JSON.parse(style.photoUrls)
        : []
    : [];
} catch {
  rawPhotoUrls = [];
}

const photoUrls = order.isPreview
  ? rawPhotoUrls
  : rawPhotoUrls.map(
      (path: string) =>
        `https://${CONFIG.S3_BUCKET}.${CONFIG.S3_AWS_ENDPOINT}/${path}`
    );



              return {
                ...style,
                product,
                convertedFirstProductImage: convertFirstProductImage,
                // photoUrl: style.photoUrl ?
                //     `https://${CONFIG.S3_BUCKET}.${CONFIG.S3_AWS_ENDPOINT}/${style.photoUrl}` :
                //     null,
                photoUrls: photoUrls,
              };
            }
          )
        );

        return {
          ...order,
          styles: processedStyles,
        };
      })
    );

    return newOrders;
  } catch (error) {
    console.error("Error processing orders:", error);
    throw error;
  }
}




router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const {
      page,
      query,
      orderType,
    }: {
      page?: string;
      query?: string;
      orderType?: string;
    } = req.query;

    const skip = (page ? Number(page) - 1 : 0) * 100;
    const likeQuery = query ? `%${query.toLowerCase()}%` : undefined;
    const pageSize = 100;

    let unionQuery;

    // First query for regular orders
    const regularOrdersQuery = db
      .createQueryBuilder()
      .select([
        "o.id as id",
        "o.purchaeOrderNo as purchaeOrderNo",
        "o.manufacturingEmailAddress as manufacturingEmailAddress",
        "o.orderType as orderType",
        "o.orderReceivedDate as orderReceivedDate",
        "o.orderCancellationDate as orderCancellationDate",
        "o.address as address",
        "o.orderStatus as orderStatus",
        "o.shippingStatus as shippingStatus",
        "o.shippingDate as shippingDate",
        "o.trackingNo as trackingNo",
        "o.createdAt as createdAt",
        "'regular' as orderSource",
      ])
      .from(Order, "o")
      .leftJoin("o.customer", "customer") // Join the Customer table to filter by name
      .where("o.status = 0");

    if (likeQuery) {
      regularOrdersQuery.andWhere(
        "(LOWER(o.purchaeOrderNo) LIKE :likeQuery OR LOWER(customer.name) LIKE :likeQuery)", // Add filter for customer.name
        { likeQuery }
      );
    }

    // Second query for retailer orders
    const retailerOrdersQuery = db
      .createQueryBuilder()
      .select([
        "ro.id as id",
        "ro.purchaeOrderNo as purchaeOrderNo",
        "ro.manufacturingEmailAddress as manufacturingEmailAddress",
        "CASE WHEN ro.is_stock_order = 1 THEN 'Stock' ELSE 'Fresh' END as orderType",
        "ro.orderReceivedDate as orderReceivedDate",
        "ro.orderCancellationDate as orderCancellationDate",
        "ro.address as address",
        "ro.orderStatus as orderStatus",
        "ro.shippingStatus as shippingStatus",
        "ro.shippingDate as shippingDate",
        "ro.trackingNo as trackingNo",
        "ro.createdAt as createdAt",
        "'retailer' as orderSource",
      ])
      .from(RetailerOrder, "ro")
      .leftJoin("ro.retailer", "retailer") // Join the Retailer table
      .leftJoin("retailer.customer", "customer") // Join the Customer table to filter by name
      .where("ro.status = 0");

    if (likeQuery) {
      retailerOrdersQuery.andWhere(
        "(LOWER(ro.purchaeOrderNo) LIKE :likeQuery OR LOWER(customer.name) LIKE :likeQuery)", // Add filter for customer.name
        { likeQuery }
      );
    }

    if (orderType) {
      if (orderType === "Stock") {
        retailerOrdersQuery.andWhere("ro.is_stock_order = 1");
        unionQuery = retailerOrdersQuery.getQuery();
      } else if (orderType === "Fresh") {
        retailerOrdersQuery.andWhere("ro.is_stock_order = 0");
        unionQuery = retailerOrdersQuery.getQuery();
      } else {
        regularOrdersQuery.andWhere("o.orderType = :orderType", { orderType });
        unionQuery = regularOrdersQuery.getQuery();
      }
    } else {
      unionQuery = `(${regularOrdersQuery.getQuery()}) UNION ALL (${retailerOrdersQuery.getQuery()})`;
    }

    const finalQuery = db
      .createQueryBuilder()
      .select("*")
      .from(`(${unionQuery})`, "combined_orders")
      .orderBy("createdAt", "DESC")
      .limit(pageSize)
      .offset(skip);

    const countQuery = db
      .createQueryBuilder()
      .select("COUNT(*) as count")
      .from(`(${unionQuery})`, "combined_orders");

    const mergedParams = {
      ...regularOrdersQuery.getParameters(),
      ...retailerOrdersQuery.getParameters(),
    };

    const [combinedOrders, countResult] = await Promise.all([
      finalQuery.setParameters(mergedParams).getRawMany(),
      countQuery.setParameters(mergedParams).getRawOne(),
    ]);

    const regularOrderIds = combinedOrders
      .filter((order) => order.orderSource === "regular")
      .map((order) => order.id);

    const retailerOrderIds = combinedOrders
      .filter((order) => order.orderSource === "retailer")
      .map((order) => order.id);

    let regularOrdersWithRelations = [] as any;
    let retailerOrdersWithRelations = [] as any;

    if (regularOrderIds.length > 0) {
      regularOrdersWithRelations = await db
        .createQueryBuilder()
        .select("order")
        .from(Order, "order")
        .leftJoinAndSelect("order.customer", "customer")
        .leftJoinAndSelect("order.styles", "styles")
        .where("order.id IN (:...ids)", { ids: regularOrderIds })
        .getMany();
    }

    if (retailerOrderIds.length > 0) {
      retailerOrdersWithRelations = await db
        .createQueryBuilder()
        .select("order")
        .from(RetailerOrder, "order")
        .leftJoinAndSelect("order.retailer", "retailer")
        .leftJoinAndSelect("retailer.customer", "customer")
        .leftJoinAndSelect("order.favourite_order", "favourite_order")
        .leftJoinAndSelect("order.Stock_order", "Stock_order")
        .where("order.id IN (:...ids)", { ids: retailerOrderIds })
        .getMany();
    }

    // Fetch and map payment data for retailer orders
    const paymentsMap = new Map<number, number>();
    if (retailerOrderIds.length > 0) {
      const retailerPayments = await db
        .createQueryBuilder()
        .select("payment.orderId", "orderId")
        .addSelect("SUM(payment.amount)", "paidAmount")
        .from("retailer_order_payments", "payment")
        .where("payment.orderId IN (:...ids)", { ids: retailerOrderIds })
        .groupBy("payment.orderId")
        .getRawMany();

      retailerPayments.forEach((p) => {
        paymentsMap.set(Number(p.orderId), Number(p.paidAmount));
      });
    }

    // Final formatting
    const formattedOrders = combinedOrders.map((baseOrder) => {
      let detailedOrder;
      if (baseOrder.orderSource === "regular") {
        detailedOrder = regularOrdersWithRelations.find(
          (o: any) => o.id === baseOrder.id
        );
      } else {
        detailedOrder = retailerOrdersWithRelations.find(
          (o: any) => o.id === baseOrder.id
        );
      }

     const styles = detailedOrder?.styles?.map((style: any) => {
  return {
    ...style,

    // Fix photoUrls
    photoUrls: safeArray(style.photoUrls).map(
      (url: string) =>
        `https://${CONFIG.S3_BUCKET}.${CONFIG.S3_AWS_ENDPOINT}/${url}`
    ),

    // Fix comments
    comments: safeArray(style.comments),

    // Fix custom colors
    customColor: safeArray(style.customColor),

    // Fix custom sizes
    customSize: safeArray(style.customSize),
  };
});

      const result: any = {
        id: baseOrder.id,
        createdAt: baseOrder.createdAt,
        purchaeOrderNo: baseOrder.purchaeOrderNo,
        manufacturingEmailAddress: baseOrder.manufacturingEmailAddress,
        orderType: baseOrder.orderType,
        orderReceivedDate: baseOrder.orderReceivedDate,
        orderCancellationDate: baseOrder.orderCancellationDate,
        address: baseOrder.address,
        orderStatus: baseOrder.orderStatus,
        shippingStatus: baseOrder.shippingStatus,
        shippingDate: baseOrder.shippingDate,
        trackingNo: baseOrder.trackingNo,
        customer:
          baseOrder.orderSource === "regular"
            ? detailedOrder?.customer
              ? {
                  id: detailedOrder.customer.id,
                  name: detailedOrder.customer.name,
                  phoneNumber: detailedOrder.customer.phoneNumber,  // <-- ADD THIS

                }
              : null
            : detailedOrder?.retailer?.customer
            ? {
                id: detailedOrder.retailer.customer.id,
                name: detailedOrder.retailer.customer.name,
                phoneNumber: detailedOrder.retailer.customer.phoneNumber,  // <-- ADD THIS

              }
            : null,
        styles: styles || [],
        orderSource: baseOrder.orderSource,
      };

      if (baseOrder.orderSource === "retailer") {
        result.retailer = detailedOrder?.retailer;

        if (baseOrder.orderType === "Stock" && detailedOrder?.Stock_order) {
          result.stockId = detailedOrder.Stock_order.id;
          result.Stock_order = detailedOrder.Stock_order;
        }

        if (baseOrder.orderType === "Fresh" && detailedOrder?.favourite_order) {
          result.favouriteOrder = detailedOrder.favourite_order;
        }

        // payment-related info
        const purchaseAmount = Number(detailedOrder?.purchaseAmount || 0);
        const paidAmount = paymentsMap.get(baseOrder.id) || 0;
        const balancePayment = purchaseAmount - paidAmount;

        result.purchaseAmount = purchaseAmount;
        result.paidAmount = paidAmount;
        result.balancePayment = balancePayment;
      }

      return result;
    });

    res.json({
      orders: formattedOrders,
      totalCount: parseInt(countResult?.count || "0"),
    });
  })
);


router.get(
  "/orderDetails",
  asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.query as any;

    const order = await Order.findOne({
      where: { id: Number(orderId) },
      relations: ["customer", "styles"],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
        orders: [],
      });
    }

    const processedOrders = await processOrders([order]); // ← convert to array

    res.json({
      success: true,
      orders: processedOrders,
    });
  })
);


router.post(
  "/preview",
  raw({
    type: "multipart/form-data",
    limit: "100mb",
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const busboy = Busboy({ headers: req.headers });
    const fields: Field = {};
    const filePromises: Promise<FileData>[] = [];

    busboy.on("field", (fieldname: string, val: string) => {
      fields[fieldname] = val;
    });

    busboy.on(
      "file",
      (
        fieldname: string,
        file: NodeJS.ReadableStream,
        filename: string,
        encoding: string,
        mimetype: string
      ) => {
        const buffers: Buffer[] = [];

        const filePromise = new Promise<FileData>((resolve, reject) => {
          file.on("data", (data: Buffer) => {
            buffers.push(data);
          });

          file.on("end", () => {
            const fileBuffer = Buffer.concat(buffers);
            resolve({
              fieldname,
              filename,
              encoding,
              mimetype,
              buffer: fileBuffer,
            });
          });

          file.on("error", (error: Error) => {
            reject(error);
          });
        });

        filePromises.push(filePromise);
      }
    );

    busboy.on("finish", async () => {
      try {
        const files = await Promise.all(filePromises);

        // Parse the fields
        const purchaseOrderNo = fields["purchaseOrderNo"];
        const manufacturingEmailAddress = fields["manufacturingEmailAddress"];
        const orderType = fields["orderType"];
        const orderReceivedDate = new Date(fields["orderReceivedDate"]);
        const orderCancellationDate = new Date(fields["orderCancellationDate"]);
        const address = fields["address"];
        const customerId = Number(fields["customerId"]);

        // Parse styles from fields
        const styles: any = [];
        for (const key in fields) {
          if (key.startsWith("styles[")) {
            const matches = key.match(/\[(\d+)\]\.(.+)/);
            if (matches) {
              const index = Number(matches[1]);
              const field = matches[2];
              if (!styles[index]) {
                styles[index] = {};
              }
              styles[index][field] = fields[key];
            }
          }
        }

        // Fetch the customer
        const customer = await Customer.findOneOrFail({
          where: {
            id: customerId,
          },
        });

        // Create a temporary order object (not saved to database)
        const orderPreview = {
          id: -1, // Temporary ID for preview
          purchaseOrderNo,
          manufacturingEmailAddress,
          orderType,
          orderReceivedDate,
          orderCancellationDate,
          address,
          customer,
          isPreview: true,
          styles: await Promise.all(
            styles.map(async (style: any, index: number) => {
              // Process style images
              const styleImages = files.filter(
                (file) =>
                  file.fieldname === `styles[${index}].modifiedPhotoImage`
              );

              const imageUrls = await Promise.all(
                styleImages.map(async (file) => {
                  if (!file) return null;

                  // Generate a temporary preview URL or base64 image
                  const compressedImage = await sharp(file.buffer)
                    .jpeg()
                    .toBuffer();

                  // Return base64 for preview
                  return {
                    fileName: `data:image/jpeg;base64,${compressedImage.toString(
                      "base64"
                    )}`,
                  };
                })
              );

              return {
                colorType: style.colorType,
                // customColor: style.customColor,
                customColor:
                  typeof style.customColor === "string"
                    ? JSON.parse(style.customColor)
                    : style.customColor,
                sizeCountry: style.sizeCountry,
                size: style.size,
                // customSize: style.customSize,
                customSize:
                  typeof style.customSize === "string"
                    ? JSON.parse(style.customSize)
                    : style.customSize,
                quantity: Number(style.quantity),
                styleNo: style.styleNo,
                // comments: style.comments,
                comments:
                  typeof style.comments === "string"
                    ? JSON.parse(style.comments)
                    : style.comments,
                // customSizesQuantity: style.customSizesQuantity,
                customSizesQuantity:
                  typeof style.customSizesQuantity === "string"
                    ? JSON.parse(style.customSizesQuantity)
                    : style.customSizesQuantity,
                photoUrls: imageUrls
                  .filter((url) => url !== null)
                  .map((url) => url?.fileName),
                mesh: style.mesh,
                beading: style.beading,
                liningColor: style.liningColor,
                lining: style.lining,
              };
            })
          ),
        };

        // Process the preview order using the existing processOrders function
        const processedOrder = await processOrders([orderPreview]);

        res.json({
          success: true,
          orders: processedOrder,
        });
      } catch (error: any) {
        console.error(error);
        res.status(500).json({
          error: "An error occurred while processing the preview",
          details: error.message,
        });
      }
    });

    busboy.end(req.body);
  })
);


router.put(
  "/orderStatus",
  asyncHandler(async (req: Request, res: Response) => {
    const { barcode, status } = req.body;

    if (!barcode || !status) {
      return res.status(400).json({
        success: false,
        message: "Barcode and status required",
      });
    }

    // 1️⃣ Validate style + order (sirf check ke liye)
    const style = await Style.findOne({
      where: { barcode },
      relations: ["order"],
    });

    if (!style) {
      return res.status(404).json({
        success: false,
        message: "Invalid barcode",
      });
    }

    const order = style.order;

    // 2️⃣ BLOCK SHIP IF BALANCE PENDING
    if (
      status === OrderStatus.Shipped &&
      order.orderStatus === OrderStatus.Balance_Pending
    ) {
      return res.json({
        success: false,
        message: "Balance pending. Cannot ship order.",
      });
    }

    // 3️⃣ 🔥 SINGLE SOURCE OF TRUTH (ADMIN ACTION)
    await updateOrderByBarcode(
      barcode,
      status,
      0 // qty = 0 → admin/manual update
    );

    return res.json({
      success: true,
      message: `Order moved to ${status}`,
    });
  })
);



router.put(
  "/orderShippingStatus",
  asyncHandler(async (req: Request, res: Response) => {
    const { orderId, status } = req.body as { orderId: number; status: string };

    const order = await Order.findOne({
      where: {
        id: orderId,
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    order.shippingStatus = status as any;

    await order.save();

    res.json({
      success: true,
      message: "Order status updated successfully",
    });
  })
);

router.put(
  "/tracking",
  asyncHandler(async (req: Request, res: Response) => {
    const { orderId, trackingNo } = req.body as {
      orderId: number;
      trackingNo: string;
    };

    const order = await Order.findOne({
      where: {
        id: orderId,
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    order.trackingNo = trackingNo;

    await order.save();

    res.json({
      success: true,
      message: "Tracking ID updated successfully",
    });
  })
);

router.get(
  "/retailer-order/status/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const order = await RetailerOrder.findOne({
      select: ["pattern", "stitching", "ready_to_delivery", "beading"],
      where: {
        id: Number(id),
      },
    });

    res.json({
      success: true,
      data: order,
    });
  })
);

router.get(
  "/order/status/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const order = await Order.findOne({
      select: ["pattern", "stitching", "ready_to_delivery", "beading"],
      where: {
        id: Number(id),
      },
    });

    res.json({
      success: true,
      data: order,
    });
  })
);

router.get(
  "/latest-regular-order",
  asyncHandler(async (req: Request, res: Response) => {
    const latestOrder = await Order.find({
      order: {
        id: "desc",
      },
      take: 1,
    });

    return res.json(latestOrder[0]);
  })
);

router.get(
  "/latest-retailer-order",
  asyncHandler(async (req: Request, res: Response) => {
    const latestOrder = await RetailerOrder.find({
      order: {
        id: "desc",
      },
      take: 1,
    });

    // console.log(latestOrder, "latestRetailerOrder");

    return res.json(latestOrder[0] || {});
  })
);

router.put(
  "/deliver",
  asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.body as { orderId: number };

    const order = await Order.findOne({ where: { id: orderId } });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Final delivery stage according to your workflow
    order.orderStatus = OrderStatus.Shipped;        // last step
    order.shippingStatus = ShippingStatus.Shipped;  // marks shipped
    order.shippingDate = new Date();               // delivery date

    await order.save();

    res.json({
      success: true,
      message: "Order delivered successfully",
    });
  })
);
// ===============================




export default router;
export const PublicStoreRoutes = Router();


PublicStoreRoutes.get(
  "/store-scan/:barcode",
  asyncHandler(async (req: Request, res: Response) => {
    const { barcode } = req.params;

    const style = await Style.findOne({
      where: { barcode },
      relations: ["order"],
    });

    if (!style) {
      return res.status(404).json({
        success: false,
        message: "Invalid barcode",
      });
    }

    // 🔥 Fetch progress logs for this style
    const progress = await StoreStyleProgress.find({
      where: { barcode },
      order: { createdAt: "ASC" },
    });

    // 🔥 Total completed qty
    const completedQty = progress.reduce((sum, p) => sum + p.qty, 0);

    const remainingQty = style.quantity - completedQty;

    // 🔥 Safe parsing JSON fields
    const photoUrls = Array.isArray(style.photoUrls)
      ? style.photoUrls
      : typeof style.photoUrls === "string"
      ? JSON.parse(style.photoUrls)
      : [];

    const comments = Array.isArray(style.comments)
      ? style.comments
      : typeof style.comments === "string"
      ? JSON.parse(style.comments)
      : [];

    const customColor = Array.isArray(style.customColor)
      ? style.customColor
      : typeof style.customColor === "string"
      ? JSON.parse(style.customColor)
      : [];

    const customSize = Array.isArray(style.customSize)
      ? style.customSize
      : typeof style.customSize === "string"
      ? JSON.parse(style.customSize)
      : [];

    const customSizesQuantity = Array.isArray(style.customSizesQuantity)
      ? style.customSizesQuantity
      : typeof style.customSizesQuantity === "string"
      ? JSON.parse(style.customSizesQuantity)
      : [];

    res.json({
      success: true,
      data: {
        orderId: style.order.id,
        purchaeOrderNo: style.order.purchaeOrderNo,

        // 🔥 FULL STYLE DETAILS
        styleId: style.id,
        styleNo: style.styleNo,
        quantity: style.quantity,
        barcode: style.barcode,

        colorType: style.colorType,
        customColor,
        sizeCountry: style.sizeCountry,
        size: style.size,
        customSize,
        customSizesQuantity,

        mesh_color: style.mesh_color,
        beading_color: style.beading_color,
        lining: style.lining,
        lining_color: style.lining_color,

        comments,
        photoUrls,

        // 🔥 PROGRESS + REMAINING
        progress,
        completedQty,
        remainingQty,
      },
    });
  })
);

PublicStoreRoutes.post(
  "/store-scan-update",
  asyncHandler(async (req: Request, res: Response) => {
    const { barcode } = req.body;

    if (!barcode) {
      return res.json({
        success: false,
        message: "Barcode required",
      });
    }

    // 1️⃣ Find style + order (sirf validation ke liye)
    const style = await Style.findOne({
      where: { barcode },
      relations: ["order"],
    });

    if (!style) {
      return res.json({
        success: false,
        message: "Invalid barcode",
      });
    }

    const order = style.order;

    // 2️⃣ Last progress
    const lastProgress = await StoreStyleProgress.findOne({
      where: { barcode },
      order: { createdAt: "DESC" },
    });

 const currentStage: OrderStatus | null =
  lastProgress?.status
    ? (lastProgress.status as OrderStatus)
    : null;


    const nextStage = getNextStatus(currentStage);

    // 🔒 STORE cannot mark Ready To Delivery
    if (nextStage === OrderStatus.Ready_To_Delivery) {
      return res.json({
        success: false,
        message: "Ready To Delivery can be done only by Admin",
      });
    }

    // 🔒 BLOCK SHIP IF BALANCE PENDING
    if (
      nextStage === OrderStatus.Shipped &&
      order.orderStatus === OrderStatus.Balance_Pending
    ) {
      return res.json({
        success: false,
        message: "Balance pending. Cannot ship order.",
      });
    }

    // ❌ same stage again
    if (currentStage === nextStage) {
      return res.json({
        success: false,
        message: `Already at ${nextStage}`,
      });
    }

    // 3️⃣ 🔥 SINGLE SOURCE OF TRUTH
    await updateOrderByBarcode(
      barcode,
      nextStage,
      1 // qty = 1 → store scan
    );

    return res.json({
      success: true,
      barcode,
      currentStage,
      nextStage,
    });
  })
);











const STORE_STATUS_FLOW = [
  OrderStatus.Pattern,
  OrderStatus.Khaka,
  OrderStatus.Issue_Beading,
  OrderStatus.Beading,
  OrderStatus.Zarkan,
  OrderStatus.Stitching,
  OrderStatus.Balance_Pending,
  OrderStatus.Shipped,
];


function getNextStatus(current: OrderStatus | null): OrderStatus {
  if (!current) return STORE_STATUS_FLOW[0];

  // 🔒 admin ke baad store sirf ship kare
  if (current === OrderStatus.Ready_To_Delivery)
    return OrderStatus.Shipped;

  const index = STORE_STATUS_FLOW.indexOf(current);
  return STORE_STATUS_FLOW[index + 1] || current;
}



PublicStoreRoutes.get(
  "/store-status/report/:orderId",
  asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.params;

    const rows = await db.query(
      `
      SELECT
        s.id AS styleId,
        s.styleNo,
        s.barcode,

        s.size,
        s.quantity,

        o.purchaeOrderNo,

        -- ✅ SAME FIX AS OTHER REPORTS
        CONCAT(
          'SAS(',
          COALESCE(pc.name, s.mesh_color),
          ')'
        ) AS meshColor

      FROM orderstyles s
      INNER JOIN orders o
        ON o.id = s.orderId

      LEFT JOIN product_colours pc
        ON LOWER(pc.hexcode) = LOWER(s.mesh_color)

      WHERE o.id = ?
      ORDER BY s.id ASC
      `,
      [orderId]
    );

    const final = [];

    for (const row of rows) {
      const progress = await StoreStyleProgress.find({
        where: { barcode: row.barcode },
        order: { createdAt: "ASC" },
      });

      const completedQty = progress.reduce((sum, p) => sum + p.qty, 0);

      final.push({
        styleId: row.styleId,
        styleNo: row.styleNo,
        barcode: row.barcode,

        // ✅ LABEL DATA
        size: row.size,
        quantity: row.quantity,
        meshColor: row.meshColor,
        purchaseOrderNo: row.purchaeOrderNo,

        totalQty: row.quantity,
        completedQty,
        remainingQty: row.quantity - completedQty,
        progress,
      });
    }

    res.json({ success: true, data: final });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const order = await RetailerOrder.findOne({
      where: { id: Number(id) },
      relations: [
        "retailer",
        "retailer.customer",
        "favourite_order",
        "Stock_order",
      ],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Retailer order not found",
      });
    }

    const styles = await Style.find({
      where: { order: { id: Number(id) } },
    });

    res.json({
      success: true,
      data: { ...order, styles },
    });
  })
);


router.get(
  "/retailer/store-orders/:retailerId",
  asyncHandler(async (req: Request, res: Response) => {
    const { retailerId } = req.params;
    const { page = 1 } = req.query;

    const take = 10;
    const skip = (Number(page) - 1) * take;

    const [orders] = await db.query(
      `
      SELECT 
        o.id,
        o.purchaeOrderNo,
        o.orderType,
        o.orderStatus,
        o.trackingNo,
        o.orderReceivedDate,
        DATE_FORMAT(o.createdAt,'%Y-%m-%d') as createdAt
      FROM orders o
      WHERE o.status = 0
      ORDER BY o.createdAt DESC
      LIMIT ? OFFSET ?
      `,
      [take, skip]
    );

    res.json({
      success: true,
      orders,
      totalCount: orders.length,
    });
  })
);


router.put(
  "/mark-ready",
  asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID required",
      });
    }

    // 1️⃣ Find order with styles
    const order = await Order.findOne({
      where: { id: orderId },
      relations: ["styles"],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // 2️⃣ Already Ready?
    if (order.orderStatus === OrderStatus.Ready_To_Delivery) {
      return res.json({
        success: false,
        message: "Order already Ready To Delivery",
      });
    }

    // 3️⃣ 🔥 ADMIN ACTION — SAME ENGINE AS STORE SCAN
    for (const style of order.styles) {
      await updateOrderByBarcode(
        style.barcode,
        OrderStatus.Ready_To_Delivery,
        0 // qty = 0 → admin action
      );
    }

    return res.json({
      success: true,
      message: "Order marked Ready To Delivery",
    });
  })
);

