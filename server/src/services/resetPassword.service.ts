import bcrypt from "bcrypt";
import CONFIG from "../config";
import db from "../db";
import { TABLE_NAMES } from "../constants";

const RESET_PASSWORD_SETTING_KEY = "product_scan_reset_password_hash";
const EDIT_PASSWORD_SETTING_KEY = "edit_order_password_hash";

let ensureAdminSettingsTablePromise: Promise<void> | null = null;

export const ensureAdminSettingsTable = async () => {
  if (!ensureAdminSettingsTablePromise) {
    ensureAdminSettingsTablePromise = (async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS \`${TABLE_NAMES.ADMIN_SETTINGS}\` (
          \`id\` INT NOT NULL AUTO_INCREMENT,
          \`settingKey\` VARCHAR(100) NOT NULL,
          \`settingValue\` TEXT NOT NULL,
          \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
          PRIMARY KEY (\`id\`),
          UNIQUE KEY \`IDX_admin_settings_settingKey\` (\`settingKey\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
    })().catch((error) => {
      ensureAdminSettingsTablePromise = null;
      throw error;
    });
  }

  await ensureAdminSettingsTablePromise;
};

export const getResetPasswordHash = async () => {
  await ensureAdminSettingsTable();

  const [setting] = await db.query(
    `
      SELECT settingValue
      FROM \`${TABLE_NAMES.ADMIN_SETTINGS}\`
      WHERE settingKey = ?
      LIMIT 1
    `,
    [RESET_PASSWORD_SETTING_KEY],
  );

  return setting?.settingValue ? String(setting.settingValue) : null;
};

export const getEditPasswordHash = async () => {
  await ensureAdminSettingsTable();

  const [setting] = await db.query(
    `
      SELECT settingValue
      FROM \`${TABLE_NAMES.ADMIN_SETTINGS}\`
      WHERE settingKey = ?
      LIMIT 1
    `,
    [EDIT_PASSWORD_SETTING_KEY],
  );

  return setting?.settingValue ? String(setting.settingValue) : null;
};

export const verifyResetPassword = async (
  password: string,
  fallbackAdminPasswordHash?: string | null,
) => {
  const trimmedPassword = String(password ?? "");

  if (!trimmedPassword) {
    return false;
  }

  const resetPasswordHash = await getResetPasswordHash();
  const hashToCompare = resetPasswordHash || fallbackAdminPasswordHash;

  if (!hashToCompare) {
    return false;
  }

  return bcrypt.compare(trimmedPassword, hashToCompare);
};

export const verifyEditPassword = async (
  password: string,
  fallbackAdminPasswordHash?: string | null,
) => {
  const trimmedPassword = String(password ?? "");

  if (!trimmedPassword) {
    return false;
  }

  const editPasswordHash = await getEditPasswordHash();
  const hashToCompare = editPasswordHash || fallbackAdminPasswordHash;

  if (!hashToCompare) {
    return false;
  }

  return bcrypt.compare(trimmedPassword, hashToCompare);
};

export const updateResetPassword = async (newPassword: string) => {
  await ensureAdminSettingsTable();

  const hashedPassword = await bcrypt.hash(newPassword, CONFIG.SALT_ROUNDS);

  await db.query(
    `
      INSERT INTO \`${TABLE_NAMES.ADMIN_SETTINGS}\` (settingKey, settingValue)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE
        settingValue = VALUES(settingValue),
        updatedAt = CURRENT_TIMESTAMP(6)
    `,
    [RESET_PASSWORD_SETTING_KEY, hashedPassword],
  );
};

export const updateEditPassword = async (newPassword: string) => {
  await ensureAdminSettingsTable();

  const hashedPassword = await bcrypt.hash(newPassword, CONFIG.SALT_ROUNDS);

  await db.query(
    `
      INSERT INTO \`${TABLE_NAMES.ADMIN_SETTINGS}\` (settingKey, settingValue)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE
        settingValue = VALUES(settingValue),
        updatedAt = CURRENT_TIMESTAMP(6)
    `,
    [EDIT_PASSWORD_SETTING_KEY, hashedPassword],
  );
};
