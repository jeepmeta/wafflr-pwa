import type { Metadata, Viewport } from "next";
import { Fredoka, Inter } from "next/font/google";
import Script from "next/script";
import { AppHeader } from "@/components/layout/AppHeader";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { OfflineBanner } from "@/components/pwa/OfflineBanner";
import { StoreProvider } from "@/components/store/StoreProvider";
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
  themeColor: "#FFF7F2",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${fredoka.variable}`}>
      <head>
        <link rel="apple-touch-icon" href="/characters/butters/hero.svg" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <StoreProvider>
          <div className="app-shell">
            <AppHeader />
            <OfflineBanner />
            <main className="app-main">{children}</main>
            <InstallPrompt />
          </div>
        </StoreProvider>
        <Script id="sw-register" strategy="afterInteractive">{
          `if ('serviceWorker' in navigator) {
            window.addEventListener('load', function () {
              navigator.serviceWorker.register('/sw.js').catch(function () {});
            });
          }`
        }</Script>
      </body>
    </html>
  );
}
