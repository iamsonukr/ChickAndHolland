import type { Metadata } from "next";
import { Poppins, Prata } from "next/font/google";
import "../globals.css";
import { cn } from "@/lib/utils";
import Header from "@/components/custom/website/Header";
import Footer from "@/components/custom/website/Footer";
import localFont from "next/font/local";
import { Toaster } from "@/components/ui/sonner";
import ScrollToTop from "@/components/custom/ScrollToTop";

const poppins = Poppins({
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-poppins",
  subsets: ["latin-ext"],
});

const prata = Prata({
  weight: "400",
  display: "swap",
  variable: "--font-prata",
  subsets: ["latin"],
});

const vivaldi = localFont({
  src: [{ path: "../../fonts/Vivaldii.woff2", weight: "400" }],
  variable: "--font-vivaldi",
  display: "swap",
});

const adornstoryserif = localFont({
  src: [{ path: "../../fonts/AdornStorySerif.woff2", weight: "400" }],
  variable: "--font-adornstoryserif",
  display: "swap",
});

const helveticaneuemedium = localFont({
  src: [{ path: "../../fonts/HelveticaNeueMedium.otf", weight: "500" }],
  variable: "--font-helveticaneuemedium",
  display: "swap",
});

const msyi = localFont({
  src: [{ path: "../../fonts/msyi.ttf", weight: "400" }],
  variable: "--font-msyi",
  display: "swap",
});

const brandon = localFont({
  src: [{ path: "../../fonts/brandon-grotesque-light.otf", weight: "300" }],
  variable: "--font-brandon",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Chic & Holland | Designer Couture Dresses & Evening Gowns",
  description:
    "Discover Chic & Holland, a luxury couture fashion brand creating handcrafted evening gowns and designer dresses.",
  alternates: {
    canonical: "https://chicandholland.com/",
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Chic & Holland",
  alternateName: "Chic and Holland",
  url: "https://chicandholland.com/",
  logo: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/Brand_New/logo.png",
  description:
    "Chic & Holland is a luxury fashion brand offering designer dresses and couture collections.",
  sameAs: [
    "https://www.instagram.com/chicandholland",
    "https://www.facebook.com/chicandholland",
  ],
  address: {
    "@type": "PostalAddress",
    streetAddress:
      "Jonkheer Carel Sternplein 33, 2273 WZ Voorburg, Netherlands",
    addressLocality: "Voorburg",
    addressRegion: "South Holland",
    postalCode: "2273 WZ",
    addressCountry: "NL",
  },
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+31-621422813",
    contactType: "customer service",
    areaServed: "NL",
    availableLanguage: ["English", "Dutch"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        poppins.variable,
        prata.variable,
        vivaldi.variable,
        adornstoryserif.variable,
        helveticaneuemedium.variable,
        msyi.variable,
        brandon.variable
      )}
    >
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="google-site-verification"
          content="RxJM7QQ7Hb_iMp7MI0R8cyBrGBMCrb2MlYc6gu5eUhQ"
        />

        {/* ✅ Fixed JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      </head>

      <body className="bg-background font-poppins antialiased">
        <ScrollToTop />
        <Header />
        <main className="w-full">{children}</main>
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}

export const dynamic = "force-dynamic";
