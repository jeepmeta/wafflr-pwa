"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Room, RoomCard } from "@/lib/rooms";
import { applyVote, completeRoom } from "@/lib/rooms";
import {
  isSupabaseConfigured,
  remoteCompleteIfReady,
  remoteVote,
  type RemoteVote,
} from "@/lib/remote-rooms";
import { WaitScreen } from "./WaitScreen";

interface Props {
  room: Room;
  onUpdate: (room: Room) => void;
  alreadyVotedIds?: string[];
  /** Other phones in the room — used to gate completion. */
  participantDeviceIds?: string[];
  /** Latest vote list for completion check. */
  votes?: RemoteVote[];
  isHost?: boolean;
}

const THRESHOLD = 100;

export function SwipeStack({
  room,
  onUpdate,
  alreadyVotedIds = [],
  participantDeviceIds = [],
  votes = [],
  isHost = true,
}: Props) {
  const cards = room.cards;
  const [index, setIndex] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [flyOut, setFlyOut] = useState<"left" | "right" | null>(null);
  const start = useRef({ x: 0, y: 0 });
  const localVoted = useRef(new Set(alreadyVotedIds));

  useEffect(() => {
    localVoted.current = new Set(alreadyVotedIds);
    const next = cards.findIndex((c) => !localVoted.current.has(c.id));
    setIndex(next === -1 ? cards.length : next);
  }, [alreadyVotedIds, cards]);

  const current = cards[index] as RoomCard | undefined;
  const doneCount = cards.filter((c) => localVoted.current.has(c.id)).length;
  const progress = cards.length ? (doneCount / cards.length) * 100 : 0;

  const commit = useCallback(
    (vote: "yum" | "nah") => {
      if (!current || localVoted.current.has(current.id)) return;
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([10, 30, 20]);
      }
      setFlyOut(vote === "yum" ? "right" : "left");
      setTimeout(() => {
        void (async () => {
          localVoted.current.add(current.id);
          let nextVotes = votes;
          if (isSupabaseConfigured) {
            await remoteVote(room.id, current.id, vote);
            nextVotes = [
              ...votes.filter(
                (v) =>
                  !(v.card_id === current.id && v.device_id === localVoted.current && false)
              ),
            ];
            // Optimistic local vote for completion check
            const { getDeviceId } = await import("@/lib/device");
            nextVotes = [
              ...votes.filter(
                (v) => !(v.card_id === current.id && v.device_id === getDeviceId())
              ),
              { card_id: current.id, device_id: getDeviceId(), vote },
            ];
          }
          const nextRoom = applyVote(room, current.id, vote);
          let nextIndex = index + 1;
          while (nextIndex < cards.length && localVoted.current.has(cards[nextIndex].id)) {
            nextIndex++;
          }
          setFlyOut(null);
          setOffset({ x: 0, y: 0 });

          if (nextIndex >= cards.length) {
            // This device finished — complete room only if everyone is done
            if (isSupabaseConfigured) {
              const cardIds = cards.map((c) => c.id);
              const ids =
                participantDeviceIds.length > 0
                  ? participantDeviceIds
                  : [(await import("@/lib/device")).getDeviceId()];
              const allDone = await remoteCompleteIfReady(
                room.id,
                nextVotes,
                cardIds,
                ids
              );
              if (allDone) {
                onUpdate(completeRoom(nextRoom));
              } else {
                onUpdate(nextRoom); // stay in swiping; WaitScreen shows
              }
            } else {
              onUpdate(completeRoom(nextRoom));
            }
            setIndex(cards.length);
          } else {
            setIndex(nextIndex);
            onUpdate(nextRoom);
          }
        })();
      }, 220);
    },
    [current, room, index, cards, onUpdate, votes, participantDeviceIds]
  );

  function onPointerDown(e: React.PointerEvent) {
    if (flyOut) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setDragging(true);
    start.current = { x: e.clientX, y: e.clientY };
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging || flyOut) return;
    setOffset({
      x: e.clientX - start.current.x,
      y: (e.clientY - start.current.y) * 0.35,
    });
  }

  function onPointerUp() {
    if (!dragging) return;
    setDragging(false);
    if (offset.x > THRESHOLD) commit("yum");
    else if (offset.x < -THRESHOLD) commit("nah");
    else setOffset({ x: 0, y: 0 });
  }

  if (!current) {
    return (
      <WaitScreen
        variant="swipe"
        doneCount={doneCount}
        totalCount={cards.length}
        message={
          isHost
            ? "You finished — waiting on the rest of the room."
            : "You finished — hang tight for everyone else."
        }
      />
    );
  }

  const rot = offset.x * 0.08;
  const flyX = flyOut === "right" ? 480 : flyOut === "left" ? -480 : offset.x;
  const opacity = flyOut ? 0 : 1;

  return (
    <div className="flex flex-col flex-1 w-full max-w-md mx-auto relative">
      <div className="h-2 rounded-full bg-surface border-2 border-obsidian/10 mb-4 overflow-hidden">
        <div className="h-full bg-syrup transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>
      <p className="text-center text-xs text-muted mb-2">
        {Math.min(doneCount + 1, cards.length)} / {cards.length}
      </p>
      <div className="relative flex-1 flex items-center justify-center min-h-[280px]">
        <div
          className="card w-full max-w-sm select-none touch-none cursor-grab active:cursor-grabbing relative z-10"
          style={{
            transform: `translate3d(${flyX}px, ${offset.y}px, 0) rotate(${flyOut ? (flyOut === "right" ? 18 : -18) : rot}deg)`,
            opacity,
            transition: dragging ? "none" : "transform 0.22s ease-out, opacity 0.22s ease-out",
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {offset.x > 40 && !flyOut && (
            <span className="absolute top-4 left-4 font-display font-bold text-match text-2xl rotate-[-12deg] border-4 border-match rounded-lg px-2 py-1">
              YUM
            </span>
          )}
          {offset.x < -40 && !flyOut && (
            <span className="absolute top-4 right-4 font-display font-bold text-berry text-2xl rotate-[12deg] border-4 border-berry rounded-lg px-2 py-1">
              NAH
            </span>
          )}
          <p className="text-[10px] font-semibold text-muted uppercase tracking-wide mb-2">{current.skin}</p>
          <p className="font-display font-bold text-2xl mb-2">{current.name}</p>
          {current.detail && <p className="text-muted text-sm mb-4">{current.detail}</p>}
          <p className="text-xs text-muted text-center mt-6">Swipe or use buttons</p>
        </div>
      </div>
      <div className="flex justify-center gap-6 py-4">
        <button type="button" className="w-14 h-14 rounded-full bg-white border-3 border-obsidian text-berry text-2xl font-bold shadow-[0_3px_0_rgba(15,23,42,0.15)] active:scale-95" onClick={() => commit("nah")} aria-label="Nah">✕</button>
        <button type="button" className="w-14 h-14 rounded-full bg-white border-3 border-obsidian text-match text-2xl font-bold shadow-[0_3px_0_rgba(15,23,42,0.15)] active:scale-95" onClick={() => commit("yum")} aria-label="Yum">✓</button>
      </div>
      <div className="flex justify-center gap-4 pb-2 opacity-80">
        <div className="char-frame" style={{ width: 48, height: 48, backgroundImage: "url(/characters/barron-bacon/idle.svg)", opacity: offset.x < -20 ? 1 : 0.35 }} />
        <div className="char-frame" style={{ width: 48, height: 48, backgroundImage: "url(/characters/strawberry-sue/idle.svg)", opacity: offset.x > 20 ? 1 : 0.35 }} />
      </div>
    </div>
  );
}
