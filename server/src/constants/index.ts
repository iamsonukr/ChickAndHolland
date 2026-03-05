/**
 * @description This file contains all the constants used in the application
 * @file        constants/index.ts
 */

export const TABLE_NAMES = {
  BODY_DETAILS: "bodydetails",
  CATEGORIES: "categories",
  COUNTRIES : "countries",
  CONTACT_US: "contactus",
  EMPLOYEE_IMAGES: "employeeimages",
  EMPLOYEES: "employees",
  EXPENSES: "expenses",
  EXPENSETYPES: "expensetypes",
  INVENTORY: "inventories",
  ORDER_PRODUCTS: "order_products",
  ORDERS: "orders",
  PAYERS: "payers",
  PRODUCT_IMAGES: "productimages",
  PRODUCTS: "products",
  ROLES: "roles",
  SUBCATEGORY: "subcategories",
  PERMISSIONS: "permissions",
  ORDER_ITEMS: "orderitems",
  SELLERS: "sellers",
  USERS: "users",
  CART_ITEMS: "cart_items",
  WISHLIST_ITEMS: "wishlist_items",
  Clients: "clients",
  RETAILERS: "retailers",
  USER_ROLES: "new_user_roles",
  QUICKBOOKTOKENS: "quickbooktokens",
  QUICKBOOKLOGINHISTORY: "quickbookloginhistory",
  PRODUCT_COLOURS: "product_colours",
  ORDERPAYMENTS: "orderpayments",
  SPONSOR: "sponsor_images",
  RETAILERFAVOURITESORDERS: "retailer_favourites_orders",
  RETAILERSTOCKORDERS: "retailer_stock_orders",
  RETAILERORDERSPAYMENT: "retailer_order_payments",
  RETAILERBANK: "retailer_bank",
  ADMINBANK: "admin_bank",
  COUNTRY: "country",
  PRODUCT_COUNTRY_PRICING: "product_country_pricing",
  CURRENCIES: "currencies",
  PRODUCT_CURRENCY_PRICING: "product_currency_pricing",
  STOCK_CURRENCY_PRICING: "stock_currency_pricing",
  PAGE_ACTIONS: "page_action",
    COLOR_CHART: "color_chart",


};

export const CLIENT_OBJ_NAMES = {
  BODY_DETAIL: "bodydetails",
  CATEGORY: "category",
  EMPLOYEE_IMAGES: "employeeimages",
  EMPLOYEE: "employee",
  EXPENSE: "expense",
  EXPENSETYPE: "expenseType",
  INVENTORY: "inventory",
  ORDER_PRODUCTS: "order_products",
  ORDER: "order",
  PAYER: "payer",
  PRODUCT_IMAGES: "productimage",
  PRODUCT: "product",
  ROLE: "role",
  SUBCATEGORY: "subCategory",
};

export const FOLDER_NAMES = {
  EXPENSES: "expenses",
  STATIC: "public",
  STATIC_PATH: "static",
  PRODUCTS: "products",
  EMPLOYEES: "employees",
  SOURCE: "source",
  ORDERS: "orders",
  SPONSORS: "sponsors",
    SETTINGS: "settings",

};

export const ORDER_TYPE = {
  OFFLINE: "offline",
  ONLINE: "online",
  CUSTOMIZED: "customized",
  NOT_CUSTOMIZED: "customized",
};

export const TAXES = {
  VAT: 0.21,
};

/**
 * Names of the MySQL Procedures
 */
export const PRC_NAMES = {
  ORDERS_GROUPED: "PRC_getCountByOrder",
  INVENTORY_REPORT: "PRC_getInventoryReport",
  MANUFACTURER_REPORT: "PRC_getManufacturerReport",
  RECENT_DASHBOARD: "PRC_getRecentDashboardOrders",
  RECENT_ORDERS: "PRC_getRecentOrders",
  SALES_RETURN_REPORT: "PRC_getSaleReturnReport",
  SALES_BY_SUB_CATEGORY: "PRC_getSalesByCategoryWise",
  SALES_REPORT: "PRC_getSalesReport",
  SALES_SUMMARY: "PRC_getSaleSummary",
  TOP_PRODUCTS_REPORT: "PRC_getTopProductReport",
  SALES_BY_REGION: "PRC_getTotalSalesByRegion",
  USER_REPORT: "PRC_getUserReport",
  EXPENSE_REPORT: "PRC_getExpenseReport",
  ORDER_LIST_BY_TYPE: "PRC_getOrdersListByType",
};

export const ROWS_PER_PAGE = 10;
