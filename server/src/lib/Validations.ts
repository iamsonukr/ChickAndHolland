import { body, param, query } from "express-validator";
import { ORDER_TYPE } from "../constants";

export const categoryValidator = [
  body("name").notEmpty().trim().withMessage("Name is required"),
];

export const loginValidator = [
  body("userName").notEmpty().withMessage("Username is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

export const subcategoryValidator = [
  body("name").notEmpty().trim().withMessage("Name is required"),
  body("category")
    .notEmpty()
    .withMessage("Category is required")
    .isObject()
    .withMessage("Category Must Be A Object"),
  body("category.id")
    .notEmpty()
    .withMessage("Category.id is required")
    .isNumeric()
    .withMessage("Category.id must be a number"),
];

export const idValidater = [
  param("id").isNumeric().withMessage("Id must be a number"),
];

export const roleValidator = [
  body("name").notEmpty().trim().withMessage("Name is required"),
  body("description").notEmpty().trim().withMessage("Description is required"),
  body("permissions")
    .notEmpty()
    .withMessage("Permisssions are required")
    .isArray({ min: 1, max: 33 })
    .withMessage("At least 1 permission is required"),
];

export const payerValidator = [
  body("name").notEmpty().trim().withMessage("Name is required"),
  body("mobileNumber")
    .notEmpty()
    .withMessage("mobileNumber is required")
    .isMobilePhone("en-US")
    .withMessage("MobileNumber must be valid"),
];

export const sellerValidator = [
  body("name").notEmpty().trim().withMessage("Name is required"),
  body("userName")
    .notEmpty()
    .withMessage("UserName is required")
    .isEmail()
    .withMessage("Username must be valid email")
    .customSanitizer((input, { req }) => {
      req.body.email = input;
    }),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 7 })
    .withMessage("Password Should Be At Least 7 Charecters"),
];

export const employeeValidator = [
  body("firstName").notEmpty().trim().withMessage("FirstName is required"),
  body("lastName").notEmpty().trim().withMessage("LastName is required"),
  body("address1").notEmpty().trim().withMessage("Address1 is required"),
  body("address2").notEmpty().trim().withMessage("Address2 is required"),
  body("state").notEmpty().trim().withMessage("State is required"),
  body("zipCode")
    .notEmpty()
    .withMessage("ZipCode is required")
    .isNumeric()
    .withMessage("ZipCode Must Be Numberic"),
  body("userName").notEmpty().withMessage("Username is required"),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 7 })
    .withMessage("Password Should Be At Least 7 Charecters"),
  body("roleId")
    .notEmpty()
    .withMessage("RoleId is required")
    .isNumeric()
    .withMessage("RoleId Must Be Numberic"),
  // body("reportingManagerId")
  //   .notEmpty()
  //   .withMessage("ReportingManagerId is required")
  //   .isNumeric()
  //   .withMessage("Reporting Manager Must Be A Number"),
  body("mobileNumber")
    .notEmpty()
    .withMessage("mobileNumber is required")
    .isMobilePhone("en-US")
    .withMessage("MobileNumber must be valid"),
  body("image")
    .custom((input, { req }) => {
      if (req.file) return true;
      return false;
    })
    .withMessage("Image is required"),
  body("image")
    .custom((input, { req }) => {
      const file = req.file as Express.Multer.File;
      switch (file.mimetype) {
        case "image/png":
          return true;
        case "image/jpg":
          return true;
        case "image/jpeg":
          return true;
        default:
          return false;
      }
    })
    .withMessage("Only .png , .jpg  and .jpeg are allowed"),
];

export const expenseValidator = [
  body("expenseTypeId")
    .notEmpty()
    .withMessage("ExpenseTypeId is required")
    .isNumeric()
    .withMessage("ExpenseTypeId must be a number"),
  body("payerId")
    .notEmpty()
    .withMessage("PayerId is required")
    .isNumeric()
    .withMessage("PayerId must be a number"),
  body("paymentMode").notEmpty().trim().withMessage("PaymentMode Is Required"),
  body("amount")
    .notEmpty()
    .withMessage("Amount Is Required")
    .isNumeric()
    .withMessage("Amount must be a number"),
  body("description").notEmpty().withMessage("Description is required"),
  body("file")
    .custom((value, { req }) => {
      if (req.file) return true;
      return false;
    })
    .withMessage("File is required"),
  body("referenceNumber")
    .notEmpty()
    .withMessage("Reference Number Is Required")
    .isAlphanumeric()
    .withMessage("Reference Number Must Be A AlphaNumeric"),
];

export const editExpenseValidator = [
  body("expenseTypeId")
    .notEmpty()
    .withMessage("ExpenseTypeId is required")
    .isNumeric()
    .withMessage("ExpenseTypeId must be a number"),
  body("payerId")
    .notEmpty()
    .withMessage("PayerId is required")
    .isNumeric()
    .withMessage("PayerId must be a number"),
  body("paymentMode").notEmpty().trim().withMessage("PaymentMode Is Required"),
  body("amount")
    .notEmpty()
    .withMessage("Amount Is Required")
    .isNumeric()
    .withMessage("Amount must be a number"),
  body("description").notEmpty().withMessage("Description is required"),

  body("referenceNumber")
    .notEmpty()
    .withMessage("Reference Number Is Required")
    .isAlphanumeric()
    .withMessage("Reference Number Must Be A AlphaNumeric"),
];

export const expenseTypeValidator = [
  body("name").notEmpty().trim().withMessage("Name is required"),
];

// inventory validator
export const inventoryValidator = [
  body("color").notEmpty().trim().withMessage("Color is required"),
  body("general").notEmpty().trim().withMessage("Color is required"),
  body("size")
    .notEmpty()
    .withMessage("Color is required")
    .isNumeric()
    .withMessage("Size must be a number"),
  body("category")
    .notEmpty()
    .withMessage("Category is required")
    .isObject()
    .withMessage("Category Must Be A Object"),
  body("category.id")
    .notEmpty()
    .withMessage("Category.id is required")
    .isNumeric()
    .withMessage("Category.id must be a number"),
  body("subCategory")
    .notEmpty()
    .withMessage("Sub Category is required")
    .isObject()
    .withMessage("Sub Category Must Be A Object"),
  body("subCategory.id")
    .notEmpty()
    .withMessage("Sub Category.id is required")
    .isNumeric()
    .withMessage("Sub Category.id must be a number"),
  body("product")
    .notEmpty()
    .withMessage("Product is required")
    .isObject()
    .withMessage("Product Must Be A Object"),
  body("product.id")
    .notEmpty()
    .withMessage("Product.id is required")
    .isNumeric()
    .withMessage("Product.id must be a number"),
];

export const orderValidator = [
  body("items")
    .custom((input, { req }) => {
      const items = JSON.parse(req.body.items) as {
        productId: number;
        quantity: number;
      }[];

      if (items.length > 0) return true;

      return false;
    })
    .withMessage("At least 1 item is required"),
  body("items")
    .custom((input, { req }) => {
      const items = JSON.parse(req.body.items) as {
        productId: number;
        quantity: number;
      }[];

      for (const item of items) {
        const keys = Object.keys(item);
        const hasAllKeys =
          keys.includes("productId") && keys.includes("quantity");

        if (!hasAllKeys) return false;
      }

      return true;
    })
    .withMessage(
      "Every item in Items must have productId, quantity, categoryId, subCategoryId"
    ),
  body("customerName")
    .notEmpty()
    .trim()
    .withMessage("CustomerName is required"),
  body("customerMobile")
    .notEmpty()
    .withMessage("CustomerMobile is required")
    .isMobilePhone("en-US")
    .withMessage("CustomerMobile must be valid"),
  body("orderType")
    .notEmpty()
    .trim()
    .withMessage("OrderType is required")
    .isIn(Object.values(ORDER_TYPE))
    .withMessage(`OrderType Must Be ${Object.values(ORDER_TYPE).join(" Or ")}`),
  body("color").notEmpty().trim().withMessage("Color is required"),
  body("zipCode")
    .notEmpty()
    .withMessage("ZipCode is required")
    .isNumeric()
    .withMessage("ZipCode Must Be Numberic"),
  body("quantity")
    .notEmpty()
    .withMessage("Quantity is required")
    .isNumeric()
    .withMessage("Quantity Must Be Numberic"),
  body("status").notEmpty().trim().withMessage("Status is required"),
  body("totalAmount")
    .notEmpty()
    .withMessage("TotalAmount is required")
    .isNumeric()
    .withMessage("TotalAmount Must Be Numberic"),
  body("estimatedDeliveryTime")
    .notEmpty()
    .withMessage("EstimatedDeliveryTime is required")
    .isDate({ delimiters: ["/", "-"], format: "YYYY-MM-DD" })
    .toDate()
    .withMessage("EstimatedDeliveryTime Must Match YYYY-MM-DD Format"),
  body("productStatus")
    .notEmpty()
    .trim()
    .withMessage("ProductStatus is required"),
  body("paymentStatus")
    .notEmpty()
    .trim()
    .withMessage("PaymentStatus is required"),
  body("remarks").notEmpty().trim().withMessage("Remarks is required"),
  body("hasVat")
    .notEmpty()
    .withMessage("HasVat is required")
    .isBoolean()
    .withMessage("HasVat Must Be A Boolean"),
  body("productionCost")
    .notEmpty()
    .withMessage("ProductionCost is required")
    .isNumeric()
    .withMessage("ProductionCost Must Be Numberic"),
  body("customizationCost")
    .notEmpty()
    .withMessage("CustomizationCost is required")
    .isNumeric()
    .withMessage("CustomizationCost Must Be Numberic"),
  body("bodyDetail").customSanitizer((input) => {
    return JSON.parse(input);
  }),
  body("bodyDetail.height")
    .notEmpty()
    .withMessage("BodyDetail.height is required")
    .isNumeric()
    .withMessage("BodyDetail.height Must Be Numberic"),
  body("bodyDetail.head")
    .notEmpty()
    .withMessage("BodyDetail.head is required")
    .isNumeric()
    .withMessage("BodyDetail.head Must Be Numberic"),
  body("bodyDetail.neck")
    .notEmpty()
    .withMessage("BodyDetail.neck is required")
    .isNumeric()
    .withMessage("BodyDetail.neck Must Be Numberic"),
  body("bodyDetail.hip")
    .notEmpty()
    .withMessage("BodyDetail.hip is required")
    .isNumeric()
    .withMessage("BodyDetail.hip Must Be Numberic"),
  body("bodyDetail.shoulderToWaist")
    .notEmpty()
    .withMessage("BodyDetail.shoulderToWaist is required")
    .isNumeric()
    .withMessage("BodyDetail.shoulderToWaist Must Be Numberic"),
  body("bodyDetail.sleeveLength")
    .notEmpty()
    .withMessage("BodyDetail.sleeveLength is required")
    .isNumeric()
    .withMessage("BodyDetail.sleeveLength Must Be Numberic"),
  body("bodyDetail.armTurn")
    .notEmpty()
    .withMessage("BodyDetail.armTurn is required")
    .isNumeric()
    .withMessage("BodyDetail.armTurn Must Be Numberic"),
  body("bodyDetail.shoeSize")
    .notEmpty()
    .withMessage("BodyDetail.shoeSize is required")
    .isNumeric()
    .withMessage("BodyDetail.shoeSize Must Be Numberic"),
  body("bodyDetail.waistLengthBehind")
    .notEmpty()
    .withMessage("BodyDetail.waistLengthBehind is required")
    .isNumeric()
    .withMessage("BodyDetail.waistLengthBehind Must Be Numberic"),
  body("bodyDetail.shoulderLength")
    .notEmpty()
    .withMessage("BodyDetail.shoulderLength is required")
    .isNumeric()
    .withMessage("BodyDetail.shoulderLength Must Be Numberic"),
  body("bodyDetail.bustCircumference")
    .notEmpty()
    .withMessage("BodyDetail.bustCircumference is required")
    .isNumeric()
    .withMessage("BodyDetail.bustCircumference Must Be Numberic"),
  body("bodyDetail.waistCircumference")
    .notEmpty()
    .withMessage("BodyDetail.waistCircumference is required")
    .isNumeric()
    .withMessage("BodyDetail.waistCircumference Must Be Numberic"),
  body("bodyDetail.waistToKnee")
    .notEmpty()
    .withMessage("BodyDetail.waistToKnee is required")
    .isNumeric()
    .withMessage("BodyDetail.waistToKnee Must Be Numberic"),
  body("bodyDetail.waistToAnkle")
    .notEmpty()
    .withMessage("BodyDetail.waistToAnkle is required")
    .isNumeric()
    .withMessage("BodyDetail.waistToAnkle Must Be Numberic"),
  body("bodyDetail.waistLengthBehind_two")
    .notEmpty()
    .withMessage("BodyDetail.waistLengthBehind_two is required")
    .isNumeric()
    .withMessage("BodyDetail.waistLengthBehind_two Must Be Numberic"),
];

// product validator
export const productValidator = [
  body("categoryId")
    .notEmpty()
    .withMessage("CategoryId is required")
    .isNumeric()
    .withMessage("CategoryId must be a number"),
  body("subCategoryId")
    .notEmpty()
    .withMessage("Sub CategoryId is required")
    .isNumeric()
    .withMessage("Sub CategoryId must be a number"),
  // body("quantity")
  //   .notEmpty()
  //   .withMessage("Quantity is required")
  //   .isNumeric()
  //   .withMessage("Quantity Must Be A Number"),
  // body("color").notEmpty().trim().withMessage("Color is required"),
  // body("productCode").notEmpty().trim().withMessage("Product Code is required"),
  // body("unitProduct").notEmpty().trim().withMessage("Unit Product is required"),
  // body("unitSale").notEmpty().trim().withMessage("Unit Sale is required"),
  // body("minSaleQuantity")
  //   .notEmpty()
  //   .withMessage("Minimum Sale Quantity is required")
  //   .isNumeric()
  //   .withMessage("Minimum Sale Quantity Must Be A Number"),
  // body("hasReturnPolicy")
  //   .notEmpty()
  //   .withMessage("Has Return Policy is required")
  //   .isBoolean()
  //   .withMessage("Has Return Policy Must Be A Boolean"),
  // body("hasDiscount")
  //   .notEmpty()
  //   .withMessage("Has Discount is required")
  //   .isBoolean()
  //   .withMessage("Has Discount Must Be A Boolean"),
  // body("stockAlert")
  //   .notEmpty()
  //   .withMessage("Stock Alert is required")
  //   .isNumeric()
  //   .withMessage("Stock Alert Must Be A Number"),
  body("images")
    .custom((input, { req }) => {
      if (req.files && req.files.length > 0) return true;
      return false;
    })
    .withMessage("At least 1 image is required"),
  // body("images")
  //   .custom((input, { req }) => {
  //     const fileTypes = req.files.map(
  //       (file: Express.Multer.File) => file.mimetype
  //     );
  //     for (const file of fileTypes) {
  //       switch (file) {
  //         case "image/png":
  //           continue;
  //         case "image/jpg":
  //           continue;
  //         case "image/jpeg":
  //           continue;
  //         default:
  //           return false;
  //       }
  //     }
  //     return true;
  //   })
  //   .withMessage("Only .png , .jpg  and .jpeg are allowed"),
];

// product validator
export const editProductValidator = [
  body("categoryId")
    .notEmpty()
    .withMessage("CategoryId is required")
    .isNumeric()
    .withMessage("CategoryId must be a number"),
  body("subCategoryId")
    .notEmpty()
    .withMessage("Sub CategoryId is required")
    .isNumeric()
    .withMessage("Sub CategoryId must be a number"),
  body("quantity")
    .notEmpty()
    .withMessage("Quantity is required")
    .isNumeric()
    .withMessage("Quantity Must Be A Number"),
  body("color").notEmpty().trim().withMessage("Color is required"),
  body("productCode").notEmpty().trim().withMessage("Product Code is required"),
  // body("unitProduct").notEmpty().trim().withMessage("Unit Product is required"),
  // body("unitSale").notEmpty().trim().withMessage("Unit Sale is required"),
  body("minSaleQuantity")
    .notEmpty()
    .withMessage("Minimum Sale Quantity is required")
    .isNumeric()
    .withMessage("Minimum Sale Quantity Must Be A Number"),
  body("hasReturnPolicy")
    .notEmpty()
    .withMessage("Has Return Policy is required")
    .isBoolean()
    .withMessage("Has Return Policy Must Be A Boolean"),
  body("hasDiscount")
    .notEmpty()
    .withMessage("Has Discount is required")
    .isBoolean()
    .withMessage("Has Discount Must Be A Boolean"),
  body("stockAlert")
    .notEmpty()
    .withMessage("Stock Alert is required")
    .isNumeric()
    .withMessage("Stock Alert Must Be A Number"),
];

export const imageIdValiadtor = [
  body("imageIds")
    .notEmpty()
    .withMessage("ImageIds Are Required")
    .isArray()
    .withMessage("ImageIds Must Be An Array")
    .isArray({ min: 1 })
    .withMessage("At Least 1 ImageId Is Required"),
];

export const orderFilterValidator = [
  query("type")
    .notEmpty()
    .trim()
    .isIn(Object.values(ORDER_TYPE))
    .withMessage(`type Must Be ${Object.values(ORDER_TYPE).join(" Or ")}`),
];

export const userValidator = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email must be valid"),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6, max: 8 })
    .withMessage("Password Should Be Min 6 and Max 8 Charecters"),
  body("username")
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ min: 3 })
    .withMessage("Username Should Be At Least 3 Charecters"),
];

export const userLoginValidator = [
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6, max: 8 })
    .withMessage("Password Should Be Min 6 and Max 8 Charecters"),
  body("username")
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ min: 3 })
    .withMessage("Username Should Be At Least 3 Charecters"),
];

export const userUpdateValidator = [
  body("email").optional().isEmail().withMessage("Email must be valid"),
  body("password")
    .optional()
    .isLength({ min: 6, max: 8 })
    .withMessage("Password Should Be Min 6 and Max 8 Charecters"),
  body("username")
    .optional()
    .isLength({ min: 3 })
    .withMessage("Username Should Be At Least 3 Charecters"),
];

export const cartAndWishlistValidator = [
  query("productId")
    .notEmpty()
    .withMessage("ProductId is required")
    .isNumeric()
    .withMessage("ProductId Must Be A Number"),
];

export const enquiryEmailValidator = [
  body("firstName").notEmpty().withMessage("First Name is Required"),
  body("lastName").notEmpty().withMessage("Last Name is Required"),
  body("contactNumber").notEmpty().withMessage("First Name is Required"),
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email must be valid"),
  body("city").notEmpty().withMessage("City is Required"),
  body("country").notEmpty().withMessage("Country is Required"),
  body("message").notEmpty().withMessage("Message is Required"),
  body("productCodes").notEmpty().withMessage("Product Codes is Required"),
  // body("categoryName").notEmpty().withMessage("Category Name is Required"),
];

export const addRetailorValidator = [
  body("username").notEmpty().withMessage("User Name is Required"),
  body("password").notEmpty().withMessage("Password is Required"),
  body("name").notEmpty().withMessage("Name is Required"),
  body("storeName").notEmpty().withMessage("Store Name is required"),
  body("storeAddress").notEmpty().withMessage("Store address is Required"),
  body("website")
    .notEmpty()
    .withMessage("Website is Required")
    .isURL()
    .withMessage("Should be a valid URL"),
  body("phoneNumber").notEmpty().withMessage("Phone Number is Required"),
  body("contactPersonOfTheStore")
    .notEmpty()
    .withMessage("Contact Person of the Store is Required"),
  body("page").optional(),
];

export const constactUsFormValidator = [
  body("can_we_give_you_a_call")
    .notEmpty()
    .withMessage("Please fill all the fields"),
  body("how_can_we_contact_you")
    .notEmpty()
    .withMessage("Please fill all the fields"),
  body("tell_us_who_you_are")
    .notEmpty()
    .withMessage("Please fill all the fields"),
  body("where_are_you_from")
    .notEmpty()
    .withMessage("Please fill all the fields"),
];
