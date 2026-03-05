import { Request, Response, Router } from "express";
import asyncHandler from "../middleware/AsyncHandler";
import Customer from "../models/Customer";
import { Like } from "typeorm";
import Retailer from "../models/Retailer";
import Clients from "../models/ClientsModel";
import Currency from "../models/Currency";
import { RetailerOrder } from "../models/RetailerOrder";
import Favourites from "../models/Favourites";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const {
      page,
      query,
    }: {
      page?: string;
      query?: string;
    } = req.query;

    if (!page) {
      const customers = await Customer.find({
        where: { isDeleted: false },
        relations: ["retailer", "country", "currency"],
      });
      const totalCount = await Customer.count({
        where: { isDeleted: false },
      });

      return res.json({
        customers,
        totalCount,
      });
    } else {
      const skip = (page ? Number(page) - 1 : 0) * 100;

const likeQuery = query ? `%${query.toLowerCase()}%` : "%%";

      const whereConditions = [
        { name: Like(likeQuery), isDeleted: false },
        { storeName: Like(likeQuery), isDeleted: false },
        { storeAddress: Like(likeQuery), isDeleted: false },
        { website: Like(likeQuery), isDeleted: false },
        { phoneNumber: Like(likeQuery), isDeleted: false },
        { contactPerson: Like(likeQuery), isDeleted: false },
        { email: Like(likeQuery), isDeleted: false },
      ];

      const customers = await Customer.find({
        where: whereConditions,
        skip,
        take: 100,
        relations: ["retailer", "client", "country", "currency"],
      });

      const totalCount = await Customer.count({
        where: whereConditions,
      });

      // for every customer if the

      res.json({
        customers,
        totalCount,
      });
    }
  })
);

router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const customer = new Customer();
    customer.name = req.body.name;
    customer.storeName = req.body.storeName;
    customer.storeAddress = req.body.address;
    customer.website = req.body.website;
    customer.phoneNumber = req.body.phoneNumber;
    customer.contactPerson = req.body.contactPerson;
    customer.email = req.body.email;

    // Add country assignment
    if (req.body.country_id) {
      customer.countryId = req.body.country_id;
    }

    // Add currency assignment
    if (req.body.currency_id) {
      // Validate currency exists
      const currency = await Currency.findOne({
        where: { id: req.body.currency_id },
      });
      if (!currency) {
        return res.status(400).json({
          success: false,
          message: "Invalid currency selected",
        });
      }
      customer.currencyId = req.body.currency_id;
    } else {
      // Assign default currency (EUR) if no currency specified
      const defaultCurrency = await Currency.findOne({
        where: { isDefault: true },
      });
      if (defaultCurrency) {
        customer.currencyId = defaultCurrency.id.toString();
      }
    }
const newClient = Clients.create({
  name: req.body.storeName,
  address: req.body.address,
  proximity: req.body.proximity || 1,
  latitude: req.body.coordinates?.latitude || "0",
  longitude: req.body.coordinates?.longitude || "0",
  city_name: req.body.city_name || "",
});

    customer.client = newClient;

    await newClient.save();
    await customer.save();

    res.json({
      success: true,
      message: "Customer created successfully",
    });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const customer = await Customer.findOne({
      where: {
        id: Number(req.params.id),
        isDeleted: false,
      },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.json(customer);
  })
);

router.put(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const customer = await Customer.findOne({
      where: {
        id: Number(req.params.id),
        isDeleted: false,
      },
      relations: ["client", "retailer"],
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Update customer fields
    customer.name = req.body.name;
    customer.storeName = req.body.storeName;
    customer.storeAddress = req.body.address;
    customer.website = req.body.website;
    customer.phoneNumber = req.body.phoneNumber;
    customer.contactPerson = req.body.contactPerson;
    customer.email = req.body.email;

    // Update country assignment
    if (req.body.country_id) {
      customer.countryId = req.body.country_id;
    } else {
      customer.countryId = null; // Clear country if not provided
    }

    // Handle currency updates with validation for existing orders and favourites
    if (req.body.currency_id && req.body.currency_id != customer.currencyId) {
      // Check if customer has retailer and existing orders
      if (customer.retailer) {
        const existingOrders = await RetailerOrder.count({
          where: { retailer: { id: customer.retailer.id } },
        });

        if (existingOrders > 0) {
          return res.status(400).json({
            success: false,
            message:
              "Cannot change currency for customer with existing orders. This would make pricing inconsistent.",
          });
        }

        // Check if customer has items in their favourites (cart)
        const existingFavourites = await Favourites.count({
          where: { retailer: { id: customer.retailer.id } },
        });

        if (existingFavourites > 0) {
          return res.status(400).json({
            success: false,
            message:
              "Cannot change currency for customer with items in cart. Please remove all cart items before changing currency.",
          });
        }
      }

      // Validate currency exists
      const currency = await Currency.findOne({
        where: { id: req.body.currency_id },
      });
      if (!currency) {
        return res.status(400).json({
          success: false,
          message: "Invalid currency selected",
        });
      }

      customer.currencyId = req.body.currency_id;
    }

    let clientError = null;

   // ✅ ALWAYS handle client (manual + quickbooks)
try {
  let client = customer.client
    ? await Clients.findOne({ where: { id: customer.client.id } })
    : null;

  if (!client) {
    client = Clients.create({});
  }

  client.name = req.body.storeName;
  client.address = req.body.address || client.address || "";
  client.proximity = req.body.proximity || client.proximity || 1;
  client.latitude =
    req.body.coordinates?.latitude || client.latitude || "0";
  client.longitude =
    req.body.coordinates?.longitude || client.longitude || "0";
  client.city_name = req.body.city_name || client.city_name || "";

  await client.save();
  customer.client = client;
} catch (error: any) {
  clientError = {
    message: "Failed to update/create client",
    details: error.message,
  };
}


    await customer.save();

    res.json({
      success: true,
      message: clientError
        ? `Customer updated successfully, but client location update failed: ${clientError.message}`
        : "Customer updated successfully",
      clientError: clientError,
    });
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const customer = await Customer.findOne({
      where: {
        id: Number(req.params.id),
      },
      relations: ["client", "retailer"],
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Soft delete the customer
    customer.isDeleted = true;
    await customer.save();

    // Soft delete the associated client if exists
    if (customer.client) {
      customer.client.isDeleted = true;
      await customer.client.save();
    }

    // Soft delete the associated retailer if exists
    if (customer.retailer) {
      customer.retailer.isDeleted = true;
      await customer.retailer.save();
    }

    res.json({
      success: true,
      message: "Customer deleted successfully",
    });
  })
);

// create retailer login for customer
router.post(
  "/retailer",
  asyncHandler(async (req: Request, res: Response) => {
    const { customerId, username, password } = req.body;

    const customer = await Customer.findOne({
      where: {
        id: customerId,
        isDeleted: false,
      },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // check if retailer already exists
    const existingRetailer = await Retailer.findOne({
      where: {
        username,
      },
    });

    if (existingRetailer) {
      return res.status(400).json({
        success: false,
        message: "Retailer already exists",
      });
    }

    const retailer = new Retailer();
    retailer.username = username;
    retailer.password = password;
    retailer.customer = customer;

    await retailer.save();

    res.json({
      success: true,
      message: "Retailer created successfully",
    });
  })
);

// update retailer login for customer
router.put(
  "/retailer/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { username, password } = req.body;

    const retailer = await Retailer.findOne({
      where: {
        id: Number(req.params.id),
      },
    });

    if (!retailer) {
      return res.status(404).json({
        success: false,
        message: "Retailer not found",
      });
    }

    retailer.username = username;
    retailer.password = password;

    await retailer.save();

    res.json({
      success: true,
      message: "Retailer updated successfully",
    });
  })
);

// delete retailer login for customer
router.delete(
  "/retailer/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const retailer = await Retailer.findOne({
      where: {
        id: Number(req.params.id),
      },
    });

    if (!retailer) {
      return res.status(404).json({
        success: false,
        message: "Retailer not found",
      });
    }

    await retailer.remove();

    res.json({
      success: true,
      message: "Retailer deleted successfully",
    });
  })
);

export default router;
