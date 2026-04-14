import { DEFAULT_COUNTRIES } from "../data/defaultCountries";
import Country from "../models/Country";

const normalizeCountryCode = (code?: string | null) => code?.trim().toUpperCase();

export const syncCountryCatalog = async () => {
  const existingCountries = await Country.find();
  const existingCodes = new Set(
    existingCountries
      .map((country) => normalizeCountryCode(country.code))
      .filter((code): code is string => Boolean(code)),
  );

  const missingCountries = DEFAULT_COUNTRIES.filter(
    (country) => !existingCodes.has(country.code),
  );

  if (missingCountries.length > 0) {
    const recordsToCreate = missingCountries.map((countryData) =>
      Country.create(countryData),
    );

    await Country.save(recordsToCreate);
  }

  return Country.find({
    order: {
      name: "ASC",
    },
  });
};
