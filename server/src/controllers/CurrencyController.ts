import { Request, Response, Router } from "express";
import asyncHandler from "../middleware/AsyncHandler";
import Currency from "../models/Currency";

const router = Router();

// Get all currencies
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const currencies = await Currency.find();
    res.json({
      success: true,
      currencies,
    });
  })
);

// Create new currency
router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const { code, name, symbol, isDefault } = req.body;

    // Check if currency with same code already exists
    const existingCurrency = await Currency.findOne({ where: { code } });
    if (existingCurrency) {
      return res.status(400).json({
        success: false,
        message: "Currency with this code already exists",
      });
    }

    // If this is being set as default, remove default from others
    if (isDefault) {
      await Currency.update({}, { isDefault: false });
    }

    const currency = new Currency();
    currency.code = code;
    currency.name = name;
    currency.symbol = symbol;
    currency.isDefault = isDefault || false;

    await currency.save();

    res.json({
      success: true,
      message: "Currency created successfully",
      currency,
    });
  })
);

// Update currency
router.put(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { code, name, symbol, isDefault } = req.body;

    const currency = await Currency.findOne({ where: { id: Number(id) } });
    if (!currency) {
      return res.status(404).json({
        success: false,
        message: "Currency not found",
      });
    }

    // Check if another currency with same code exists
    if (code && code !== currency.code) {
      const existingCurrency = await Currency.findOne({ where: { code } });
      if (existingCurrency) {
        return res.status(400).json({
          success: false,
          message: "Currency with this code already exists",
        });
      }
    }

    // If this is being set as default, remove default from others
    if (isDefault && !currency.isDefault) {
      await Currency.update({}, { isDefault: false });
    }

    // Update fields
    if (code) currency.code = code;
    if (name) currency.name = name;
    if (symbol) currency.symbol = symbol;
    if (isDefault !== undefined) currency.isDefault = isDefault;

    await currency.save();

    res.json({
      success: true,
      message: "Currency updated successfully",
      currency,
    });
  })
);

// Delete currency
router.delete(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const currency = await Currency.findOne({ where: { id: Number(id) } });
    if (!currency) {
      return res.status(404).json({
        success: false,
        message: "Currency not found",
      });
    }

    // Prevent deletion of default currency
    if (currency.isDefault) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete default currency",
      });
    }

    await currency.remove();

    res.json({
      success: true,
      message: "Currency deleted successfully",
    });
  })
);

// Initialize default currencies
router.get(
  "/initialize",
  asyncHandler(async (req: Request, res: Response) => {
    // Check if currencies already exist
    const existingCurrencies = await Currency.find();
    if (existingCurrencies.length > 0) {
      return res.json({
        success: true,
        message: "Currencies already initialized",
        currencies: existingCurrencies,
      });
    }

    const defaultCurrencies = [
      {
        code: "EUR",
        name: "Euro",
        symbol: "€",
        isDefault: true,
      },
      {
        code: "USD",
        name: "US Dollar",
        symbol: "$",
        isDefault: false,
      },
      {
        code: "GBP",
        name: "British Pound",
        symbol: "£",
        isDefault: false,
      },
    ];

    // const currencies = await Currency.save(defaultCurrencies);
    const currencies = [];
    for (const currencyData of defaultCurrencies) {
      const currency = new Currency();
      currency.code = currencyData.code;
      currency.name = currencyData.name;
      currency.symbol = currencyData.symbol;
      currency.isDefault = currencyData.isDefault;

      await currency.save();
      currencies.push(currency);
    }

    res.json({
      success: true,
      message: "Default currencies initialized successfully",
      currencies,
    });
  })
);

export default router;