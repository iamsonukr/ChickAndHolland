import { raw, Request, Response, Router } from "express";
import asyncHandler from "../middleware/AsyncHandler";
import {
  dbUpdate,
  relationIdValidator,
  validate,
} from "../middleware/Validator";
import {
  editProductValidator,
  enquiryEmailValidator,
  idValidater,
  imageIdValiadtor,
  productValidator,
} from "../lib/Validations";
import { CLIENT_OBJ_NAMES, FOLDER_NAMES, TABLE_NAMES } from "../constants";
import { created, deleted, updated } from "../lib/Responses";
import Product from "../models/Product";
import { productUpload } from "../lib/upload";
import CONFIG from "../config";
import { NotFound } from "../errors/Errors";
import ProductImage from "../models/ProductImage";
import { In, Like, Not, IsNull } from "typeorm";
import fs from "fs";
import path from "path";
import db from "../db";
import { mail } from "../lib/Utils";
import Stock from "../models/Stock";
import Busboy from "busboy";
import sharp from "sharp";
import { getFullUrl, storeFileInS3 } from "../lib/s3";
import Category from "../models/Category";
import SubCategory from "../models/SubCategory";
import { searchCache } from "../lib/cache.service";
import { CacheController } from "./CacheController";
import ProductCountryPricing from "../models/ProductCountryPricing";
import Country from "../models/Country";
import ProductCurrencyPricing from "../models/ProductCurrencyPricing";
import Currency from "../models/Currency";
import AppDataSource from "../db";
import Favourites from "../models/Favourites";

const router = Router();

/**
 * There will be a chain of validators for every post or patch requests
 * check the validator file for more info
 */

const RES_NAME = "Product";
const PRODUCT_IMAGES = "Product Images";

router.get(
  "/styleNo/:no",
  asyncHandler(async (req: Request, res: Response) => {
    const { no } = req.params;
    let products;
    if (no == "pavan") {
      products = await Product.find({
        select: ["id", "productCode"],
        take: 10,
      });
    } else {
      products = await Product.find({
        select: ["id", "productCode"],
        take: 10,
        where: {
          productCode: Like(`%${no}%`),
        },
      });
    }

    res.json({
      success: true,
      products: products,
    });
  })
);

router.get(
  "/price/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const [price] = await Product.find({
      select: [
        "price",
        "mesh_color",
        "beading_color",
        "lining",
        "lining_color",
      ],
      where: {
        id: Number(id),
      },
    });

    res.json({
      success: true,
      price: price,
    });
  })
);

router.get(
  "/searchStyleNo/",
  asyncHandler(async (req: Request, res: Response) => {
    const { query } = req.query;

    if (typeof query !== "string") {
      return res.status(400).json({
        success: false,
        message: "Query parameter must be a string",
      });
    }

    // Generate a cache key based on the search query
    const cacheKey = `search:${query.toLowerCase()}`;

    // Try to get results from cache first
    const cachedResults = searchCache.get(cacheKey);
    if (cachedResults) {
      return res.json({
        success: true,
        products: cachedResults,
        fromCache: true,
      });
    }

    // If not in cache, perform the database query
    const data = await Product.query(
      `SELECT productCode, id , mesh_color  ,lining , lining_color ,  beading_color FROM ${TABLE_NAMES.PRODUCTS} WHERE productCode LIKE '%${query}%' AND deletedAt IS NULL`
    );

    const formattedData = data.map((d: Product) => ({
      label: d.productCode,
      value: d.productCode,
      productId: d.id,
      mesh: d.mesh_color,
      lining: d.lining,
      liningColor: d.lining_color,
      beading: d.beading_color,
    }));

    searchCache.set(cacheKey, formattedData);

    res.json({
      success: true,
      products: formattedData,
      fromCache: false,
    });
  })
);

router.get(
  "/filter",
  asyncHandler(async (req: Request, res: Response) => {
    const { categoryId, subCategoryId, currencyId } = req.query as {
      categoryId: string;
      subCategoryId: string;
      currencyId: string;
    };

    let products = [] as any[];

    const baseSelect = currencyId
      ? `
        SELECT 
          p.id,
          p.productCode,
          p.price,
          pcp.price as regionPrice,
          c.name as currencyName,
          c.code as currencyCode,
          c.symbol as currencySymbol,
          (SELECT name FROM ${TABLE_NAMES.PRODUCT_IMAGES} WHERE productId = p.id LIMIT 1) as imageName,
          (SELECT name FROM ${TABLE_NAMES.PRODUCT_IMAGES} WHERE productId = p.id LIMIT 1,1) as imageName1
        FROM ${TABLE_NAMES.PRODUCTS} p
        LEFT JOIN ${TABLE_NAMES.PRODUCT_CURRENCY_PRICING} pcp ON p.id = pcp.productId AND pcp.currencyId = ?
        LEFT JOIN ${TABLE_NAMES.CURRENCIES} c ON pcp.currencyId = c.id
        WHERE p.deletedAt IS NULL
      `
      : `
        SELECT 
          p.id,
          p.productCode,
          p.price,
          NULL as regionPrice,
          NULL as currencyName,
          NULL as currencyCode,
          NULL as currencySymbol,
          (SELECT name FROM ${TABLE_NAMES.PRODUCT_IMAGES} WHERE productId = p.id LIMIT 1) as imageName,
          (SELECT name FROM ${TABLE_NAMES.PRODUCT_IMAGES} WHERE productId = p.id LIMIT 1,1) as imageName1
        FROM ${TABLE_NAMES.PRODUCTS} p
        WHERE p.deletedAt IS NULL
      `;

    const queryParams = currencyId ? [currencyId] : [];

    // Rest of your filtering logic remains the same
    if (categoryId && subCategoryId) {
      products = await Product.query(
        baseSelect + ` AND p.categoryId = ? AND p.subCategoryId = ?`,
        [...queryParams, categoryId, subCategoryId]
      );
    } else if (categoryId) {
      products = await Product.query(baseSelect + ` AND p.categoryId = ?`, [
        ...queryParams,
        categoryId,
      ]);
    } else if (subCategoryId) {
      products = await Product.query(
        baseSelect + ` AND p.subCategoryId = ?`,
        [...queryParams, subCategoryId]
      );
    } else {
      products = await Product.query(baseSelect, queryParams);
    }

    res.json(products);
  })
);

router.delete(
  "/:id/image/",
  validate(idValidater),
  validate(imageIdValiadtor),
  asyncHandler(async (req: Request, res: Response) => {
    const { imageIds } = req.body as { imageIds: number[] };
    const productImages = await ProductImage.findBy({ id: In(imageIds) });

    if (!productImages || productImages.length === 0)
      throw new NotFound(`No Images Found With This Ids`);

    for (const image of productImages) {
      const cuttedImage = image.name.split("/"); //splitting the image path to get the image name
      const toDeletePath = path.join(
        process.cwd(),
        FOLDER_NAMES.STATIC,
        FOLDER_NAMES.PRODUCTS,
        cuttedImage[cuttedImage.length - 1]
      );
      // skipping the itearation if the path is not valid or the file does not exits
      if (!fs.existsSync(toDeletePath)) continue;

      // deleting the file
      fs.unlinkSync(toDeletePath);
    }

    await ProductImage.query(
      `DELETE FROM ${TABLE_NAMES.PRODUCT_IMAGES} WHERE id IN (?)`,
      [imageIds]
    );
    res.json({ msg: deleted(PRODUCT_IMAGES) });
  })
);

router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const products = await Product.find({
      select: [
        "id",
        "color",
        "productCode",
        "color",
        // "unitProduct",
        // "unitSale",

        "price",
        "description",
        "stockAlert",
        "category",
        "subCategory",
        "hasDiscount",
        "hasReturnPolicy",
        "images",
        "minSaleQuantity",
      ],
      relations: ["images", "category", "subCategory"],
    });

    res.json(products);
  })
);

router.get(
  "/dropdown",
  asyncHandler(async (req: Request, res: Response) => {
    const products = await Product.find({
      select: ["id", "productCode"],
    });
    res.json(products);
  })
);

// uploading images
router.post(
  "/",
  productUpload.array(
    "images",
    typeof CONFIG.MAX_PRODUCT_IMAGE_LIMIT === "string"
      ? parseInt(CONFIG.MAX_PRODUCT_IMAGE_LIMIT)
      : CONFIG.MAX_PRODUCT_IMAGE_LIMIT
  ),
  validate(productValidator),
  relationIdValidator(`${CLIENT_OBJ_NAMES.CATEGORY}Id`, TABLE_NAMES.CATEGORIES),
  relationIdValidator(
    `${CLIENT_OBJ_NAMES.SUBCATEGORY}Id`,
    TABLE_NAMES.SUBCATEGORY
  ),
  asyncHandler(async (req: Request, res: Response) => {
    const images = req.files as Express.MulterS3.File[];
    const productImages = [] as ProductImage[];
    let isFirst = true;
    const emptyProduct = {} as Product;
    for (const image of images) {
      const imagePath = `https://${CONFIG.S3_BUCKET}.${CONFIG.S3_AWS_ENDPOINT}/${image.key}`;

      const toPushImage = {
        isMain: isFirst,
        name: imagePath,
        product: emptyProduct,
      } as ProductImage;

      productImages.push(toPushImage);

      isFirst = false;
    }
    const { categoryId, subCategoryId } = req.body;

    req.body.category = { id: categoryId };
    req.body.subCategory = { id: subCategoryId };
    req.body.baseQuantity = req.body.quantity;
    const product = Product.create({ ...req.body }) as Product;

    const queryRunner = db.createQueryRunner(); // creating a query runner

    try {
      await queryRunner.startTransaction(); // starting the transaction

      // const savedProduct = await queryRunner.manager.save(product); // saving the product
      const savedProduct = await product.save(); // saving the product
      productImages.forEach((pImage) => (pImage.product = savedProduct)); // setting image product to the saved product
      // await queryRunner.manager.save(productImages); // saving the images

      await ProductImage.save(productImages); // saving the images
      await queryRunner.commitTransaction();
    } catch {
      // deleting the product images if the transaction fails
      // for (const image of images) {
      //   const toDeletePath = path.join(
      //     process.cwd(),
      //     FOLDER_NAMES.STATIC,
      //     FOLDER_NAMES.PRODUCTS,
      //     image.filename
      //   );
      //   if (fs.existsSync(toDeletePath)) {
      //     // checking if the file exists
      //     fs.unlinkSync(toDeletePath); //deleting the path
      //   }
      // }

      await queryRunner.rollbackTransaction(); // rolling back the transaction
    }

    res.json({ msg: created(RES_NAME) });
  })
);

router.patch(
  "/:id",
  productUpload.array(
    "images",
    typeof CONFIG.MAX_PRODUCT_IMAGE_LIMIT === "string"
      ? parseInt(CONFIG.MAX_PRODUCT_IMAGE_LIMIT)
      : CONFIG.MAX_PRODUCT_IMAGE_LIMIT
  ),
  validate(idValidater),
  relationIdValidator(`${CLIENT_OBJ_NAMES.CATEGORY}Id`, TABLE_NAMES.CATEGORIES),
  relationIdValidator(
    `${CLIENT_OBJ_NAMES.SUBCATEGORY}Id`,
    TABLE_NAMES.SUBCATEGORY
  ),
  dbUpdate(TABLE_NAMES.PRODUCTS),
  validate(editProductValidator),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { categoryId, subCategoryId } = req.body;
    const uploadedFiles = req.files as Express.Multer.File[];

    const product = await Product.findOne({
      where: { id: parseInt(id) },
      relations: ["images"],
    });

    if (!product) {
      throw new NotFound(`Product with id ${id} Not Found`);
    }

    if (uploadedFiles.length > 0) {
      const imagesToSave = uploadedFiles.map((image) => {
        return {
          product,
          name: `${CONFIG.HOST}/${FOLDER_NAMES.STATIC_PATH}/${FOLDER_NAMES.PRODUCTS}/${image.filename}`,
        };
      }) as ProductImage[];
      req.body.images = imagesToSave;
    }

    req.body.category = { id: categoryId };
    req.body.subCategory = { id: subCategoryId };

    delete req.body.categoryId;
    delete req.body.subCategoryId;

    const data = {
      ...req.body,
      minSaleQuantity: parseInt(req.body.minSaleQuantity),
      hasDiscount: parseInt(req.body.hasDiscount),
      hasReturnPolicy: parseInt(req.body.hasReturnPolicy),
    };
    try {
      const manager = db.createQueryRunner();

      await manager.startTransaction();
      if (req.body.images && req.body.images.length > 0) {
        // if there are uploaded files then save them
        await ProductImage.save(req.body.images);
      }
      delete data.images; // deleting the images from the data to be updated
      await Product.update(id, data);
      await manager.commitTransaction();
      res.json({ msg: updated(RES_NAME) });
    } catch (error) {
      for (const image of uploadedFiles) {
        const toDeletePath = path.join(
          process.cwd(),
          FOLDER_NAMES.STATIC,
          FOLDER_NAMES.PRODUCTS,
          image.filename
        );
        if (fs.existsSync(toDeletePath)) {
          // checking if the file exists
          fs.unlinkSync(toDeletePath); //deleting the path
        }
      }
      throw error;
    }
  })
);

router.post(
  "/enquiry-email",
  validate(enquiryEmailValidator),
  asyncHandler(async (req: Request, res: Response) => {
    const {
      firstName,
      lastName,
      contactNumber,
      city,
      country,
      message,
      email,
      productCodes,
      page,
    } = req.body;
    if (page !== "favourites") {
      mail({
        html: `<!DOCTYPE html>
        <html
          lang="en"
          xmlns="http://www.w3.org/1999/xhtml"
          xmlns:v="urn:schemas-microsoft-com:vml"
          xmlns:o="urn:schemas-microsoft-com:office:office"
        >
          <head>
            <title>New Enquiry - ChicandHolland</title>
            <!--[if !mso]><!-- -->
            <meta http-equiv="X-UA-Compatible" content="IE=edge" />
            <!--<![endif]-->
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <style type="text/css">
              #outlook a {
                padding: 0;
              }
        
              body {
                margin: 0;
                padding: 0;
                -webkit-text-size-adjust: 100%;
                -ms-text-size-adjust: 100%;
              }
        
              table,
              td {
                border-collapse: collapse;
                mso-table-lspace: 0pt;
                mso-table-rspace: 0pt;
              }
        
              img {
                border: 0;
                height: auto;
                line-height: 100%;
                outline: none;
                text-decoration: none;
                -ms-interpolation-mode: bicubic;
              }
        
              p {
                display: block;
                margin: 13px 0;
              }
            </style>
            <!--[if mso]>
              <xml>
                <o:OfficeDocumentSettings>
                  <o:AllowPNG />
                  <o:PixelsPerInch>96</o:PixelsPerInch>
                </o:OfficeDocumentSettings>
              </xml>
            <![endif]-->
            <!--[if lte mso 11]>
              <style type="text/css">
                .mj-outlook-group-fix {
                  width: 100% !important;
                }
              </style>
            <![endif]-->
            <!--[if !mso]><!-->
            <link
              href="https://fonts.googleapis.com/css?family=Roboto:100,300,400,700"
              rel="stylesheet"
              type="text/css"
            />
            <style type="text/css">
              @import url(https://fonts.googleapis.com/css?family=Roboto:100,300,400,700);
            </style>
            <!--<![endif]-->
            <style type="text/css">
              @media only screen and (min-width: 480px) {
                .mj-column-per-100 {
                  width: 100% !important;
                  max-width: 100%;
                }
              }
            </style>
            <style type="text/css">
              @media only screen and (max-width: 480px) {
                table.mj-full-width-mobile {
                  width: 100% !important;
                }
        
                td.mj-full-width-mobile {
                  width: auto !important;
                }
              }
            </style>
            <style type="text/css">
              a,
              span,
              td,
              th {
                -webkit-font-smoothing: antialiased !important;
                -moz-osx-font-smoothing: grayscale !important;
              }
            </style>
          </head>
        
          <body style="background-color: #54595f">
            <div
              style="
                display: none;
                font-size: 1px;
                color: #ffffff;
                line-height: 1px;
                max-height: 0px;
                max-width: 0px;
                opacity: 0;
                overflow: hidden;
              "
            >
              Preview - New Enquiry - ChicandBlood
            </div>
            <div style="background-color: #54595f">
              <!--[if mso | IE]>
                  <table
                     align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600"
                  >
                    <tr>
                      <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;">
                  <![endif]-->
              <div style="margin: 0px auto; max-width: 600px">
                <table
                  align="center"
                  border="0"
                  cellpadding="0"
                  cellspacing="0"
                  role="presentation"
                  style="width: 100%"
                >
                  <tbody>
                    <tr>
                      <td
                        style="
                          direction: ltr;
                          font-size: 0px;
                          padding: 20px 0;
                          text-align: center;
                        "
                      >
                        <!--[if mso | IE]>
                              <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                            
                    <tr>
                  
                        <td
                           class="" style="vertical-align:top;width:600px;"
                        >
                      <![endif]-->
                        <div
                          class="mj-column-per-100 mj-outlook-group-fix"
                          style="
                            font-size: 0px;
                            text-align: left;
                            direction: ltr;
                            display: inline-block;
                            vertical-align: top;
                            width: 100%;
                          "
                        >
                          <table
                            border="0"
                            cellpadding="0"
                            cellspacing="0"
                            role="presentation"
                            style="vertical-align: top"
                            width="100%"
                          >
                            <tbody>
                              <tr>
                                <td style="font-size: 0px; word-break: break-word">
                                  <!--[if mso | IE]>
                
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td height="20" style="vertical-align:top;height:20px;">
                  
                <![endif]-->
                                  <div style="height: 20px"></div>
                                  <!--[if mso | IE]>
                
                    </td></tr></table>
                  
                <![endif]-->
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <!--[if mso | IE]>
                        </td>
                      
                    </tr>
                  
                              </table>
                            <![endif]-->
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <!--[if mso | IE]>
                      </td>
                    </tr>
                  </table>
                  
                  <table
                     align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600"
                  >
                    <tr>
                      <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;">
                  <![endif]-->
              <div
                style="
                  background: #ffffff;
                  background-color: #ffffff;
                  margin: 0px auto;
                  border-radius: 4px;
                  max-width: 600px;
                "
              >
                <table
                  align="center"
                  border="0"
                  cellpadding="0"
                  cellspacing="0"
                  role="presentation"
                  style="
                    background: #ffffff;
                    background-color: #ffffff;
                    width: 100%;
                    border-radius: 4px;
                  "
                >
                  <tbody>
                    <tr>
                      <td
                        style="
                          direction: ltr;
                          font-size: 0px;
                          padding: 20px 0;
                          text-align: center;
                        "
                      >
                        <!--[if mso | IE]>
                              <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                            
                        <tr>
                          <td
                             class="" width="600px"
                          >
                      
                  <table
                     align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600"
                  >
                    <tr>
                      <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;">
                  <![endif]-->
                        <div style="margin: 0px auto; max-width: 600px">
                          <table
                            align="center"
                            border="0"
                            cellpadding="0"
                            cellspacing="0"
                            role="presentation"
                            style="width: 100%"
                          >
                            <tbody>
                              <tr>
                                <td
                                  style="
                                    direction: ltr;
                                    font-size: 0px;
                                    padding: 20px 0;
                                    text-align: center;
                                  "
                                >
                                  <!--[if mso | IE]>
                              <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                            
                    <tr>
                  
                        <td
                           class="" style="vertical-align:top;width:600px;"
                        >
                      <![endif]-->
                                  <div
                                    class="mj-column-per-100 mj-outlook-group-fix"
                                    style="
                                      font-size: 0px;
                                      text-align: left;
                                      direction: ltr;
                                      display: inline-block;
                                      vertical-align: top;
                                      width: 100%;
                                    "
                                  >
                                    <table
                                      border="0"
                                      cellpadding="0"
                                      cellspacing="0"
                                      role="presentation"
                                      style="vertical-align: top"
                                      width="100%"
                                    >
                                      <tbody>
                                        <tr>
                                          <td
                                            align="center"
                                            style="
                                              font-size: 0px;
                                              padding: 8px 0;
                                              word-break: break-word;
                                            "
                                          >
                                            <table
                                              border="0"
                                              cellpadding="0"
                                              cellspacing="0"
                                              role="presentation"
                                              style="
                                                border-collapse: collapse;
                                                border-spacing: 0px;
                                              "
                                            >
                                              <tbody>
                                                <tr>
                                                  <td style="width: 150px">
                                                    <img
                                                      height="auto"
                                                      src="https://chicandholland.com/LOGO.png"
                                                      style="
                                                        border: 0;
                                                        display: block;
                                                        outline: none;
                                                        text-decoration: none;
                                                        height: auto;
                                                        width: 100%;
                                                        font-size: 13px;
                                                      "
                                                      width="150"
                                                    />
                                                  </td>
                                                </tr>
                                              </tbody>
                                            </table>
                                          </td>
                                        </tr>
                                        <tr>
                                          <td
                                            style="
                                              font-size: 0px;
                                              padding: 10px 25px;
                                              word-break: break-word;
                                            "
                                          >
                                            <p
                                              style="
                                                border-top: dashed 1px lightgrey;
                                                font-size: 1px;
                                                margin: 0px auto;
                                                width: 100%;
                                              "
                                            ></p>
                                            <!--[if mso | IE]>
                                              <table
                                                align="center"
                                                border="0"
                                                cellpadding="0"
                                                cellspacing="0"
                                                style="
                                                  border-top: dashed 1px lightgrey;
                                                  font-size: 1px;
                                                  margin: 0px auto;
                                                  width: 550px;
                                                "
                                                role="presentation"
                                                width="550px"
                                              >
                                                <tr>
                                                  <td style="height: 0; line-height: 0">
                                                    &nbsp;
                                                  </td>
                                                </tr>
                                              </table>
                                            <![endif]-->
                                          </td>
                                        </tr>
                                        <tr>
                                          <td
                                            align="left"
                                            style="
                                              font-size: 0px;
                                              padding: 10px 25px;
                                              word-break: break-word;
                                            "
                                          >
                                            <div
                                              style="
                                                font-family: Roboto, Helvetica, Arial,
                                                  sans-serif;
                                                font-size: 24px;
                                                font-weight: 300;
                                                line-height: 30px;
                                                text-align: left;
                                                color: #000000;
                                              "
                                            >
                                              New Enquiry from Customer
                                            </div>
                                          </td>
                                        </tr>
                                        <tr>
                                          <td
                                            align="left"
                                            style="
                                              font-size: 0px;
                                              padding: 10px 25px;
                                              word-break: break-word;
                                            "
                                          >
                                            <div
                                              style="
                                                font-family: Roboto, Helvetica, Arial,
                                                  sans-serif;
                                                font-size: 14px;
                                                font-weight: 300;
                                                line-height: 20px;
                                                text-align: left;
                                                color: #000000;
                                              "
                                            >
                                              There was a new enquiry by customer, here
                                              are customer details:
                                            </div>
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                  <!--[if mso | IE]>
                        </td>
                      
                    </tr>
                  
                              </table>
                            <![endif]-->
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <!--[if mso | IE]>
                      </td>
                    </tr>
                  </table>
                  
                          </td>
                        </tr>
                      
                        <tr>
                          <td
                             class="" width="600px"
                          >
                      
                  <table
                     align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600"
                  >
                    <tr>
                      <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;">
                  <![endif]-->
                        <div style="margin: 0px auto; max-width: 600px">
                          <table
                            align="center"
                            border="0"
                            cellpadding="0"
                            cellspacing="0"
                            role="presentation"
                            style="width: 100%"
                          >
                            <tbody>
                              <tr>
                                <td
                                  style="
                                    direction: ltr;
                                    font-size: 0px;
                                    padding: 0;
                                    text-align: center;
                                  "
                                >
                                  <!--[if mso | IE]>
                              <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                            
                    <tr>
                  
                        <td
                           class="" style="vertical-align:top;width:600px;"
                        >
                      <![endif]-->
                                  <div
                                    class="mj-column-per-100 mj-outlook-group-fix"
                                    style="
                                      font-size: 0px;
                                      text-align: left;
                                      direction: ltr;
                                      display: inline-block;
                                      vertical-align: top;
                                      width: 100%;
                                    "
                                  >
                                    <table
                                      border="0"
                                      cellpadding="0"
                                      cellspacing="0"
                                      role="presentation"
                                      style="vertical-align: top"
                                      width="100%"
                                    >
                                      <tbody>
                                        <tr>
                                          <td
                                            align="left"
                                            class="receipt-table"
                                            style="
                                              font-size: 0px;
                                              padding: 10px 25px;
                                              word-break: break-word;
                                            "
                                          >
                                            <table
                                              cellpadding="0"
                                              cellspacing="0"
                                              width="100%"
                                              border="0"
                                              style="
                                                color: #000000;
                                                font-family: Roboto, Helvetica, Arial,
                                                  sans-serif;
                                                font-size: 13px;
                                                line-height: 22px;
                                                table-layout: auto;
                                                width: 100%;
                                                border: none;
                                              "
                                            >
                                              <tbody>
                                                <tr valign="top">
                                                  <td
                                                    width="60%"
                                                    style="
                                                      font-size: 14px;
                                                      line-height: 16px;
                                                      word-break: normal;
                                                    "
                                                  >
                                                    <p
                                                      style="
                                                        margin: 0 0 5px 0;
                                                        padding-bottom: 10px;
                                                      "
                                                    >
                                                      <b>Name : </b>
                                                      <span style="color: #aca9bb">
                                                        ${firstName} ${lastName}
                                                      </span>
                                                    </p>
                                                  </td>
                                                </tr>
                                                <tr valign="top">
                                                  <td
                                                    width="60%"
                                                    style="
                                                      font-size: 14px;
                                                      line-height: 16px;
                                                      word-break: normal;
                                                    "
                                                  >
                                                    <p
                                                      style="
                                                        margin: 0 0 5px 0;
                                                        padding-bottom: 10px;
                                                      "
                                                    >
                                                      <b>Contact Number : </b>
                                                      <span style="color: #aca9bb">
                                                        ${contactNumber}
                                                      </span>
                                                    </p>
                                                  </td>
                                                </tr>
                                                <tr valign="top">
                                                  <td
                                                    width="60%"
                                                    style="
                                                      font-size: 14px;
                                                      line-height: 16px;
                                                      word-break: normal;
                                                    "
                                                  >
                                                    <p
                                                      style="
                                                        margin: 0 0 5px 0;
                                                        padding-bottom: 10px;
                                                      "
                                                    >
                                                      <b>City: </b>
                                                      <span style="color: #aca9bb">
                                                        ${city}
                                                      </span>
                                                    </p>
                                                  </td>
                                                </tr>
                                                <tr valign="top">
                                                  <td
                                                    width="60%"
                                                    style="
                                                      font-size: 14px;
                                                      line-height: 16px;
                                                      word-break: normal;
                                                    "
                                                  >
                                                    <p
                                                      style="
                                                        margin: 0 0 5px 0;
                                                        padding-bottom: 10px;
                                                      "
                                                    >
                                                      <b>Country: </b>
                                                      <span style="color: #aca9bb">
                                                        ${country}
                                                      </span>
                                                    </p>
                                                  </td>
                                                </tr>
                                                <tr valign="top">
                                                  <td
                                                    width="60%"
                                                    style="
                                                      font-size: 14px;
                                                      line-height: 16px;
                                                      word-break: normal;
                                                    "
                                                  >
                                                    <p
                                                      style="
                                                        margin: 0 0 5px 0;
                                                        padding-bottom: 10px;
                                                      "
                                                    >
                                                      <b>Message: </b>
                                                      <span style="color: #aca9bb">
                                                        ${message}
                                                      </span>
                                                    </p>
                                                  </td>
                                                </tr>
                                                <tr valign="top">
                                                  <td
                                                    width="60%"
                                                    style="
                                                      font-size: 14px;
                                                      line-height: 16px;
                                                      word-break: normal;
                                                    "
                                                  >
                                                    <p
                                                      style="
                                                        margin: 0 0 5px 0;
                                                        padding-bottom: 10px;
                                                      "
                                                    >
                                                      <b>Email: </b>
                                                      <span style="color: #aca9bb">
                                                       ${email}
                                                      </span>
                                                    </p>
                                                  </td>
                                                </tr>
                                                <tr valign="top">
                                                  <td
                                                    width="60%"
                                                    style="
                                                      font-size: 14px;
                                                      line-height: 16px;
                                                      word-break: normal;
                                                    "
                                                  >
                                                    <p
                                                      style="
                                                        margin: 0 0 5px 0;
                                                        padding-bottom: 10px;
                                                      "
                                                    >
                                                      <b>Product Codes: </b>
                                                      <span style="color: #aca9bb">
                                                        ${productCodes}
                                                      </span>
                                                    </p>
                                                  </td>
                                                </tr>
                                              </tbody>
                                            </table>
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                  <!--[if mso | IE]>
                        </td>
                      
                    </tr>
                  
                              </table>
                            <![endif]-->
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <!--[if mso | IE]>
                      </td>
                    </tr>
                  </table>
                  
                          </td>
                        </tr>
                      
                        <tr>
                          <td
                             class="" width="600px"
                          >
                      
                  <table
                     align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600"
                  >
                    <tr>
                      <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;">
                  <![endif]-->
                        <div style="margin: 0px auto; max-width: 600px">
                          <table
                            align="center"
                            border="0"
                            cellpadding="0"
                            cellspacing="0"
                            role="presentation"
                            style="width: 100%"
                          >
                            <tbody>
                              <tr>
                                <td
                                  style="
                                    direction: ltr;
                                    font-size: 0px;
                                    padding: 20px 0;
                                    text-align: center;
                                  "
                                >
                                  <!--[if mso | IE]>
                              <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                            
                    <tr>
                  
                        <td
                           class="" style="vertical-align:top;width:600px;"
                        >
                      <![endif]-->
                         
                                  <!--[if mso | IE]>
                        </td>
                      
                    </tr>
                  
                              </table>
                            <![endif]-->
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <!--[if mso | IE]>
                      </td>
                    </tr>
                  </table>
                  
                          </td>
                        </tr>
                      
                              </table>
                            <![endif]-->
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <!--[if mso | IE]>
                      </td>
                    </tr>
                  </table>
                  
                  <table
                     align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600"
                  >
                    <tr>
                      <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;">
                  <![endif]-->
              <!--[if mso | IE]>
                      </td>
                    </tr>
                  </table>
                  
                  <table
                     align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600"
                  >
                    <tr>
                      <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;">
                  <![endif]-->
              <div style="margin: 0px auto; max-width: 600px">
                <table
                  align="center"
                  border="0"
                  cellpadding="0"
                  cellspacing="0"
                  role="presentation"
                  style="width: 100%"
                >
                  <tbody>
                    <tr>
                      <td
                        style="
                          direction: ltr;
                          font-size: 0px;
                          padding: 20px 0;
                          text-align: center;
                        "
                      >
                        <!--[if mso | IE]>
                              <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                            
                    <tr>
                  
                        <td
                           class="" style="vertical-align:top;width:600px;"
                        >
                      <![endif]-->
                        <div
                          class="mj-column-per-100 mj-outlook-group-fix"
                          style="
                            font-size: 0px;
                            text-align: left;
                            direction: ltr;
                            display: inline-block;
                            vertical-align: top;
                            width: 100%;
                          "
                        >
                          <table
                            border="0"
                            cellpadding="0"
                            cellspacing="0"
                            role="presentation"
                            style="vertical-align: top"
                            width="100%"
                          >
                            <tbody>
                              <tr>
                                <td style="font-size: 0px; word-break: break-word">
                                  <!--[if mso | IE]>
                
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td height="1" style="vertical-align:top;height:1px;">
                  
                <![endif]-->
                                  <div style="height: 1px"></div>
                                  <!--[if mso | IE]>
                
                    </td></tr></table>
                  
                <![endif]-->
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <!--[if mso | IE]>
                        </td>
                      
                    </tr>
                  
                              </table>
                            <![endif]-->
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <!--[if mso | IE]>
                      </td>
                    </tr>
                  </table>
                  <![endif]-->
            </div>
          </body>
        </html>
        `,
        to: "info@chicandholland.com",
        // to: "rehan@ymtsindia.org",
        subject: `New Contact US Form Submission - ${new Date().toLocaleDateString()}`,
        replyTo: email,
        inReplyTo: email,
      });
    } else {
      mail({
        html: `<!DOCTYPE html>
        <html
          lang="en"
          xmlns="http://www.w3.org/1999/xhtml"
          xmlns:v="urn:schemas-microsoft-com:vml"
          xmlns:o="urn:schemas-microsoft-com:office:office"
        >
          <head>
            <title>New Enquiry - ChicandHolland</title>
            <!--[if !mso]><!-- -->
            <meta http-equiv="X-UA-Compatible" content="IE=edge" />
            <!--<![endif]-->
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <style type="text/css">
              #outlook a {
                padding: 0;
              }
        
              body {
                margin: 0;
                padding: 0;
                -webkit-text-size-adjust: 100%;
                -ms-text-size-adjust: 100%;
              }
        
              table,
              td {
                border-collapse: collapse;
                mso-table-lspace: 0pt;
                mso-table-rspace: 0pt;
              }
        
              img {
                border: 0;
                height: auto;
                line-height: 100%;
                outline: none;
                text-decoration: none;
                -ms-interpolation-mode: bicubic;
              }
        
              p {
                display: block;
                margin: 13px 0;
              }
            </style>
            <!--[if mso]>
              <xml>
                <o:OfficeDocumentSettings>
                  <o:AllowPNG />
                  <o:PixelsPerInch>96</o:PixelsPerInch>
                </o:OfficeDocumentSettings>
              </xml>
            <![endif]-->
            <!--[if lte mso 11]>
              <style type="text/css">
                .mj-outlook-group-fix {
                  width: 100% !important;
                }
              </style>
            <![endif]-->
            <!--[if !mso]><!-->
            <link
              href="https://fonts.googleapis.com/css?family=Roboto:100,300,400,700"
              rel="stylesheet"
              type="text/css"
            />
            <style type="text/css">
              @import url(https://fonts.googleapis.com/css?family=Roboto:100,300,400,700);
            </style>
            <!--<![endif]-->
            <style type="text/css">
              @media only screen and (min-width: 480px) {
                .mj-column-per-100 {
                  width: 100% !important;
                  max-width: 100%;
                }
              }
            </style>
            <style type="text/css">
              @media only screen and (max-width: 480px) {
                table.mj-full-width-mobile {
                  width: 100% !important;
                }
        
                td.mj-full-width-mobile {
                  width: auto !important;
                }
              }
            </style>
            <style type="text/css">
              a,
              span,
              td,
              th {
                -webkit-font-smoothing: antialiased !important;
                -moz-osx-font-smoothing: grayscale !important;
              }
            </style>
          </head>
        
          <body style="background-color: #54595f">
            <div
              style="
                display: none;
                font-size: 1px;
                color: #ffffff;
                line-height: 1px;
                max-height: 0px;
                max-width: 0px;
                opacity: 0;
                overflow: hidden;
              "
            >
              Preview - New Enquiry - ChicandBlood
            </div>
            <div style="background-color: #54595f">
              <!--[if mso | IE]>
                  <table
                     align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600"
                  >
                    <tr>
                      <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;">
                  <![endif]-->
              <div style="margin: 0px auto; max-width: 600px">
                <table
                  align="center"
                  border="0"
                  cellpadding="0"
                  cellspacing="0"
                  role="presentation"
                  style="width: 100%"
                >
                  <tbody>
                    <tr>
                      <td
                        style="
                          direction: ltr;
                          font-size: 0px;
                          padding: 20px 0;
                          text-align: center;
                        "
                      >
                        <!--[if mso | IE]>
                              <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                            
                    <tr>
                  
                        <td
                           class="" style="vertical-align:top;width:600px;"
                        >
                      <![endif]-->
                        <div
                          class="mj-column-per-100 mj-outlook-group-fix"
                          style="
                            font-size: 0px;
                            text-align: left;
                            direction: ltr;
                            display: inline-block;
                            vertical-align: top;
                            width: 100%;
                          "
                        >
                          <table
                            border="0"
                            cellpadding="0"
                            cellspacing="0"
                            role="presentation"
                            style="vertical-align: top"
                            width="100%"
                          >
                            <tbody>
                              <tr>
                                <td style="font-size: 0px; word-break: break-word">
                                  <!--[if mso | IE]>
                
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td height="20" style="vertical-align:top;height:20px;">
                  
                <![endif]-->
                                  <div style="height: 20px"></div>
                                  <!--[if mso | IE]>
                
                    </td></tr></table>
                  
                <![endif]-->
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <!--[if mso | IE]>
                        </td>
                      
                    </tr>
                  
                              </table>
                            <![endif]-->
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <!--[if mso | IE]>
                      </td>
                    </tr>
                  </table>
                  
                  <table
                     align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600"
                  >
                    <tr>
                      <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;">
                  <![endif]-->
              <div
                style="
                  background: #ffffff;
                  background-color: #ffffff;
                  margin: 0px auto;
                  border-radius: 4px;
                  max-width: 600px;
                "
              >
                <table
                  align="center"
                  border="0"
                  cellpadding="0"
                  cellspacing="0"
                  role="presentation"
                  style="
                    background: #ffffff;
                    background-color: #ffffff;
                    width: 100%;
                    border-radius: 4px;
                  "
                >
                  <tbody>
                    <tr>
                      <td
                        style="
                          direction: ltr;
                          font-size: 0px;
                          padding: 20px 0;
                          text-align: center;
                        "
                      >
                        <!--[if mso | IE]>
                              <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                            
                        <tr>
                          <td
                             class="" width="600px"
                          >
                      
                  <table
                     align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600"
                  >
                    <tr>
                      <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;">
                  <![endif]-->
                        <div style="margin: 0px auto; max-width: 600px">
                          <table
                            align="center"
                            border="0"
                            cellpadding="0"
                            cellspacing="0"
                            role="presentation"
                            style="width: 100%"
                          >
                            <tbody>
                              <tr>
                                <td
                                  style="
                                    direction: ltr;
                                    font-size: 0px;
                                    padding: 20px 0;
                                    text-align: center;
                                  "
                                >
                                  <!--[if mso | IE]>
                              <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                            
                    <tr>
                  
                        <td
                           class="" style="vertical-align:top;width:600px;"
                        >
                      <![endif]-->
                                  <div
                                    class="mj-column-per-100 mj-outlook-group-fix"
                                    style="
                                      font-size: 0px;
                                      text-align: left;
                                      direction: ltr;
                                      display: inline-block;
                                      vertical-align: top;
                                      width: 100%;
                                    "
                                  >
                                    <table
                                      border="0"
                                      cellpadding="0"
                                      cellspacing="0"
                                      role="presentation"
                                      style="vertical-align: top"
                                      width="100%"
                                    >
                                      <tbody>
                                        <tr>
                                          <td
                                            align="center"
                                            style="
                                              font-size: 0px;
                                              padding: 8px 0;
                                              word-break: break-word;
                                            "
                                          >
                                            <table
                                              border="0"
                                              cellpadding="0"
                                              cellspacing="0"
                                              role="presentation"
                                              style="
                                                border-collapse: collapse;
                                                border-spacing: 0px;
                                              "
                                            >
                                              <tbody>
                                                <tr>
                                                  <td style="width: 150px">
                                                    <img
                                                      height="auto"
                                                      src="https://chicandholland.com/LOGO.png"
                                                      style="
                                                        border: 0;
                                                        display: block;
                                                        outline: none;
                                                        text-decoration: none;
                                                        height: auto;
                                                        width: 100%;
                                                        font-size: 13px;
                                                      "
                                                      width="150"
                                                    />
                                                  </td>
                                                </tr>
                                              </tbody>
                                            </table>
                                          </td>
                                        </tr>
                                        <tr>
                                          <td
                                            style="
                                              font-size: 0px;
                                              padding: 10px 25px;
                                              word-break: break-word;
                                            "
                                          >
                                            <p
                                              style="
                                                border-top: dashed 1px lightgrey;
                                                font-size: 1px;
                                                margin: 0px auto;
                                                width: 100%;
                                              "
                                            ></p>
                                            <!--[if mso | IE]>
                                              <table
                                                align="center"
                                                border="0"
                                                cellpadding="0"
                                                cellspacing="0"
                                                style="
                                                  border-top: dashed 1px lightgrey;
                                                  font-size: 1px;
                                                  margin: 0px auto;
                                                  width: 550px;
                                                "
                                                role="presentation"
                                                width="550px"
                                              >
                                                <tr>
                                                  <td style="height: 0; line-height: 0">
                                                    &nbsp;
                                                  </td>
                                                </tr>
                                              </table>
                                            <![endif]-->
                                          </td>
                                        </tr>
                                        <tr>
                                          <td
                                            align="left"
                                            style="
                                              font-size: 0px;
                                              padding: 10px 25px;
                                              word-break: break-word;
                                            "
                                          >
                                            <div
                                              style="
                                                font-family: Roboto, Helvetica, Arial,
                                                  sans-serif;
                                                font-size: 24px;
                                                font-weight: 300;
                                                line-height: 30px;
                                                text-align: left;
                                                color: #000000;
                                              "
                                            >
                                              New Enquiry from Customer
                                            </div>
                                          </td>
                                        </tr>
                                        <tr>
                                          <td
                                            align="left"
                                            style="
                                              font-size: 0px;
                                              padding: 10px 25px;
                                              word-break: break-word;
                                            "
                                          >
                                            <div
                                              style="
                                                font-family: Roboto, Helvetica, Arial,
                                                  sans-serif;
                                                font-size: 14px;
                                                font-weight: 300;
                                                line-height: 20px;
                                                text-align: left;
                                                color: #000000;
                                              "
                                            >
                                              There was a new enquiry by customer on wishlist page, here
                                              are the form details:
                                            </div>
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                  <!--[if mso | IE]>
                        </td>
                      
                    </tr>
                  
                              </table>
                            <![endif]-->
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <!--[if mso | IE]>
                      </td>
                    </tr>
                  </table>
                  
                          </td>
                        </tr>
                      
                        <tr>
                          <td
                             class="" width="600px"
                          >
                      
                  <table
                     align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600"
                  >
                    <tr>
                      <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;">
                  <![endif]-->
                        <div style="margin: 0px auto; max-width: 600px">
                          <table
                            align="center"
                            border="0"
                            cellpadding="0"
                            cellspacing="0"
                            role="presentation"
                            style="width: 100%"
                          >
                            <tbody>
                              <tr>
                                <td
                                  style="
                                    direction: ltr;
                                    font-size: 0px;
                                    padding: 0;
                                    text-align: center;
                                  "
                                >
                                  <!--[if mso | IE]>
                              <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                            
                    <tr>
                  
                        <td
                           class="" style="vertical-align:top;width:600px;"
                        >
                      <![endif]-->
                                  <div
                                    class="mj-column-per-100 mj-outlook-group-fix"
                                    style="
                                      font-size: 0px;
                                      text-align: left;
                                      direction: ltr;
                                      display: inline-block;
                                      vertical-align: top;
                                      width: 100%;
                                    "
                                  >
                                    <table
                                      border="0"
                                      cellpadding="0"
                                      cellspacing="0"
                                      role="presentation"
                                      style="vertical-align: top"
                                      width="100%"
                                    >
                                      <tbody>
                                        <tr>
                                          <td
                                            align="left"
                                            class="receipt-table"
                                            style="
                                              font-size: 0px;
                                              padding: 10px 25px;
                                              word-break: break-word;
                                            "
                                          >
                                            <table
                                              cellpadding="0"
                                              cellspacing="0"
                                              width="100%"
                                              border="0"
                                              style="
                                                color: #000000;
                                                font-family: Roboto, Helvetica, Arial,
                                                  sans-serif;
                                                font-size: 13px;
                                                line-height: 22px;
                                                table-layout: auto;
                                                width: 100%;
                                                border: none;
                                              "
                                            >
                                              <tbody>
                                                <tr valign="top">
                                                  <td
                                                    width="60%"
                                                    style="
                                                      font-size: 14px;
                                                      line-height: 16px;
                                                      word-break: normal;
                                                    "
                                                  >
                                                    <p
                                                      style="
                                                        margin: 0 0 5px 0;
                                                        padding-bottom: 10px;
                                                      "
                                                    >
                                                      <b>Name : </b>
                                                      <span style="color: #aca9bb">
                                                        ${firstName} ${lastName}
                                                      </span>
                                                    </p>
                                                  </td>
                                                </tr>
                                                <tr valign="top">
                                                  <td
                                                    width="60%"
                                                    style="
                                                      font-size: 14px;
                                                      line-height: 16px;
                                                      word-break: normal;
                                                    "
                                                  >
                                                    <p
                                                      style="
                                                        margin: 0 0 5px 0;
                                                        padding-bottom: 10px;
                                                      "
                                                    >
                                                      <b>Contact Number : </b>
                                                      <span style="color: #aca9bb">
                                                        ${contactNumber}
                                                      </span>
                                                    </p>
                                                  </td>
                                                </tr>
                                                <tr valign="top">
                                                  <td
                                                    width="60%"
                                                    style="
                                                      font-size: 14px;
                                                      line-height: 16px;
                                                      word-break: normal;
                                                    "
                                                  >
                                                    <p
                                                      style="
                                                        margin: 0 0 5px 0;
                                                        padding-bottom: 10px;
                                                      "
                                                    >
                                                      <b>City: </b>
                                                      <span style="color: #aca9bb">
                                                        ${city}
                                                      </span>
                                                    </p>
                                                  </td>
                                                </tr>
                                                <tr valign="top">
                                                  <td
                                                    width="60%"
                                                    style="
                                                      font-size: 14px;
                                                      line-height: 16px;
                                                      word-break: normal;
                                                    "
                                                  >
                                                    <p
                                                      style="
                                                        margin: 0 0 5px 0;
                                                        padding-bottom: 10px;
                                                      "
                                                    >
                                                      <b>Country: </b>
                                                      <span style="color: #aca9bb">
                                                        ${country}
                                                      </span>
                                                    </p>
                                                  </td>
                                                </tr>
                                                <tr valign="top">
                                                  <td
                                                    width="60%"
                                                    style="
                                                      font-size: 14px;
                                                      line-height: 16px;
                                                      word-break: normal;
                                                    "
                                                  >
                                                    <p
                                                      style="
                                                        margin: 0 0 5px 0;
                                                        padding-bottom: 10px;
                                                      "
                                                    >
                                                      <b>Message: </b>
                                                      <span style="color: #aca9bb">
                                                        ${message}
                                                      </span>
                                                    </p>
                                                  </td>
                                                </tr>
                                                <tr valign="top">
                                                  <td
                                                    width="60%"
                                                    style="
                                                      font-size: 14px;
                                                      line-height: 16px;
                                                      word-break: normal;
                                                    "
                                                  >
                                                    <p
                                                      style="
                                                        margin: 0 0 5px 0;
                                                        padding-bottom: 10px;
                                                      "
                                                    >
                                                      <b>Email: </b>
                                                      <span style="color: #aca9bb">
                                                       ${email}
                                                      </span>
                                                    </p>
                                                  </td>
                                                </tr>
                                                <tr valign="top">
                                                  <td
                                                    width="60%"
                                                    style="
                                                      font-size: 14px;
                                                      line-height: 16px;
                                                      word-break: normal;
                                                    "
                                                  >
                                                    <p
                                                      style="
                                                        margin: 0 0 5px 0;
                                                        padding-bottom: 10px;
                                                      "
                                                    >
                                                      <b>Product Codes: </b>
                                                      <span style="color: #aca9bb">
                                                        ${productCodes}
                                                      </span>
                                                    </p>
                                                  </td>
                                                </tr>
                                              </tbody>
                                            </table>
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                  <!--[if mso | IE]>
                        </td>
                      
                    </tr>
                  
                              </table>
                            <![endif]-->
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <!--[if mso | IE]>
                      </td>
                    </tr>
                  </table>
                  
                          </td>
                        </tr>
                      
                        <tr>
                          <td
                             class="" width="600px"
                          >
                      
                  <table
                     align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600"
                  >
                    <tr>
                      <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;">
                  <![endif]-->
                        <div style="margin: 0px auto; max-width: 600px">
                          <table
                            align="center"
                            border="0"
                            cellpadding="0"
                            cellspacing="0"
                            role="presentation"
                            style="width: 100%"
                          >
                            <tbody>
                              <tr>
                                <td
                                  style="
                                    direction: ltr;
                                    font-size: 0px;
                                    padding: 20px 0;
                                    text-align: center;
                                  "
                                >
                                  <!--[if mso | IE]>
                              <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                            
                    <tr>
                  
                        <td
                           class="" style="vertical-align:top;width:600px;"
                        >
                      <![endif]-->
                         
                                  <!--[if mso | IE]>
                        </td>
                      
                    </tr>
                  
                              </table>
                            <![endif]-->
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <!--[if mso | IE]>
                      </td>
                    </tr>
                  </table>
                  
                          </td>
                        </tr>
                      
                              </table>
                            <![endif]-->
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <!--[if mso | IE]>
                      </td>
                    </tr>
                  </table>
                  
                  <table
                     align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600"
                  >
                    <tr>
                      <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;">
                  <![endif]-->
              <!--[if mso | IE]>
                      </td>
                    </tr>
                  </table>
                  
                  <table
                     align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600"
                  >
                    <tr>
                      <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;">
                  <![endif]-->
              <div style="margin: 0px auto; max-width: 600px">
                <table
                  align="center"
                  border="0"
                  cellpadding="0"
                  cellspacing="0"
                  role="presentation"
                  style="width: 100%"
                >
                  <tbody>
                    <tr>
                      <td
                        style="
                          direction: ltr;
                          font-size: 0px;
                          padding: 20px 0;
                          text-align: center;
                        "
                      >
                        <!--[if mso | IE]>
                              <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                            
                    <tr>
                  
                        <td
                           class="" style="vertical-align:top;width:600px;"
                        >
                      <![endif]-->
                        <div
                          class="mj-column-per-100 mj-outlook-group-fix"
                          style="
                            font-size: 0px;
                            text-align: left;
                            direction: ltr;
                            display: inline-block;
                            vertical-align: top;
                            width: 100%;
                          "
                        >
                          <table
                            border="0"
                            cellpadding="0"
                            cellspacing="0"
                            role="presentation"
                            style="vertical-align: top"
                            width="100%"
                          >
                            <tbody>
                              <tr>
                                <td style="font-size: 0px; word-break: break-word">
                                  <!--[if mso | IE]>
                
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td height="1" style="vertical-align:top;height:1px;">
                  
                <![endif]-->
                                  <div style="height: 1px"></div>
                                  <!--[if mso | IE]>
                
                    </td></tr></table>
                  
                <![endif]-->
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <!--[if mso | IE]>
                        </td>
                      
                    </tr>
                  
                              </table>
                            <![endif]-->
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <!--[if mso | IE]>
                      </td>
                    </tr>
                  </table>
                  <![endif]-->
            </div>
          </body>
        </html>
        `,
        to: "info@chicandholland.com",
        // to: "rehan@ymtsindia.org",
        subject: `New Wishlist page enquiry form Submission - ${new Date().toLocaleDateString()}`,
        replyTo: email,
        inReplyTo: email,
      });
    }

    res.json({
      message: "sup, mail sent",
    });
  })
);

router.get(
  "/new",
  asyncHandler(async (req: Request, res: Response) => {
    const {
      page,
      query,
    }: {
      page?: string;
      query?: string;
    } = req.query;

    if (!page) {
      const products = await Product.find({
        where: { deletedAt: IsNull() },
        relations: [
          "images",
          "category",
          "subCategory",
          "currencyPricing",
          "currencyPricing.currency",
        ],
      });
      const totalCount = await Product.count({ where: { deletedAt: IsNull() } });

      return res.json({
        products,
        totalCount,
      });
    } else {
      const skip = (page ? Number(page) - 1 : 0) * 100;

      const likeQuery = `%${query?.toLowerCase()}%`;

      const whereConditions = [
        {
          productCode: Like(likeQuery),
          deletedAt: IsNull(),
        },
        {
          category: {
            name: Like(likeQuery),
          },
          deletedAt: IsNull(),
        },
        {
          subCategory: {
            name: Like(likeQuery),
          },
          deletedAt: IsNull(),
        },
      ];

      const products = await Product.find({
        where: whereConditions,
        relations: [
          "images",
          "category",
          "subCategory",
          "currencyPricing",
          "currencyPricing.currency",
        ],
        take: 100,
        skip,
        order: {
          id: "DESC",
        },
      });

      const totalCount = await Product.count({
        where: whereConditions,
      });

      return res.json({
        products,
        totalCount,
      });
    }
  })
);

router.delete(
  "/:id",
  validate(idValidater),
  asyncHandler(async (req: Request<{ id: number }>, res: Response) => {
    const { id } = req.params;

    const product = await Product.findOne({
      where: { id: Number(id) },
      withDeleted: true
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (product.deletedAt) {
      return res.status(400).json({
        success: false,
        message: "Product already deleted",
      });
    }

    await Product.update({ id: Number(id) }, { deletedAt: new Date() });

    res.json({
      success: true,
      message: "Product soft deleted",
    });
  })
);

router.delete(
  "/images/:id",
  asyncHandler(async (req: Request<{ id: number }>, res: Response) => {
    const { id } = req.params;

    const image = await ProductImage.findOne({
      where: { id: Number(id) },
    });

    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Image not found",
      });
    }

    await ProductImage.delete({ id: Number(id) });

    res.json({
      success: true,
      message: "Image deleted",
    });
  })
);

interface Field {
  [key: string]: string;
}

export interface FileData {
  fieldname: string;
  filename: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
}

router.post(
  "/images",
  raw({
    type: "multipart/form-data",
    limit: "900mb",
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

        const productId = Number(fields.productId);

        const product = await Product.findOne({
          where: { id: productId },
        });

        if (!product) {
          return res.status(404).json({
            error: "Product not found",
          });
        }

        const productImages: ProductImage[] = [];

        for (const file of files) {
          const compressedImage = await sharp(file.buffer)
            .webp({
              quality: 100,
            })
            .resize({
              width: 1000,
              height: 1600,
              // fit: "cover",
            })
            .toBuffer();

          const fileName = `products/${product.productCode}/${Math.random()
            .toString(36)
            .substring(7)}.webp`;

          const s3Response = await storeFileInS3(compressedImage, fileName);

          const productImage = new ProductImage();
          productImage.product = product;
          productImage.name = getFullUrl(s3Response?.fileName as string);

          productImages.push(productImage);
        }

        await ProductImage.save(productImages);

        res.json({
          success: true,
          message: "Files uploaded successfully",
        });
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .json({ error: "An error occurred while processing the files" });
      }
    });

    busboy.end(req.body);
  })
);

router.get(
  "/product-details",
  asyncHandler(async (req: Request, res: Response) => {
    const { ids } = req.query;

    if (!ids) {
      return res.status(400).json({
        success: false,
        message: "Please provide ids in query params",
      });
    }

    const productCodes = (ids as string).split(",");

    const products = await Product.find({
      where: {
        productCode: In(productCodes),
      },
      relations: ["images"],
    });

    return res.json({
      success: true,
      products,
    });
  })
);

router.get(
  "/product-code/:code",
  asyncHandler(async (req: Request, res: Response) => {
    const { code } = req.params;

    const product = await Product.findOne({
      where: {
        productCode: code,
      },
      relations: ["images"],
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // res.json({
    //   success: true,
    //   product,
    // });

    res.json(product);
  })
);

// router.get(
//   "/:id",
//   validate(idValidater),
//   asyncHandler(async (req: Request<{ id: number }>, res: Response) => {
//     const { id } = req.params;
//     const { currencyId } = req.query as { currencyId?: string };

//     let product;
//     let currencyPricing = null;

//     if (currencyId) {
//       // Use raw query to get product with currency pricing
//       const productWithCurrency = await Product.query(
//         `
//         SELECT 
//           p.id,
//           p.color,
//           p.productCode,
//           p.mesh_color,
//           p.beading_color,
//           p.lining,
//           p.lining_color,
//           p.price,
//           p.description,
//           p.stockAlert,
//           p.categoryId,
//           p.subCategoryId,
//           p.hasDiscount,
//           p.hasReturnPolicy,
//           pcp.price as regionPrice,
//           c.name as currencyName,
//           c.code as currencyCode,
//           c.symbol as currencySymbol
//         FROM ${TABLE_NAMES.PRODUCTS} p
//         LEFT JOIN ${TABLE_NAMES.PRODUCT_CURRENCY_PRICING} pcp ON p.id = pcp.productId AND pcp.currencyId = ?
//         LEFT JOIN ${TABLE_NAMES.CURRENCIES} c ON pcp.currencyId = c.id
//         WHERE p.id = ?
//       `,
//         [currencyId, id]
//       );

//       if (!productWithCurrency || productWithCurrency.length === 0) {
//         return res.status(404).json({
//           success: false,
//           message: "Product not found",
//         });
//       }

//       const productData = productWithCurrency[0];

//       // Get the product with relations for additional data
//       product = await Product.findOne({
//         relations: ["images", "subCategory","currencyPricing",
//     "currencyPricing.currency"],
//         where: { id },
//       });

//       if (!product?.subCategory) {
//         return res.status(404).json({
//           success: false,
//           message: "Product not found",
//         });
//       }

//       // Add currency pricing information
//       if (productData.regionPrice) {
//         currencyPricing = {
//           regionPrice: productData.regionPrice,
//           currencyName: productData.currencyName,
//           currencyCode: productData.currencyCode,
//           currencySymbol: productData.currencySymbol,
//         };
//       }
//     } else {
//       // Original query without currency support
//       product = await Product.findOne({
//         relations: ["images", "subCategory","currencyPricing",
//     "currencyPricing.currency"],
//         select: [
//           "id",
//           "color",
//           "productCode",
//           "color",
//           // "unitProduct",
//           // "unitSale",
//           "mesh_color",
//           "beading_color",
//           "lining",
//           "lining_color",
//           "price",
//           "description",
//           "stockAlert",
//           "category",
//           "subCategory",
//           "hasDiscount",
//           "hasReturnPolicy",
//           "images",
//         ],
//         where: { id },
//       });

//       if (!product?.subCategory) {
//         return res.status(404).json({
//           success: false,
//           message: "Product not found",
//         });
//       }
//     }

//     // get relatedproducts based on it's subcategory
//     //         const relatedProducts = await Product.query(`
//     // SELECT
//     //     ps.id,
//     //     pi.*
//     // FROM ${TABLE_NAMES.PRODUCTS} ps
//     // LEFT JOIN ${TABLE_NAMES.PRODUCT_IMAGES} pi ON ps.id = pi.productId
//     // WHERE ps.subCategoryId = ${product.subCategory.id}
//     //     AND ps.id != ${product.id}
//     // GROUP BY ps.id
//     // LIMIT 5`);

//     // first get 5 related products
//     const relatedProducts_ = await Product.find({
//       where: {
//         subCategory: { id: product.subCategory.id },
//         id: Not(product.id),
//       },
//       relations: ["images"],
//       take: 5,
//       skip: 0,
//     });

//     // get 1 image from each relatedProduct
//     const relatedProducts = relatedProducts_.map((product) => {
//       const firstImage = product.images[0];
//       return {
//         // ...product,
//         // images: product.images.slice(0, 1)
//         productId: product.id,
//         ...firstImage,
//       };
//     });

//     const stocks = await Stock.find({
//       where: {
//         styleNo: product?.id.toString(),
//       },
//     });

//     // const stocks = await Stock.query(
//     //   `select * from stock where styleNo = ${product?.id.toString()} group by size`
//     // );

//     // convert stocks to array even if it is only one
//     const stockArray = Array.isArray(stocks) ? stocks : [stocks];
//     // console.log(product);
//     res.json({
//       ...product,
//       stockDetails: stockArray,
//       relatedProducts: relatedProducts,
//       ...(currencyPricing && { currencyPricing }),
//     });
//   })
// );
router.get(
  "/:id",
  validate(idValidater),
  asyncHandler(async (req: Request<{ id: number }>, res: Response) => {
    const { id } = req.params;
    const { currencyId } = req.query as { currencyId?: string };

    let product;
    let currencyPricing = null;

    if (currencyId) {
      // Use raw query to get product with currency pricing
      const productWithCurrency = await Product.query(
        `
        SELECT 
          p.id,
          p.color,
          p.productCode,
          p.mesh_color,
          p.beading_color,
          p.lining,
          p.lining_color,
          p.price,
          p.description,
          p.stockAlert,
          p.categoryId,
          p.subCategoryId,
          p.hasDiscount,
          p.hasReturnPolicy,
          pcp.price as regionPrice,
          c.name as currencyName,
          c.code as currencyCode,
          c.symbol as currencySymbol
        FROM ${TABLE_NAMES.PRODUCTS} p
        LEFT JOIN ${TABLE_NAMES.PRODUCT_CURRENCY_PRICING} pcp ON p.id = pcp.productId AND pcp.currencyId = ?
        LEFT JOIN ${TABLE_NAMES.CURRENCIES} c ON pcp.currencyId = c.id
        WHERE p.id = ?
      `,
        [currencyId, id]
      );

      if (!productWithCurrency || productWithCurrency.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      const productData = productWithCurrency[0];

      // Get the product with relations for additional data
      product = await Product.findOne({
        relations: ["images", "subCategory"],
        where: { id },
      });

      if (!product?.subCategory) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      // Add currency pricing information
      if (productData.regionPrice) {
        currencyPricing = {
          regionPrice: productData.regionPrice,
          currencyName: productData.currencyName,
          currencyCode: productData.currencyCode,
          currencySymbol: productData.currencySymbol,
        };
      }
    } else {
      // Original query without currency support
      product = await Product.findOne({
        relations: ["images", "subCategory"],
        select: [
          "id",
          "color",
          "productCode",
          "color",
          // "unitProduct",
          // "unitSale",
          "mesh_color",
          "beading_color",
          "lining",
          "lining_color",
          "price",
          "description",
          "stockAlert",
          "category",
          "subCategory",
          "hasDiscount",
          "hasReturnPolicy",
          "images",
        ],
        where: { id },
      });

      if (!product?.subCategory) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }
    }

    // get relatedproducts based on it's subcategory
    //         const relatedProducts = await Product.query(`
    // SELECT
    //     ps.id,
    //     pi.*
    // FROM ${TABLE_NAMES.PRODUCTS} ps
    // LEFT JOIN ${TABLE_NAMES.PRODUCT_IMAGES} pi ON ps.id = pi.productId
    // WHERE ps.subCategoryId = ${product.subCategory.id}
    //     AND ps.id != ${product.id}
    // GROUP BY ps.id
    // LIMIT 5`);

    // first get 5 related products
    const relatedProducts_ = await Product.find({
      where: {
        subCategory: { id: product.subCategory.id },
        id: Not(product.id),
      },
      relations: ["images"],
      take: 5,
      skip: 0,
    });

    // get 1 image from each relatedProduct
    const relatedProducts = relatedProducts_.map((product) => {
      const firstImage = product.images[0];
      return {
        // ...product,
        // images: product.images.slice(0, 1)
        productId: product.id,
        ...firstImage,
      };
    });

    const stocks = await Stock.find({
      where: {
        styleNo: product?.id.toString(),
      },
    });

    // const stocks = await Stock.query(
    //   `select * from stock where styleNo = ${product?.id.toString()} group by size`
    // );

    // convert stocks to array even if it is only one
    const stockArray = Array.isArray(stocks) ? stocks : [stocks];
    // console.log(product);
    res.json({
      ...product,
      stockDetails: stockArray,
      relatedProducts: relatedProducts,
      ...(currencyPricing && { currencyPricing }),
    });
  })
);

router.post(
  "/new",
  asyncHandler(async (req: Request, res: Response) => {
    const {
      productCode,
      categoryId,
      subCategoryId,
      productPrice,
      description,
      mesh,
      beading,
      lining,
      liningColor,
      currencyBasedPricing = [], // Default to empty array if not provided
    } = req.body;

    // check if product already exists with the same product code
    const product = await Product.findOne({
      where: {
        productCode,
      },
    });

    if (product) {
      return res.status(400).json({
        success: false,
        message: "Product with the same code already exists",
      });
    }

    const category = await Category.findOne({
      where: {
        id: Number(categoryId),
      },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const subCategory = await SubCategory.findOne({
      where: {
        id: Number(subCategoryId),
      },
    });

    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: "Collection not found",
      });
    }

    // Validate currencies if currency-based pricing is provided
    if (currencyBasedPricing.length > 0) {
      const currencyIds = currencyBasedPricing.map((pricing: any) =>
        Number(pricing.currencyId)
      );
      const currencies = await Currency.findByIds(currencyIds);

      if (currencies.length !== currencyIds.length) {
        return res.status(400).json({
          success: false,
          message: "One or more currencies not found",
        });
      }
    }

    // Start database transaction
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create the main product
      const newProduct = new Product();
      newProduct.productCode = productCode;
      newProduct.category = category;
      newProduct.subCategory = subCategory;
      newProduct.price = productPrice;
      newProduct.description = description;
      newProduct.mesh_color = mesh;
      newProduct.beading_color = beading;
      newProduct.lining = lining;
      newProduct.lining_color = lining === "No Lining" ? "No Color" : liningColor;

      // Save the product first
      const savedProduct = await queryRunner.manager.save(newProduct);

      // Create currency-based pricing if provided
      if (currencyBasedPricing.length > 0) {
        const currencyPricingEntities = [];

        for (const pricing of currencyBasedPricing) {
          const currency = await queryRunner.manager.findOne(Currency, {
            where: { id: Number(pricing.currencyId) },
          });

          if (currency) {
            const currencyPricing = new ProductCurrencyPricing();
            currencyPricing.product = savedProduct;
            currencyPricing.currency = currency;
            currencyPricing.price = Number(pricing.price);
            currencyPricingEntities.push(currencyPricing);
          }
        }

        // Save all currency pricing at once
        if (currencyPricingEntities.length > 0) {
          await queryRunner.manager.save(currencyPricingEntities);
        }
      }

      // Commit the transaction
      await queryRunner.commitTransaction();

      CacheController.clearCacheByName("products");

      res.json({
        success: true,
        message: "Product created successfully",
        data: {
          productId: savedProduct.id,
          currencyPricingCount: currencyBasedPricing.length,
        },
      });
    } catch (error: any) {
      // Rollback the transaction on error
      await queryRunner.rollbackTransaction();
      console.error("Error creating product:", error);

      res.status(500).json({
        success: false,
        message: "Failed to create product",
        error: error.message,
      });
    } finally {
      // Release the query runner
      await queryRunner.release();
    }
  })
);

router.patch(
  "/product-patch/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const {
      productCode,
      categoryId,
      subCategoryId,
      productPrice,
      description,
      mesh,
      beading,
      lining,
      liningColor,
      currencyBasedPricing = [], // Default to empty array if not provided
    } = req.body;
    const { id } = req.params;

    // Check if product already exists with the same product code (excluding current product)
    const existingProduct = await Product.query(
      `select id from products where id != ${Number(
        id
      )} and productCode = '${productCode}'`
    );

    if (existingProduct.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Product with the same code already exists",
      });
    }

    const category = await Category.findOne({
      where: {
        id: Number(categoryId),
      },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const subCategory = await SubCategory.findOne({
      where: {
        id: Number(subCategoryId),
      },
    });

    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: "Collection not found",
      });
    }

    // Validate currencies if currency-based pricing is provided
    if (currencyBasedPricing.length > 0) {
      const currencyIds = currencyBasedPricing.map((pricing: any) =>
        Number(pricing.currencyId)
      );
      const currencies = await Currency.findByIds(currencyIds);

      if (currencies.length !== currencyIds.length) {
        return res.status(400).json({
          success: false,
          message: "One or more currencies not found",
        });
      }
    }

    const patchProduct = await Product.findOne({
      where: {
        id: Number(id),
      },
      relations: ["currencyPricing"], // Load existing currency pricing
    });

    if (!patchProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Start database transaction
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Update main product fields
      patchProduct.productCode = productCode;
      patchProduct.category = category;
      patchProduct.subCategory = subCategory;
      patchProduct.price = productPrice;
      patchProduct.description = description;
      patchProduct.mesh_color = mesh;
      patchProduct.beading_color = beading;
      patchProduct.lining = lining;
      patchProduct.lining_color = lining === "No Lining" ? null : liningColor;

      // Save the updated product
      await queryRunner.manager.save(patchProduct);

      // Handle currency-based pricing updates
      // First, remove all existing currency pricing for this product
      await queryRunner.manager.delete(ProductCurrencyPricing, {
        product: { id: Number(id) },
      });

      // Then, create new currency pricing entries
      if (currencyBasedPricing.length > 0) {
        const currencyPricingEntities = [];

        for (const pricing of currencyBasedPricing) {
          const currency = await queryRunner.manager.findOne(Currency, {
            where: { id: Number(pricing.currencyId) },
          });

          if (currency) {
            const currencyPricing = new ProductCurrencyPricing();
            currencyPricing.product = patchProduct;
            currencyPricing.currency = currency;
            currencyPricing.price = Number(pricing.price);
            currencyPricingEntities.push(currencyPricing);
          }
        }

        // Save all currency pricing at once
        if (currencyPricingEntities.length > 0) {
          await queryRunner.manager.save(currencyPricingEntities);
        }
      }

      // Commit the transaction
      await queryRunner.commitTransaction();

      CacheController.clearCacheByName("products");

      res.json({
        success: true,
        message: "Product updated successfully",
        data: {
          productId: patchProduct.id,
          currencyPricingCount: currencyBasedPricing.length,
        },
      });
    } catch (error: any) {
      // Rollback the transaction on error
      await queryRunner.rollbackTransaction();
      console.error("Error updating product:", error);

      res.status(500).json({
        success: false,
        message: "Failed to update product",
        error: error.message,
      });
    } finally {
      // Release the query runner
      await queryRunner.release();
    }
  })
);

export default router;

router.get(
  "/product-color/:id",
  validate(idValidater),
  asyncHandler(async (req: Request<{ id: number }>, res: Response) => {
    const { id } = req.params;

    const [product]: any = await Product.find({
      where: {
        id: Number(id),
      },
      select: ["beading_color", "mesh_color", "lining", "lining_color"],
    });

    res.json({
      status: true,
      data: product,
    });
  })
);
