import type { Metadata } from "next";
import { Poppins, Prata } from "next/font/google";
import "../globals.css";
import { cn } from "@/lib/utils";
import Header from "@/components/custom/website/Header";
import Footer from "@/components/custom/website/Footer";
import localFont from "next/font/local";
import { Toaster } from "@/components/ui/sonner";
import Loaders from "./Loader";


const poppins = Poppins({
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-poppins",
  subsets: ["latin-ext"],
});

const vivaldi = localFont({
  src: [{ path: "../../fonts/Vivaldii.woff2", weight: "400" }],
  variable: "--font-vivaldi",
  display: "swap",
});

const adornstoryserif = localFont({
  src: [{ path: "../../fonts/AdornStorySerif.ttf", weight: "600" }],
  variable: "--font-adornstoryserif",
  display: "swap",
});

const helveticaneuemedium = localFont({
  src: [{ path: "../../fonts/HelveticaNeueMedium.otf", weight: "700" }],
  variable: "--font-helveticaneuemedium",
  display: "swap",
});

const msyi = localFont({
  src: [{ path: "../../fonts/msyi.ttf", weight: "700" }],
  variable: "--font-msyi",
  display: "swap",
});

const prata = Prata({
  weight: "400",
  display: "swap",
  variable: "--font-prata",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chic & Holland",
  description:
    "We are focused on designing and creating high-end, handmade dresses for every special occasion in a woman's life.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
   <html lang="en" suppressHydrationWarning>
  <head>
    <meta
      name="viewport"
      content="width=device-width, initial-scale=0.75, maximum-scale=0.75, minimum-scale=0.75, user-scalable=no"
    />
  </head>
  <body
    className={cn(
      "bg-background font-poppins antialiased",
      poppins.variable,
      vivaldi.variable,
      prata.variable,
      adornstoryserif.variable,
      msyi.variable,
      helveticaneuemedium.variable,
    )}
  >
<Loaders/>
        <Header />
        <main className="w-full">{children}</main>
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}

export const dynamic = "force-dynamic";
