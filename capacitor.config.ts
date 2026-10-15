import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Wafflr native shell — same web core, store wrappers only.
 *
 * Dev: point server.url at `next dev` (e.g. http://10.0.2.2:3000 on Android emulator).
 * Prod: either host the Next deploy URL, or use `out/` after static export.
 *
 * Setup: npm i -D @capacitor/cli && npm i @capacitor/core @capacitor/ios @capacitor/android
 *        npx cap init (if needed) && npx cap add ios && npx cap add android
 */
const config: CapacitorConfig = {
  appId: "app.wafflr.decision",
  appName: "Wafflr",
  webDir: "out",
  server: {
    // Uncomment for live-reload against Next during native dev:
    // url: "http://localhost:3000",
    // cleartext: true,
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: {
      backgroundColor: "#FFFBEB",
      launchAutoHide: true,
    },
  },
  ios: {
    contentInset: "automatic",
    preferredContentMode: "mobile",
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
