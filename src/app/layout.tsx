import type { Metadata, Viewport } from "next";
import { Fredoka, Inter } from "next/font/google";
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
  title: "Wafflr — Decide faster",
  description:
    "Sleek, gamified decision-making. Where to eat, what to watch — fair, fun, done in under a minute.",
  applicationName: "Wafflr",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Wafflr",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: "/favicon.png",
    apple: "/icon-192.png",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0F172A" },
    { media: "(prefers-color-scheme: light)", color: "#F8FAFC" },
  ],
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" className={`${inter.variable} ${fredoka.variable}`}>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-dvh antialiased">
        {children}
      </body>
    </html>
  );
}
