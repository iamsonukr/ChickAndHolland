
/**
 * Index file for the server application for Rani fashions
 * @dev Written by WEB DEV TEAM - YMTS INDIA
 * @date 24th june 2023
 * @version 1.0.0
 */
import { BaseEntity } from "typeorm";
import ColorChartController from "./controllers/ColorChartController";

import { initializeData } from "./seeder/initializeData";
import "reflect-metadata";
import express from "express";
import db from "./db";
import errorHandler from "./middleware/ErrorHandler";
import morgan from "morgan";
import fs from "fs";
import cors from "cors";
import path from "path";
import CONFIG from "./config";
import StockEmailRoute from "./routes/StockEmailRoute";


// -----------------------
// Import Controllers
import CategoryRouter from "./controllers/CategoryController";
import SubCategoryRouter from "./controllers/SubCategoryController";
import RoleRouter from "./controllers/RoleController";
import PayerRouter from "./controllers/PayerController";
import ExpenseTypeRouter from "./controllers/ExpenseTypeController";
import ExpenseRouter from "./controllers/ExpenseController";
import InventoryRouter from "./controllers/InventoryController";
import ProductRouter from "./controllers/ProductController";
import EmployeeRouter from "./controllers/EmployeeController";
import OrderRouter,{ PublicStoreRoutes } from "./controllers/OrderController";
import ReportRouter from "./controllers/ReportController";
import SellerRouter from "./controllers/SellerController";
import AnalyticsRouter from "./controllers/AnalyticsController";
import ContactusRouter from "./controllers/contactusController";
import UserRouter from "./controllers/UserController";
import Clientrouter from "./controllers/ClientsController";
import RetailerRouter from "./controllers/RetailersController";
import CustomerRouter from "./controllers/CustomerController";
import StockRouter from "./controllers/StockController";
import FavouritesRouter from "./controllers/FavouritesController";
import UserRoleRouter from "./controllers/UserRoleController";
import QuickBooksRouter from "./controllers/QuickBooksController";
import ProductColoursRouter from "./controllers/ProductColours";
import Sponsor from "./controllers/SponsorController";
import RetailerOrders from "./controllers/RetailerOrdersController";
import RetailerBank from "./controllers/RetailerBankController";
import AdminBank from "./controllers/AdminBankController";
import CountryController from "./controllers/CountryController";
import CurrencyRouter from "./controllers/CurrencyController";
import PageActions from "./controllers/PageActions";
import { CacheController } from "./controllers/CacheController";
import WorkerController from "./controllers/WorkerController";

// Middleware
import {
  itemsPerPageHandler,
  minChangeHandler,
  sortHandler,
} from "./middleware/Pagination";
import { memberAuthHandler } from "./middleware/AuthHandler";
import cookieParser from "cookie-parser";
import sharp from "sharp";
import fetch from "node-fetch";
import { FOLDER_NAMES } from "./constants";
import uploadPptRoute from "./routes/uploadPpt";
import { Router } from "express";
import scanController from "./controllers/scan.controller";
import statusUpdateController from "./controllers/statusUpdate.controller";
import reportController from "./controllers/report.controller";
import retailerScanRoute from "./routes/RetailerScanRoute";
import stockScanRoute from "./routes/StockScanRoute";
import stripeWebhookHandler from "./routes/webhook";

const router = Router();


// --------------------
// Create static folders
const publicFolder = path.join(process.cwd(), FOLDER_NAMES.STATIC);
const foldersToCreate = [
  FOLDER_NAMES.EXPENSES,
  FOLDER_NAMES.PRODUCTS,
  FOLDER_NAMES.EMPLOYEES,
  FOLDER_NAMES.ORDERS,
  FOLDER_NAMES.SETTINGS, // ⬅️ Added for Color Chart uploads
  
];

// -----------------
// Express App Setup
const port = CONFIG.PORT;
const app = express();



app.post(
  "/api/payment/webhook",
   express.raw({ type: "application/json" }), // RAW BODY
  stripeWebhookHandler
);

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

// Middleware Setup

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://chicandholland.com",
      "https://www.chicandholland.com",
      "http://188.166.61.115"
    ],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE","PATCH"],
  })  
);  



app.use(cookieParser());
app.use(morgan("dev"));
app.use(`/${FOLDER_NAMES.STATIC_PATH}`, express.static(publicFolder));
// 🔓 Allow PPT download without Authorization
app.use("/uploads/ppt", express.static("uploads/ppt"));


// --------------------
// Initialize Database
(async () => {
  try {
    if (!db) throw new Error(`Error initializing the database`);
    
    // Create static folders if not exist
    if (!fs.existsSync(publicFolder)) fs.mkdirSync(publicFolder);
    for (const name of foldersToCreate) {
      const dir = path.join(publicFolder, name);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    }
    
  await db.initialize();
BaseEntity.useDataSource(db);
console.log("✅ Database connected");

if (process.env.RUN_SEEDER === "true") {
  try {
    await initializeData();
  } catch (e) {
    console.error("Seeder error (ignored):", e);
  }
}

app.listen(port, () => {
  console.log(`✅ Server is running on port ${port}`);
});
 
  } catch (err: any) {
    console.error("Error occurred while connecting to database");
    console.error("Error:", err.message);
    console.error(err);
  }
})();

// --------------------
// Default Route
app.get("/", (req, res) => {
  res.json({
    status: "OK",
    health: "Good",
    msg: "Welcome to the API of CHIC AND HOLLAND",
  });
});

// --------------------
// Global Middleware
app.use(minChangeHandler);
app.use(itemsPerPageHandler);
app.use(sortHandler);

// --------------------
// ✅ Public Routes (no login required)
app.use("/api/countries", CountryController);
app.use("/api/currencies", CurrencyRouter);
app.use("/api/users", UserRouter);
app.use("/api/roles", RoleRouter);
app.use("/api/user-roles", UserRoleRouter);
app.use("/api/retailers", RetailerRouter);
app.use("/api/color-chart", ColorChartController);
app.use("/api/upload-ppt", uploadPptRoute);
// PUBLIC Store APIs
app.use("/api/orders", PublicStoreRoutes);
app.use("/api/retailer-orders", RetailerOrders);

app.use("/api/worker", WorkerController);


// app.use("/api/orders", OrderRouter);

// BARCODE TRACKING SYSTEM
app.use("/api/scan", scanController);
app.use("/api/status", statusUpdateController);
app.use("/api/report", reportController);
app.use("/api/retailer-scan", retailerScanRoute);
app.use("/api/stock-scan", stockScanRoute);




// --------------------
// 🔒 Protected Routes (require Authorization)
app.use(memberAuthHandler);
app.use("/api/orders", OrderRouter);
// app.use("/api/retailer-orders", RetailerOrders);
app.use("/api", StockEmailRoute);

app.use("/api/customers", CustomerRouter);
app.use("/api/categories", CategoryRouter);
app.use("/api/subcategories", SubCategoryRouter);
app.use("/api/employees", EmployeeRouter);
app.use("/api/contactus", ContactusRouter);
app.use("/api/products", ProductRouter);
app.use("/api/payers", PayerRouter);
app.use("/api/expensetypes", ExpenseTypeRouter);
app.use("/api/expenses", ExpenseRouter);
app.use("/api/inventory", InventoryRouter);

app.use("/api/reports", ReportRouter);
app.use("/api/analytics", AnalyticsRouter);
app.use("/api/sellers", SellerRouter);
app.use("/api/clients", Clientrouter);
app.use("/api/stock", StockRouter);
app.use("/api/favourites", FavouritesRouter);
app.use("/api/quickbook", QuickBooksRouter);
app.use("/api/product-colours", ProductColoursRouter);
app.use("/api/sponsors", Sponsor);
app.use("/api/retailer-bank", RetailerBank);
app.use("/api/admin-bank", AdminBank);
app.use("/api/page-actions", PageActions);


// --------------------
// Cache API
app.post("/api/cache/clear", CacheController.handleClearAll);
app.post("/api/cache/clearByName", CacheController.handleClearByName);
app.get("/api/cache/stats", CacheController.handleGetStats);
app.post("/api/cache/clearKey", CacheController.handleClearKey);
app.post("/api/cache/clearPattern", CacheController.handleClearPattern);
app.get("/api/cache/keyInfo", CacheController.handleGetKeyInfo);

// --------------------
// Image Conversion API
app.get("/api/image-to-jpeg", async (req, res) => {
  const { imageUrl } = req.query;

  if (!imageUrl || typeof imageUrl !== "string") {
    return res.status(400).json({ msg: "Valid image url is required" });
  }

  try {
    const imageBuffer = await fetch(imageUrl).then((res) => res.arrayBuffer());
    const convertedImage = await sharp(imageBuffer)
      .toFormat("jpeg", { quality: 40 })
      .toBuffer();

    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("Content-Disposition", "inline; filename=image.jpeg");
    res.send(convertedImage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error converting image to jpeg" });
  }
});

// --------------------
// 404 Handler
app.use("*", async (req, res) => {
  res.status(404).json({
    msg: "Please check the route you are trying to access",
  });
});

// --------------------
// Global Error Handler
app.use(errorHandler);
