import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CartProvider } from "@/components/Cart";
import { CartBar } from "@/components/CartLink";
import PwaBoot from "@/components/PwaBoot";
import { SITE_URL } from "@/lib/env";
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL), title: { default: "Jamva: Pay for the food. Not the platform.", template: "%s | Jamva" },
  description: "Food delivery in Ahmedabad with zero commission restaurants, no platform fee and one honest delivery fee.", manifest: "/manifest.webmanifest",
  openGraph: { type: "website", siteName: "Jamva", title: "Jamva: Pay for the food. Not the platform.", description: "Zero commission. No platform fee. One honest delivery fee. Launching in Ahmedabad.", images: ["/og.png"] },
  twitter: { card: "summary_large_image" }, appleWebApp: { capable: true, title: "Jamva", statusBarStyle: "default" },
};
export const viewport: Viewport = { themeColor: "#F08A00", width: "device-width", initialScale: 1 };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en" className={`${fraunces.variable} ${jakarta.variable}`}><body><CartProvider><Header /><main className="min-h-[70vh]">{children}</main><Footer /><CartBar /><PwaBoot /></CartProvider><Analytics /></body></html>);
}
