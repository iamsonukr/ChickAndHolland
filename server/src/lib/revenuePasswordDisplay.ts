import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "crypto";
import CONFIG from "../config";
const key = () =>
  createHash("sha256")
    .update("revenue-password-display:")
    .update(CONFIG.JWT_SECRET)
    .digest();
export function encryptRevenuePassword(password: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(password, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), data]
    .map((value) => value.toString("base64"))
    .join(".");
}
export function decryptRevenuePassword(value: string): string {
  const [iv, tag, data] = value
    .split(".")
    .map((part) => Buffer.from(part, "base64"));
  const cipher = createDecipheriv("aes-256-gcm", key(), iv);
  cipher.setAuthTag(tag);
  return Buffer.concat([cipher.update(data), cipher.final()]).toString("utf8");
}
