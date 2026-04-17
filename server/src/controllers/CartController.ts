import { Request, Response, Router, raw } from "express";
import asyncHandler from "../middleware/AsyncHandler";
import Favourites from "../models/Favourites";
import Retailer from "../models/Retailer";
import Product from "../models/Product";
import Stock from "../models/Stock";
import Busboy from "busboy";
import sharp from "sharp";
import { getFullUrl, storeFileInS3 } from "../lib/s3";
import { convertToUSSize } from "../lib/sizeConversion";

const router = Router();

router.patch(
  "/quantity",
  asyncHandler(async (req: Request, res: Response) => {
    const { cartId, quantity, favouriteId } = req.body;
    const idToUpdate = cartId || favouriteId;

    const row = await Favourites.findOneOrFail({
      where: { id: Number(idToUpdate) },
    });

    row.quantity = quantity;
    await row.save();

    res.json({
      success: true,
      message: "Cart quantity updated successfully",
    });
  }),
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
    let productDetails: any[] = [];

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
            productDetails = [];
          }
          break;
      }
    });

    busboy.on(
      "file",
      (
        fieldname: string,
        file: NodeJS.ReadableStream,
        filename: string,
        encoding: string,
        mimetype: string,
      ) => {
        const buffers: Buffer[] = [];

        const filePromise = new Promise<FileData>((resolve, reject) => {
          file.on("data", (data: Buffer) => buffers.push(data));
          file.on("end", () => {
            resolve({
              fieldname,
              filename,
              encoding,
              mimetype,
              buffer: Buffer.concat(buffers),
            });
          });
          file.on("error", reject);
        });

        filePromises.push(filePromise);
      },
    );

    busboy.on("finish", async () => {
      try {
        if (!retailerId || !productId) {
          return res.status(400).json({ error: "Missing retailerId or productId" });
        }

        const files = await Promise.all(filePromises);
        const processedFiles = await Promise.all(
          files.map(async (file) => {
            const compressedImage = await sharp(file.buffer)
              .resize(1000, 1600, {
                fit: "fill",
                position: "center",
              })
              .webp({ quality: 100 })
              .toBuffer();

            const fileName = `uploads/reference/${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;
            const s3Response = await storeFileInS3(compressedImage, fileName);

            return {
              ...file,
              url: getFullUrl(s3Response?.fileName as string),
              buffer: compressedImage,
            };
          }),
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

        const savePromises = productDetails.map(async (detail: any, index: number) => {
          const cartItem = new Favourites();
          cartItem.product = product;
          cartItem.retailer = retailer;
          cartItem.color = detail.color;
          cartItem.add_lining = detail.addLining;
          cartItem.beading_color = detail.beading;
          cartItem.lining = detail.lining;
          cartItem.lining_color =
            detail.lining === "No Lining" ? "No Color" : detail.liningColor;
          cartItem.mesh_color = detail.mesh;
          cartItem.quantity = detail.Quantity;
          cartItem.product_size = detail.size;
          cartItem.size_country = detail.size_country;
          cartItem.customization = detail.customization;
          cartItem.admin_us_size = convertToUSSize(
            Number(detail.size),
            detail.size_country,
          );

          if (retailerCurrency) {
            cartItem.currency = retailerCurrency;
            cartItem.currencyId = retailerCurrency.id;
          }

          if (processedFiles.length > 0) {
            const filesUrl = processedFiles
              .filter((item) => item.fieldname === `files[${index}][]`)
              .map((item) => item.url);
            cartItem.reference_image = JSON.stringify(filesUrl);
          }

          return cartItem.save();
        });

        await Promise.all(savePromises);

        return res.json({
          success: true,
          message: "Added to cart successfully",
        });
      } catch (error) {
        return res.status(500).json({
          error:
            error instanceof Error
              ? error.message
              : "An error occurred while processing the request",
        });
      }
    });

    busboy.end(req.body);
  }),
);

router.delete(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const { favouriteId, cartId } = req.body;
    const idToDelete = cartId || favouriteId;

    if (!idToDelete) {
      return res.status(400).json({
        success: false,
        message: "cartId is required",
      });
    }

    const row = await Favourites.findOneOrFail({
      where: { id: Number(idToDelete) },
    });

    await row.remove();

    return res.json({
      success: true,
      message: "Removed from cart successfully",
    });
  }),
);

router.get(
  "/customer/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const retailer = await Retailer.findOneOrFail({
      where: { id: Number(id) },
    });

    const cartItems = await Favourites.find({
      where: {
        retailer: { id: retailer.id },
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
      cartItems.map(async (item) =>
        Stock.find({
          where: { styleNo: item.product.productCode },
        }),
      ),
    );

    const modified = cartItems.map((item, index) => {
      let displayPrice = item.product.price;

      if (item.currency) {
        const currencyPricing = item.product.currencyPricing.find(
          (pricing) => pricing.currency.id === item.currency.id,
        );
        if (currencyPricing) {
          displayPrice = currencyPricing.price;
        }
      }

      const size = Number(item.product_size);
      let markup = 1;
      if (size >= 58) markup = 1.6;
      else if (size >= 54) markup = 1.4;
      else if (size >= 50) markup = 1.2;

      displayPrice = displayPrice * markup;

      return {
        ...item,
        stock: stocks[index],
        displayPrice: Math.round(displayPrice * item.quantity),
        unitPrice: displayPrice,
        currencyName: item.currency?.name || null,
        currencySymbol: item.currency?.symbol || null,
        regionPrice: displayPrice * item.quantity,
      };
    });

    res.json({
      success: true,
      cart: modified,
    });
  }),
);

interface FileData {
  fieldname: string;
  filename: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
}

export default router;
