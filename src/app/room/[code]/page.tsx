"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CardSubmit } from "@/components/room/CardSubmit";
import { Results } from "@/components/room/Results";
import { SwipeStack } from "@/components/room/SwipeStack";
import {
  applyVote,
  completeRoom,
  getRoomByCode,
  type Room,
} from "@/lib/rooms";

export default function RoomPage() {
  const params = useParams();
  const code = String(params.code || "").toUpperCase();
  const [room, setRoom] = useState<Room | null | undefined>(undefined);

  const refresh = useCallback(() => {
    setRoom(getRoomByCode(code) ?? null);
  }, [code]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function onUpdate(next: Room) {
    setRoom(next);
  }

  function onBreakTie(winnerId: string) {
    if (!room) return;
    const boosted = applyVote(room, winnerId, "yum");
    onUpdate(completeRoom(boosted));
  }

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
    <div className="flex flex-col flex-1 screen-pad py-3 overflow-y-auto">
      <div className="flex items-center justify-between mb-3 gap-2">
        <div>
          <h1 className="font-display font-bold text-lg leading-tight">{room.title}</h1>
          <p className="text-xs text-muted tracking-widest">{room.code}</p>
        </div>
        <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-surface border-2 border-obsidian whitespace-nowrap">
          {room.status}
        </span>
      </div>

      {(room.status === "drafting" || room.status === "submitting") && (
        <CardSubmit room={room} onUpdate={onUpdate} />
      )}

      {room.status === "swiping" && <SwipeStack room={room} onUpdate={onUpdate} />}

      {room.status === "completed" && (
        <Results room={room} onBreakTie={onBreakTie} />
      )}

      {room.status === "expired" && (
        <div className="flex flex-col items-center flex-1 justify-center text-center">
          <div
            className="char-frame mb-4"
            style={{ backgroundImage: "url(/characters/barron-bacon/error.svg)" }}
          />
          <p className="text-muted text-sm mb-4">This room has expired.</p>
          <Link href="/" className="btn-primary no-underline">
            Return Home
          </Link>
        </div>
      )}
    </div>
  );
}
