import { DataSource } from "typeorm";
import path from "path";
import CONFIG from "./config";

import AdminBank from "./models/AdminBank";
import BaseModel from "./models/BaseModel";
import BodyDetail from "./models/BodyDetail";
import Category from "./models/Category";
import ClientsModel from "./models/ClientsModel";
import {ColorChart} from "./models/ColorChart";
import Contactus from "./models/contactus";
import Countries from "./models/Countries";
import Country from "./models/Country";
import Currency from "./models/Currency";
import Customer from "./models/Customer";
import Employee from "./models/Employee";
import Expense from "./models/Expense";
import ExpenseType from "./models/ExpenseType";
import Favourites from "./models/Favourites";
import Inventory from "./models/Inventory";
import NewUserRoles from "./models/NewUserRoles";
import Order from "./models/Order";
import OrderItem from "./models/OrderItem";
import OrderPayments from "./models/OrderPayments";
// import {OrderPiece} from "./models/OrderPiece";
import OrderStyle from "./models/OrderStyle";
import PageActions from "./models/PageActions";
import Payer from "./models/Payer";
import Permission from "./models/Permission";
import Product from "./models/Product";
import ProductColours from "./models/ProductColours";
import ProductCountryPricing from "./models/ProductCountryPricing";
import ProductCurrencyPricing from "./models/ProductCurrencyPricing";
import ProductImage from "./models/ProductImage";
import QuickBookLoginHistory from "./models/QuickBookLoginHistory";
import QuickBooksToken from "./models/QuickBooksToken";
import ReailerFavouritesOrder from "./models/ReailerFavouritesOrder";
import Retailer from "./models/Retailer";
import RetailerBank from "./models/RetailerBank";
import {RetailerOrder} from "./models/RetailerOrder";
import RetailerOrderStyles from "./models/RetailerOrderStyles";
import RetailerPaymentModal from "./models/RetailerPaymentModal";
import RetailerStockOrders from "./models/RetailerStockOrders";
import Role from "./models/Role";
import Seller from "./models/Seller";
import Sponsor from "./models/Sponsor";
import Stock from "./models/Stock";
import StockCurrencyPricing from "./models/StockCurrencyPricing";
import StockOrderStyles from "./models/StockOrderStyles";
import StoreOrderStyles from "./models/StoreOrderStyles";
import StoreStyleProgress from "./models/StoreStyleProgress";
import StyleProgress from "./models/StyleProgress";
import SubCategory from "./models/SubCategory";
import User from "./models/User";
import {Worker} from "./models/Worker";

const db = new DataSource({
    type: "mysql",
    url: CONFIG.DB_URL,
    synchronize: false,
    dropSchema: false,
    entities: [
        AdminBank, BodyDetail, Category, ClientsModel, ColorChart,
        Contactus, Countries, Country, Currency, Customer,
        Employee, Expense, ExpenseType, Favourites, Inventory,
        NewUserRoles, Order, OrderItem, OrderPayments,
        OrderStyle, PageActions, Payer, Permission, Product,
        ProductColours, ProductCountryPricing, ProductCurrencyPricing,
        ProductImage, QuickBookLoginHistory, QuickBooksToken,
        ReailerFavouritesOrder, Retailer, RetailerBank, RetailerOrder,
        RetailerOrderStyles, RetailerPaymentModal, RetailerStockOrders,
        Role, Seller, Sponsor, Stock, StockCurrencyPricing,
        StockOrderStyles, StoreOrderStyles, StoreStyleProgress,
        StyleProgress, SubCategory, User, Worker,
    ],
    poolSize: CONFIG.DB_POOL_SIZE,
    logging: !CONFIG.PRODUCTION,
});

export default db;
// import { DataSource } from "typeorm";
// import path from "path";
// import CONFIG from "./config";
// import Category from "./models/Category";
// import User from "./models/User";

// let modelsPath = "";

// /**
//  * Path handling for entities
//  * CONFIG.PRODUCTION ke base par correct directory select karega
//  */
// if (CONFIG.PRODUCTION) {
//     // Production mein: dist/models/*.js ko load karega
//     // __dirname yahan 'dist' folder ko point karega
//     modelsPath = path.join(__dirname, "models", "*.js");
// } else {
//     // Development mein: src/models/*.ts ko load karega
//     modelsPath = path.join(__dirname, "models", "*.ts");
// }

// const db = new DataSource({
//     type: "mysql",
//     // Agar ECONNREFUSED aa raha hai, to .env mein 'localhost' ki jagah '127.0.0.1' use karein
//     url: CONFIG.DB_URL,

//     // Production mein ise hamesha false rakhein taaki data loss na ho
//     synchronize: false,
//     dropSchema: false,

//     // Optimized entities path
//     entities: [modelsPath],
//         // entities: [Category, User], // 👈 list them directly

    
//     poolSize: CONFIG.DB_POOL_SIZE,

//     // Development mein queries print hongi, production mein nahi
//     logging: !CONFIG.PRODUCTION,
// });

// export default db;
