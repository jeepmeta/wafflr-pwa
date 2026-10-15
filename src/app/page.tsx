"use client";

import Link from "next/link";
import { useState } from "react";

/**
 * Home = Hook entry
 * Trigger: decision paralysis / "what should we do?" (internal)
 * Action: one of two big taps (Create | Join) — under 5s
 * Variable reward: Butters wink + soft float; later room outcomes
 * Investment: rooms live in device registry (header badge)
 */
export default function HomePage() {
  const [wink, setWink] = useState(false);

  function onButtersTap() {
    setWink(true);
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(12);
    }
    setTimeout(() => setWink(false), 450);
  }

  return (
    <div className="flex flex-col items-center justify-center flex-1 screen-pad pb-10 pt-2">
      <button
        type="button"
        onClick={onButtersTap}
        className="hero-orbit relative mb-3 border-0 bg-transparent cursor-pointer p-0"
        aria-label="Butters the Waffle — tap for a wink"
      >
        <div
          className="char-frame transition-transform duration-300"
          style={{
            width: 176,
            height: 176,
            backgroundImage: wink
              ? "url(/characters/butters/wink-sheet.svg)"
              : "url(/characters/butters/hero.svg)",
            backgroundSize: wink ? "720px 176px" : "contain",
            animation: wink ? "wink 0.4s steps(4) forwards" : undefined,
          }}
        />
      </button>

      <h1 className="font-display font-bold text-4xl tracking-tight text-obsidian mb-1">
        Wafflr
      </h1>
      <p className="text-muted text-center text-balance mb-1 max-w-[18rem] text-sm sm:text-base">
        Stop waffling. Start living.
      </p>
      <p className="text-obsidian/70 text-center text-balance mb-8 max-w-[18rem] text-xs sm:text-sm">
        Stuck on where to eat or what to watch? Spin a fair room in under a minute.
      </p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Link href="/create" className="btn-primary no-underline w-full">
          Create Room
        </Link>
        <Link href="/join" className="btn-secondary no-underline w-full">
          Join Room
        </Link>
      </div>

      <p className="mt-6 text-[11px] text-muted text-center max-w-[16rem] text-balance">
        No accounts. Rooms live on this device until they expire.
      </p>
    </div>
  );
}
