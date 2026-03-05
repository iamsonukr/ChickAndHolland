"use client";

import z from "zod";
import { isValidPhoneNumber } from "react-phone-number-input";

export enum OrderType {
  Store = "Store",
  Online = "Online",
  Retail = "Retail",
  Customer = "Customer",
  Stock = "Stock",
  Fresh = "Fresh",
}

export enum OrderStatus {
  Pattern = "Pattern",
  Khaka = "Khaka",
  IssueBeading = "Issue Beading",
  Beading = "Beading",
  Zarkan = "Zarkan",
  Stitching = "Stitching",
  BalancePending = "Balance Pending",
  ReadyToDelivery = "Ready to Delivery",
  Shipped = "Shipped",
}


export enum ShippingStatus {
  NotShipped = "Not Shipped",
  Shipped = "Shipped",
}

export enum ColorType {
  SAS = "SAS",
  // ClientProvided = "Client provided",
  Custom = "Custom",
}

export enum SizeCountry {
  EU = "EU",
  IT = "IT",
  US = "US",
  UK = "UK",
}

export const OrderTypeKeys = Object.keys(OrderType) as [keyof typeof OrderType];
export const ColorTypeKeys = Object.keys(ColorType) as [keyof typeof ColorType];
export const SizeCountryKeys = Object.keys(SizeCountry) as [
  keyof typeof SizeCountry,
];
export const ExpenseType = ["fixed", "opex", "others"];

export const sizes = Array.from({ length: 16 }, (_, i) => 30 + i * 2);

export const imageFormatsSupportedByPDF = ["jpg", "jpeg", "png"];

export const enquireNowFormSchema = z.object({
  firstName: z.string().min(1, {
    message: "First Name is required",
  }),
  lastName: z.string().min(1, {
    message: "Last Name is required",
  }),
  contactNumber: z.string().min(1, {
    message: "Contact Number is required",
  }),
  email: z.string().email({
    message: "Invalid Email Address",
  }),
  city: z.string().min(1, {
    message: "City is required",
  }),
  country: z.string().min(1, {
    message: "Country is required",
  }),
  message: z.string().min(1, {
    message: "Message is required",
  }),
  productCodes: z.string().min(1, {
    message: "Product Code is required",
  }),
  // categoryName: z.string().min(1, {
  //   message: "Category Name is required"
  // })
});
export type EnquireNowForm = z.infer<typeof enquireNowFormSchema>;

export const loginFormSchema = z.object({
  userName: z.string().min(1, {
    message: "Username is required",
  }),
  password: z.string().min(1, {
    message: "Password is required",
  }),
});
export type LoginForm = z.infer<typeof loginFormSchema>;
export const updateShippingStatusFormSchema = z.object({
  shippingStatus: z.string().nonempty("Shipping status is required"),
});

export type ShippingStatusForm = z.infer<typeof updateShippingStatusFormSchema>;


export const addCustomerFormSchema = z.object({
  name: z.string().min(1, {
    message: "Name is required",
  }),

  storeName: z.string().min(1, {
    message: "Store Name is required",
  }),

  website: z.string().optional(),

  phoneNumber: z.string().min(1, {
    message: "Phone Number is required",
  }),

  contactPerson: z.string().min(1, {
    message: "Contact Person is required",
  }),

  email: z.string().email({
    message: "Invalid Email Address",
  }),

  // ✅ PROXIMITY → STRING hi rakha (kyunki input string deta hai)
  proximity: z.string().min(1, {
    message: "Proximity is required",
  }),

    address: z.string().optional(),


  // ✅ COORDINATES OPTIONAL (Edit + QuickBooks safe)
  coordinates: z
    .object({
      latitude: z.string().optional(),
      longitude: z.string().optional(),
    })
    .optional(),

  city_name: z.string().min(1, {
    message: "City/Town is required",
  }),

  country_id: z.string().min(1, {
    message: "Country is required",
  }),

  currency_id: z.string().optional(),
});

export type AddCustomerForm = z.infer<typeof addCustomerFormSchema>;

export const addStockFormSchema = z.object({
  styleNo: z
    .array(
      z.object({
        value: z.string().min(1, "Style No is required"),
        label: z.string().min(1, "Style No is required"),
      }),
    )
    .min(1, "Product is required"),
  colorsQuantity: z.array(
    z
      .object({
        quantity: z
          .string()
          .min(1, {
            message: "Quantity is required",
          })
          .refine((value) => {
            return !isNaN(Number(value));
          }, "Quantity should be a number"),
        price: z
          .number({
            coerce: true,
          })
          .min(1, {
            message: "Price is required",
          }),
        size: z.string().min(1, {
          message: "Size is required",
        }),
        size_country: z.string().min(1, {
          message: "Size Country is Required",
        }),
        mesh: z.string().min(1, {
          message: "Mesh Color is required",
        }),
        beading: z.string().min(1, {
          message: "Beading Color is required",
        }),
        lining: z.string().min(1, {
          message: "Lining is required",
        }),
        liningColor: z.string().optional(),
        discount: z
          .number({
            coerce: true,
          })
          .min(0, {
            message: "Discount is required",
          }),
        currencyBasedPricing: z.array(
          z.object({
            currencyId: z.string().min(1, {
              message: "Currency is required",
            }),
            price: z
              .number({
                coerce: true,
              })
              .min(1, {
                message: "Price is Required",
              }),
            discount: z
              .number({
                coerce: true,
              })
              .min(0, {
                message: "Discount is required",
              }),
          }),
        ).optional(),
      })
      .refine(
        (data) => {
          if (
            data.lining !== "No Lining" &&
            (!data.liningColor || data.liningColor.trim() === "")
          ) {
            return false;
          }
          return true;
        },
        {
          message: "Lining Color is required when lining is not 'No Lining'",
          path: ["liningColor"],
        },
      ),
  ),
});
export type AddStockForm = z.infer<typeof addStockFormSchema>;

export const editStockFormSchema = z
  .object({
    quantity: z
      .string()
      .min(1, {
        message: "Quantity is required",
      })
      .refine((value) => {
        return !isNaN(Number(value));
      }, "Quantity should be a number"),
    price: z
      .string({
        coerce: true,
      })
      .min(1, {
        message: "Price is required",
      }),
    mesh: z.string().min(1, {
      message: "Mesh Color is required",
    }),
    beading: z.string().min(1, {
      message: "Beading Color is required",
    }),
    lining: z.string().min(1, {
      message: "Lining is required",
    }),
    liningColor: z.string().optional(),
    discount: z
      .string()
      .min(1, {
        message: "Discount is required",
      })
      .refine((value) => {
        return !isNaN(Number(value));
      }, "Discount should be a number"),
    currencyBasedPricing: z.array(
      z.object({
        currencyId: z.string().min(1, {
          message: "Currency is required",
        }),
        price: z
          .number({
            coerce: true,
          })
          .min(1, {
            message: "Price is Required",
          }),
        discount: z
          .number({
            coerce: true,
          })
          .min(0, {
            message: "Discount is required",
          }),
      }),
    ).optional(),
  })
  .refine(
    (data) => {
      if (
        data.lining !== "No Lining" &&
        (!data.liningColor || data.liningColor.trim() === "")
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Lining Color is required when lining is not 'No Lining'",
      path: ["liningColor"],
    },
  );
export type editStockForm = z.infer<typeof editStockFormSchema>;

// export const createOrderFormSchema = z.object({
//   purchaseOrderNo: z
//     .string()
//     .min(1, {
//       message: "Purchase Order Number is required",
//     })
//     .refine((value) => {
//       const splitted = value.split(" ");
//       const last = splitted[splitted.length - 1];
//       return !isNaN(Number(last));
//     }, "Purchase Order Number should end with number"),
//   manufacturingEmailAddress: z.string().email({
//     message: "Invalid Email Address",
//   }),
//   orderType: z.enum(OrderTypeKeys, {
//     message: "Order Type is required",
//   }),
//   orderReceivedDate: z.date({
//     required_error: "Order Received Date is required",
//   }),
//   orderCancellationDate: z.date({
//     required_error: "Order Cancellation Date is required",
//   }),
//   address: z.string().optional(),
//   customerId: z
//     .object({
//       value: z.string().min(1, {
//         message: "Style Number is required",
//       }),
//       label: z.string().optional(),
//     })
//     .array()
//     .min(1, {
//       message: "Customer is required",
//     }),
//   styles: z
//     .array(
//       z
//         .object({
//           styleNo: z
//             .object({
//               value: z.string().min(1, {
//                 message: "Style Number is required",
//               }),
//               label: z.string().optional(),
//             })
//             .array()
//             .min(1, {
//               message: "Style Number is required",
//             }),
//           colorType: z.enum(ColorTypeKeys, {
//             message: "Color Type is required",
//           }),
//           customColor: z
//             .object({
//               value: z.string().optional(),
//               label: z.string().optional(),
//             })
//             .array()
//             .optional(),
//           sizeCountry: z.enum(SizeCountryKeys, {
//             message: "Size Country is required",
//           }),
//           size: z.string().min(1, {
//             message: "Size is required",
//           }),
//           customSize: z
//             .object({
//               value: z.string().optional(),
//               label: z.string().optional(),
//             })
//             .array()
//             .optional(),
//           mesh: z.string().min(1, {
//             message: "Mesh Color is required",
//           }),
//           beading: z.string().min(1, {
//             message: "Beading Color is required",
//           }),
//           lining: z.string().min(1, {
//             message: "Lining is required",
//           }),
//           liningColor: z.string().optional(),
//           addLining: z.boolean().optional(),
//           quantity: z.string().optional(),
//           customSizesQuantity: z
//             .object({
//               size: z.string().optional(),
//               quantity: z.string().min(1, {
//                 message: "Quantity is required",
//               }),
//             })
//             .array()
//             .optional(),
//           comments: z.array(z.string()).optional(),
//           modifiedPhotoImage: z.any().optional(),
//         })
//         .refine(
//           (data) => {
//             if (
//               data.lining !== "No Lining" &&
//               (!data.liningColor || data.liningColor.trim() === "")
//             ) {
//               return false;
//             }
//             return true;
//           },
//           {
//             message: "Lining Color is required when lining is not 'No Lining'",
//             path: ["liningColor"],
//           },
//         ),
//     )
//     .min(1, {
//       message: "At least one style is required",
//     }),
// });
export const createOrderFormSchema = z.object({
  purchaseOrderNo: z
    .string()
    .min(1, { message: "Purchase Order Number is required" }),

  manufacturingEmailAddress: z.string().email({
    message: "Invalid Email Address",
  }),

 orderType: z.string().min(1, "Order Type is required"),


  // 🔥 Allow optional date
  orderReceivedDate: z.date().nullable().optional(),
  orderCancellationDate: z.date().nullable().optional(),

  address: z.string().optional(),

  customerId: z
    .object({
      value: z.string().min(1, {
        message: "Customer is required",
      }),
      label: z.string().optional(),
    })
    .array()
    .min(1, {
      message: "Customer is required",
    }),

  styles: z
    .array(
      z
        .object({
          styleNo: z
            .object({
              value: z.string().min(1, {
                message: "Style Number is required",
              }),
              label: z.string().optional(),
            })
            .array()
            .min(1, "Style Number is required"),

          colorType: z.enum(ColorTypeKeys, {
            message: "Color Type is required",
          }),

          customColor: z
            .object({
              value: z.string().optional(),
              label: z.string().optional(),
            })
            .array()
            .optional(),

          sizeCountry: z.enum(SizeCountryKeys, {
            message: "Size Country is required",
          }),

          size: z.string().min(1, { message: "Size is required" }),

          customSize: z
            .object({
              value: z.string().optional(),
              label: z.string().optional(),
            })
            .array()
            .optional(),

          mesh: z.string().min(1, {
            message: "Mesh Color is required",
          }),

          beading: z.string().min(1, {
            message: "Beading Color is required",
          }),

          lining: z.string().min(1, {
            message: "Lining is required",
          }),

          liningColor: z.string().optional(),

          addLining: z.boolean().optional(),

          quantity: z.string().optional(),

          customSizesQuantity: z
            .object({
              size: z.string().optional(),
              quantity: z.string().min(1, {
                message: "Quantity is required",
              }),
            })
            .array()
            .optional(),

          comments: z.array(z.string()).optional(),
          modifiedPhotoImage: z.any().optional(),
        })
        // 🔥 Fix: Only require liningColor when needed
        .refine(
          (data) => {
            if (
              data.lining !== "No Lining" &&
              (!data.liningColor || data.liningColor.trim() === "")
            ) {
              return false;
            }
            return true;
          },
          {
            message: "Lining Color is required when lining is not 'No Lining'",
            path: ["liningColor"],
          }
        )
    )
    .min(1, {
      message: "At least one style is required",
    }),
});
export type CreateOrderForm = z.infer<typeof createOrderFormSchema>;

export const createFreshOrderFormSchema = z.object({
  purchaseOrderNo: z
    .string()
    .min(1, {
      message: "Purchase Order Number is required",
    })
    .refine((value) => {
      const splitted = value.split("");
      const last = splitted[splitted.length - 1];
      return !isNaN(Number(last));
    }, "Purchase Order Number should end with number"),
  manufacturingEmailAddress: z.string().email({
    message: "Invalid Email Address",
  }),
  orderReceivedDate: z.date({
    required_error: "Order Received Date is required",
  }),
  orderCancellationDate: z.date({
    required_error: "Order Cancellation Date is required",
  }),
  address: z.string(),
  customerId: z.string(),
  orderId: z.number(),

  advance: z.number({
    coerce: true,
  }),
  shipping: z.number({
    coerce: true,
    required_error: "Shipping cost required",
  }),
  customization: z.number({
    coerce: true,
  }),
  product_amount: z.number({
    coerce: true,
  }),
  total_amount: z.number({
    coerce: true,
  }),
  estimate: z.string(),
  invoice: z.string(),
  styles: z
    .array(
      z
        .object({
          styleNo: z.string(),
          customColor: z.string(),
          customization_p: z.number({
            coerce: true,
          }),
          amount: z.number({
            coerce: true,
          }),
          fav_id: z.number({
            coerce: true,
          }),
          size: z
            .string({
              coerce: true,
            })
            .min(1, {
              message: "Size is required",
            }),
          customSize: z
            .object({
              value: z.string().optional(),
              label: z.string().optional(),
            })
            .array()
            .optional(),
          quantity: z
            .string({
              coerce: true,
            })
            .optional(),
          customSizesQuantity: z
            .object({
              size: z.string().optional(),
              quantity: z.string().min(1, {
                message: "Quantity is required",
              }),
            })
            .array()
            .optional(),
          comments: z.string(),
          modifiedPhotoImage: z.any().optional(),
          meshColor: z.string(),
          beadingColor: z.string(),
          lining: z.string(),
          liningColor: z.string().optional(),
        })
        .refine(
          (data) => {
            if (
              data.lining !== "No Lining" &&
              (!data.liningColor || data.liningColor.trim() === "")
            ) {
              return false;
            }
            return true;
          },
          {
            message: "Lining Color is required when lining is not 'No Lining'",
            path: ["liningColor"],
          },
        ),
    )
    .min(1, {
      message: "At least one style is required",
    }),
});
export type CreateFreshOrderForm = z.infer<typeof createFreshOrderFormSchema>;

export const createStockOrderFormSchema = z.object({
  purchaseOrderNo: z.string().optional(),


  manufacturingEmailAddress: z
    .string()
    .email({ message: "Invalid Email Address" })
    .optional(),

  total_amount: z.number({ coerce: true }),
  product_amount: z.number({ coerce: true }),
  estimate: z.string(),
  invoice: z.string(),
  shipping: z.number({ coerce: true }),

  orderReceivedDate: z.date({ required_error: "Order Received Date is required" }),
  orderCancellationDate: z.date({ required_error: "Order Cancellation Date is required" }),

  address: z.string().optional(),
  customerId: z.string().min(1, "Customer is required"),

  styleNo: z.string(),
  colorType: z.string().optional(), // 🔥 fix here
  meshColor: z.string(),
  beadingColor: z.string(),
  lining: z.string(),
  liningColor: z.string(),

  size: z.string().min(1, { message: "Size is required" }),
  advance: z.string({ coerce: true }),
  quantity: z.string({ coerce: true }).optional(),
});

export type CreateStockOrderForm = z.infer<typeof createStockOrderFormSchema>;

export const addExpenseFormSchema = z.object({
  payer: z.string().min(1, {
    message: "Payer is required",
  }),
  expenseType: z.string().min(1, {
    message: "Expense Type is required",
  }),

  amount: z
    .string()
    .min(1, {
      message: "Amount is required",
    })
    .refine((value) => {
      return !isNaN(Number(value));
    }, "Amount should be a number"),
  currency: z.string().min(1, {
    message: "Currency is required",
  }),
  invoice: z.string().min(1, {
    message: "Invoice is required",
  }),
  expenseName: z.string().min(1, {
    message: "Expense Name is required",
  }),
  otherType: z.string().optional(),
});
export type AddExpenseForm = z.infer<typeof addExpenseFormSchema>;

export const createRetailerFormSchema = z.object({
  username: z.string().min(1, {
    message: "Username is required",
  }),
  password: z.string().min(1, {
    message: "Password is required",
  }),
});
export type CreateRetailerForm = z.infer<typeof createRetailerFormSchema>;

export const placeRetailerOrderFormSchema = z.object({
  stockId: z.string().min(1, {
    message: "Stock is required",
  }),
  address: z.string().optional(),
  quantity: z
    .string()
    .min(1, {
      message: "Quantity is required",
    })
    .refine((value) => {
      return !isNaN(Number(value));
    }, "Quantity should be a number"),
  color: z.string().min(1, {
    message: "Color is required",
  }),
});
export type PlaceRetailerOrder = z.infer<typeof placeRetailerOrderFormSchema>;

export const contactUsFormSchema = z.object({
  name: z.string().min(1, {
    message: "Name is required",
  }),
  email: z.string().email({
    message: "Invalid Email Address",
  }),
  orderReceivedDate: z.any(),
  phoneNumber: z
    .string()
    .optional()
    .refine(
      (value) => {
        if (!value) return true;
        if (value?.trim() === "") return true;
        return isValidPhoneNumber(value);
      },
      {
        message: "Invalid Phone Number",
      },
    ),
  subject: z.string().min(1, {
    message: "Subject is required",
  }),
  // location: z.string().min(1, {
  //   message: "Location is required",
  // }),
  message: z.string().min(1, {
    message: "Message is required",
  }),
  state: z.string().min(1, {
    message: "State is required",
  }),
  country: z.string().min(1, {
    message: "Country is required",
  }),
});
export type ContactUsForm = z.infer<typeof contactUsFormSchema>;

export const addProductCategoryFormSchema = z.object({
  name: z.string().min(1, {
    message: "Name is required",
  }),
  priority: z
    .string()
    .min(1, {
      message: "Priority is required",
    })
    .refine((value) => {
      return !isNaN(Number(value));
    }, "Priority should be a number"),
});
export type AddProductCategoryForm = z.infer<
  typeof addProductCategoryFormSchema
>;

export const addProductCollectionFormSchema = z.object({
  name: z.string().min(1, {
    message: "Name is required",
  }),
  categoryId: z.string().min(1, {
    message: "Category is required",
  }),
  priority: z
    .string()
    .min(1, {
      message: "Priority is required",
    })
    .refine((value) => {
      return !isNaN(Number(value));
    }, "Priority should be a number"),
});
export type AddProductCollectionForm = z.infer<
  typeof addProductCollectionFormSchema
>;

export const addProductFormSchema = z
  .object({
    productCode: z.string().min(1, {
      message: "Product Code is required",
    }),
    categoryId: z.string().min(1, {
      message: "Category is required",
    }),
    subCategoryId: z.string().min(1, {
      message: "Collection is required",
    }),
    description: z.string(),
    mesh: z.string().min(1, {
      message: "Mesh Color is required",
    }),
    beading: z.string().min(1, {
      message: "Beading Color is required",
    }),
    lining: z.string().min(1, {
      message: "Lining is required",
    }),
    liningColor: z.string().optional(),
    productPrice: z
      .number({
        coerce: true,
      })
      .min(1, {
        message: "Price is Required",
      }),
    currencyBasedPricing: z.array(
      z.object({
        currencyId: z.string().min(1, {
          message: "Currency is required",
        }),
        price: z
          .number({
            coerce: true,
          })
          .min(1, {
            message: "Price is Required",
          }),
      }),
    ),
  })
  .refine(
    (data) => {
      if (
        data.lining !== "No Lining" &&
        (!data.liningColor || data.liningColor.trim() === "")
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Lining Color is required when lining is not 'No Lining'",
      path: ["liningColor"],
    },
  );
export type AddProductForm = z.infer<typeof addProductFormSchema>;

export const editProductFormSchema = z
  .object({
    productCode: z.string().min(1, {
      message: "Product Code is required",
    }),
    categoryId: z.string().min(1, {
      message: "Category is required",
    }),
    subCategoryId: z.string().min(1, {
      message: "Collection is required",
    }),
    description: z.string(),
    mesh: z.string().min(1, {
      message: "Mesh Color is required",
    }),
    beading: z.string().min(1, {
      message: "Beading Color is required",
    }),
    lining: z.string().min(1, {
      message: "Lining is required",
    }),
    liningColor: z.string().optional(),
    productPrice: z
      .number({
        coerce: true,
      })
      .min(1, {
        message: "Price is Required",
      }),
    id: z.string(),
  })
  .refine(
    (data) => {
      if (
        data.lining !== "No Lining" &&
        (!data.liningColor || data.liningColor.trim() === "")
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Lining Color is required when lining is not 'No Lining'",
      path: ["liningColor"],
    },
  );
export type editProductForm = z.infer<typeof editProductFormSchema>;

export const addLocatorFormSchema = z.object({
  name: z.string().min(1, {
    message: "Name is required",
  }),
  proximity: z.string().min(1, {
    message: "Proximity is required",
  }),
  address: z.string().min(1, {
    message: "Address is required",
  }),
  city_name: z.string().min(1, {
    message: "Address is required",
  }),
  coordinates: z.object({
    latitude: z.string().min(1, {
      message: "Latitude is required",
    }),
    longitude: z.string().min(1, {
      message: "Longitude is required",
    }),
  }),
});
export type AddLocatorForm = z.infer<typeof addLocatorFormSchema>;
``;
export const addUserRoleFormSchema = z.object({
  roleName: z.string().min(1, {
    message: "Role name is required",
  }),
  permissions: z.array(z.string()).min(1, {
    message: "At least one permission is required",
  }),
});
export type AddUserRoleForm = z.infer<typeof addUserRoleFormSchema>;

export const addUserFormSchema = z.object({
  username: z.string().min(1, {
    message: "Username is required",
  }),
  password: z
    .string()
    .min(1, {
      message: "Password is required",
    })
    .optional(),
  // userRoleId: z.string().min(1, {
  //   message: "User Role is required",
  // }),
});
export type AddUserForm = z.infer<typeof addUserFormSchema>;

export const editUserFormSchema = addUserFormSchema.extend({
  password: z.string().optional(),
});
export type EditUserFormType = z.infer<typeof editUserFormSchema>;

export const updateOrderStatusFormSchema = z.object({
  status: z.string().min(1, {
    message: "Status is required",
  }),
});
export type UpdateOrderStatusForm = z.infer<typeof updateOrderStatusFormSchema>;

export const applyRoleToUserFormSchema = z.object({
  userId: z.string().min(1, "User is required"),
  roleId: z.number().min(1, "Role is required"),
});
export type ApplyRoleToUserForm = z.infer<typeof applyRoleToUserFormSchema>;

export const updateTrackingIdFormSchema = z.object({
  trackingId: z.string().min(1, { message: "Tracking ID is required" }),
});
export type UpdateTrackingIdForm = z.infer<typeof updateTrackingIdFormSchema>;

export const addProductColourFormSchema = z.object({
  colours: z
    .object({
      name: z.string().min(1, {
        message: "Name is required",
      }),
      hexcode: z.string().min(1, {
        message: "Hexcode is required",
      }),
    })
    .array()
    .min(1, {
      message: "At least one color is required",
    }),
});
export type AddProductColourForm = z.infer<typeof addProductColourFormSchema>;

export const addSponsorFormSchema = z.object({
  description: z.string().optional(),
  file: z.any(),
});
export type AddSponsorForm = z.infer<typeof addSponsorFormSchema>;

export const editSponsorFormSchema = z.object({
  description: z.string().optional(),
  file: z.any(),
});
export type EditSponsorForm = z.infer<typeof editSponsorFormSchema>;

export const addCountryFormSchema = z.object({
  country_name: z.string().min(1, "Country name is required"),
  country_currency: z.string().min(1, "Currency type is required"),
  currency_icon: z.string().min(1, "Currency icon is required"),
});

export type AddCountryForm = z.infer<typeof addCountryFormSchema>;

export const editCountryFormSchema = z.object({
  currency_icon: z.string().min(1, "Currency icon is required"),
});

export type EditCountryForm = z.infer<typeof editCountryFormSchema>;
