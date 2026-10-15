/**
 * Soft monetization — post-results only. Never mid-swipe / mid-submit.
 * Real ad SDKs plug into showInterstitial / showRewarded later.
 * Ad-free entitlement is shared with store IAP (`src/lib/iap.ts`).
 */

const AD_FREE_KEY = "wafflr_ad_free_v1";
const INTERSTITIAL_SESSION_KEY = "wafflr_interstitial_shown_session";

/** Feature flags (env or defaults). Swap for remote config later. */
export const MONETIZATION = {
  /** Master switch for any ads */
  adsEnabled: process.env.NEXT_PUBLIC_WAFFLR_ADS !== "0",
  /** Post-results interstitial */
  interstitialEnabled: process.env.NEXT_PUBLIC_WAFFLR_INTERSTITIAL !== "0",
  /** Rewarded path for rematch / extra slot */
  rewardedEnabled: process.env.NEXT_PUBLIC_WAFFLR_REWARDED !== "0",
  /** Paid SKU surface — enable to honor isAdFree / paywall */
  adFreeSkuEnabled:
    process.env.NEXT_PUBLIC_WAFFLR_AD_FREE_SKU === "1" ||
    process.env.NEXT_PUBLIC_WAFFLR_IAP_SIMULATE === "1",
  /** Min ms on results before interstitial can appear */
  interstitialDelayMs: 1200,
  /** Placeholder “ad” duration */
  interstitialMinViewMs: 2500,
  rewardedMinViewMs: 3000,
} as const;

export function isAdFree(): boolean {
  if (typeof window === "undefined") return false;
  try {
    // Always honor local entitlement if present (IAP or promo)
    if (localStorage.getItem(AD_FREE_KEY) === "1") return true;
  } catch {
    /* ignore */
  }
  return false;
}

/** Dev / IAP: toggle ad-free entitlement on this device. */
export function setAdFree(on: boolean) {
  if (typeof window === "undefined") return;
  try {
    if (on) localStorage.setItem(AD_FREE_KEY, "1");
    else localStorage.removeItem(AD_FREE_KEY);
  } catch {
    /* ignore */
  }
}

export function shouldShowPostResultsInterstitial(): boolean {
  if (!MONETIZATION.adsEnabled || !MONETIZATION.interstitialEnabled) return false;
  if (isAdFree()) return false;
  if (typeof window === "undefined") return false;
  try {
    if (sessionStorage.getItem(INTERSTITIAL_SESSION_KEY) === "1") return false;
  } catch {
    /* ignore */
  }
  return true;
}

export function markInterstitialShown() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(INTERSTITIAL_SESSION_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function canOfferRewardedRematch(): boolean {
  if (!MONETIZATION.adsEnabled || !MONETIZATION.rewardedEnabled) return false;
  if (isAdFree()) return true;
  return true;
}

/**
 * Placeholder rewarded flow. Replace body with AdMob / AdSense rewarded unit.
 */
export async function playRewardedPlaceholder(
  minMs = MONETIZATION.rewardedMinViewMs
): Promise<boolean> {
  if (isAdFree()) return true;
  await new Promise((r) => setTimeout(r, minMs));
  return true;
}
