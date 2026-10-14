"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getRoomByCode, type Room } from "@/lib/rooms";

export default function RoomPage() {
  const params = useParams();
  const code = String(params.code || "").toUpperCase();
  const [room, setRoom] = useState<Room | null | undefined>(undefined);

  useEffect(() => {
    setRoom(getRoomByCode(code) ?? null);
  }, [code]);

  if (room === undefined) {
    return (
      <div className="flex items-center justify-center flex-1">
        <div
          className="char-frame"
          style={{
            backgroundImage: "url(/characters/hugh-blueberry/loading-sheet.svg)",
          }}
        />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 screen-pad text-center">
        <div
          className="char-frame mb-4"
          style={{ backgroundImage: "url(/characters/barron-bacon/error.svg)" }}
        />
        <h1 className="font-display font-bold text-xl mb-2">Room not found</h1>
        <p className="text-muted text-sm mb-6">Expired or invalid code.</p>
        <Link href="/" className="btn-primary no-underline">
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 screen-pad py-4 items-center">
      <div
        className="char-frame mb-4"
        style={{ backgroundImage: "url(/characters/butters/chill.svg)" }}
      />
      <h1 className="font-display font-bold text-2xl mb-1">{room.title}</h1>
      <p className="text-muted text-sm tracking-widest mb-2">{room.code}</p>
      <p className="text-xs font-semibold px-3 py-1 rounded-full bg-surface border-2 border-obsidian mb-6">
        {room.status}
      </p>
      <p className="text-muted text-sm text-center max-w-xs mb-6">
        Swipe engine, card submissions, and live lobby land next. Room is saved on this device.
      </p>
      <Link href="/rooms" className="btn-ghost no-underline">
        Back to rooms
      </Link>
    </div>
  );
}
