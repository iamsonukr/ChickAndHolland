import { Request, Response, Router } from "express";
import asyncHandler from "../middleware/AsyncHandler";
import Customer from "../models/Customer";
import { Like } from "typeorm";
import Retailer from "../models/Retailer";
import Clients from "../models/ClientsModel";
import Currency from "../models/Currency";
import db from "../db";

const router = Router();

const parseStoreLocatorVisibility = (
  value: unknown,
  fallback = true,
) => {
  if (value === undefined || value === null) return fallback;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;

  const normalizedValue = String(value).trim().toLowerCase();
  if (["false", "0", "off", "no"].includes(normalizedValue)) return false;
  if (["true", "1", "on", "yes"].includes(normalizedValue)) return true;

  return fallback;
};

const parseSameAsBillingAddress = (value: unknown, fallback = true) =>
  parseStoreLocatorVisibility(value, fallback);

const getShippingDetails = (body: any) => {
  const sameAsBillingAddress = parseSameAsBillingAddress(
    body.sameAsBillingAddress,
    true,
  );

  if (sameAsBillingAddress) {
    return {
      sameAsBillingAddress,
      shippingAddress: body.address || "",
      shippingCityName: body.city_name || "",
      shippingCountryId: body.country_id || null,
      shippingContactPerson: body.contactPerson || "",
      shippingEmail: body.email || "",
      shippingPhoneNumber: body.phoneNumber || "",
    };
  }

  return {
    sameAsBillingAddress,
    shippingAddress: body.shippingAddress || "",
    shippingCityName: body.shippingCityName || "",
    shippingCountryId: body.shippingCountryId || null,
    shippingContactPerson: body.shippingContactPerson || "",
    shippingEmail: body.shippingEmail || "",
    shippingPhoneNumber: body.shippingPhoneNumber || "",
  };
};

const assignShippingDetails = (customer: Customer, body: any) => {
  const shippingDetails = getShippingDetails(body);

  customer.sameAsBillingAddress = shippingDetails.sameAsBillingAddress;
  customer.shippingAddress = shippingDetails.shippingAddress;
  customer.shippingCityName = shippingDetails.shippingCityName;
  customer.shippingCountryId = shippingDetails.shippingCountryId;
  customer.shippingContactPerson = shippingDetails.shippingContactPerson;
  customer.shippingEmail = shippingDetails.shippingEmail;
  customer.shippingPhoneNumber = shippingDetails.shippingPhoneNumber;
};

const withShippingFallbacks = (customer: Customer) => {
  const sameAsBillingAddress = customer.sameAsBillingAddress ?? true;
  const billingAddress = customer.client?.address || customer.storeAddress || "";
  const billingCityName = customer.client?.city_name || "";

  if (!sameAsBillingAddress) {
    return {
      sameAsBillingAddress,
      shippingAddress: customer.shippingAddress || "",
      shippingCityName: customer.shippingCityName || "",
      shippingCountryId: customer.shippingCountryId || "",
      shippingContactPerson: customer.shippingContactPerson || "",
      shippingEmail: customer.shippingEmail || "",
      shippingPhoneNumber: customer.shippingPhoneNumber || "",
    };
  }

  return {
    sameAsBillingAddress,
    shippingAddress: customer.shippingAddress || billingAddress,
    shippingCityName: customer.shippingCityName || billingCityName,
    shippingCountryId: customer.shippingCountryId || customer.countryId || "",
    shippingContactPerson:
      customer.shippingContactPerson || customer.contactPerson || "",
    shippingEmail: customer.shippingEmail || customer.email || "",
    shippingPhoneNumber:
      customer.shippingPhoneNumber || customer.phoneNumber || "",
  };
};

const withCustomerStoreName = (customer: Customer) => {
  const customerStoreName = customer.storeName || customer.name || "";
  const showOnStoreLocator =
    customer.showOnStoreLocator ?? customer.client?.showOnStoreLocator ?? true;

  return {
    ...customer,
    customerStoreName,
    showOnStoreLocator,
    ...withShippingFallbacks(customer),
  };
};

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
        relations: ["retailer", "client", "country", "currency"],
      });
      const totalCount = await Customer.count({
        where: { isDeleted: false },
      });

      return res.json({
        customers: customers.map(withCustomerStoreName),
        totalCount,
      });
    } else {
      const skip = (page ? Number(page) - 1 : 0) * 100;

      const likeQuery = query ? `%${query.toLowerCase()}%` : "%%";

      const whereConditions = [
        { name: Like(likeQuery), isDeleted: false },
        { storeName: Like(likeQuery), isDeleted: false },
        { storeAddress: Like(likeQuery), isDeleted: false },
        { postalCode: Like(likeQuery), isDeleted: false },
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
        customers: customers.map(withCustomerStoreName),
        totalCount,
      });
    }
  })
);

router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const customerStoreName = req.body.customerStoreName || req.body.storeName || req.body.name;
    const customer = new Customer();
    customer.name = req.body.name;
    customer.storeName = customerStoreName;
    customer.storeAddress = req.body.address;
    customer.showOnStoreLocator = parseStoreLocatorVisibility(
      req.body.showOnStoreLocator,
      true,
    );
    customer.postalCode = req.body.postalCode || null;
    customer.website = req.body.website;
    customer.phoneNumber = req.body.phoneNumber;
    customer.contactPerson = req.body.contactPerson;
    customer.email = req.body.email;
    assignShippingDetails(customer, req.body);

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
      name: customerStoreName,
      address: req.body.address,
      proximity: req.body.proximity || 1,
      latitude: req.body.coordinates?.latitude || "0",
      longitude: req.body.coordinates?.longitude || "0",
      city_name: req.body.city_name || "",
      showOnStoreLocator: customer.showOnStoreLocator,
    });

    await db.transaction(async manager => {
      await manager.save(Customer, customer);
      newClient.customer = customer;
      await manager.save(Clients, newClient);
    });

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
      relations: ["client", "country", "currency"],
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.json(withCustomerStoreName(customer));
  })
);

router.put(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await db.transaction(async manager => {
      const customer = await manager.findOne(Customer, {
        where: { id: Number(req.params.id), isDeleted: false },
        relations: ["client"],
      });
      if (!customer) return { status: 404, message: "Customer not found" };
      if (req.body.currency_id && req.body.currency_id != customer.currencyId) {
        const currency = await manager.findOne(Currency, { where: { id: req.body.currency_id } });
        if (!currency) return { status: 400, message: "Invalid currency selected" };
        customer.currencyId = req.body.currency_id;
      }
      const customerStoreName = req.body.customerStoreName || req.body.storeName || req.body.name;
      customer.name = req.body.name;
      customer.storeName = customerStoreName;
      customer.storeAddress = req.body.address ?? customer.storeAddress ?? "";
      customer.showOnStoreLocator = parseStoreLocatorVisibility(
        req.body.showOnStoreLocator,
        customer.showOnStoreLocator ?? customer.client?.showOnStoreLocator ?? true,
      );
      customer.postalCode = req.body.postalCode || null;
      customer.website = req.body.website ?? "";
      customer.phoneNumber = req.body.phoneNumber ?? "";
      customer.contactPerson = req.body.contactPerson ?? "";
      customer.email = req.body.email ?? "";
      assignShippingDetails(customer, req.body);
      customer.countryId = req.body.country_id || null;

      const client = customer.client ?? manager.create(Clients, {});
      client.name = customerStoreName;
      client.address = customer.storeAddress;
      client.proximity = Number(req.body.proximity || client.proximity || 1);
      client.latitude = Number(req.body.coordinates?.latitude ?? client.latitude ?? 0);
      client.longitude = Number(req.body.coordinates?.longitude ?? client.longitude ?? 0);
      client.city_name = req.body.city_name ?? client.city_name ?? "";
      client.showOnStoreLocator = customer.showOnStoreLocator;
      await manager.save(Customer, customer);
      // Clients owns the foreign key; assigning customer.client alone cannot link a new location.
      client.customer = customer;
      await manager.save(Clients, client);
      return { status: 200, message: "Customer updated successfully" };
    });
    return res.status(result.status).json({ success: result.status === 200, message: result.message });
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const deleted = await db.transaction(async manager => {
      const customer = await manager.findOne(Customer, {
        where: { id: Number(req.params.id) },
        relations: ["client", "retailer"],
      });
      if (!customer) return false;
      await manager.update(Customer, customer.id, { isDeleted: true });
      if (customer.client) await manager.update(Clients, customer.client.id, { isDeleted: true });
      if (customer.retailer) await manager.update(Retailer, customer.retailer.id, { isDeleted: true });
      return true;
    });
    return res.status(deleted ? 200 : 404).json({
      success: deleted,
      message: deleted ? "Customer deleted successfully" : "Customer not found",
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
