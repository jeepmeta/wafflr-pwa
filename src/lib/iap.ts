/**
 * Store IAP bridge for ad-free SKU.
 * Web: no-op / future Stripe.
 * Native: plug @capacitor-community/in-app-purchases or RevenueCat here.
 */

import { setAdFree, isAdFree, MONETIZATION } from "./monetization";
import { getAppPlatform, isNativeShell } from "./platform";

/** Product id registered in App Store Connect / Play Console */
export const AD_FREE_PRODUCT_ID =
  process.env.NEXT_PUBLIC_WAFFLR_AD_FREE_PRODUCT_ID || "wafflr_ad_free";

export type PurchaseResult =
  | { ok: true; alreadyOwned?: boolean }
  | { ok: false; reason: "cancelled" | "unavailable" | "error"; message?: string };

/**
 * Restore prior purchases (call on app launch in native shell).
 * Stub until native plugin is linked.
 */
export async function restorePurchases(): Promise<boolean> {
  if (!isNativeShell()) {
    return isAdFree();
  }
  // TODO: InAppPurchase.restorePurchases() → if AD_FREE_PRODUCT_ID owned → setAdFree(true)
  return isAdFree();
}

/**
 * Purchase ad-free. On success, sets local entitlement (same key as web flags).
 */
export async function purchaseAdFree(): Promise<PurchaseResult> {
  if (isAdFree()) return { ok: true, alreadyOwned: true };

  if (!isNativeShell()) {
    // Web / TWA: enable local entitlement when SKU flag is on (dev / promo)
    if (MONETIZATION.adFreeSkuEnabled) {
      setAdFree(true);
      return { ok: true };
    }
    return {
      ok: false,
      reason: "unavailable",
      message: "Ad-free is available in the App Store and Play builds.",
    };
  }

  try {
    // Placeholder success path for wiring tests — replace with real IAP plugin:
    // const result = await InAppPurchase.purchase({ productId: AD_FREE_PRODUCT_ID });
    const platform = getAppPlatform();
    if (process.env.NEXT_PUBLIC_WAFFLR_IAP_SIMULATE === "1") {
      setAdFree(true);
      return { ok: true };
    }
    return {
      ok: false,
      reason: "unavailable",
      message: `IAP plugin not linked yet (${platform}). Set NEXT_PUBLIC_WAFFLR_IAP_SIMULATE=1 to test entitlement.`,
    };
  } catch (e) {
    return {
      ok: false,
      reason: "error",
      message: e instanceof Error ? e.message : "Purchase failed",
    };
  }
}

/** Call once after Capacitor ready. */
export async function initStoreBilling(): Promise<void> {
  if (!isNativeShell()) return;
  await restorePurchases();
}
