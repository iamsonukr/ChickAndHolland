import { createHash } from "crypto";
import jwt from "jsonwebtoken";
import CONFIG from "../config";
import db from "../db";
import { TABLE_NAMES } from "../constants";
import { ensureAdminSettingsTable } from "./resetPassword.service";

function session(token: string) {
  const decoded = jwt.verify(token, CONFIG.JWT_SECRET) as jwt.JwtPayload;
  if (decoded.type !== "USER" || !decoded.exp)
    throw new Error("Invalid admin session");
  return {
    key: "revenue_session_" + createHash("sha256").update(token).digest("hex"),
    expiresAt: decoded.exp * 1000,
  };
}
export async function getRevenueSession(token: string): Promise<number | null> {
  const { key, expiresAt } = session(token);
  await ensureAdminSettingsTable();
  const [row] = await db.query(
    `SELECT settingValue FROM \`${TABLE_NAMES.ADMIN_SETTINGS}\` WHERE settingKey = ?`,
    [key],
  );
  return row && Number(row.settingValue) === expiresAt && expiresAt > Date.now()
    ? expiresAt
    : null;
}
export async function unlockRevenueSession(token: string): Promise<number> {
  const { key, expiresAt } = session(token);
  await ensureAdminSettingsTable();
  await db.query(
    `DELETE FROM \`${TABLE_NAMES.ADMIN_SETTINGS}\` WHERE settingKey LIKE 'revenue_session_%' AND CAST(settingValue AS UNSIGNED) <= ?`,
    [Date.now()],
  );
  await db.query(
    `INSERT INTO \`${TABLE_NAMES.ADMIN_SETTINGS}\` (settingKey, settingValue) VALUES (?, ?) ON DUPLICATE KEY UPDATE settingValue = VALUES(settingValue)`,
    [key, String(expiresAt)],
  );
  return expiresAt;
}
export async function lockRevenueSession(token: string) {
  const { key } = session(token);
  await ensureAdminSettingsTable();
  await db.query(
    `DELETE FROM \`${TABLE_NAMES.ADMIN_SETTINGS}\` WHERE settingKey = ?`,
    [key],
  );
}
