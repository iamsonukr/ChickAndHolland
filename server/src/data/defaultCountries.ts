type CountryCurrencyMeta = {
  currency_symbol: string;
  currency_name: string;
  currency_short_name: string;
};

const DEFAULT_COUNTRY_CODES = [
  "AC", "AD", "AE", "AF", "AG", "AI", "AL", "AM", "AO", "AQ", "AR", "AS",
  "AT", "AU", "AW", "AX", "AZ", "BA", "BB", "BD", "BE", "BF", "BG", "BH",
  "BI", "BJ", "BL", "BM", "BN", "BO", "BQ", "BR", "BS", "BT", "BV", "BW",
  "BY", "BZ", "CA", "CC", "CD", "CF", "CG", "CH", "CI", "CK", "CL", "CM",
  "CN", "CO", "CR", "CU", "CV", "CW", "CX", "CY", "CZ", "DE", "DJ", "DK",
  "DM", "DO", "DZ", "EC", "EE", "EG", "EH", "ER", "ES", "ET", "FI", "FJ",
  "FK", "FM", "FO", "FR", "GA", "GB", "GD", "GE", "GF", "GG", "GH", "GI",
  "GL", "GM", "GN", "GP", "GQ", "GR", "GS", "GT", "GU", "GW", "GY", "HK",
  "HM", "HN", "HR", "HT", "HU", "ID", "IE", "IL", "IM", "IN", "IO", "IQ",
  "IR", "IS", "IT", "JE", "JM", "JO", "JP", "KE", "KG", "KH", "KI", "KM",
  "KN", "KP", "KR", "KW", "KY", "KZ", "LA", "LB", "LC", "LI", "LK", "LR",
  "LS", "LT", "LU", "LV", "LY", "MA", "MC", "MD", "ME", "MF", "MG", "MH",
  "MK", "ML", "MM", "MN", "MO", "MP", "MQ", "MR", "MS", "MT", "MU", "MV",
  "MW", "MX", "MY", "MZ", "NA", "NC", "NE", "NF", "NG", "NI", "NL", "NO",
  "NP", "NR", "NU", "NZ", "OM", "PA", "PE", "PF", "PG", "PH", "PK", "PL",
  "PM", "PN", "PR", "PS", "PT", "PW", "PY", "QA", "RE", "RO", "RS", "RU",
  "RW", "SA", "SB", "SC", "SD", "SE", "SG", "SH", "SI", "SJ", "SK", "SL",
  "SM", "SN", "SO", "SR", "SS", "ST", "SV", "SX", "SY", "SZ", "TA", "TC",
  "TD", "TF", "TG", "TH", "TJ", "TK", "TL", "TM", "TN", "TO", "TR", "TT",
  "TV", "TW", "TZ", "UA", "UG", "UM", "US", "UY", "UZ", "VA", "VC", "VE",
  "VG", "VI", "VN", "VU", "WF", "WS", "XK", "YE", "YT", "ZA", "ZM", "ZW",
] as const;

const EMPTY_CURRENCY_META: CountryCurrencyMeta = {
  currency_symbol: "",
  currency_name: "",
  currency_short_name: "",
};

const COUNTRY_CURRENCY_OVERRIDES: Record<string, CountryCurrencyMeta> = {
  AE: {
    currency_symbol: "\u062F.\u0625",
    currency_name: "UAE Dirham",
    currency_short_name: "AED",
  },
  AU: {
    currency_symbol: "A$",
    currency_name: "Australian Dollar",
    currency_short_name: "AUD",
  },
  DE: {
    currency_symbol: "\u20AC",
    currency_name: "Euro",
    currency_short_name: "EUR",
  },
  ES: {
    currency_symbol: "\u20AC",
    currency_name: "Euro",
    currency_short_name: "EUR",
  },
  FR: {
    currency_symbol: "\u20AC",
    currency_name: "Euro",
    currency_short_name: "EUR",
  },
  GB: {
    currency_symbol: "\u00A3",
    currency_name: "British Pound",
    currency_short_name: "GBP",
  },
  IN: {
    currency_symbol: "\u20B9",
    currency_name: "Indian Rupee",
    currency_short_name: "INR",
  },
  IT: {
    currency_symbol: "\u20AC",
    currency_name: "Euro",
    currency_short_name: "EUR",
  },
  NL: {
    currency_symbol: "\u20AC",
    currency_name: "Euro",
    currency_short_name: "EUR",
  },
  US: {
    currency_symbol: "$",
    currency_name: "US Dollar",
    currency_short_name: "USD",
  },
};

type IntlWithDisplayNames = typeof Intl & {
  DisplayNames?: new (
    locales?: string | string[],
    options?: { type: "region" },
  ) => {
    of(code: string): string | undefined;
  };
};

const RegionDisplayNames = (Intl as IntlWithDisplayNames).DisplayNames;
const regionNames = RegionDisplayNames
  ? new RegionDisplayNames(["en"], { type: "region" })
  : null;

const getCountryName = (code: string) => {
  const name = regionNames?.of(code);
  return name && name !== code ? name : code;
};

export const DEFAULT_COUNTRIES = DEFAULT_COUNTRY_CODES.map((code) => ({
  code,
  name: getCountryName(code),
  ...(COUNTRY_CURRENCY_OVERRIDES[code] ?? EMPTY_CURRENCY_META),
})).sort((a, b) => a.name.localeCompare(b.name));
