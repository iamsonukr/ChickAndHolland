"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const FALLBACK_SITE_URL = "https://www.chicandholland.com";

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, "");
}

function buildCanonicalUrl(baseUrl: string, pathname: string) {
  if (!pathname || pathname === "/") {
    return `${baseUrl}/`;
  }

  return `${baseUrl}${pathname}`;
}

export default function DynamicCanonical() {
  const pathname = usePathname();

  useEffect(() => {
    const envSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    const baseUrl = normalizeBaseUrl(
      envSiteUrl || window.location.origin || FALLBACK_SITE_URL,
    );
    const canonicalUrl = buildCanonicalUrl(baseUrl, pathname);

    let canonicalEl = document.querySelector(
      'link[rel="canonical"]',
    ) as HTMLLinkElement | null;

    if (!canonicalEl) {
      canonicalEl = document.createElement("link");
      canonicalEl.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalEl);
    }

    canonicalEl.setAttribute("href", canonicalUrl);
  }, [pathname]);

  return null;
}
