import { promises as dns } from "dns";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number) => {
  let timeout: NodeJS.Timeout | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error("Email domain lookup timed out")),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
};

const hasMailHost = async (domain: string) => {
  try {
    const mxRecords = await withTimeout(dns.resolveMx(domain), 3000);
    if (mxRecords.some((record) => record.exchange)) return true;
  } catch {}

  try {
    const addressRecords = await withTimeout(dns.resolve4(domain), 2000);
    if (addressRecords.length > 0) return true;
  } catch {}

  try {
    const addressRecords = await withTimeout(dns.resolve6(domain), 2000);
    return addressRecords.length > 0;
  } catch {
    return false;
  }
};

export const assertDeliverableEmailAddress = async (email: unknown) => {
  const normalizedEmail = String(email ?? "")
    .trim()
    .toLowerCase();

  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    throw new Error("Invalid email address. Please enter a valid email.");
  }

  const domain = normalizedEmail.split("@").pop();

  if (!domain || !(await hasMailHost(domain))) {
    throw new Error(
      "Email domain could not be verified. Please enter an existing email address.",
    );
  }

  return normalizedEmail;
};
