"use client";

import Link from "next/link";
import { useState } from "react";

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
    <div className="flex flex-col items-center justify-center flex-1 screen-pad pb-8">
      <button
        type="button"
        onClick={onButtersTap}
        className="relative mb-4 border-0 bg-transparent cursor-pointer p-0"
        aria-label="Butters the Waffle"
      >
        <div
          className="char-frame transition-transform duration-300"
          style={{
            width: 180,
            height: 180,
            backgroundImage: wink
              ? "url(/characters/butters/wink-sheet.svg)"
              : "url(/characters/butters/hero.svg)",
            backgroundSize: wink ? "720px 180px" : "contain",
            animation: wink ? "wink 0.4s steps(4) forwards" : undefined,
          }}
        />
        <style jsx>{`
          @keyframes wink {
            to {
              background-position: -720px center;
            }
          }
        `}</style>
      </button>

      <h1 className="font-display font-bold text-4xl tracking-tight text-obsidian mb-1">
        Wafflr
      </h1>
      <p className="text-muted text-center mb-8 max-w-xs">
        Stop waffling. Start living.
      </p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Link href="/create" className="btn-primary no-underline w-full">
          Create Room
        </Link>
        <Link href="/join" className="btn-secondary no-underline w-full">
          Join Room
        </Link>
      </div>
    </div>
  );
}
