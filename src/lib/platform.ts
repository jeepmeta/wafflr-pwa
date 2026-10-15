/**
 * Runtime platform detection for web vs store shells.
 */

export type AppPlatform = "web" | "ios" | "android" | "unknown";

export function getAppPlatform(): AppPlatform {
  if (typeof window === "undefined") return "unknown";
  const w = window as Window & {
    Capacitor?: { isNativePlatform?: () => boolean; getPlatform?: () => string };
  };
  try {
    if (w.Capacitor?.isNativePlatform?.()) {
      const p = w.Capacitor.getPlatform?.() || "unknown";
      if (p === "ios") return "ios";
      if (p === "android") return "android";
      return "unknown";
    }
  } catch {
    /* ignore */
  }
  // TWA / standalone display mode still counts as installed web
  if (window.matchMedia("(display-mode: standalone)").matches) return "web";
  return "web";
}

export function isNativeShell(): boolean {
  const p = getAppPlatform();
  return p === "ios" || p === "android";
}

/** True when running inside Capacitor or as installed PWA/TWA. */
export function isInstalledExperience(): boolean {
  if (typeof window === "undefined") return false;
  if (isNativeShell()) return true;
  const nav = navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    nav.standalone === true ||
    new URLSearchParams(window.location.search).get("source") === "twa" ||
    new URLSearchParams(window.location.search).get("source") === "pwa"
  );
}
