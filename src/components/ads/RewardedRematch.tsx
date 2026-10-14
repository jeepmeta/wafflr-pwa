"use client";

import { useState } from "react";
import Link from "next/link";
import {
  canOfferRewardedRematch,
  isAdFree,
  playRewardedPlaceholder,
} from "@/lib/monetization";

/**
 * Optional rewarded path under results — unlock a frictionless “Start new room”.
 * Ad-free devices skip the watch step.
 */
export function RewardedRematch() {
  const [busy, setBusy] = useState(false);
  const [unlocked, setUnlocked] = useState(isAdFree());

  if (!canOfferRewardedRematch()) return null;

  async function watch() {
    if (busy) return;
    setBusy(true);
    try {
      const ok = await playRewardedPlaceholder();
      if (ok) setUnlocked(true);
    } finally {
      setBusy(false);
    }
  }

  if (unlocked) {
    return (
      <Link href="/create" className="btn-match no-underline w-full text-center">
        Rematch — start new room
      </Link>
    );
  }

  return (
    <button
      type="button"
      className="btn-ghost w-full border-2 border-obsidian/15"
      disabled={busy}
      onClick={() => void watch()}
    >
      {busy ? "Watching…" : "Watch short ad · unlock rematch"}
    </button>
  );
}
