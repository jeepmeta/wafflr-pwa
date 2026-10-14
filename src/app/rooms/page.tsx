"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  formatRemaining,
  loadRooms,
  remainingMs,
  type Room,
} from "@/lib/rooms";

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);

  useEffect(() => {
    setRooms(loadRooms());
    const t = setInterval(() => setRooms(loadRooms()), 30000);
    return () => clearInterval(t);
  }, []);

  if (rooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 screen-pad text-center">
        <div
          className="char-frame mb-4"
          style={{ backgroundImage: "url(/characters/barron-bacon/idle.svg)" }}
        />
        <h1 className="font-display font-bold text-xl mb-2">No rooms cookin&apos;</h1>
        <p className="text-muted text-sm mb-6">Start one up!</p>
        <Link href="/create" className="btn-primary no-underline">
          Create Room
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 screen-pad py-4 overflow-y-auto">
      <h1 className="font-display font-bold text-2xl mb-4">Your Rooms</h1>
      <ul className="flex flex-col gap-3 list-none p-0 m-0">
        {rooms.map((r) => {
          const left = remainingMs(r);
          const urgent = left < 10 * 60 * 1000;
          return (
            <li key={r.id}>
              <Link href={`/room/${r.code}`} className="card block no-underline text-obsidian">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <p className="font-display font-semibold">{r.title}</p>
                    <p className="text-sm text-muted tracking-widest">{r.code}</p>
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
                  {r.status === "expired" ? "Expired" : `Expires in ${formatRemaining(left)}`}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
