"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const PAGE_METADATA: Record<
  string,
  { title: string; description: string }
> = {
  "/": {
    title: "Chic & Holland | Designer Couture Dresses & Evening Gowns",
    description:
      "Discover Chic & Holland, a luxury couture fashion brand creating handcrafted evening gowns and designer dresses.",
  },
  "/about-us": {
    title: "About Chic & Holland | Luxury Couture Fashion Brand",
    description:
      "Learn about Chic & Holland's heritage, commitment to handcrafted luxury fashion, and our story of timeless elegance.",
  },
  "/collections": {
    title: "Collections | Chic & Holland",
    description:
      "Explore our exclusive collections of designer evening gowns and couture dresses.",
  },
  "/contact-us": {
    title: "Contact Us | Chic & Holland",
    description:
      "Get in touch with Chic & Holland for inquiries about our couture collections and fashion designs.",
  },
  "/become-a-retailer": {
    title: "Become a Retailer | Chic & Holland",
    description:
      "Partner with Chic & Holland as a retailer. Join our network of luxury fashion boutiques.",
  },
  "/find-a-store": {
    title: "Find a Store | Chic & Holland",
    description:
      "Locate your nearest Chic & Holland boutique or find where to purchase our designer couture collections.",
  },
  "/my-favourites": {
    title: "My Favourites | Chic & Holland",
    description: "View your saved favorite items from Chic & Holland.",
  },
  "/privacy-policy": {
    title: "Privacy Policy | Chic & Holland",
    description:
      "Read our privacy policy and learn how Chic & Holland protects your personal information.",
  },
  "/terms-of-use": {
    title: "Terms of Use | Chic & Holland",
    description: "Review the terms and conditions for using Chic & Holland website.",
  },
  "/size-chart": {
    title: "Size Chart | Chic & Holland",
    description:
      "Find your perfect size with our comprehensive Chic & Holland sizing guide.",
  },
  "/shows-and-events": {
    title: "Shows & Events | Chic & Holland",
    description:
      "Discover upcoming shows and events featuring Chic & Holland couture collections.",
  },
};

function normalizePathname(pathname: string): string {
  // Remove trailing slashes except for root
  if (pathname !== "/" && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

function getMetadataForPath(pathname: string): {
  title: string;
  description: string;
} {
  const normalized = normalizePathname(pathname);

  // Check exact match first
  if (PAGE_METADATA[normalized]) {
    return PAGE_METADATA[normalized];
  }

  // Check parent routes (e.g., /collections/slug -> /collections)
  const parts = normalized.split("/").filter(Boolean);
  for (let i = parts.length; i > 0; i--) {
    const parentPath = "/" + parts.slice(0, i).join("/");
    if (PAGE_METADATA[parentPath]) {
      return PAGE_METADATA[parentPath];
    }
  }

  // Fallback to homepage
  return PAGE_METADATA["/"];
}

export default function DynamicMeta() {
  const pathname = usePathname();

  useEffect(() => {
    const { title, description } = getMetadataForPath(pathname);

    // Update document title
    document.title = title;

    // Update or create meta description
    let metaDescription = document.querySelector(
      'meta[name="description"]',
    ) as HTMLMetaElement | null;
    if (!metaDescription) {
      metaDescription = document.createElement("meta");
      metaDescription.setAttribute("name", "description");
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute("content", description);

    // Update Open Graph meta tags for social sharing
    let ogTitle = document.querySelector(
      'meta[property="og:title"]',
    ) as HTMLMetaElement | null;
    if (!ogTitle) {
      ogTitle = document.createElement("meta");
      ogTitle.setAttribute("property", "og:title");
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute("content", title);

    let ogDescription = document.querySelector(
      'meta[property="og:description"]',
    ) as HTMLMetaElement | null;
    if (!ogDescription) {
      ogDescription = document.createElement("meta");
      ogDescription.setAttribute("property", "og:description");
      document.head.appendChild(ogDescription);
    }
    ogDescription.setAttribute("content", description);
  }, [pathname]);

  return null;
}
