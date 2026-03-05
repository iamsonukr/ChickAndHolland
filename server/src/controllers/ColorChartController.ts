// import { Router, Request, Response } from "express";
// import Busboy from "busboy";
// import sharp from "sharp";
// import { ColorChart } from "../models/ColorChart";
// import db from "../db";
// import { storeFileInS3, getFullUrl } from "../lib/s3";

// const router = Router();
// const colorChartRepo = db.getRepository(ColorChart);

// /**
//  * GET LATEST COLOR CHART
//  */
// router.get("/", async (_req: Request, res: Response) => {
//   try {
//     const charts = await colorChartRepo.find({
//       order: { id: "DESC" },
//       take: 1,
//     });

//     const latest = charts[0] || null;

//     return res.json({
//       success: true,
//       imageUrl: latest?.imageUrl || null,
//       createdAt: latest?.createdAt || null,
//       updatedAt: latest?.updatedAt || null,
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch color chart",
//     });
//   }
// });

// /**
//  * UPLOAD COLOR CHART
//  * ✅ FIXES ROTATION (EXIF)
//  * ✅ COMPRESSES
//  * ✅ CONVERTS TO WEBP
//  */
// router.post("/upload", async (req: Request, res: Response) => {
//   const busboy = Busboy({ headers: req.headers });
//   let imageBuffer: Buffer | null = null;

//   busboy.on("file", (_fieldname, file) => {
//     const buffers: Buffer[] = [];

//     file.on("data", (data: Buffer) => {
//       buffers.push(data);
//     });

//     file.on("end", () => {
//       imageBuffer = Buffer.concat(buffers);
//     });
//   });

//   busboy.on("finish", async () => {
//     try {
//       if (!imageBuffer) {
//         return res.status(400).json({
//           success: false,
//           message: "Image is required",
//         });
//       }

//       /**
//        * 🔥 MOST IMPORTANT FIX
//        * .rotate() reads EXIF orientation and fixes image permanently
//        */
//       const processedImage = await sharp(imageBuffer)
//         .rotate() // ✅ FIXES ULTA / SIDEWAYS IMAGE
//         .resize({
//           width: 1200,
//           withoutEnlargement: true,
//         })
//         .webp({ quality: 90 })
//         .toBuffer();

//       const fileName = `color-chart/color-chart-${Date.now()}.webp`;

//       const s3Res = await storeFileInS3(processedImage, fileName);

//       if (!s3Res) {
//         return res.status(500).json({
//           success: false,
//           message: "S3 upload failed",
//         });
//       }

//       const chart = new ColorChart();
//       chart.imageUrl = getFullUrl(s3Res.fileName);

//       await colorChartRepo.save(chart);

//       return res.json({
//         success: true,
//         message: "Color chart uploaded successfully",
//         imageUrl: chart.imageUrl,
//       });
//     } catch (error) {
//       console.error(error);
//       return res.status(500).json({
//         success: false,
//         message: "Upload failed",
//       });
//     }
//   });

//   req.pipe(busboy);
// });

// export default router;


import { Router, Request, Response } from "express";
import Busboy from "busboy";
import sharp from "sharp";
import { ColorChart } from "../models/ColorChart";
import db from "../db";
import { storeFileInS3, getFullUrl } from "../lib/s3";

const router = Router();
const colorChartRepo = db.getRepository(ColorChart);

/**
 * GET LATEST COLOR CHART
 */
router.get("/", async (_req: Request, res: Response) => {
  try {
    const charts = await colorChartRepo.find({
      order: { id: "DESC" },
      take: 1,
    });

    const latest = charts[0] || null;

    return res.json({
      success: true,
      imageUrl: latest?.imageUrl || null,
      createdAt: latest?.createdAt || null,
      updatedAt: latest?.updatedAt || null,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch color chart",
    });
  }
});

/**
 * UPLOAD COLOR CHART
 * ✅ FIXES ROTATION (EXIF)
 * ✅ COMPRESSES
 * ✅ CONVERTS TO WEBP
 * ✅ SAFE (NO CRASH)
 */
router.post("/upload", (req: Request, res: Response) => {
  let responded = false;

  const safeRespond = (status: number, data: any) => {
    if (responded) return;
    responded = true;
    return res.status(status).json(data);
  };

  const busboy = Busboy({
    headers: req.headers,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
      files: 1,
    },
  });

  let imageBuffer: Buffer | null = null;
  let fileReceived = false;

  busboy.on("error", (err) => {
    console.error("Busboy error:", err);
    return safeRespond(400, {
      success: false,
      message: "Invalid upload data",
    });
  });

  busboy.on("file", (_fieldname, file, info) => {
    if (fileReceived) {
      file.resume();
      return;
    }

    fileReceived = true;

    const { mimeType } = info;

    if (!mimeType.startsWith("image/")) {
      file.resume();
      return safeRespond(400, {
        success: false,
        message: "Only image files are allowed",
      });
    }

    const buffers: Buffer[] = [];

    file.on("data", (data: Buffer) => {
      buffers.push(data);
    });

    file.on("limit", () => {
      return safeRespond(413, {
        success: false,
        message: "File too large (max 5MB)",
      });
    });

    file.on("end", () => {
      imageBuffer = Buffer.concat(buffers);
    });
  });

  busboy.on("finish", async () => {
    try {
      if (!imageBuffer) {
        return safeRespond(400, {
          success: false,
          message: "Image is required",
        });
      }

      const processedImage = await sharp(imageBuffer)
        .rotate() // EXIF orientation fix
        .resize({
          width: 1200,
          withoutEnlargement: true,
        })
        .webp({ quality: 90 })
        .toBuffer();

      const fileName = `color-chart/color-chart-${Date.now()}.webp`;

      const s3Res = await storeFileInS3(processedImage, fileName);

      if (!s3Res) {
        return safeRespond(500, {
          success: false,
          message: "S3 upload failed",
        });
      }

      const chart = new ColorChart();
      chart.imageUrl = getFullUrl(s3Res.fileName);

      await colorChartRepo.save(chart);

      return safeRespond(200, {
        success: true,
        message: "Color chart uploaded successfully",
        imageUrl: chart.imageUrl,
      });
    } catch (error) {
      console.error("Upload error:", error);
      return safeRespond(500, {
        success: false,
        message: "Upload failed",
      });
    }
  });

  req.pipe(busboy);
});

export default router;