"use client";

import type { Participant } from "@/lib/remote-rooms";

interface Props {
  participants: Participant[];
  deviceId: string;
  onReady?: () => void;
  ready?: boolean;
}

export function Lobby({ participants, deviceId, onReady, ready }: Props) {
  return (
    <div className="card p-3! mb-4">
      <p className="font-display font-semibold text-sm mb-2">
        Lobby · {participants.length} here
      </p>
      <ul className="list-none p-0 m-0 flex flex-col gap-1.5">
        {participants.map((p) => (
          <li key={p.id} className="flex justify-between items-center text-sm gap-2">
            <span>
              {p.display_name}
              {p.device_id === deviceId ? " (you)" : ""}
              {p.is_host ? " · host" : ""}
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                p.ready
                  ? "bg-match text-white border-obsidian"
                  : "bg-surface border-obsidian/20 text-muted"
              }`}
            >
              {p.ready ? "ready" : "waiting"}
            </span>
          </li>
        ))}
      </ul>
      {onReady && (
        <button
          type="button"
          className={`mt-3 w-full ${ready ? "btn-ghost" : "btn-primary"}`}
          onClick={onReady}
        >
          {ready ? "Not ready" : "I'm ready"}
        </button>
      )}
    </div>
  );
}
