type RegularOrderStyleTotalSqlOptions = {
  styleAlias?: string;
  productAlias?: string;
  pricingAlias?: string;
};

export const buildRegularOrderStyleQuantitySql = (styleAlias = "os") =>
  `COALESCE(NULLIF(${styleAlias}.quantity, 0), 0)`;

export const buildRegularOrderStyleMarkupSql = (styleAlias = "os") => `
  CASE
    WHEN CAST(${styleAlias}.size AS SIGNED) >= 58 THEN 1.60
    WHEN CAST(${styleAlias}.size AS SIGNED) >= 54 THEN 1.40
    WHEN CAST(${styleAlias}.size AS SIGNED) >= 50 THEN 1.20
    ELSE 1
  END
`;

export const buildRegularOrderStyleTotalSql = ({
  styleAlias = "os",
  productAlias = "p",
  pricingAlias = "pcp",
}: RegularOrderStyleTotalSqlOptions = {}) => {
  const quantitySql = buildRegularOrderStyleQuantitySql(styleAlias);

  return `
    COALESCE(
      NULLIF(${styleAlias}.totalPrice, 0),
      NULLIF(${styleAlias}.subtotal, 0),
      NULLIF(${styleAlias}.unitPrice * ${quantitySql}, 0),
      COALESCE(${pricingAlias}.price, ${productAlias}.price, 0) *
        ${buildRegularOrderStyleMarkupSql(styleAlias)} *
        ${quantitySql}
    )
  `;
};

export const buildRegularOrderMissingStyleTotalSql = (styleAlias = "os") => `
  CASE
    WHEN NULLIF(${styleAlias}.totalPrice, 0) IS NULL
      AND NULLIF(${styleAlias}.subtotal, 0) IS NULL
    THEN 1
    ELSE 0
  END
`;
