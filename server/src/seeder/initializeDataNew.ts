import Currency from "../models/Currency";
import { syncCountryCatalog } from "../services/countryCatalog";

/**
 * Initializes default countries and currencies if not present.
 */
export const initializeData = async () => {
  console.log("Checking and initializing default data...");

  const existingCurrencies = await Currency.find();
  if (existingCurrencies.length === 0) {
    console.log("Seeding default currencies...");

    const defaultCurrencies = [
      { code: "EUR", name: "Euro", symbol: "\u20AC", isDefault: true },
      { code: "USD", name: "US Dollar", symbol: "$", isDefault: false },
      { code: "GBP", name: "British Pound", symbol: "\u00A3", isDefault: false },
      { code: "INR", name: "Indian Rupee", symbol: "\u20B9", isDefault: false },
    ];

    for (const currencyData of defaultCurrencies) {
      const currency = new Currency();
      currency.code = currencyData.code;
      currency.name = currencyData.name;
      currency.symbol = currencyData.symbol;
      currency.isDefault = currencyData.isDefault;
      await currency.save();
    }

    console.log("Default currencies added.");
  } else {
    console.log("Currencies already initialized.");
  }

  console.log("Syncing country catalog...");
  const countries = await syncCountryCatalog();
  console.log(`Country catalog ready with ${countries.length} countries.`);

  console.log("Data initialization complete!");
};
