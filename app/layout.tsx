import type { Metadata, Viewport } from "next";
import { Jost, Raleway } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import ServiceWorker from "@/components/service-worker";
import InstallApp from "@/components/install-app";
import JsonLd from "@/components/json-ld";
import { organizationSchema, websiteSchema } from "@/lib/structured-data";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";

// Jost is a free geometric sans that stands in for the original Futura-PT.
const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Bridal Team — Fun, Simple, AI-Powered Wedding Planning",
    // Page-level titles that set only a string get the brand appended.
    template: "%s — Bridal Team",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    url: "/",
    title: "Bridal Team — Fun, Simple, AI-Powered Wedding Planning",
    description: SITE_DESCRIPTION,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bridal Team — Fun, Simple, AI-Powered Wedding Planning",
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  // Installed-app presentation on iOS.
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: "default",
  },
  other: {
    // Next only emits the standardised `mobile-web-app-capable`. iOS below 16.4
    // predates manifest support and still needs the apple-prefixed original to
    // launch standalone rather than in a Safari chrome.
    "apple-mobile-web-app-capable": "yes",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    other: [{ rel: "mask-icon", url: "/mask-icon.svg", color: "#f25e00" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#f25e00",
  // Installed apps should fill the display, including behind the notch.
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${jost.variable} ${raleway.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col bg-white text-ink"
        suppressHydrationWarning
      >
        <JsonLd data={organizationSchema()} />
        <JsonLd data={websiteSchema()} />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <ServiceWorker />
        <InstallApp />
      </body>
    </html>
  );
}
