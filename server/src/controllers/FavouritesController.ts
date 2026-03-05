// import { Request, Response, Router, json, raw } from "express";
// import asyncHandler from "../middleware/AsyncHandler";
// import Favourites from "../models/Favourites";
// import { Equal, Like } from "typeorm";
// import Retailer from "../models/Retailer";
// import Product from "../models/Product";
// import Stock from "../models/Stock";
// import ProductColour from "../models/ProductColours";
// import Busboy from "busboy";
// import sharp from "sharp";
// import { getFullUrl, storeFileInS3 } from "../lib/s3";
// import ProductCurrencyPricing from "../models/ProductCurrencyPricing";
// import Currency from "../models/Currency";
// import { convertToUSSize } from "../lib/sizeConversion";


// const router = Router();

// router.get(
//   "/",
//   asyncHandler(async (req: Request, res: Response) => {
//     const {
//       page,
//       query,
//     }: {
//       page?: string;
//       query?: string;
//     } = req.query;

//     if (!page) {
//       const favourites = await Favourites.find({});
//       const totalCount = await Favourites.count({});

//       return res.json({
//         favourites,
//         totalCount,
//       });
//     } else {
//       const skip = (page ? Number(page) - 1 : 0) * 10;

//       const favourites = await Favourites.find({
//         skip,
//         take: 10,
//       });

//       const totalCount = await Favourites.count({});

//       res.json({
//         favourites,
//         totalCount,
//       });
//     }
//   })
// );

// router.patch(
//   "/quantity",
//   asyncHandler(async (req: Request, res: Response) => {
//     const { favouriteId, quantity } = req.body;

//     const fav = await Favourites.findOneOrFail({
//       where: {
//         id: favouriteId,
//       },
//     });

//     fav.quantity = quantity;
//     await fav.save();
//     res.json({
//       success: true,
//       message: "Favourite added successfully",
//     });
//   })
// );

// router.post(
//   "/",
//   raw({
//     type: "multipart/form-data",
//     limit: "100mb",
//   }),
//   asyncHandler(async (req: Request, res: Response) => {
//     const busboy = Busboy({ headers: req.headers });
//     const filePromises: Promise<FileData>[] = [];
//     let retailerId = "";
//     let productId = "";
//     let productDetails: any = [];

//     // Handle form fields
//     busboy.on("field", (fieldname: string, value: string) => {
//       switch (fieldname) {
//         case "retailerId":
//           retailerId = value;
//           break;
//         case "productId":
//           productId = value;
//           break;
//         case "productDetails":
//           try {
//             productDetails = JSON.parse(value);
//           } catch (error) {
//             console.error("Error parsing productDetails:", error);
//             productDetails = [];
//           }
//           break;
//       }
//     });

//     // Handle files
//     busboy.on(
//       "file",
//       (
//         fieldname: string,
//         file: NodeJS.ReadableStream,
//         filename: string,
//         encoding: string,
//         mimetype: string
//       ) => {
//         const buffers: Buffer[] = [];

//         const filePromise = new Promise<FileData>((resolve, reject) => {
//           file.on("data", (data: Buffer) => buffers.push(data));
//           file.on("end", () => {
//             resolve({
//               fieldname,
//               filename,
//               encoding,
//               mimetype,
//               buffer: Buffer.concat(buffers),
//             });
//           });
//           file.on("error", reject);
//         });

//         filePromises.push(filePromise);
//       }
//     );

//     busboy.on("finish", async () => {
//       try {
//         // Validate required fields
//         if (!retailerId || !productId) {
//           return res
//             .status(400)
//             .json({ error: "Missing retailerId or productId" });
//         }

//         // Process files
//         const files = await Promise.all(filePromises);
//         const processedFiles = await Promise.all(
//           files.map(async (file, index: number) => {
//             const compressedImage = await sharp(file.buffer)
//               .resize(1000, 1600, {
//                 fit: "fill",
//                 position: "center",
//               })
//               .webp({ quality: 100 })
//               .toBuffer();

//             const fileName = `uploads/reference/${Date.now()}-${Math.random()
//               .toString(36)
//               .substring(7)}.webp`;

//             const s3Response = await storeFileInS3(compressedImage, fileName);

//             return {
//               ...file,
//               url: getFullUrl(s3Response?.fileName as string),
//               buffer: compressedImage,
//             };
//           })
//         );

//         const retailer = await Retailer.findOneOrFail({
//           where: { id: Number(retailerId) },
//           relations: ["customer", "customer.currency"],
//         });

//         const product = await Product.findOneOrFail({
//           where: { id: Number(productId) },
//           relations: ["currencyPricing", "currencyPricing.currency"],
//         });

//         // Get retailer's currency for price calculation
//         let retailerCurrency: any;
//         if (retailer.customer && retailer.customer.currency) {
//           retailerCurrency = retailer.customer.currency;
//         }

//         const savePromises = productDetails.map(
//           async (detail: any, index: number) => {
//             const favourite = new Favourites();
//             favourite.product = product;
//             favourite.retailer = retailer;
//             favourite.color = detail.color;
//             favourite.add_lining = detail.addLining;
//             favourite.beading_color = detail.beading;
//             favourite.lining = detail.lining;
//             // favourite.lining_color = detail.liningColor;
//             favourite.lining_color =
//               detail.lining === "No Lining" ? "No Color" : detail.liningColor;

//             favourite.mesh_color = detail.mesh;
//             favourite.quantity = detail.Quantity;
//             favourite.product_size = detail.size;
//             favourite.size_country = detail.size_country;
//             favourite.customization = detail.customization;

//             // Store retailer's currency for order processing
//             if (retailerCurrency) {
//               favourite.currency = retailerCurrency;
//               favourite.currencyId = retailerCurrency.id;
//             }

//             if (processedFiles.length > 0) {
//               const filesUrl = processedFiles
//                 .filter(
//                   (i, filterIndex: number) => i.fieldname == `files[${index}][]`
//                 )
//                 .map((item) => {
//                   return item.url;
//                 });
//               favourite.reference_image = JSON.stringify(filesUrl);
//             }

//             return favourite.save();
//           }
//         );

//         await Promise.all(savePromises);

//         res.json({
//           success: true,
//           message: "Favourite added successfully with files",
//         });
//       } catch (error) {
//         console.error("Error processing request:", error);
//         res
//           .status(
//             error instanceof Error &&
//               error.message === "Only image files are allowed"
//               ? 400
//               : 500
//           )
//           .json({
//             error:
//               error instanceof Error
//                 ? error.message
//                 : "An error occurred while processing the request",
//           });
//       }
//     });

//     busboy.end(req.body);
//   })
// );

// // Add these interfaces to support the file handling
// interface FileData {
//   fieldname: string;
//   filename: string;
//   encoding: string;
//   mimetype: string;
//   buffer: Buffer;
// }

// router.delete(
//   "/",
//   asyncHandler(async (req: Request, res: Response) => {
//     const { retailerId, productId, favouriteId } = req.body;

//     const retailer = await Retailer.findOneOrFail({
//       where: {
//         id: Number(retailerId),
//       },
//     });

//     const product = await Product.findOneOrFail({
//       where: {
//         id: Number(productId),
//       },
//     });

//     if (!retailer || !product) {
//       return res.status(404).json({
//         success: false,
//         message: "Favourite not found",
//       });
//     }

//     if (Array.isArray(favouriteId)) {
//       for (let index = 0; index < favouriteId.length; index++) {
//         const favourite = await Favourites.findOneOrFail({
//           where: {
//             id: favouriteId[index],
//           },
//         });

//         const remove = await Favourites.findOne({
//           where: {
//             product: {
//               id: favourite.product.id,
//             },
//             is_order_placed: 0,
//           },
//         });

//         await favourite.remove();
//       }
//     } else {
//       const favourite = await Favourites.findOneOrFail({
//         where: {
//           id: favouriteId,
//         },
//       });

//       await favourite.remove();
//     }

//     res.json({
//       success: true,
//       message: "Favourite removed successfully",
//     });
//   })
// );

// // get favourites by customer id
// router.get(
//   "/customer/:id",
//   asyncHandler(async (req: Request, res: Response) => {
//     const { id } = req.params;

//     const retailer = await Retailer.findOneOrFail({
//       where: {
//         id: Number(id),
//       },
//     });

//     const favourites = await Favourites.find({
//       where: {
//         retailer: {
//           id: retailer.id,
//         },
//         is_order_placed: 0,
//       },
//       relations: [
//         "product",
//         "product.images",
//         "product.currencyPricing",
//         "product.currencyPricing.currency",
//         "currency",
//       ],
//     });

//     // for every favourites, get the productCode, and get their stocks

//     const stocks = await Promise.all(
//       favourites.map(async (favourite) => {
//         const stock = await Stock.find({
//           where: {
//             styleNo: favourite.product.productCode,
//           },
//         });

//         return stock;
//       })
//     );

//     const modifiedFavourites = favourites.map((favourite, index) => {
//       // Calculate currency-specific price
//       let displayPrice = favourite.product.price; // Default Euro price

//       if (favourite.currency) {
//         // Find product price in favourite's stored currency
//         const currencyPricing = favourite.product.currencyPricing.find(
//           (pricing) => pricing.currency.id === favourite.currency.id
//         );

//         if (currencyPricing) {
//           displayPrice = currencyPricing.price;
//         }
//       }

//       // Apply size-based tiered markup
//       const size = Number(favourite.product_size);
//       // Replace the tier calculation with:
//       let markup = 1;
//       if (size >= 60) {
//         markup = 1.6;
//       } else if (size >= 56) {
//         markup = 1.4;
//       } else if (size >= 52) {
//         markup = 1.4;
//       } else if (size >= 48) {
//         markup = 1.2;
//       }
//       displayPrice = displayPrice * markup;

//       return {
//         ...favourite,
//         stock: stocks[index],
//         displayPrice: Math.round(displayPrice * favourite.quantity),
//         unitPrice: displayPrice,
//         // Frontend expects these fields for currency display
//         currencyName: favourite.currency?.name || null,
//         currencySymbol: favourite.currency?.symbol || null,
//         regionPrice: displayPrice * favourite.quantity,
//       };
//     });

//     res.json({
//       success: true,
//       favourites: modifiedFavourites,
//       rr: favourites,
//     });
//   })
// );

// export default router;

import { Request, Response, Router, json, raw } from "express";
import asyncHandler from "../middleware/AsyncHandler";
import Favourites from "../models/Favourites";
import { Equal, Like } from "typeorm";
import Retailer from "../models/Retailer";
import Product from "../models/Product";
import Stock from "../models/Stock";
import ProductColour from "../models/ProductColours";
import Busboy from "busboy";
import sharp from "sharp";
import { getFullUrl, storeFileInS3 } from "../lib/s3";
import ProductCurrencyPricing from "../models/ProductCurrencyPricing";
import Currency from "../models/Currency";
import { convertToUSSize } from "../lib/sizeConversion";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const {
      page,
      query,
    }: {
      page?: string;
      query?: string;
    } = req.query;

    if (!page) {
      const favourites = await Favourites.find({});
      const totalCount = await Favourites.count({});

      return res.json({
        favourites,
        totalCount,
      });
    } else {
      const skip = (page ? Number(page) - 1 : 0) * 10;

      const favourites = await Favourites.find({
        skip,
        take: 10,
      });

      const totalCount = await Favourites.count({});

      res.json({
        favourites,
        totalCount,
      });
    }
  })
);

router.patch(
  "/quantity",
  asyncHandler(async (req: Request, res: Response) => {
    const { favouriteId, quantity } = req.body;

    const fav = await Favourites.findOneOrFail({
      where: {
        id: favouriteId,
      },
    });

    fav.quantity = quantity;
    await fav.save();
    res.json({
      success: true,
      message: "Favourite added successfully",
    });
  })
);

router.post(
  "/",
  raw({
    type: "multipart/form-data",
    limit: "100mb",
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const busboy = Busboy({ headers: req.headers });
    const filePromises: Promise<FileData>[] = [];
    let retailerId = "";
    let productId = "";
    let productDetails: any = [];

    // Handle form fields
    busboy.on("field", (fieldname: string, value: string) => {
      switch (fieldname) {
        case "retailerId":
          retailerId = value;
          break;
        case "productId":
          productId = value;
          break;
        case "productDetails":
          try {
            productDetails = JSON.parse(value);
          } catch (error) {
            console.error("Error parsing productDetails:", error);
            productDetails = [];
          }
          break;
      }
    });

    // Handle files
    busboy.on(
      "file",
      (
        fieldname: string,
        file: NodeJS.ReadableStream,
        filename: string,
        encoding: string,
        mimetime: string
      ) => {
        const buffers: Buffer[] = [];

        const filePromise = new Promise<FileData>((resolve, reject) => {
          file.on("data", (data: Buffer) => buffers.push(data));
          file.on("end", () => {
            resolve({
              fieldname,
              filename,
              encoding,
              mimetype: mimetime,
              buffer: Buffer.concat(buffers),
            });
          });
          file.on("error", reject);
        });

        filePromises.push(filePromise);
      }
    );

    busboy.on("finish", async () => {
      try {
        if (!retailerId || !productId) {
          return res
            .status(400)
            .json({ error: "Missing retailerId or productId" });
        }

        const files = await Promise.all(filePromises);
        const processedFiles = await Promise.all(
          files.map(async (file, index: number) => {
            const compressedImage = await sharp(file.buffer)
              .resize(1000, 1600, {
                fit: "fill",
                position: "center",
              })
              .webp({ quality: 100 })
              .toBuffer();

            const fileName = `uploads/reference/${Date.now()}-${Math.random()
              .toString(36)
              .substring(7)}.webp`;

            const s3Response = await storeFileInS3(compressedImage, fileName);

            return {
              ...file,
              url: getFullUrl(s3Response?.fileName as string),
              buffer: compressedImage,
            };
          })
        );

        const retailer = await Retailer.findOneOrFail({
          where: { id: Number(retailerId) },
          relations: ["customer", "customer.currency"],
        });

        const product = await Product.findOneOrFail({
          where: { id: Number(productId) },
          relations: ["currencyPricing", "currencyPricing.currency"],
        });

        let retailerCurrency: any;
        if (retailer.customer && retailer.customer.currency) {
          retailerCurrency = retailer.customer.currency;
        }

        const savePromises = productDetails.map(
          async (detail: any, index: number) => {
            const favourite = new Favourites();
            favourite.product = product;
            favourite.retailer = retailer;
            favourite.color = detail.color;
            favourite.add_lining = detail.addLining;
            favourite.beading_color = detail.beading;
            favourite.lining = detail.lining;
            favourite.lining_color =
              detail.lining === "No Lining" ? "No Color" : detail.liningColor;

            favourite.mesh_color = detail.mesh;
            favourite.quantity = detail.Quantity;
            favourite.product_size = detail.size;
            favourite.size_country = detail.size_country;
            favourite.customization = detail.customization;

            // 🔥 Added: Convert & Save US Size
            favourite.admin_us_size = convertToUSSize(
              Number(detail.size),
              detail.size_country
            );

            if (retailerCurrency) {
              favourite.currency = retailerCurrency;
              favourite.currencyId = retailerCurrency.id;
            }

            if (processedFiles.length > 0) {
              const filesUrl = processedFiles
                .filter(
                  (i, filterIndex: number) => i.fieldname == `files[${index}][]`
                )
                .map((item) => {
                  return item.url;
                });
              favourite.reference_image = JSON.stringify(filesUrl);
            }

            return favourite.save();
          }
        );

        await Promise.all(savePromises);

        res.json({
          success: true,
          message: "Favourite added successfully with files",
        });
      } catch (error) {
        console.error("Error processing request:", error);
        res
          .status(
            error instanceof Error &&
              error.message === "Only image files are allowed"
              ? 400
              : 500
          )
          .json({
            error:
              error instanceof Error
                ? error.message
                : "An error occurred while processing the request",
          });
      }
    });

    busboy.end(req.body);
  })
);

interface FileData {
  fieldname: string;
  filename: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
}

router.delete(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const { retailerId, productId, favouriteId } = req.body;

    const retailer = await Retailer.findOneOrFail({
      where: {
        id: Number(retailerId),
      },
    });

    const product = await Product.findOneOrFail({
      where: {
        id: Number(productId),
      },
    });

    if (!retailer || !product) {
      return res.status(404).json({
        success: false,
        message: "Favourite not found",
      });
    }

    if (Array.isArray(favouriteId)) {
      for (let index = 0; index < favouriteId.length; index++) {
        const favourite = await Favourites.findOneOrFail({
          where: {
            id: favouriteId[index],
          },
        });

        const remove = await Favourites.findOne({
          where: {
            product: {
              id: favourite.product.id,
            },
            is_order_placed: 0,
          },
        });

        await favourite.remove();
      }
    } else {
      const favourite = await Favourites.findOneOrFail({
        where: {
          id: favouriteId,
        },
      });

      await favourite.remove();
    }

    res.json({
      success: true,
      message: "Favourite removed successfully",
    });
  })
);

router.get(
  "/customer/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const retailer = await Retailer.findOneOrFail({
      where: {
        id: Number(id),
      },
    });

    const favourites = await Favourites.find({
      where: {
        retailer: {
          id: retailer.id,
        },
        is_order_placed: 0,
      },
      relations: [
        "product",
        "product.images",
        "product.currencyPricing",
        "product.currencyPricing.currency",
        "currency",
      ],
    });

    const stocks = await Promise.all(
      favourites.map(async (favourite) => {
        const stock = await Stock.find({
          where: {
            styleNo: favourite.product.productCode,
          },
        });

        return stock;
      })
    );

    const modifiedFavourites = favourites.map((favourite, index) => {
      let displayPrice = favourite.product.price;

      if (favourite.currency) {
        const currencyPricing = favourite.product.currencyPricing.find(
          (pricing) => pricing.currency.id === favourite.currency.id
        );

        if (currencyPricing) {
          displayPrice = currencyPricing.price;
        }
      }

      const size = Number(favourite.product_size);
      let markup = 1;
      if (size >= 60) {
        markup = 1.6;
      } else if (size >= 56) {
        markup = 1.4;
      } else if (size >= 52) {
        markup = 1.4;
      } else if (size >= 48) {
        markup = 1.2;
      }
      displayPrice = displayPrice * markup;

      return {
        ...favourite,
        stock: stocks[index],
        displayPrice: Math.round(displayPrice * favourite.quantity),
        unitPrice: displayPrice,
        currencyName: favourite.currency?.name || null,
        currencySymbol: favourite.currency?.symbol || null,
        regionPrice: displayPrice * favourite.quantity,
      };
    });

    res.json({
      success: true,
      favourites: modifiedFavourites,
      rr: favourites,
    });
  })
);

export default router;
