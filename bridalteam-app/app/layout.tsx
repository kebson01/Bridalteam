import type { Metadata } from "next";
import { Jost, Raleway } from "next/font/google";
import "./globals.css";

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
  title: "Bridal Team — Fun, Simple, AI-Powered Wedding Planning",
  description:
    "Organize details, find ideas, and collaborate with your team — now supercharged with AI. Plan your whole wedding in one place with Bridal Team.",
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
    >
      <body className="min-h-full flex flex-col bg-white text-ink">
        {children}
      </body>
    </html>
  );
}
