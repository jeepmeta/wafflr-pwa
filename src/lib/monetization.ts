/**
 * Soft monetization — post-results only. Never mid-swipe / mid-submit.
 * Real ad SDKs plug into showInterstitial / showRewarded later.
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
  /** Future paid SKU — when true, skip all ads */
  adFreeSkuEnabled: process.env.NEXT_PUBLIC_WAFFLR_AD_FREE_SKU === "1",
  /** Min ms on results before interstitial can appear */
  interstitialDelayMs: 1200,
  /** Placeholder “ad” duration */
  interstitialMinViewMs: 2500,
  rewardedMinViewMs: 3000,
} as const;

export function isAdFree(): boolean {
  if (typeof window === "undefined") return false;
  if (MONETIZATION.adFreeSkuEnabled) {
    try {
      return localStorage.getItem(AD_FREE_KEY) === "1";
    } catch {
      return false;
    }
  }
  return false;
}

/** Dev / future IAP: toggle ad-free entitlement on this device. */
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
    // At most one interstitial per browser session
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
  if (isAdFree()) return true; // ad-free users get rematch free
  return true;
}

/**
 * Placeholder rewarded flow. Replace body with AdMob / AdSense rewarded unit.
 * Resolves true if reward should be granted.
 */
export async function playRewardedPlaceholder(minMs = MONETIZATION.rewardedMinViewMs): Promise<boolean> {
  if (isAdFree()) return true;
  await new Promise((r) => setTimeout(r, minMs));
  return true;
}
