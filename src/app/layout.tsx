import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Frame } from "@/components/Frame";
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

const description = "Answer 1 short scenario to discover the career archetype that fits how you work.";

export const metadata: Metadata = {
  // Absolute URLs for share previews. Set NEXT_PUBLIC_SITE_URL to the live domain when deploying.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Find your career archetype | Spinach",
  description,
  // No site-wide preview image (only /result/<pair> has one).
  // Icons live in public/, so they must be listed here (files in app/ would be picked up automatically).
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
  },
  openGraph: { title: "Find your Career Archetype", description, siteName: "Spinach", type: "website" },
  twitter: { card: "summary", title: "Find your Career Archetype", description },
};

// viewport-fit=cover lets the page use env(safe-area-inset-*) around notches and home indicators.
export const viewport: Viewport = { themeColor: "#edf0ed", viewportFit: "cover" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${montserrat.variable} ${ptSans.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <Frame>{children}</Frame>
      </body>
    </html>
  );
}
