import { Request, Response, Router, raw } from "express";
import asyncHandler from "../middleware/AsyncHandler";
import SPONSOR from "../models/Sponsor";
import { getFullUrl, storeFileInS3 } from "../lib/s3";
import sharp from "sharp";
import Busboy from "busboy";
import { FileData } from "./ProductController";
import { FindOptionsWhere, Like } from "typeorm";
import { sponsorUpload } from "../lib/upload";
import db from "../db";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const {
      page,
      query = "",
    }: {
      page?: string;
      query?: string;
    } = req.query;
    const images = await SPONSOR.find();

    if (!page) {
      const sponsor = await SPONSOR.find({});
      const totalCount = await SPONSOR.count({});
      res.json({
        sponsor,
        totalCount,
      });
    } else {
      const skip = (page ? Number(page) - 1 : 0) * 10;

      const likeQuery = `%${query?.toLowerCase()}%`;

      const whereConditions:
        | FindOptionsWhere<SPONSOR>
        | FindOptionsWhere<SPONSOR>[]
        | undefined = [{ description: Like(likeQuery) }];

      const sponsorWithProducts = await SPONSOR.createQueryBuilder("sponsor")
        .where(whereConditions)
        .skip(skip)
        .take(10)
        .getMany();

      const totalCount = await SPONSOR.count({
        where: whereConditions,
      });
      res.json({
        sponsorWithProducts,
        totalCount,
      });
    }
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
    const fields = {
      description: "",
    };

    // Handle form fields
    busboy.on("field", (fieldname: string, value: string) => {
      if (fieldname === "description") {
        fields.description = value;
      }
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

        if (files.length === 0) {
          return res.status(400).json({ error: "No files uploaded" });
        }

        // Process all files to ensure consistent dimensions and format
        const processedFiles = await Promise.all(
          files.map(async (file) => {
            const compressedImage = await sharp(file.buffer)
              .resize(1000, 1600, {
                fit: "cover", // Ensures the image covers the dimensions without distortion
                position: "center", // Centers the image during resizing
              })
              .webp({ quality: 100 }) // Convert to WebP format with 100% quality
              .toBuffer();

            return {
              ...file,
              buffer: compressedImage,
            };
          })
        );

        // Save all processed files to S3 and database
        const savePromises = processedFiles.map(async (file) => {
          const fileName = `uploads/${Math.random()
            .toString(36)
            .substring(7)}.webp`;

          const s3Response = await storeFileInS3(file.buffer, fileName);

          const sponsorImage = new SPONSOR();
          sponsorImage.image_url = getFullUrl(s3Response?.fileName as string);
          sponsorImage.description = fields.description;

          await SPONSOR.save(sponsorImage);
        });

        await Promise.all(savePromises);

        res.json({
          success: true,
          message: "All images uploaded and processed successfully",
        });
      } catch (error) {
        console.error("Error processing files:", error);
        res.status(500).json({
          error: "An error occurred while processing the files",
        });
      }
    });

    busboy.end(req.body);
  })
);

router.delete(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.body;

    const sponsor = db.getRepository(SPONSOR);

    await sponsor
      .createQueryBuilder()
      .delete()
      .from("sponsor_images")
      .where("id = :id", { id: id })
      .execute();

    res.json({
      success: true,
      msg: "Sponsor Deleted SuccessFully",
    });
  })
);

router.patch(
  "/:id",
  raw({
    type: "multipart/form-data",
    limit: "100mb",
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const busboy = Busboy({ headers: req.headers });
    const filePromises: Promise<FileData>[] = [];
    const fields = {
      description: "",
      hasFile: false,
    };

    // Handle form fields
    busboy.on("field", (fieldname: string, value: string) => {
      if (fieldname === "description") {
        fields.description = value;
      }
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
        // Only process if there's actually a file
        if (filename) {
          fields.hasFile = true;
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
        } else {
          // If no file, just drain the stream
          file.resume();
        }
      }
    );

    busboy.on("finish", async () => {
      try {
        // Find existing sponsor
        const sponsor = await SPONSOR.findOne({ where: { id: Number(id) } });

        if (!sponsor) {
          return res.status(404).json({ error: "Sponsor not found" });
        }

        // Update description if provided
        if (fields.description) {
          sponsor.description = fields.description;
        }

        // Process file if one was uploaded
        if (fields.hasFile) {
          const files = await Promise.all(filePromises);

          if (files.length > 0) {
            const processedFile = await sharp(files[0].buffer)
              .resize(1000, 1600, {
                fit: "cover",
                position: "center",
              })
              .webp({ quality: 100 })
              .toBuffer();

            const fileName = `uploads/${Math.random()
              .toString(36)
              .substring(7)}.webp`;

            const s3Response = await storeFileInS3(processedFile, fileName);

            // Update image URL
            sponsor.image_url = getFullUrl(s3Response?.fileName as string);
          }
        }

        // Save updates
        await SPONSOR.save(sponsor);

        res.json({
          success: true,
          message: "Sponsor updated successfully",
          data: {
            id: sponsor.id,
            description: sponsor.description,
            image_url: sponsor.image_url,
          },
        });
      } catch (error) {
        console.error("Error updating sponsor:", error);
        res.status(500).json({
          error: "An error occurred while updating the sponsor",
          details: error instanceof Error ? error.message : "Unknown error",
        });
      }
    });

    busboy.end(req.body);
  })
);

export default router;
