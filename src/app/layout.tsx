import type { Metadata, Viewport } from "next";
import { Fredoka, Inter } from "next/font/google";
import { AppHeader } from "@/components/layout/AppHeader";
import "./App.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-fredoka",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Wafflr — Stop waffling. Start living.",
  description:
    "Mobile-first swipe-tournament decision engine. Fair, fast, and fun for groups.",
  applicationName: "Wafflr",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Wafflr",
  },
  formatDetection: { telephone: false },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#FFFBEB",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${fredoka.variable}`}>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <div className="app-shell">
          <AppHeader />
          <main className="app-main">{children}</main>
        </div>
      </body>
    </html>
  );
}
