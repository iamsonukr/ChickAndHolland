import { Request, Response, Router } from "express";
import asyncHandler from "../middleware/AsyncHandler";
import Stock from "../models/Stock";
import { Brackets, FindOptionsWhere, In, Like, Not, IsNull } from "typeorm";
import Product from "../models/Product";
import db from "../db";
import ProductImage from "../models/ProductImage";
import StockCurrencyPricing from "../models/StockCurrencyPricing";
import Currency from "../models/Currency";

const router = Router();

// Helper function to get currency-aware pricing for stock items
const getStockWithCurrencyPricing = (stock: any[], currencyId?: string) => {
  if (!currencyId) {
    return stock; // Return original stock with EUR pricing
  }

  return stock.map((stockItem: any) => {
    // Find pricing for the requested currency
    const currencyPricing = stockItem.currencyPricing?.find(
      (cp: any) => cp.currency.id.toString() === currencyId
    );

    if (currencyPricing) {
      // Use currency-specific pricing
      return {
        ...stockItem,
        price: currencyPricing.price,
        discountedPrice: currencyPricing.discountedPrice,
        currencySymbol: currencyPricing.currency.symbol,
        currencyCode: currencyPricing.currency.code,
      };
    } else {
      // Fallback to EUR (default pricing)
      return {
        ...stockItem,
        currencySymbol: "€",
        currencyCode: "EUR",
      };
    }
  });
};

//old
// router.get(
//   "/",
//   asyncHandler(async (req: Request, res: Response) => {
//     const stockRepository = db.getRepository(Stock);

//     const {
//       page,
//       query = "",
//       currencyId,
//     }: {
//       page?: string;
//       query?: string;
//       currencyId?: string;
//     } = req.query;

//     if (!page) {
//       const stock = await Stock.find({
//         relations: ["currencyPricing", "currencyPricing.currency"]
//       });
//       const totalCount = await Stock.count({});

//       const stockWithCurrency = getStockWithCurrencyPricing(stock, currencyId);

//       res.json({
//         stock: stockWithCurrency,
//         totalCount,
//       });
//     } else {
//       const skip = (page ? Number(page) - 1 : 0) * 100;

//       const likeQuery = `%${query?.toLowerCase()}%`;

//       const stockWithProducts = await stockRepository
//         .createQueryBuilder("stock")
//         .leftJoinAndMapOne(
//           "stock.product",
//           Product,
//           "products",
//           "stock.styleNo = products.id"
//         )
//         .leftJoinAndMapOne(
//           "stock.images",
//           "ProductImage",
//           "ProductImage",
//           "ProductImage.productId = stock.styleNo"
//         )
//         .leftJoinAndMapMany(
//           "stock.currencyPricing",
//           "StockCurrencyPricing",
//           "currencyPricing",
//           "currencyPricing.stockId = stock.id"
//         )
//         .leftJoinAndMapOne(
//           "currencyPricing.currency",
//           "Currency",
//           "currency",
//           "currency.id = currencyPricing.currencyId"
//         )
//         .where(
//           new Brackets((qb) => {
//             qb.where("LOWER(stock.styleNo) LIKE :query", {
//               query: likeQuery,
//             }).orWhere("LOWER(products.productCode) LIKE :query", {
//               query: likeQuery,
//             }); // Example: Searching in `name` column of `Product`
//             // Example: Searching in `description` column of `Product`
//           })
//         )
//         .orderBy("stock.createdAt", "DESC")
//         .skip(skip)
//         .take(100)
//         .getMany();

//       const totalCount = await stockRepository
//         .createQueryBuilder("stock")
//         .leftJoin(Product, "products", "stock.styleNo = products.id")
//         .where(
//           new Brackets((qb) => {
//             qb.where("LOWER(stock.styleNo) LIKE :query", {
//               query: likeQuery,
//             }).orWhere("LOWER(products.productCode) LIKE :query", {
//               query: likeQuery,
//             });
//           })
//         )
//         .getCount();

//       const stockWithCurrency = getStockWithCurrencyPricing(stockWithProducts, currencyId);

//       res.json({
//         stock: stockWithCurrency,
//         totalCount,
//       });
//     }
//   })
// );

//new
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const stockRepository = db.getRepository(Stock);

    const {
      page,
      query = "",
      currencyId,
    }: {
      page?: string;
      query?: string;
      currencyId?: string;
    } = req.query;

    if (!page) {
      const stock = await Stock.find({
        where: { isDeleted: false },
        relations: ["currencyPricing", "currencyPricing.currency"],
      });
      const totalCount = await Stock.count({
        where: { isDeleted: false },
      });

      const stockWithCurrency = getStockWithCurrencyPricing(stock, currencyId);

      res.json({
        stock: stockWithCurrency,
        totalCount,
      });
    } else {
      const skip = (page ? Number(page) - 1 : 0) * 100;

      const likeQuery = `%${query?.toLowerCase()}%`;

      const stockWithProducts = await stockRepository
        .createQueryBuilder("stock")
        .leftJoinAndMapOne(
          "stock.product",
          Product,
          "products",
          "stock.styleNo = products.id"
        )
        .leftJoinAndMapOne(
          "stock.images",
          "ProductImage",
          "ProductImage",
          "ProductImage.productId = stock.styleNo"
        )
        .leftJoinAndMapMany(
          "stock.currencyPricing",
          "StockCurrencyPricing",
          "currencyPricing",
          "currencyPricing.stockId = stock.id"
        )
        .leftJoinAndMapOne(
          "currencyPricing.currency",
          "Currency",
          "currency",
          "currency.id = currencyPricing.currencyId"
        )
        .where(
          new Brackets((qb) => {
            qb.where("LOWER(stock.styleNo) LIKE :query", {
              query: likeQuery,
            }).orWhere("LOWER(products.productCode) LIKE :query", {
              query: likeQuery,
            }); // Example: Searching in `name` column of `Product`
            // Example: Searching in `description` column of `Product`
          })
        )
        .andWhere("stock.isDeleted = false")
        .orderBy("stock.createdAt", "DESC")
        .skip(skip)
        .take(100)
        .getMany();

      const totalCount = await stockRepository
        .createQueryBuilder("stock")
        .leftJoin(Product, "products", "stock.styleNo = products.id")
        .where(
          new Brackets((qb) => {
            qb.where("LOWER(stock.styleNo) LIKE :query", {
              query: likeQuery,
            }).orWhere("LOWER(products.productCode) LIKE :query", {
              query: likeQuery,
            });
          })
        )
        .andWhere("stock.isDeleted = false")
        .getCount();

      const stockWithCurrency = getStockWithCurrencyPricing(
        stockWithProducts,
        currencyId
      );

      res.json({
        stock: stockWithCurrency,
        totalCount,
      });
    }
  })
);

router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const {
      styleNo,
      colorsQuantity,
    }: {
      styleNo: Array<{ value: string; label: string }>;
      colors: string[];
      quantity: number;
      price: number;
      discount: number;
      size: number;
      colorsQuantity: Array<{
        color: string;
        quantity: string;
        price: string;
        size: string;
        discount: string;
        size_country: string;
        beading: string;
        lining: string;
        liningColor: string;
        mesh: string;
        currencyPricing?:
          | Array<{
              currencyId: number;
              price: string;
              discount: string;
            }>
          | undefined;
      }>;
    } = req.body;

    // check if Product exist with this style number
    const product = await Product.findOne({
      where: {
        productCode: styleNo[0].label,
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found with this style number",
      });
    }

    for (let index = 0; index < colorsQuantity.length; index++) {
      const discountedPrice =
        Number(colorsQuantity[index].price) -
        (Number(colorsQuantity[index].price) *
          Number(colorsQuantity[index].discount)) /
          100;
      const whereCondition: FindOptionsWhere<Stock> = {
        styleNo: styleNo[0].value,
        size: Number(colorsQuantity[index].size),
        beading_color: colorsQuantity[index].beading,
        mesh_color: colorsQuantity[index].mesh,
        lining: colorsQuantity[index].lining,
        lining_color:
          colorsQuantity[index].lining === "No Lining"
            ? IsNull()
            : colorsQuantity[index].liningColor,
      };

      const stockExist = await Stock.findOne({
        where: whereCondition,
      });

      if (stockExist) {
        stockExist.quantity += Number(colorsQuantity[index].quantity);
        stockExist.price = Number(colorsQuantity[index].price);
        stockExist.discount = Number(colorsQuantity[index].discount);
        stockExist.discountedPrice = discountedPrice;
        await stockExist.save();

        // Handle currency pricing for existing stock
        if (
          colorsQuantity[index].currencyPricing &&
          colorsQuantity[index].currencyPricing!.length > 0
        ) {
          for (const currencyPrice of colorsQuantity[index].currencyPricing!) {
            const currency = await Currency.findOne({
              where: { id: currencyPrice.currencyId },
            });
            if (currency) {
              const currencyDiscountedPrice =
                Number(currencyPrice.price) -
                (Number(currencyPrice.price) * Number(currencyPrice.discount)) /
                  100;

              // Check if currency pricing already exists for this stock
              let existingCurrencyPricing = await StockCurrencyPricing.findOne({
                where: {
                  stock: { id: stockExist.id },
                  currency: { id: currency.id },
                },
              });

              if (existingCurrencyPricing) {
                existingCurrencyPricing.price = Number(currencyPrice.price);
                existingCurrencyPricing.discountedPrice =
                  currencyDiscountedPrice;
                await existingCurrencyPricing.save();
              } else {
                const stockCurrencyPricing = StockCurrencyPricing.create({
                  price: Number(currencyPrice.price),
                  discountedPrice: currencyDiscountedPrice,
                  stock: stockExist,
                  currency: currency,
                });
                await stockCurrencyPricing.save();
              }
            }
          }
        }
      } else {
        const stock = Stock.create({
          styleNo: styleNo[0].value,
          quantity: Number(colorsQuantity[index].quantity),
          price: Number(colorsQuantity[index].price),
          discount: Number(colorsQuantity[index].discount),
          discountedPrice,
          size: Number(colorsQuantity[index].size),
          size_country: colorsQuantity[index].size_country,
          beading_color: colorsQuantity[index].beading,
          mesh_color: colorsQuantity[index].mesh,
          lining: colorsQuantity[index].lining,
          lining_color:
            colorsQuantity[index].lining === "No Lining"
              ? null
              : colorsQuantity[index].liningColor,
        });
        await stock.save();

        // Handle currency pricing for new stock
        if (
          colorsQuantity[index].currencyPricing &&
          colorsQuantity[index].currencyPricing!.length > 0
        ) {
          for (const currencyPrice of colorsQuantity[index].currencyPricing!) {
            const currency = await Currency.findOne({
              where: { id: currencyPrice.currencyId },
            });
            if (currency) {
              const currencyDiscountedPrice =
                Number(currencyPrice.price) -
                (Number(currencyPrice.price) * Number(currencyPrice.discount)) /
                  100;

              const stockCurrencyPricing = StockCurrencyPricing.create({
                price: Number(currencyPrice.price),
                discountedPrice: currencyDiscountedPrice,
                stock: stock,
                currency: currency,
              });
              await stockCurrencyPricing.save();
            }
          }
        }
      }
    }
    return res.json({ success: true });
  })
);

router.get(
  "/:stockId/image",
  asyncHandler(async (req: Request, res: Response) => {
    const { stockId } = req.params;

    if (!stockId || isNaN(parseInt(stockId))) {
      return res.status(400).json({
        success: false,
        message: "Please provide stockId in params",
      });
    }

    const stock = await Stock.findOne({ where: { id: parseInt(stockId) } });

    if (!stock) {
      return res.status(404).json({
        success: false,
        message: "Stock not found",
      });
    }

    const product = await Product.findOne({
      where: { id: Number(stock?.styleNo) },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const productImages = await ProductImage.find({
      where: { product: { id: product.id } },
    });

    if (!productImages.length) {
      return res.status(404).json({
        success: false,
        message: "Product images not found",
      });
    }

    if (!stock) {
      return res.status(404).json({
        success: false,
        message: "Stock not found",
      });
    }

    return res.json({
      success: true,
      images: productImages,
    });
  })
);

router.get(
  "/stock-details",
  // get stock dtails of ids in search query params exurl: /http://192.168.1.186:5001/api/stock/stock-details?ids=921%2C924%2C917
  asyncHandler(async (req: Request, res: Response) => {
    const { ids } = req.query;

    if (!ids) {
      return res.status(400).json({
        success: false,
        message: "Please provide ids in query params",
      });
    }

    const productCodes = (ids as string).split(",");

    // console.log("productCodes: ", productCodes);

    // we need to search based on product code
    const stockDetails = await Stock.find({
      where: {
        styleNo: In(productCodes),
      },
      relations: ["currencyPricing", "currencyPricing.currency"],
    });

    // also join the product when product.productCode = stock.styleNo... and get the product details
    const productDetails = await Product.find({
      where: {
        productCode: In(productCodes),
      },
      relations: ["images"],
    });

    let modifiedStockDetails = stockDetails.map((stock) => {
      const product = productDetails.find(
        (product) => product.productCode === stock.styleNo
      );

      return {
        ...stock,
        product,
      };
    });

    // remove duplicates
    modifiedStockDetails = modifiedStockDetails.filter(
      (stock, index, self) =>
        index === self.findIndex((t) => t.styleNo === stock.styleNo)
    );

    res.json({
      stockDetails: modifiedStockDetails,
      productCodes,
      success: true,
    });
  })
);

router.get(
  "/stock-by-productid/:productId",
  asyncHandler(async (req: Request, res: Response) => {
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Please provide productId in params",
      });
    }

    const product = await Product.findOne({
      where: { id: parseInt(productId) },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const stocks = await Stock.find({
      where: { styleNo: product.productCode },
      relations: ["currencyPricing", "currencyPricing.currency"],
    });

    res.json({
      success: true,
      stocks,
    });
  })
);

router.get(
  "/searchStyleNo",
  asyncHandler(async (req: Request, res: Response) => {
    const { query } = req.query;

    const likeQuery = `%${query}%`;

    const whereConditions = [{ styleNo: Like(likeQuery) }];

    const stock = await Stock.find({ where: whereConditions });

    const formattedStock = stock.map((s) => ({
      value: s.styleNo,
      label: s.styleNo,
    }));

    const uniqueStockMap = new Map();
    formattedStock.forEach((s) => {
      if (!uniqueStockMap.has(s.label)) {
        uniqueStockMap.set(s.label, s);
      }
    });

    const uniqueStock = Array.from(uniqueStockMap.values());

    res.json({
      stock: uniqueStock,
      success: true,
    });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const stock = await Stock.findOneOrFail({
      where: {
        id: Number(req.params.id),
      },
      relations: ["currencyPricing", "currencyPricing.currency"],
    });

    res.json(stock);
  })
);

router.put(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const {
      quantity,
      price,
      discount,
      beading,
      lining,
      liningColor,
      mesh,
      currencyPricing,
    }: {
      quantity: number;
      price: number;
      discount: number;
      beading: string;
      lining: string;
      liningColor: string;
      mesh: string;
      currencyPricing?:
        | Array<{
            currencyId: number;
            price: string;
            discount: string;
          }>
        | undefined;
    } = req.body;

    // check if stock already exist with this style number, don't check for the same stock

    // check if Product exist with this style number
    // const product = await Product.findOne({
    //   where: {
    //     productCode: styleNo,
    //   },
    // });

    // if (!product) {
    //   return res.status(404).json({
    //     success: false,
    //     message: "Product not found with this style number",
    //   });
    // }

    const discountedPrice = price - (price * discount) / 100;

    const stock = await Stock.findOneOrFail({
      where: {
        id: Number(req.params.id),
      },
    });

    stock.quantity = quantity;
    stock.price = price;
    stock.discount = discount;
    stock.discountedPrice = discountedPrice;
    stock.mesh_color = mesh;
    stock.beading_color = beading;
    stock.lining = lining;
    stock.lining_color = lining === "No Lining" ? null : liningColor;

    await stock.save();

    // Handle currency pricing updates
    if (currencyPricing && currencyPricing.length > 0) {
      for (const currencyPrice of currencyPricing) {
        const currency = await Currency.findOne({
          where: { id: currencyPrice.currencyId },
        });
        if (currency) {
          const currencyDiscountedPrice =
            Number(currencyPrice.price) -
            (Number(currencyPrice.price) * Number(currencyPrice.discount)) /
              100;

          // Check if currency pricing already exists for this stock
          let existingCurrencyPricing = await StockCurrencyPricing.findOne({
            where: { stock: { id: stock.id }, currency: { id: currency.id } },
          });

          if (existingCurrencyPricing) {
            existingCurrencyPricing.price = Number(currencyPrice.price);
            existingCurrencyPricing.discountedPrice = currencyDiscountedPrice;
            await existingCurrencyPricing.save();
          } else {
            const stockCurrencyPricing = StockCurrencyPricing.create({
              price: Number(currencyPrice.price),
              discountedPrice: currencyDiscountedPrice,
              stock: stock,
              currency: currency,
            });
            await stockCurrencyPricing.save();
          }
        }
      }
    }

    // Reload stock with currency pricing to return updated data
    const updatedStock = await Stock.findOne({
      where: { id: stock.id },
      relations: ["currencyPricing", "currencyPricing.currency"],
    });

    res.json({
      ...updatedStock,
      success: true,
    });
  })
);

//hard delete old

// router.delete(
//   "/:id",
//   asyncHandler(async (req: Request, res: Response) => {
//     try {
//       const stock = await Stock.findOneOrFail({
//         where: { id: Number(req.params.id) },
//       });

//       await stock.remove();

//       res.json({
//         success: true,
//         message: "Stock deleted successfully",
//       });
//     } catch (error: any) {
//       if (
//         error.name === "QueryFailedError" &&
//         error.message.includes("foreign key")
//       ) {
//         return res.status(400).json({
//           success: false,
//           message: "Cannot delete stock as it is referenced by other records.",
//         });
//       }

//       res.status(500).json({
//         success: false,
//         message: "An error occurred while deleting the stock.",
//       });
//     }
//   })
// );

//soft delete
router.delete(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const stockRepository = db.getRepository(Stock);

      const stock = await stockRepository.findOneOrFail({
        where: { id: Number(req.params.id), isDeleted: false },
      });

      stock.isDeleted = true;
      await stockRepository.save(stock);

      res.json({
        success: true,
        message: "Stock soft-deleted successfully",
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Error deleting the stock.",
      });
    }
  })
);

// get all stocks with a specific style number
router.get(
  "/style/:styleNo",
  asyncHandler(async (req: Request, res: Response) => {
    const stock = await Stock.find({
      where: {
        styleNo: req.params.styleNo,
      },
      relations: ["currencyPricing", "currencyPricing.currency"],
    });

    res.json({
      success: true,
      stockDetails: stock,
    });
  })
);

export default router;
