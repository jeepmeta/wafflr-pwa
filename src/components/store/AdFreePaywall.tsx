"use client";

import { useEffect, useState } from "react";
import { isAdFree } from "@/lib/monetization";
import { purchaseAdFree, restorePurchases } from "@/lib/iap";
import { isNativeShell } from "@/lib/platform";

/**
 * Minimal ad-free upsell — safe on web (shows message) and native (IAP).
 * Mount from settings or under Results if desired; not forced mid-flow.
 */
export function AdFreePaywall({ compact = false }: { compact?: boolean }) {
  const [owned, setOwned] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    setOwned(isAdFree());
    void restorePurchases().then((ok) => setOwned(ok || isAdFree()));
  }, []);

  async function buy() {
    setBusy(true);
    setMsg(null);
    const result = await purchaseAdFree();
    setBusy(false);
    if (result.ok) {
      setOwned(true);
      setMsg(result.alreadyOwned ? "Already unlocked" : "Ad-free unlocked");
    } else {
      setMsg(result.message || result.reason);
    }
  }

  if (owned) {
    return (
      <p className={`text-sm text-match font-semibold ${compact ? "" : "text-center"}`}>
        Ad-free active on this device
      </p>
    );
  }

  return (
    <div className={compact ? "" : "card w-full max-w-sm mx-auto text-center"}>
      {!compact && (
        <>
          <div
            className="char-frame mx-auto mb-3"
            style={{
              width: 72,
              height: 72,
              backgroundImage: "url(/characters/butters/chill.svg)",
            }}
          />
          <p className="font-display font-bold text-lg mb-1">Go ad-free</p>
          <p className="text-sm text-muted mb-4">
            One-time unlock. Same Wafflr — no post-results interstitial.
          </p>
        </>
      )}
      <button
        type="button"
        className="btn-primary w-full"
        disabled={busy}
        onClick={() => void buy()}
      >
        {busy ? "Working…" : isNativeShell() ? "Unlock ad-free" : "Unlock ad-free (store builds)"}
      </button>
      {msg && <p className="text-xs text-muted mt-2">{msg}</p>}
    </div>
  );
}
