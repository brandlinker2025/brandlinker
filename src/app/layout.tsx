import type { Metadata, Viewport } from "next";
import { Outfit, Playfair_Display } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { CursorGlow } from "@/components/cursor-glow";
import { ScrollProgress } from "@/components/motion-fx";
import DataRain from "@/components/ui/data-rain";
import { MotionProvider } from "@/components/motion-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { siteDescription, siteName, siteTitle, siteUrl } from "@/lib/site";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-outfit",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: "%s · Razia Sultana Lina (RS Lina)",
  },
  description: siteDescription,
  applicationName: siteName,
  authors: [{ name: "Razia Sultana Lina", url: siteUrl }],
  creator: "Razia Sultana Lina",
  keywords: [
    "Razia Sultana Lina",
    "RS Lina",
    "RSLina",
    "rslina",
    "ACI Motors Ltd.",
    "Dhaka",
    "Bangladesh",
    "operations",
    "internal audit",
    "Creative Minded BD",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName,
    title: siteTitle,
    description: siteDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  category: "Portfolio",
};

export const viewport: Viewport = {
  themeColor: "#07080d",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      id="top"
      className={`${outfit.variable} ${playfair.variable} dark h-full antialiased`}
    >
      <body className="min-h-full">
        <MotionProvider>
          <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
            <div className="ambient-wash" />
            <DataRain />
            <div className="absolute -top-40 -left-24 h-[38rem] w-[38rem] rounded-full bg-[#1e6bff]/30 blur-[120px]" />
            <div className="absolute top-[12%] -right-28 h-[34rem] w-[34rem] rounded-full bg-[#ff9f5a]/28 blur-[130px]" />
            <div className="absolute top-[48%] left-[18%] h-[30rem] w-[30rem] rounded-full bg-[#1e6bff]/0 blur-[130px]" />
            <div className="absolute -bottom-32 right-[8%] h-[32rem] w-[32rem] rounded-full bg-[#1e6bff]/14 blur-[120px]" />
          </div>
          <div className="relative z-10 flex min-h-full flex-col">
            <ScrollProgress />
            <CursorGlow />
            <a
              href="#content"
              className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-[#2f7bff] focus:px-4 focus:py-2 focus:text-[#0a0c12]"
            >
              Skip to content
            </a>
            <Suspense
              fallback={
                <div className="h-16 border-b border-[#ffa45c]/30 bg-[#07080d]/40 backdrop-blur-xl" />
              }
            >
              <SiteHeader />
            </Suspense>
            <div id="content" tabIndex={-1} className="flex flex-1 flex-col outline-none">
              {children}
            </div>
            <SiteFooter />
          </div>
        </MotionProvider>
      </body>
    </html>
  );
}
