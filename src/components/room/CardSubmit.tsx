"use client";

import { useState } from "react";
import type { Room } from "@/lib/rooms";
import { addCard, startSwiping } from "@/lib/rooms";

interface Props {
  room: Room;
  onUpdate: (room: Room) => void;
}

export function CardSubmit({ room, onUpdate }: Props) {
  const [name, setName] = useState("");
  const [detail, setDetail] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const next = addCard(room, name, detail);
    onUpdate(next);
    setName("");
    setDetail("");
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }
  }

  function goSwipe() {
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
      </p>

      {room.cards.length > 0 && (
        <ul className="flex flex-col gap-2 mb-4 list-none p-0 m-0 max-h-36 overflow-y-auto">
          {room.cards.map((c) => (
            <li key={c.id} className="card !p-3 !border-2 flex justify-between gap-2">
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

      <form onSubmit={submit} className="flex flex-col gap-2 mb-4">
        <input
          className="input-lg"
          placeholder="Name (e.g. Luigi's Pizzeria)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          autoFocus
        />
        <input
          className="input-lg !min-h-12"
          placeholder="Detail (optional)"
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          maxLength={80}
        />
        <button type="submit" className="btn-primary w-full" disabled={!name.trim()}>
          Add card
        </button>
      </form>

      <button
        type="button"
        className="btn-match w-full"
        disabled={room.cards.length < 2}
        onClick={goSwipe}
      >
        {room.cards.length < 2 ? "Need at least 2 cards" : "Start swiping →"}
      </button>
    </div>
  );
}
