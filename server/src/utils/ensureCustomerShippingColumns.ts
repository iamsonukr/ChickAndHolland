import db from "../db";
import { TABLE_NAMES } from "../constants";

const customerShippingColumns = [
  {
    name: "sameAsBillingAddress",
    definition:
      "ALTER TABLE `customers` ADD COLUMN `sameAsBillingAddress` tinyint(1) NOT NULL DEFAULT 1 AFTER `email`",
  },
  {
    name: "shippingAddress",
    definition:
      "ALTER TABLE `customers` ADD COLUMN `shippingAddress` varchar(200) NULL AFTER `sameAsBillingAddress`",
  },
  {
    name: "shippingCityName",
    definition:
      "ALTER TABLE `customers` ADD COLUMN `shippingCityName` varchar(100) NULL AFTER `shippingAddress`",
  },
  {
    name: "shippingCountryId",
    definition:
      "ALTER TABLE `customers` ADD COLUMN `shippingCountryId` varchar(255) NULL AFTER `shippingCityName`",
  },
  {
    name: "shippingContactPerson",
    definition:
      "ALTER TABLE `customers` ADD COLUMN `shippingContactPerson` varchar(50) NULL AFTER `shippingCountryId`",
  },
  {
    name: "shippingEmail",
    definition:
      "ALTER TABLE `customers` ADD COLUMN `shippingEmail` text NULL AFTER `shippingContactPerson`",
  },
  {
    name: "shippingPhoneNumber",
    definition:
      "ALTER TABLE `customers` ADD COLUMN `shippingPhoneNumber` text NULL AFTER `shippingEmail`",
  },
];

export const ensureCustomerShippingColumns = async () => {
  for (const column of customerShippingColumns) {
    const columns = await db.query("SHOW COLUMNS FROM `customers` LIKE ?", [
      column.name,
    ]);

    if (!Array.isArray(columns) || columns.length === 0) {
      await db.query(column.definition);
    }
  }

  await db.query(`
    UPDATE \`customers\` c
    LEFT JOIN \`${TABLE_NAMES.Clients}\` cl ON cl.customerId = c.id
    SET
      c.sameAsBillingAddress = 1,
      c.shippingAddress = LEFT(COALESCE(NULLIF(c.shippingAddress, ''), NULLIF(cl.address, ''), c.storeAddress, ''), 200),
      c.shippingCityName = COALESCE(NULLIF(c.shippingCityName, ''), NULLIF(cl.city_name, ''), ''),
      c.shippingCountryId = COALESCE(NULLIF(c.shippingCountryId, ''), c.countryId),
      c.shippingContactPerson = COALESCE(NULLIF(c.shippingContactPerson, ''), c.contactPerson, ''),
      c.shippingEmail = COALESCE(NULLIF(c.shippingEmail, ''), c.email, ''),
      c.shippingPhoneNumber = COALESCE(NULLIF(c.shippingPhoneNumber, ''), c.phoneNumber, '')
    WHERE c.sameAsBillingAddress = 1
      OR c.sameAsBillingAddress IS NULL
      OR c.shippingAddress IS NULL
      OR c.shippingAddress = ''
  `);
};
