import { Request } from "express";

export const DISPOSABLE_EMAIL_DOMAINS = [
  "10minutemail.com",
  "dispostable.com",
  "fakeinbox.com",
  "getnada.com",
  "grr.la",
  "guerrillamail.com",
  "guerrillamail.net",
  "maildrop.cc",
  "mailinator.com",
  "mailnesia.com",
  "moakt.com",
  "sharklasers.com",
  "temp-mail.org",
  "tempail.com",
  "tempmail.com",
  "tempmailo.com",
  "throwawaymail.com",
  "yopmail.com",
  "yopmail.net",
] as const;

type RateLimitConfig = {
  windowMs: number;
  max: number;
};

type RateLimitConfigs = Record<string, RateLimitConfig>;

const requestLogs = new Map<string, Map<string, number[]>>();

export const getClientIp = (req: Request) => {
  const forwardedFor = req.headers["x-forwarded-for"];
  const forwardedIp = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : forwardedFor?.split(",")[0];
  const rawIp =
    forwardedIp?.trim() || req.ip || req.socket.remoteAddress || "unknown";

  return rawIp.replace(/^::ffff:/, "");
};

export const getEmailDomain = (email: string) => {
  const [, domain = ""] = email.trim().toLowerCase().split("@");
  return domain;
};

export const isDisposableEmail = (email: string) => {
  const domain = getEmailDomain(email);

  if (!domain) {
    return false;
  }

  return DISPOSABLE_EMAIL_DOMAINS.some(
    (blockedDomain) =>
      domain === blockedDomain || domain.endsWith(`.${blockedDomain}`),
  );
};

export const getRateLimitViolation = ({
  bucket,
  ip,
  now,
  limits,
  resourceLabel,
}: {
  bucket: string;
  ip: string;
  now: number;
  limits: RateLimitConfigs;
  resourceLabel: string;
}) => {
  const maxWindowMs = Math.max(...Object.values(limits).map((limit) => limit.windowMs));
  const bucketLog = requestLogs.get(bucket) ?? new Map<string, number[]>();
  const timestamps = bucketLog.get(ip) ?? [];
  const activeTimestamps = timestamps.filter(
    (timestamp) => now - timestamp < maxWindowMs,
  );

  bucketLog.set(ip, activeTimestamps);
  requestLogs.set(bucket, bucketLog);

  for (const limit of Object.values(limits)) {
    const matchingRequests = activeTimestamps.filter(
      (timestamp) => now - timestamp < limit.windowMs,
    );

    if (matchingRequests.length >= limit.max) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((matchingRequests[0] + limit.windowMs - now) / 1000),
      );

      return {
        retryAfterSeconds,
        message: `Too many ${resourceLabel} requests from this IP. Please try again later.`,
      };
    }
  }

  activeTimestamps.push(now);
  bucketLog.set(ip, activeTimestamps);
  requestLogs.set(bucket, bucketLog);

  return null;
};
