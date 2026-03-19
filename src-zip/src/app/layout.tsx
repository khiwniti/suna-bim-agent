import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/i18n/provider";
import { PostHogProvider } from "@/lib/analytics";
import { PanelEventProvider } from "@/contexts/PanelEventContext";
import { TamboProviders } from "./tambo-providers";
import { JsonLd } from "@/components/seo";
import {
  generateOrganizationSchema,
  generateSoftwareAppSchema,
} from "@/lib/seo";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai"],
  display: "swap",
  variable: "--font-noto-thai",
});

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://bim.getintheq.space";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "CarbonBIM - Carbon Footprint Calculator for Thai Construction",
    template: "%s | CarbonBIM",
  },
  description:
    "AI-powered carbon footprint analysis for BIM models. Calculate emissions, generate TGO-compliant reports, and achieve TREES certification for Thai construction projects.",
  keywords: [
    "carbon footprint",
    "BIM",
    "building information modeling",
    "Thailand construction",
    "TGO",
    "TREES certification",
    "green building",
    "sustainability",
    "carbon calculator",
    "IFC",
    "embodied carbon",
  ],
  authors: [{ name: "CarbonBIM Team" }],
  creator: "CarbonBIM",
  publisher: "CarbonBIM",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: "th_TH",
    url: BASE_URL,
    siteName: "CarbonBIM",
    title: "CarbonBIM - Carbon Footprint Calculator for Thai Construction",
    description:
      "AI-powered carbon footprint analysis for BIM models. Calculate emissions and achieve TGO compliance.",
    images: [
      {
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "CarbonBIM - Sustainable Construction Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CarbonBIM - Carbon Calculator for Construction",
    description: "AI-powered carbon analysis for Thai construction projects",
    images: [`${BASE_URL}/og-image.png`],
  },
  alternates: {
    canonical: BASE_URL,
  },
  category: "technology",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#10b981" },
    { media: "(prefers-color-scheme: dark)", color: "#059669" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${notoSansThai.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <JsonLd data={generateOrganizationSchema()} />
        <JsonLd data={generateSoftwareAppSchema()} />
      </head>
      <body className="antialiased bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <PostHogProvider>
          <I18nProvider>
            <TamboProviders>
              <PanelEventProvider>{children}</PanelEventProvider>
            </TamboProviders>
          </I18nProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
