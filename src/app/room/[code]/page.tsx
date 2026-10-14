"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CardSubmit } from "@/components/room/CardSubmit";
import { Lobby } from "@/components/room/Lobby";
import { Results } from "@/components/room/Results";
import { SwipeStack } from "@/components/room/SwipeStack";
import { getJoinedEntry } from "@/lib/joined";
import { getDeviceId } from "@/lib/device";
import {
  applyVote,
  completeRoom,
  getRoomByCode,
  upsertRoom,
  type Room,
} from "@/lib/rooms";
import {
  isSupabaseConfigured,
  remoteGetByCode,
  remoteJoinRoom,
  remoteSetReady,
  remoteSetStatus,
  subscribeRoom,
  type Participant,
} from "@/lib/remote-rooms";

export default function RoomPage() {
  const params = useParams();
  const code = String(params.code || "").toUpperCase();
  const [room, setRoom] = useState<Room | null | undefined>(undefined);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [deviceId, setDeviceId] = useState("");
  const [ready, setReady] = useState(false);
  const [live, setLive] = useState(false);
  const [myVotedIds, setMyVotedIds] = useState<string[]>([]);
  const [hostDeviceId, setHostDeviceId] = useState<string | undefined>();

  const load = useCallback(async () => {
    if (isSupabaseConfigured) {
      const packed = await remoteGetByCode(code);
      if (packed) {
        const role = getJoinedEntry(code)?.role || "joiner";
        upsertRoom(packed.room, role);
        setRoom(packed.room);
        setParticipants(packed.participants);
        setMyVotedIds(packed.myVotedCardIds);
        setLive(true);
        const me = packed.participants.find((p) => p.device_id === getDeviceId());
        setReady(Boolean(me?.ready));
        const host = packed.participants.find((p) => p.is_host);
        setHostDeviceId(host?.device_id);
        return;
      }
    }
    const local = getRoomByCode(code) ?? null;
    if (local) {
      const role = getJoinedEntry(code)?.role || "joiner";
      upsertRoom(local, role);
    }
    setRoom(local);
    setLive(false);
    setMyVotedIds([]);
  }, [code]);

  useEffect(() => {
    setDeviceId(getDeviceId());
    void (async () => {
      if (isSupabaseConfigured) {
        const remote = await remoteJoinRoom(code);
        if (remote) {
          const role = getJoinedEntry(code)?.role || "joiner";
          upsertRoom(remote, role);
        }
      }
      await load();
    })();
  }, [code, load]);

  useEffect(() => {
    if (!room?.id || !live) return;
    return subscribeRoom(room.id, () => {
      void load();
    });
  }, [room?.id, live, load]);

  function onUpdate(next: Room) {
    setRoom(next);
  }

  function onBreakTie(winnerId: string) {
    if (!room) return;
    const boosted = applyVote(room, winnerId, "yum");
    onUpdate(completeRoom(boosted));
  }

  async function toggleReady() {
    if (!room) return;
    const next = !ready;
    setReady(next);
    await remoteSetReady(room.id, next);
    await load();
  }

  const isHost =
    hostDeviceId === deviceId ||
    participants.some((p) => p.device_id === deviceId && p.is_host) ||
    getJoinedEntry(code)?.role === "host";

  async function hostStartSwipe() {
    if (!room || !isHost) return;
    if (isSupabaseConfigured) await remoteSetStatus(room.id, "swiping");
    onUpdate({ ...room, status: "swiping" });
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
          <p className="text-xs text-muted tracking-widest">
            {room.code}
            {live ? " · live" : " · local"}
            {isHost ? " · host" : ""}
          </p>
        </div>
        <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-surface border-2 border-obsidian whitespace-nowrap">
          {room.status}
        </span>
      </div>

      {live && (room.status === "drafting" || room.status === "submitting") && (
        <Lobby
          participants={participants}
          deviceId={deviceId}
          ready={ready}
          onReady={() => void toggleReady()}
        />
      )}

      {(room.status === "drafting" || room.status === "submitting") && (
        <>
          <CardSubmit room={room} onUpdate={onUpdate} />
          {isHost && room.cards.length >= 2 && (
            <button
              type="button"
              className="btn-match w-full mt-2"
              onClick={() => void hostStartSwipe()}
            >
              Host: start swiping for everyone →
            </button>
          )}
        </>
      )}

      {room.status === "swiping" && (
        <SwipeStack
          room={room}
          onUpdate={onUpdate}
          alreadyVotedIds={myVotedIds}
          isHost={isHost}
        />
      )}

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
