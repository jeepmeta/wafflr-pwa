"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  loadJoined,
  touchJoined,
  type JoinedEntry,
} from "@/lib/joined";
import {
  formatRemaining,
  getRoomByCode,
  remainingMs,
  upsertRoom,
  type Room,
} from "@/lib/rooms";
import { isSupabaseConfigured, remoteGetByCode } from "@/lib/remote-rooms";

type Row = JoinedEntry & { snapshot?: Room };

export default function RoomsPage() {
  const [rows, setRows] = useState<Row[] | null>(null);

  const refresh = useCallback(async () => {
    const joined = loadJoined();
    const next: Row[] = [];

    for (const entry of joined) {
      let snapshot = getRoomByCode(entry.code);

      // Rehydrate from server when online so status/cards stay fresh after a kill
      if (isSupabaseConfigured) {
        try {
          const packed = await remoteGetByCode(entry.code);
          if (packed) {
            snapshot = packed.room;
            upsertRoom(packed.room); // touch registry, keep role
            touchJoined(entry.code, {
              title: packed.room.title,
              status: packed.room.status,
              expiresAt: packed.room.expiresAt,
              roomId: packed.room.id,
            });
          }
        } catch {
          /* offline — use cache */
        }
      }

      const status =
        snapshot?.status ||
        (Date.now() >= entry.expiresAt ? "expired" : entry.status);

      next.push({
        ...entry,
        title: snapshot?.title || entry.title,
        status,
        expiresAt: snapshot?.expiresAt || entry.expiresAt,
        snapshot,
      });
    }

    setRows(next);
  }, []);

  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), 30000);
    return () => clearInterval(t);
  }, [refresh]);

  if (rows === null) {
    return (
      <div className="flex items-center justify-center flex-1">
        <p className="text-muted text-sm">Loading rooms…</p>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 screen-pad text-center">
        <div
          className="char-frame mb-4"
          style={{ backgroundImage: "url(/characters/barron-bacon/idle.svg)" }}
        />
        <h1 className="font-display font-bold text-xl mb-2">No rooms cookin&apos;</h1>
        <p className="text-muted text-sm mb-6">
          Rooms you create or join show up here until they expire — no account needed.
        </p>
        <Link href="/create" className="btn-primary no-underline">
          Create Room
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 screen-pad py-4 overflow-y-auto">
      <h1 className="font-display font-bold text-2xl mb-1">Your Rooms</h1>
      <p className="text-muted text-xs mb-4">Saved on this device until expiry</p>
      <ul className="flex flex-col gap-3 list-none p-0 m-0">
        {rows.map((r) => {
          const left = remainingMs({ expiresAt: r.expiresAt });
          const urgent = left < 10 * 60 * 1000 && r.status !== "expired";
          return (
            <li key={r.code}>
              <Link href={`/room/${r.code}`} className="card block no-underline text-obsidian">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <p className="font-display font-semibold">{r.title}</p>
                    <p className="text-sm text-muted tracking-widest">{r.code}</p>
                    <p className="text-[10px] text-muted mt-1 uppercase tracking-wide">
                      {r.role === "host" ? "Host" : "Joined"}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full border-2 border-obsidian ${
                      r.status === "completed"
                        ? "bg-match text-white"
                        : r.status === "expired"
                          ? "bg-muted text-white"
                          : "bg-butter"
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
                <p className={`text-xs mt-2 ${urgent ? "text-berry font-semibold" : "text-muted"}`}>
                  {r.status === "expired" || left === 0
                    ? "Expired"
                    : `Expires in ${formatRemaining(left)}`}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
