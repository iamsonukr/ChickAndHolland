import { Request, Response, Router, raw } from "express";
import asyncHandler from "../middleware/AsyncHandler";
import Favourites from "../models/Favourites";
import Retailer from "../models/Retailer";
import Product from "../models/Product";
import Stock from "../models/Stock";
import Category from "../models/Category";
import SubCategory from "../models/SubCategory";
import ProductImage from "../models/ProductImage";
import RetailerFavouritesOrders from "../models/ReailerFavouritesOrder";
import Busboy from "busboy";
import sharp from "sharp";
import path from "path";
import { getFullUrl, storeFileInS3 } from "../lib/s3";
import { convertToUSSize } from "../lib/sizeConversion";
import db from "../db";
import { TABLE_NAMES } from "../constants";
import {
  generateNextSampleOrderStyleNo,
  peekNextSampleOrderStyleNo,
} from "../utils/generatePO";

const router = Router();
const SAMPLE_CATEGORY_NAME = "Retailer Collection";
const SAMPLE_SUBCATEGORY_NAME = "Custom Category";
const SAMPLE_CATEGORY_ALIASES = ["Retailer Collection"];
const SAMPLE_SUBCATEGORY_ALIASES = ["Custom Category", "Custom"];
const ALLOWED_IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".heic",
  ".heif",
]);

const sanitizeText = (value: unknown) => {
  const text = String(value ?? "").trim();
  return text &&
    text.toLowerCase() !== "undefined" &&
    text.toLowerCase() !== "null"
    ? text
    : "";
};

const parsePositiveQuantity = (value: unknown) => {
  const quantity = Number(String(value ?? "").trim());
  return Number.isInteger(quantity) && quantity > 0 ? quantity : 0;
};

const safeJsonArray = (value: unknown) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string" || !value.trim()) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const normalizeBusboyFileInfo = (
  filenameOrInfo: any,
  encoding?: string,
  mimetype?: string,
) => {
  if (filenameOrInfo && typeof filenameOrInfo === "object") {
    return {
      filename: sanitizeText(filenameOrInfo.filename),
      encoding: sanitizeText(filenameOrInfo.encoding),
      mimetype: sanitizeText(
        filenameOrInfo.mimeType ?? filenameOrInfo.mimetype,
      ),
    };
  }

  return {
    filename: sanitizeText(filenameOrInfo),
    encoding: sanitizeText(encoding),
    mimetype: sanitizeText(mimetype),
  };
};

const isAllowedImageFile = (file: FileData) => {
  const mimetype = sanitizeText(file.mimetype).toLowerCase();
  if (mimetype.startsWith("image/")) return true;

  const extension = path.extname(file.filename).toLowerCase();
  return ALLOWED_IMAGE_EXTENSIONS.has(extension);
};

const getUploadedImageExtension = (file: FileData) => {
  const extension = path.extname(file.filename).toLowerCase();
  return ALLOWED_IMAGE_EXTENSIONS.has(extension) ? extension : ".jpg";
};

const buildSampleImageKey = (suffix: string, extension = ".webp") =>
  `uploads/sample-orders/${Date.now()}-${Math.random()
    .toString(36)
    .substring(7)}-${suffix}${extension}`;

const uploadOriginalSampleImage = async (file: FileData, suffix: string) => {
  const fileName = buildSampleImageKey(suffix, getUploadedImageExtension(file));
  const s3Response = await storeFileInS3(file.buffer, fileName, {
    contentType: file.mimetype || undefined,
  });

  return getFullUrl(s3Response?.fileName as string);
};

const uploadCompressedSampleImage = async (file: FileData, suffix: string) => {
  const compressedImage = await sharp(file.buffer)
    .resize(1000, 1600, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 100 })
    .toBuffer();
  const fileName = buildSampleImageKey(suffix);
  const s3Response = await storeFileInS3(compressedImage, fileName, {
    contentType: "image/webp",
  });

  return getFullUrl(s3Response?.fileName as string);
};

const findCategoryByAliases = async (aliases: string[]) => {
  const normalizedAliases = aliases.map((alias) => alias.toLowerCase());
  const rows = await db.query(
    `
      SELECT id
      FROM \`${TABLE_NAMES.CATEGORIES}\`
      WHERE LOWER(name) IN (?)
        AND deletedAt IS NULL
      ORDER BY id ASC
      LIMIT 1
    `,
    [normalizedAliases],
  );

  return rows?.[0]?.id
    ? Category.findOne({ where: { id: Number(rows[0].id) } })
    : null;
};

const findSubCategoryByAliases = async (
  categoryId: number,
  aliases: string[],
) => {
  const normalizedAliases = aliases.map((alias) => alias.toLowerCase());
  const rows = await db.query(
    `
      SELECT id
      FROM \`${TABLE_NAMES.SUBCATEGORY}\`
      WHERE LOWER(name) IN (?)
        AND categoryId = ?
        AND deletedAt IS NULL
      ORDER BY id ASC
      LIMIT 1
    `,
    [normalizedAliases, categoryId],
  );

  return rows?.[0]?.id
    ? SubCategory.findOne({ where: { id: Number(rows[0].id) } })
    : null;
};

const resolveSampleOrderCategory = async () => {
  let category = await findCategoryByAliases(SAMPLE_CATEGORY_ALIASES);

  if (!category) {
    category = Category.create({
      name: SAMPLE_CATEGORY_NAME,
      priority: 0,
    }) as Category;
    await category.save();
  }

  let subCategory = await findSubCategoryByAliases(
    category.id,
    SAMPLE_SUBCATEGORY_ALIASES,
  );

  if (!subCategory) {
    subCategory = SubCategory.create({
      name: SAMPLE_SUBCATEGORY_NAME,
      priority: 0,
      category,
    }) as SubCategory;
    await subCategory.save();
  }

  return { category, subCategory };
};

const generateAvailableSampleStyleNo = async () => {
  for (let attempt = 0; attempt < 50; attempt++) {
    const sequence = await generateNextSampleOrderStyleNo();
    const existingProduct = await Product.findOne({
      where: { productCode: sequence.styleNo },
      withDeleted: true,
    } as any);

    if (!existingProduct) {
      return sequence;
    }
  }

  throw new Error("Unable to reserve a unique sample order style number.");
};

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
          return res
            .status(400)
            .json({ error: "Missing retailerId or productId" });
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

        const savePromises = productDetails.map(
          async (detail: any, index: number) => {
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
          },
        );

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

router.get(
  "/sample-order/next-style",
  asyncHandler(async (_req: Request, res: Response) => {
    const sequence = await peekNextSampleOrderStyleNo();

    return res.json({
      success: true,
      nextNumber: sequence.nextNumber,
      styleNo: sequence.styleNo,
    });
  }),
);

router.post(
  "/sample-order",
  raw({
    type: "multipart/form-data",
    limit: "50mb",
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const busboy = Busboy({ headers: req.headers });
    let retailerId = "";
    let colorType = "";
    let customColor = "";
    let sizeCountry = "";
    let size = "";
    let customSize = "";
    let mesh = "";
    let beading = "";
    let beader = "";
    let addLining = "";
    let lining = "";
    let liningColor = "";
    let quantity = "";
    let comments = "";
    let uploadedPrimaryImage: Promise<FileData> | null = null;
    const uploadedSecondaryImages: Promise<FileData>[] = [];

    busboy.on("field", (fieldname: string, value: string) => {
      switch (fieldname) {
        case "retailerId":
          retailerId = value;
          break;
        case "colorType":
          colorType = value;
          break;
        case "customColor":
          customColor = value;
          break;
        case "sizeCountry":
          sizeCountry = value;
          break;
        case "size":
          size = value;
          break;
        case "customSize":
          customSize = value;
          break;
        case "mesh":
          mesh = value;
          break;
        case "beading":
          beading = value;
          break;
        case "beader":
          beader = value;
          break;
        case "addLining":
          addLining = value;
          break;
        case "lining":
          lining = value;
          break;
        case "liningColor":
          liningColor = value;
          break;
        case "quantity":
          quantity = value;
          break;
        case "comments":
          comments = value;
          break;
      }
    });

    busboy.on(
      "file",
      (
        fieldname: string,
        file: NodeJS.ReadableStream,
        filenameOrInfo: any,
        encoding?: string,
        mimetype?: string,
      ) => {
        if (
          fieldname !== "primaryImage" &&
          fieldname !== "secondaryImages" &&
          fieldname !== "image"
        ) {
          file.resume();
          return;
        }

        const fileInfo = normalizeBusboyFileInfo(
          filenameOrInfo,
          encoding,
          mimetype,
        );
        const buffers: Buffer[] = [];
        const uploadedFile = new Promise<FileData>((resolve, reject) => {
          file.on("data", (data: Buffer) => buffers.push(data));
          file.on("end", () => {
            resolve({
              fieldname,
              filename: fileInfo.filename,
              encoding: fileInfo.encoding,
              mimetype: fileInfo.mimetype,
              buffer: Buffer.concat(buffers),
            });
          });
          file.on("error", reject);
        });

        if (fieldname === "secondaryImages") {
          uploadedSecondaryImages.push(uploadedFile);
        } else {
          uploadedPrimaryImage = uploadedFile;
        }
      },
    );

    busboy.on("finish", async () => {
      try {
        const cleanRetailerId = Number(retailerId);
        const cleanColorType = sanitizeText(colorType);
        const cleanCustomColor = sanitizeText(customColor);
        const cleanSizeCountry = sanitizeText(sizeCountry);
        const cleanSize = sanitizeText(size);
        const cleanCustomSizes = safeJsonArray(customSize)
          .map((item: any) => sanitizeText(item?.value ?? item?.label ?? item))
          .filter(Boolean);
        const cleanIsSasColor = cleanColorType.toUpperCase() === "SAS";
        const cleanMesh = cleanIsSasColor ? "SAS" : sanitizeText(mesh);
        const cleanBeading = cleanIsSasColor ? "SAS" : sanitizeText(beading);
        const cleanBeader = sanitizeText(beader);
        const cleanAddLining = sanitizeText(addLining) === "1";
        const cleanLining = cleanAddLining
          ? sanitizeText(lining) || "No Lining"
          : cleanIsSasColor
            ? "SAS"
            : "No Lining";
        const cleanLiningColor = cleanAddLining
          ? cleanLining === "No Lining"
            ? "No Color"
            : sanitizeText(liningColor)
          : cleanIsSasColor
            ? "SAS"
            : "No Color";
        const cleanQuantity = parsePositiveQuantity(quantity);
        const cleanComments = sanitizeText(comments);
        const primaryImage = uploadedPrimaryImage
          ? await uploadedPrimaryImage
          : null;
        const secondaryImages = await Promise.all(uploadedSecondaryImages);

        if (!cleanRetailerId) {
          return res.status(400).json({
            success: false,
            message: "Retailer is required.",
          });
        }

        if (
          !cleanColorType ||
          !cleanSizeCountry ||
          !cleanSize ||
          (cleanSize === "Custom" && cleanCustomSizes.length === 0) ||
          !cleanMesh ||
          !cleanBeading ||
          !cleanQuantity
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Color type, size, mesh, beading, and quantity are required.",
          });
        }

        if (cleanLining !== "No Lining" && !cleanLiningColor) {
          return res.status(400).json({
            success: false,
            message: "Lining color is required when lining is not No Lining.",
          });
        }

        if (!primaryImage?.buffer?.length) {
          return res.status(400).json({
            success: false,
            message: "Primary image upload is required.",
          });
        }

        if (
          !isAllowedImageFile(primaryImage) ||
          secondaryImages.some((image) => !isAllowedImageFile(image))
        ) {
          return res.status(400).json({
            success: false,
            message: "Only image files are allowed.",
          });
        }

        const retailer = await Retailer.findOneOrFail({
          where: { id: cleanRetailerId },
          relations: ["customer", "customer.currency"],
        });
        const { category, subCategory } = await resolveSampleOrderCategory();
        const sequence = await generateAvailableSampleStyleNo();
        const sampleOrderNotes = [
          "Sample Order",
          `Color Type: ${cleanColorType}`,
          cleanCustomColor ? `Custom Color: ${cleanCustomColor}` : "",
          cleanSize === "Custom" && cleanCustomSizes.length
            ? `Custom Sizes: ${cleanCustomSizes.join(", ")}`
            : "",
          cleanBeader ? `Beader: ${cleanBeader}` : "",
          cleanComments ? `Comments: ${cleanComments}` : "",
        ]
          .filter(Boolean)
          .join("; ");
        const imageUrl = await uploadOriginalSampleImage(
          primaryImage,
          "primary",
        );
        const secondaryImageUrls = await Promise.all(
          secondaryImages.map((image, index) =>
            uploadCompressedSampleImage(image, `secondary-${index + 1}`),
          ),
        );

        const queryRunner = db.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
          const product = new Product();
          product.productCode = sequence.styleNo;
          product.category = category;
          product.subCategory = subCategory;
          product.quantity = cleanQuantity;
          product.color = (cleanCustomColor || cleanColorType).slice(0, 20);
          product.price = 0;
          product.description = sampleOrderNotes || "Sample Order";
          product.mesh_color = cleanMesh;
          product.beading_color = cleanBeading;
          product.beader = cleanBeader || null;
          product.lining = cleanLining;
          product.lining_color = cleanLiningColor;
          product.product_size =
            cleanSize === "Custom" ? 0 : Number(cleanSize) || 0;

          const savedProduct = await queryRunner.manager.save(product);

          const productImage = new ProductImage();
          productImage.product = savedProduct;
          productImage.isMain = true;
          productImage.name = imageUrl;
          await queryRunner.manager.save(productImage);

          const cartItem = new Favourites();
          cartItem.product = savedProduct;
          cartItem.retailer = retailer;
          cartItem.color = cleanColorType;
          cartItem.mesh_color = cleanMesh;
          cartItem.beading_color = cleanBeading;
          cartItem.add_lining = cleanAddLining ? 1 : 0;
          cartItem.lining = cleanLining;
          cartItem.lining_color = cleanLiningColor;
          cartItem.product_size =
            cleanSize === "Custom" && cleanCustomSizes.length
              ? `Custom: ${cleanCustomSizes.join(", ")}`
              : cleanSize;
          cartItem.admin_us_size = convertToUSSize(
            Number(cleanSize),
            cleanSizeCountry,
          );
          cartItem.quantity = cleanQuantity;
          cartItem.product_price = 0;
          cartItem.customization_price = 0;
          cartItem.customization = sampleOrderNotes || "Sample Order";
          cartItem.reference_image = JSON.stringify(
            secondaryImageUrls.filter(Boolean),
          );
          cartItem.size_country = cleanSizeCountry;
          cartItem.is_order_placed = 1;

          if (retailer.customer?.currency) {
            cartItem.currency = retailer.customer.currency;
            cartItem.currencyId = retailer.customer.currency.id;
          }

          await queryRunner.manager.save(cartItem);

          const requestOrder = new RetailerFavouritesOrders();
          requestOrder.favourite_ids = String(cartItem.id);
          requestOrder.retailer = retailer;
          await queryRunner.manager.save(requestOrder);

          await queryRunner.commitTransaction();

          const nextSequence = await peekNextSampleOrderStyleNo();

          return res.json({
            success: true,
            message: "Sample order request submitted successfully.",
            styleNo: sequence.styleNo,
            nextStyleNo: nextSequence.styleNo,
            productId: savedProduct.id,
            cartId: cartItem.id,
            requestId: requestOrder.id,
          });
        } catch (error) {
          await queryRunner.rollbackTransaction();
          throw error;
        } finally {
          await queryRunner.release();
        }
      } catch (error) {
        return res.status(500).json({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "An error occurred while placing the sample order.",
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
