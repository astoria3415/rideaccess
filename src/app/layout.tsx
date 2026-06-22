import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FloatingActions } from "@/components/FloatingActions";
import { AiAssistant } from "@/components/AiAssistant";
import { JsonLd } from "@/components/JsonLd";
import { localBusinessJsonLd } from "@/lib/seo";
import { site } from "@/lib/site";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default:
      "Private Wheelchair Transportation Across NYC | Ride Access NYC",
    template: "%s | Ride Access NYC",
  },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.name }],
  creator: site.name,
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export const viewport: Viewport = {
  themeColor: "#0F4C81",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      {/* suppressHydrationWarning: some browser extensions inject attributes
          (e.g. data-gptw) onto <body> before React hydrates, which is harmless
          but otherwise triggers a hydration mismatch warning. */}
      <body suppressHydrationWarning>
        <JsonLd data={localBusinessJsonLd()} />
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        <Header />
        <main id="main" className="pb-16 md:pb-0">
          {children}
        </main>
        <Footer />
        <FloatingActions />
        <AiAssistant />
      </body>
    </html>
  );
}
