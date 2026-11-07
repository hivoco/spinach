import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Frame } from "@/components/Frame";
import { QUIZ_LENGTH } from "@/lib/quiz";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

// Self-hosted copies of the Figma text styles: Montserrat SemiBold/Bold for headings and labels, PT Sans Regular for body.
const montserrat = localFont({
  variable: "--font-montserrat",
  src: [
    { path: "../fonts/Montserrat-SemiBold.woff2", weight: "600" },
    { path: "../fonts/Montserrat-Bold.woff2", weight: "700" },
  ],
});
const ptSans = localFont({
  variable: "--font-pt-sans",
  src: [{ path: "../fonts/PTSans-Regular.woff2", weight: "400" }],
});

const title = "Find Your Career Archetype | Spinach";
const description = `Take the free Spinach Career Archetype quiz. Answer ${QUIZ_LENGTH} short scenarios to discover the blend of archetypes that shapes how you work, and get your personalised report.`;

export const metadata: Metadata = {
  // Absolute URLs for share previews. Set NEXT_PUBLIC_SITE_URL to the live domain when deploying.
  metadataBase: new URL(SITE_URL),
  title,
  description,
  applicationName: "Spinach",
  keywords: ["career archetype", "career quiz", "career personality test", "career assessment", "work motivation", "career choices", "Spinach"],
  authors: [{ name: "Spinach", url: "https://www.spinachlearn.com" }],
  creator: "Spinach",
  publisher: "Spinach",
  robots: { index: true, follow: true },
  // The preview image is the logo (opengraph-image.png and twitter-image.png in this folder); /result/<pair> has its own.
  // Icons live in public/, so they must be listed here (files in app/ would be picked up automatically).
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
  },
  openGraph: { title, description, url: "/", siteName: "Spinach", locale: "en_IN", type: "website" },
  twitter: { card: "summary_large_image", title, description },
};

// viewport-fit=cover lets the page use env(safe-area-inset-*) around notches and home indicators.
export const viewport: Viewport = { themeColor: "#edf0ed", viewportFit: "cover" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${montserrat.variable} ${ptSans.variable} h-full antialiased`}>
      <body className="h-full font-sans">
        <Frame>{children}</Frame>
      </body>
    </html>
  );
}
