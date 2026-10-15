"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CardSubmit } from "@/components/room/CardSubmit";
import { Lobby } from "@/components/room/Lobby";
import { Results } from "@/components/room/Results";
import { SwipeStack } from "@/components/room/SwipeStack";
import { WaitScreen } from "@/components/room/WaitScreen";
import { getJoinedEntry } from "@/lib/joined";
import { getDeviceId } from "@/lib/device";
import { getRoomSnapshotByCode, saveRoomSnapshot } from "@/lib/offline";
import {
  applyVote,
  completeRoom,
  getRoomByCode,
  upsertRoom,
  type Room,
} from "@/lib/rooms";
import {
  devicesFinishedSwiping,
  isSupabaseConfigured,
  remoteBreakTie,
  remoteGetByCode,
  remoteJoinRoom,
  remoteSetReady,
  remoteSetStatus,
  subscribeRoom,
  type Participant,
  type RemoteVote,
} from "@/lib/remote-rooms";

export default function RoomPage() {
  const params = useParams();
  const code = String(params.code || "").toUpperCase();
  const [room, setRoom] = useState<Room | null | undefined>(undefined);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [votes, setVotes] = useState<RemoteVote[]>([]);
  const [deviceId, setDeviceId] = useState("");
  const [ready, setReady] = useState(false);
  const [live, setLive] = useState(false);
  const [myVotedIds, setMyVotedIds] = useState<string[]>([]);
  const [hostDeviceId, setHostDeviceId] = useState<string | undefined>();

  const load = useCallback(async () => {
    if (isSupabaseConfigured) {
      try {
        const packed = await remoteGetByCode(code);
        if (packed) {
          const role = getJoinedEntry(code)?.role || "joiner";
          upsertRoom(packed.room, role);
          saveRoomSnapshot(packed.room);
          setRoom(packed.room);
          setParticipants(packed.participants);
          setVotes(packed.votes);
          setMyVotedIds(packed.myVotedCardIds);
          setLive(true);
          const me = packed.participants.find((p) => p.device_id === getDeviceId());
          setReady(Boolean(me?.ready));
          const host = packed.participants.find((p) => p.is_host);
          setHostDeviceId(host?.device_id);
          return;
        }
      } catch {
        /* fall through */
      }
    }

    const local = getRoomByCode(code) ?? getRoomSnapshotByCode(code) ?? null;
    if (local) {
      const role = getJoinedEntry(code)?.role || "joiner";
      upsertRoom(local, role);
      saveRoomSnapshot(local);
    }
    setRoom(local);
    setLive(false);
    setMyVotedIds([]);
    setVotes([]);
  }, [code]);

  useEffect(() => {
    setDeviceId(getDeviceId());
    void (async () => {
      if (isSupabaseConfigured && navigator.onLine) {
        try {
          const remote = await remoteJoinRoom(code);
          if (remote) {
            const role = getJoinedEntry(code)?.role || "joiner";
            upsertRoom(remote, role);
            saveRoomSnapshot(remote);
          }
        } catch {
          /* offline */
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
    saveRoomSnapshot(next);
  }

  async function onBreakTie(winnerId: string) {
    if (!room) return;
    if (isSupabaseConfigured && live && navigator.onLine) {
      await remoteBreakTie(room.id, winnerId);
      await load();
      return;
    }
    const boosted = applyVote(room, winnerId, "yum");
    onUpdate(completeRoom(boosted));
  }

  async function toggleReady() {
    if (!room) return;
    const next = !ready;
    setReady(next);
    if (navigator.onLine) {
      await remoteSetReady(room.id, next);
      await load();
    }
  }

  const isHost =
    hostDeviceId === deviceId ||
    participants.some((p) => p.device_id === deviceId && p.is_host) ||
    getJoinedEntry(code)?.role === "host";

  const isBroadcast = Boolean(room?.isBroadcast);

  async function hostStartSwipe() {
    if (!room || !isHost) return;
    if (isSupabaseConfigured && navigator.onLine) await remoteSetStatus(room.id, "swiping");
    onUpdate({ ...room, status: "swiping" });
  }

  async function hostRevealResults() {
    if (!room || !isHost) return;
    if (isSupabaseConfigured && navigator.onLine) {
      await remoteSetStatus(room.id, "completed");
      await load();
      return;
    }
    onUpdate(completeRoom(room));
  }

  const deviceIds = participants.map((p) => p.device_id).filter(Boolean);
  const cardIds = room?.cards.map((c) => c.id) || [];
  const { finished, pending } =
    room && live && !isBroadcast
      ? devicesFinishedSwiping(votes, cardIds, deviceIds)
      : { finished: [], pending: [] };

  if (room === undefined) {
    return (
      <div className="flex items-center justify-center flex-1">
        <WaitScreen variant="tally" message="Loading room…" />
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
        <p className="text-muted text-sm mb-6">Expired, invalid, or no offline snapshot.</p>
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
            {isBroadcast ? " · broadcast" : ""}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-surface border-2 border-obsidian whitespace-nowrap">
            {room.status}
          </span>
          {isBroadcast && typeof room.viewerCount === "number" && (
            <span className="text-[10px] font-semibold text-lavender px-2">
              {room.viewerCount.toLocaleString()} joined
            </span>
          )}
        </div>
      </div>

      {live && !isBroadcast && (room.status === "drafting" || room.status === "submitting") && (
        <Lobby
          participants={participants}
          deviceId={deviceId}
          ready={ready}
          onReady={() => void toggleReady()}
        />
      )}

      {isBroadcast && live && (room.status === "drafting" || room.status === "submitting") && (
        <div className="card !p-3 mb-3 text-center">
          <p className="font-display font-semibold text-sm">Broadcast lobby</p>
          <p className="text-xs text-muted mt-1">
            {(room.viewerCount ?? 0).toLocaleString()} devices connected · host controls the cards
          </p>
        </div>
      )}

      {(room.status === "drafting" || room.status === "submitting") && (
        <>
          {(isHost || !room.hostOnlyCards) && (
            <CardSubmit room={room} onUpdate={onUpdate} />
          )}
          {isHost && room.cards.length >= 2 && (
            <button
              type="button"
              className="btn-match w-full mt-2"
              onClick={() => void hostStartSwipe()}
            >
              Host: start swiping for everyone →
            </button>
          )}
          {!isHost && room.hostOnlyCards && (
            <WaitScreen
              variant="submit"
              message={
                isBroadcast
                  ? "Host is setting the cards. Swiping opens when they start the room."
                  : "Host is building the card list. Sit tight."
              }
            />
          )}
        </>
      )}

      {room.status === "swiping" && (
        <>
          <SwipeStack
            room={room}
            onUpdate={onUpdate}
            alreadyVotedIds={myVotedIds}
            participantDeviceIds={isBroadcast ? [] : deviceIds}
            votes={votes}
            isHost={isHost && !isBroadcast}
          />
          {isHost && isBroadcast && (
            <button
              type="button"
              className="btn-primary w-full mt-3"
              onClick={() => void hostRevealResults()}
            >
              Host: reveal results →
            </button>
          )}
        </>
      )}

      {room.status === "swiping" && live && !isBroadcast && finished.length > 0 && pending.length > 0 && (
        <p className="text-center text-[10px] text-muted mt-2">
          {finished.length}/{deviceIds.length} devices finished swiping
        </p>
      )}

      {room.status === "completed" && (
        <Results room={room} onBreakTie={(id) => void onBreakTie(id)} />
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
