import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const SITE_URL = "https://travel-os.example.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Travel OS — Plan Your Dream Trip, Effortlessly",
    template: "%s · Travel OS",
  },
  description:
    "A high-end, interactive digital travel planner. Build itineraries, track budgets, and organize packing lists in one beautiful workspace. Instant download.",
  keywords: [
    "travel planner",
    "digital planner",
    "notion travel template",
    "itinerary builder",
    "trip budget tracker",
    "packing list",
    "etsy travel planner",
  ],
  authors: [{ name: "Travel OS" }],
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: "Travel OS — Plan Your Dream Trip, Effortlessly",
    description:
      "An interactive digital travel planner: itinerary builder, budget tracker, packing lists and more.",
    siteName: "Travel OS",
  },
  twitter: {
    card: "summary_large_image",
    title: "Travel OS — Plan Your Dream Trip, Effortlessly",
    description:
      "An interactive digital travel planner: itinerary builder, budget tracker, packing lists and more.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#07070d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${inter.variable}`}
      style={{ ["--font-geist-sans" as string]: GeistSans.style.fontFamily }}
    >
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
