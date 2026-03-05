import multer from "multer";
import { v4 as uuid } from "uuid";
import path from "path";
import { FOLDER_NAMES } from "../constants";
import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import CONFIG from "../config";
import multerS3 from "multer-s3";
import sharp from "sharp";

const expensesPath = path.join(
  process.cwd(),
  FOLDER_NAMES.STATIC,
  FOLDER_NAMES.EXPENSES
);

const employeeImagesPath = path.join(
  process.cwd(),
  FOLDER_NAMES.STATIC,
  FOLDER_NAMES.EMPLOYEES
);

const orderFilePath = path.join(
  process.cwd(),
  FOLDER_NAMES.STATIC,
  FOLDER_NAMES.ORDERS
);

const expenseStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, expensesPath);
  },
  filename: (req, file, cb) => {
    cb(
      null,
      uuid() +
        file.originalname
          .slice(file.originalname.lastIndexOf("."))
          .toLowerCase()
    );
  },
});

const employeeImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, employeeImagesPath);
  },
  filename: (req, file, cb) => {
    cb(
      null,
      uuid() +
        file.originalname
          .slice(file.originalname.lastIndexOf("."))
          .toLowerCase()
    );
  },
});

const orderFileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, orderFilePath);
  },
  filename: (req, file, cb) => {
    // accept only ppt files
    if (!file.originalname.match(/\.(ppt|pptx)$/)) {
      return cb(new Error("Only ppt files are allowed!"), "");
    }
    cb(
      null,
      uuid() +
        file.originalname
          .slice(file.originalname.lastIndexOf("."))
          .toLowerCase()
    );
  },
});

export const expenseUpload = multer({ storage: expenseStorage });
export const employeeUpload = multer({ storage: employeeImageStorage });
export const orderFileUpload = multer({ storage: orderFileStorage });

const s3 = new S3Client({
  region: CONFIG.S3_REGION,
  endpoint: `https://${CONFIG.S3_AWS_ENDPOINT}`,
  credentials: {
    accessKeyId: CONFIG.S3_ACCESS_KEY_ID,
    secretAccessKey: CONFIG.S3_SECRET_ACCESS_KEY,
  },
});

export const productUpload = multer({
  storage: multerS3({
    s3,
    bucket: CONFIG.S3_BUCKET,
    acl: "public-read",
    key: (req, file, cb) => {
      cb(
        null,
        `chicandholland/${FOLDER_NAMES.PRODUCTS}/${uuid()}${path.extname(
          file.originalname
        )}`
      );
    },
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
  }),
});

export const sponsorUpload = multer({
  storage: multerS3({
    s3,
    bucket: CONFIG.S3_BUCKET,
    acl: "public-read",
    key: (req, file, cb) => {
      cb(
        null,
        `chicandholland/${FOLDER_NAMES.SPONSORS}/${uuid()}${path.extname(
          file.originalname
        )}`
      );
    },
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
  }),
});

export const deleteFile = async (key: string) => {
  try {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: CONFIG.S3_BUCKET,
        Key: key,
      })
    );
  } catch (error) {
    throw new Error("Error deleting file from S3");
  }
};

export const modifyFile = async (
  file:
    | Buffer
    | ArrayBuffer
    | Uint8Array
    | Uint8ClampedArray
    | Int8Array
    | Uint16Array
    | Int16Array
    | Uint32Array
    | Int32Array
    | Float32Array
    | Float64Array
    | string
) => {
  try {
    const buffer = await sharp(file).avif().toBuffer();
    return buffer;
  } catch (error) {
    throw new Error("Error modifying file");
  }
};
