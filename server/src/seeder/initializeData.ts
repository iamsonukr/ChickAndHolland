import Country from "../models/Country";
import Currency from "../models/Currency";

/**
 * Initializes default countries and currencies if not present
 */
export const initializeData = async () => {
  console.log("🔄 Checking and initializing default data...");

  /** ============================
   *  CURRENCIES SEEDER
   * ============================ */
  const existingCurrencies = await Currency.find();
  if (existingCurrencies.length === 0) {
    console.log("💰 Seeding default currencies...");
    const defaultCurrencies = [
      { code: "EUR", name: "Euro", symbol: "€", isDefault: true },
      { code: "USD", name: "US Dollar", symbol: "$", isDefault: false },
      { code: "GBP", name: "British Pound", symbol: "£", isDefault: false },
      { code: "INR", name: "Indian Rupee", symbol: "₹", isDefault: false },
    ];

    for (const currencyData of defaultCurrencies) {
      const currency = new Currency();
      currency.code = currencyData.code;
      currency.name = currencyData.name;
      currency.symbol = currencyData.symbol;
      currency.isDefault = currencyData.isDefault;
      await currency.save();
    }
    console.log("✅ Default currencies added.");
  } else {
    console.log("✅ Currencies already initialized.");
  }

  /** ============================
   *  COUNTRIES SEEDER
   * ============================ */
  const existingCountries = await Country.find();
  if (existingCountries.length === 0) {
    console.log("🌍 Seeding default countries...");
    const defaultCountries = [
      {
        name: "India",
        code: "IN",
        currency_symbol: "₹",
        currency_name: "Indian Rupee",
        currency_short_name: "INR",
      },
      {
        name: "United States",
        code: "US",
        currency_symbol: "$",
        currency_name: "US Dollar",
        currency_short_name: "USD",
      },
      {
        name: "United Kingdom",
        code: "GB",
        currency_symbol: "£",
        currency_name: "British Pound",
        currency_short_name: "GBP",
      },
      {
        name: "Germany",
        code: "DE",
        currency_symbol: "€",
        currency_name: "Euro",
        currency_short_name: "EUR",
      },
      {
        name: "France",
        code: "FR",
        currency_symbol: "€",
        currency_name: "Euro",
        currency_short_name: "EUR",
      },
      {
        name: "Italy",
        code: "IT",
        currency_symbol: "€",
        currency_name: "Euro",
        currency_short_name: "EUR",
      },
      {
        name: "Spain",
        code: "ES",
        currency_symbol: "€",
        currency_name: "Euro",
        currency_short_name: "EUR",
      },
      {
        name: "Netherlands",
        code: "NL",
        currency_symbol: "€",
        currency_name: "Euro",
        currency_short_name: "EUR",
      },
      {
        name: "Australia",
        code: "AU",
        currency_symbol: "A$",
        currency_name: "Australian Dollar",
        currency_short_name: "AUD",
      },
      {
        name: "United Arab Emirates",
        code: "AE",
        currency_symbol: "د.إ",
        currency_name: "UAE Dirham",
        currency_short_name: "AED",
      },
    ];

    for (const countryData of defaultCountries) {
      const country = new Country();
      country.name = countryData.name;
      country.code = countryData.code;
      country.currency_symbol = countryData.currency_symbol;
      country.currency_name = countryData.currency_name;
      country.currency_short_name = countryData.currency_short_name;
      await country.save();
    }
    console.log("✅ Default countries added.");
  } else {
    console.log("✅ Countries already initialized.");
  }

  console.log("🎉 Data initialization complete!");
};
