import type { Metadata, Viewport } from "next";
import { Jost, Raleway } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import ServiceWorker from "@/components/service-worker";
import AttributionCapture from "@/components/attribution-capture";
import PageViewTracker from "@/components/page-view-tracker";
import InstallApp from "@/components/install-app";
import JsonLd from "@/components/json-ld";
import { organizationSchema, websiteSchema } from "@/lib/structured-data";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";

// Jost is a free geometric sans that stands in for the original Futura-PT.
//
// No `weight` on either, deliberately — but NOT for the reason it looks like.
// Both families already shipped as variable fonts whether or not `weight` was
// listed: builds with and without it emit byte-identical woff2 files (8 files,
// 176,184 bytes, same content hashes, same 2 preloaded). Listing weights never
// produced static cuts in this version of next/font; it only narrowed the
// `font-weight` descriptor in the generated @font-face rules. So this change
// saves nothing, and anyone reaching for it as a payload win should measure
// first — that measurement is why the claim is stated here rather than
// repeated.
//
// What it does fix is real. Raleway was declared `font-weight: 300 400 500
// 600`, and the app uses `font-bold` (700) on eight non-heading elements —
// only h1-h4 take the display font, so those are all Raleway. With no face
// declared at 700 the browser fell back to 600 and SYNTHESISED the bold: a
// smeared, algorithmically-fattened approximation of a cut that was sitting
// unused inside the very file already being downloaded. Declaring the full
// `100 900` range makes every weight the genuine one, for free.
const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
});

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
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
  // No root-level `alternates.canonical` on purpose: it would be inherited by
  // every page that doesn't set its own, canonicalising the whole site to "/".
  // Each route supplies its own canonical (most via pageMetadata()).
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
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
        className="min-h-full flex flex-col overflow-x-clip bg-white text-ink"
        suppressHydrationWarning
      >
        <JsonLd data={organizationSchema()} />
        <JsonLd data={websiteSchema()} />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <ServiceWorker />
        <AttributionCapture />
        <PageViewTracker />
        <InstallApp />
      </body>
    </html>
  );
}
