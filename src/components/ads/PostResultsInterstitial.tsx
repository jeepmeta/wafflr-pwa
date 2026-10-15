"use client";

import { useEffect, useState } from "react";
import {
  markInterstitialShown,
  MONETIZATION,
  shouldShowPostResultsInterstitial,
} from "@/lib/monetization";

interface Props {
  /** Called after dismiss or skip — results CTAs become fully available */
  onDone: () => void;
}

/**
 * Soft interstitial — only mount from Results after a real winner (never mid-swipe).
 * Branded placeholder until a real network is wired.
 */
export function PostResultsInterstitial({ onDone }: Props) {
  const [visible, setVisible] = useState(false);
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    if (!shouldShowPostResultsInterstitial()) {
      onDone();
      return;
    }
    const t = setTimeout(() => setVisible(true), MONETIZATION.interstitialDelayMs);
    return () => clearTimeout(t);
  }, [onDone]);

  useEffect(() => {
    if (!visible) return;
    markInterstitialShown();
    const t = setTimeout(() => setCanSkip(true), MONETIZATION.interstitialMinViewMs);
    return () => clearTimeout(t);
  }, [visible]);

  function close() {
    setVisible(false);
    onDone();
  }

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-obsidian/55 p-4"
      role="dialog"
      aria-label="Sponsored"
    >
      <div className="w-full max-w-sm card p-0! overflow-hidden shadow-[0_12px_40px_rgba(15,23,42,0.35)]">
        <div className="bg-butter/40 border-b-2 border-obsidian/10 px-3 py-1.5 flex justify-between items-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Sponsored</span>
          {canSkip ? (
            <button type="button" className="text-xs font-semibold text-obsidian" onClick={close}>
              Close
            </button>
          ) : (
            <span className="text-[10px] text-muted">…</span>
          )}
        </div>

        <div className="p-5 flex flex-col items-center text-center gap-3">
          <div
            className="char-frame"
            style={{
              width: 96,
              height: 96,
              backgroundImage: "url(/characters/butters/chill.svg)",
            }}
          />
          <p className="font-display font-bold text-lg leading-tight">Keep Wafflr free</p>
          <p className="text-sm text-muted max-w-[16rem]">
            Quick sponsor break — never during a swipe. Real ads plug in here later.
          </p>
          <div className="w-full h-24 rounded-2xl border-2 border-dashed border-obsidian/20 bg-surface flex items-center justify-center text-xs text-muted">
            Ad unit placeholder
          </div>
          <button
            type="button"
            className="btn-primary w-full"
            disabled={!canSkip}
            onClick={close}
          >
            {canSkip ? "Continue" : "Hang on…"}
          </button>
        </div>
      </div>
    </div>
  );
}
