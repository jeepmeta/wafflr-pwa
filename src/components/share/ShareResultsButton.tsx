"use client";

import { useState } from "react";
import type { Room } from "@/lib/rooms";
import { rankedCards } from "@/lib/rooms";
import { shareResultsWithCard } from "@/lib/share";

interface Props {
  room: Room;
}

export function ShareResultsButton({ room }: Props) {
  const [status, setStatus] = useState<"idle" | "working" | "shared" | "copied">("idle");
  const winner = rankedCards(room)[0];

  async function onShare() {
    if (!winner || status === "working") return;
    setStatus("working");
    const result = await shareResultsWithCard({
      code: room.code,
      roomTitle: room.title,
      winnerName: winner.name,
      yum: winner.yum,
      nah: winner.nah,
    });
    if (result === "shared") setStatus("shared");
    else if (result === "copied") setStatus("copied");
    else setStatus("idle");
    if (result !== "dismissed") {
      setTimeout(() => setStatus("idle"), 2200);
    }
  }

  const label =
    status === "working"
      ? "Preparing…"
      : status === "shared"
        ? "Shared!"
        : status === "copied"
          ? "Copied link"
          : "Share results";

  return (
    <button
      type="button"
      className="btn-ghost w-full border-2 border-obsidian/20 font-semibold"
      disabled={status === "working" || !winner}
      onClick={() => void onShare()}
    >
      {label}
    </button>
  );
}
