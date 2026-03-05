export function convertToUSSize(size: any, country: string): string {
  const number = parseInt(size); // Extract digits

const US_TO_EU: Record<number, string> = {
  0: "32", 2: "34", 4: "36", 6: "38",
  8: "40", 10: "42", 12: "44", 14: "46",
  16: "48", 18: "50", 20: "52", 22: "54",
  24: "56", 26: "58", 28: "60",
};

const IT_TO_EU: Record<number, string> = {
  36: "32", 38: "34", 40: "36", 42: "38",
  44: "40", 46: "42", 48: "44", 50: "46",
  52: "48", 54: "50", 56: "52", 58: "54",
  60: "56", 62: "58", 64: "60",
};

const UK_TO_EU: Record<number, string> = {
  4: "32", 6: "34", 8: "36", 10: "38",
  12: "40", 14: "42", 16: "44", 18: "46",
  20: "48", 22: "50", 24: "52", 26: "54",
  28: "56", 30: "58", 32: "60",
};

const EU_TO_EU: Record<number, string> = {
  32: "32", 34: "34", 36: "36", 38: "38",
  40: "40", 42: "42", 44: "44", 46: "46",
  48: "48", 50: "50", 52: "52", 54: "54",
  56: "56", 58: "58", 60: "60",
};


  const c = country?.toUpperCase();

  if (c === "EU") return EU_TO_EU[number] || "N/A";
  if (c === "IT") return IT_TO_EU[number] || "N/A";
  if (c === "UK") return UK_TO_EU[number] || "N/A";
  if (c === "US") return US_TO_EU[number] || "N/A";

  return "N/A";
}
