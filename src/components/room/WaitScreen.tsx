"use client";

import type { Participant } from "@/lib/remote-rooms";

type Variant = "submit" | "swipe" | "tally";

interface Props {
  variant: Variant;
  participants?: Participant[];
  doneCount?: number;
  totalCount?: number;
  message?: string;
}

const COPY: Record<Variant, { title: string; body: string; art: string }> = {
  submit: {
    title: "Waiting on the crew…",
    body: "Butters is chilling while everyone drops their choices.",
    art: "/characters/butters/chill.svg",
  },
  swipe: {
    title: "You're all set!",
    body: "Hang tight while the rest of the room finishes swiping.",
    art: "/characters/butters/anxious.svg",
  },
  tally: {
    title: "Counting the yum…",
    body: "Almost there — locking in the winner.",
    art: "/characters/hugh-blueberry/loading-sheet.svg",
  },
};

export function WaitScreen({
  variant,
  participants = [],
  doneCount,
  totalCount,
  message,
}: Props) {
  const c = COPY[variant];
  return (
    <div className="flex flex-col flex-1 items-center justify-center text-center gap-3 px-2">
      <div
        className="char-frame"
        style={{
          width: 160,
          height: 160,
          backgroundImage: `url(${c.art})`,
          backgroundSize: variant === "tally" ? "auto 160px" : "contain",
        }}
      />
      <h2 className="font-display font-bold text-xl">{c.title}</h2>
      <p className="text-muted text-sm max-w-xs">{message || c.body}</p>
      {typeof doneCount === "number" && typeof totalCount === "number" && totalCount > 0 && (
        <p className="text-xs font-semibold text-obsidian mt-1">
          {doneCount}/{totalCount} finished
        </p>
      )}
      {participants.length > 0 && (
        <ul className="list-none p-0 m-0 mt-2 flex flex-col gap-1 w-full max-w-xs">
          {participants.map((p) => (
            <li
              key={p.id}
              className="flex justify-between text-xs px-3 py-1.5 rounded-full bg-surface border border-obsidian/15"
            >
              <span>
                {p.display_name}
                {p.is_host ? " · host" : ""}
              </span>
              <span className={p.ready ? "text-match font-bold" : "text-muted"}>
                {p.ready ? "ready" : "…"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
