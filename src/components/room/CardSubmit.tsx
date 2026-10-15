"use client";

import { useMemo, useState } from "react";
import type { Room } from "@/lib/rooms";
import { addCard, startSwiping } from "@/lib/rooms";
import { getDeviceId } from "@/lib/device";
import {
  isSupabaseConfigured,
  remoteAddCard,
  remoteSetStatus,
} from "@/lib/remote-rooms";

interface Props {
  room: Room;
  onUpdate: (room: Room) => void;
  /** When false, hide host-only start-swipe control (parent may own it). */
  showStartSwipe?: boolean;
}

export function CardSubmit({ room, onUpdate, showStartSwipe = false }: Props) {
  const [name, setName] = useState("");
  const [detail, setDetail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const deviceId = useMemo(() => getDeviceId(), []);

  const myCardCount = room.cards.filter((c) => c.authorDeviceId === deviceId).length;
  const limit = room.hostOnlyCards ? Infinity : room.maxCardsPerJoiner;
  const atLimit = myCardCount >= limit;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || busy) return;
    if (atLimit) {
      setError(`You can add up to ${room.maxCardsPerJoiner} card${room.maxCardsPerJoiner === 1 ? "" : "s"}.`);
      return;
    }
    setBusy(true);
    try {
      if (isSupabaseConfigured) {
        const card = await remoteAddCard(room.id, name, detail);
        if (card) {
          onUpdate({
            ...room,
            status: room.status === "drafting" ? "submitting" : room.status,
            cards: [...room.cards, { ...card, authorDeviceId: deviceId }],
          });
          setName("");
          setDetail("");
          if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate(10);
          }
          return;
        }
        setError("Couldn’t save card to the live room. Try again.");
        return;
      }
      const next = addCard(room, name, detail, deviceId);
      onUpdate(next);
      setName("");
      setDetail("");
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(10);
      }
    } finally {
      setBusy(false);
    }
  }

  async function goSwipe() {
    if (room.cards.length < 2) return;
    setError(null);
    if (isSupabaseConfigured) {
      const ok = await remoteSetStatus(room.id, "swiping");
      if (!ok) {
        setError("Couldn’t start swiping on the server. Check connection.");
        return;
      }
    }
    const next = startSwiping(room);
    onUpdate(next);
  }

  return (
    <div className="flex flex-col flex-1 w-full max-w-md mx-auto">
      <div
        className="char-frame mx-auto mb-3"
        style={{
          width: 120,
          height: 120,
          backgroundImage: "url(/characters/strawberry-sue/idle.svg)",
        }}
      />
      <h2 className="font-display font-bold text-xl text-center mb-1">Add options</h2>
      <p className="text-muted text-sm text-center mb-4">
        {room.cards.length} card{room.cards.length === 1 ? "" : "s"} in the pool
        {!room.hostOnlyCards && (
          <span className="block text-xs mt-1">
            Your cards: {myCardCount}/{room.maxCardsPerJoiner}
          </span>
        )}
      </p>

      {room.cards.length > 0 && (
        <ul className="flex flex-col gap-2 mb-4 list-none p-0 m-0 max-h-36 overflow-y-auto">
          {room.cards.map((c) => (
            <li key={c.id} className="card p-3! border-2! flex justify-between gap-2">
              <div>
                <p className="font-semibold text-sm">{c.name}</p>
                {c.detail && <p className="text-xs text-muted">{c.detail}</p>}
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface border border-obsidian/20 self-start whitespace-nowrap">
                {c.skin}
              </span>
            </li>
          ))}
        </ul>
      )}

      {atLimit ? (
        <p className="text-sm text-center text-muted mb-4">
          You’ve hit your card limit for this room.
        </p>
      ) : (
        <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-2 mb-4">
          <label className="sr-only" htmlFor="card-name">
            Option name
          </label>
          <input
            id="card-name"
            className="input-lg"
            placeholder="Name (e.g. Luigi&apos;s Pizzeria)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            autoComplete="off"
          />
          <label className="sr-only" htmlFor="card-detail">
            Optional detail
          </label>
          <input
            id="card-detail"
            className="input-lg"
            placeholder="Detail (optional)"
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            maxLength={80}
            autoComplete="off"
          />
          <button type="submit" className="btn-primary w-full" disabled={busy || !name.trim()}>
            {busy ? "Adding…" : "Add card"}
          </button>
        </form>
      )}

      {error && <p className="text-sm text-berry text-center mb-3">{error}</p>}

      {showStartSwipe && room.cards.length >= 2 && (
        <button type="button" className="btn-match w-full" onClick={() => void goSwipe()}>
          Start swiping →
        </button>
      )}
    </div>
  );
}
