import { promises as dns } from "dns";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_DOMAIN_LOOKUP_TIMEOUT_CODE = "EMAIL_DOMAIN_LOOKUP_TIMEOUT";
const TEMPORARY_DNS_ERROR_CODES = new Set([
  EMAIL_DOMAIN_LOOKUP_TIMEOUT_CODE,
  "EAI_AGAIN",
  "ETIMEOUT",
  "ECONNREFUSED",
  "ECONNRESET",
  "ESERVFAIL",
  "SERVFAIL",
]);
type MailHostStatus = "verified" | "missing" | "unknown";

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number) => {
  let timeout: NodeJS.Timeout | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeout = setTimeout(
          () => {
            const error = new Error("Email domain lookup timed out") as Error & {
              code: string;
            };
            error.code = EMAIL_DOMAIN_LOOKUP_TIMEOUT_CODE;
            reject(error);
          },
          timeoutMs,
        );
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
};

const isTemporaryDnsError = (error: unknown) => {
  const code = (error as { code?: string })?.code;
  const message = (error as { message?: string })?.message ?? "";

  return (
    (code ? TEMPORARY_DNS_ERROR_CODES.has(code) : false) ||
    /timed out|timeout|servfail|eai_again|refused/i.test(message)
  );
};

const getMailHostStatus = async (domain: string): Promise<MailHostStatus> => {
  let lookupWasInconclusive = false;

  try {
    const mxRecords = await withTimeout(dns.resolveMx(domain), 3000);
    if (mxRecords.some((record) => record.exchange)) return "verified";
  } catch (error) {
    if (isTemporaryDnsError(error)) lookupWasInconclusive = true;
  }

  try {
    const addressRecords = await withTimeout(dns.resolve4(domain), 2000);
    if (addressRecords.length > 0) return "verified";
  } catch (error) {
    if (isTemporaryDnsError(error)) lookupWasInconclusive = true;
  }

  try {
    const addressRecords = await withTimeout(dns.resolve6(domain), 2000);
    if (addressRecords.length > 0) return "verified";
  } catch (error) {
    if (isTemporaryDnsError(error)) lookupWasInconclusive = true;
  }

  return lookupWasInconclusive ? "unknown" : "missing";
};

export const assertDeliverableEmailAddress = async (email: unknown) => {
  const normalizedEmail = String(email ?? "")
    .trim()
    .toLowerCase();

  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    throw new Error("Invalid email address. Please enter a valid email.");
  }

  const domain = normalizedEmail.split("@").pop();

  if (!domain) {
    throw new Error("Invalid email address. Please enter a valid email.");
  }

  const mailHostStatus = await getMailHostStatus(domain);

  if (mailHostStatus === "missing") {
    throw new Error(
      "Email domain could not be verified. Please enter an existing email address.",
    );
  }

  return normalizedEmail;
};
