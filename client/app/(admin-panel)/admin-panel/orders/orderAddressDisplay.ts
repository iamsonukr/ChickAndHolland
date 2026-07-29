const textValue = (value: unknown) => {
  if (typeof value === "number") return String(value);
  if (typeof value !== "string") return "";

  const trimmed = value.trim();
  if (!trimmed) return "";

  const lowered = trimmed.toLowerCase();
  if (lowered === "null" || lowered === "undefined") return "";

  return trimmed;
};

const firstNonBlank = (...values: unknown[]) => {
  for (const value of values) {
    const text = textValue(value);
    if (text) return text;
  }

  return "";
};

const displayValue = (...values: unknown[]) =>
  firstNonBlank(...values) || "N/A";

const getOrderCustomer = (order: any) =>
  order?.customer || order?.retailer?.customer || {};

const getCountryName = (country: unknown) => {
  if (typeof country === "string") return textValue(country);
  if (country && typeof country === "object" && "name" in country) {
    return textValue((country as { name?: unknown }).name);
  }

  return "";
};

const getStoreNameValue = (order: any) => {
  const customer = getOrderCustomer(order);

  return firstNonBlank(
    customer?.customerStoreName,
    customer?.storeName,
    customer?.name,
  );
};

const getShippingContactPersonValue = (order: any) => {
  const customer = getOrderCustomer(order);

  return firstNonBlank(
    customer?.shippingContactPerson,
    customer?.contactPerson,
    customer?.name,
  );
};

const getShippingAddressValue = (order: any) => {
  const customer = getOrderCustomer(order);

  return firstNonBlank(
    order?.address,
    customer?.shippingAddress,
    customer?.storeAddress,
    customer?.client?.address,
  );
};

const getShippingCityValue = (order: any) => {
  const customer = getOrderCustomer(order);

  return firstNonBlank(
    customer?.shippingCityName,
    customer?.cityName,
    customer?.client?.city_name,
  );
};

const getShippingCountryValue = (order: any) => {
  const customer = getOrderCustomer(order);

  return firstNonBlank(
    customer?.shippingCountryName,
    getCountryName(customer?.shippingCountry),
    getCountryName(customer?.country),
  );
};

const getShippingEmailValue = (order: any) => {
  const customer = getOrderCustomer(order);

  return firstNonBlank(customer?.shippingEmail, customer?.email);
};

const getOrderMobileNumberValue = (order: any) => {
  const customer = getOrderCustomer(order);

  return firstNonBlank(
    order?.phoneNumber,
    customer?.shippingPhoneNumber,
    customer?.phoneNumber,
  );
};

export const getStoreName = (order: any) =>
  displayValue(getStoreNameValue(order));

export const getCustomerPersonName = (order: any) =>
  displayValue(getShippingContactPersonValue(order));

export const getOrderMobileNumber = (order: any) =>
  displayValue(getOrderMobileNumberValue(order));

export const getOrderShippingAddress = (order: any) =>
  displayValue(getShippingAddressValue(order));

export const buildOrderAddressDisplay = (order: any) =>
  [
    `Contact Person : ${displayValue(getShippingContactPersonValue(order))}`,
    `Store Name : ${displayValue(getStoreNameValue(order))}`,
    `Address : ${displayValue(getShippingAddressValue(order))}`,
    `City : ${displayValue(getShippingCityValue(order))}`,
    `Country : ${displayValue(getShippingCountryValue(order))}`,
    `Phone : ${displayValue(getOrderMobileNumberValue(order))}`,
    `Email : ${displayValue(getShippingEmailValue(order))}`,
  ].join("\n");
