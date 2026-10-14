"use client";

import Link from "next/link";
import { useState } from "react";
import { QrCode } from "@/components/room/QrCode";
import { CATEGORIES } from "@/lib/categories";
import { createRoomDraft, upsertRoom, type RoomCategory } from "@/lib/rooms";
import { isSupabaseConfigured, remoteCreateRoom } from "@/lib/remote-rooms";

type Step = "type" | "custom" | "cards" | "share";

export default function CreatePage() {
  const [step, setStep] = useState<Step>("type");
  const [category, setCategory] = useState<RoomCategory | null>(null);
  const [title, setTitle] = useState("");
  const [hostOnly, setHostOnly] = useState(true);
  const [maxCards, setMaxCards] = useState<1 | 2 | 3>(2);
  const [code, setCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [online, setOnline] = useState(false);

  function pickCategory(id: RoomCategory) {
    setCategory(id);
    if (id === "custom") setStep("custom");
    else {
      setTitle("");
      setStep("cards");
    }
  }

  function finishCustom() {
    if (!title.trim()) return;
    setStep("cards");
  }

  async function createRoom() {
    if (!category || creating) return;
    setCreating(true);
    try {
      let room = null;
      if (isSupabaseConfigured) {
        room = await remoteCreateRoom({
          category,
          title,
          hostOnlyCards: hostOnly,
          maxCardsPerJoiner: maxCards,
        });
        setOnline(Boolean(room));
      }
      if (!room) {
        room = createRoomDraft(category, title, hostOnly, maxCards);
        upsertRoom(room);
        setOnline(false);
      } else {
        upsertRoom(room);
      }
      setCode(room.code);
      setStep("share");
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([10, 30, 20]);
      }
    } finally {
      setCreating(false);
    }
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      /* ignore */
    }
  }

  const joinUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/join?code=${code}`
      : `/join?code=${code}`;

  async function shareRoom() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join my Wafflr room",
          text: `Code: ${code}`,
          url: joinUrl,
        });
      } catch {
        /* cancelled */
      }
    } else {
      await copyCode();
    }
  }

  return (
    <div className="flex flex-col flex-1 screen-pad py-4 overflow-y-auto">
      {step === "type" && (
        <>
          <h1 className="font-display font-bold text-2xl mb-1">Create Room</h1>
          <p className="text-muted text-sm mb-6">What are we deciding?</p>
          <div className="grid grid-cols-2 gap-3">
            {CATEGORIES.map((c) => (
              <button key={c.id} type="button" className="tile" onClick={() => pickCategory(c.id)}>
                <span className="text-3xl block mb-2">{c.emoji}</span>
                <span className="font-display font-semibold block">{c.label}</span>
                <span className="text-xs text-muted">{c.description}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {step === "custom" && (
        <>
          <button type="button" className="btn-ghost self-start mb-4" onClick={() => setStep("type")}>
            ← Back
          </button>
          <h1 className="font-display font-bold text-2xl mb-1">What are we deciding?</h1>
          <input
            className="input-lg mb-3"
            autoFocus
            placeholder="Who is the GOAT?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
          />
          <div className="flex flex-wrap gap-2 mb-6">
            {["Where for dinner?", "What movie?", "Who drives?", "Beach or mountains?"].map((s) => (
              <button key={s} type="button" className="chip" onClick={() => setTitle(s)}>
                {s}
              </button>
            ))}
          </div>
          <button type="button" className="btn-primary w-full" disabled={!title.trim()} onClick={finishCustom}>
            Next →
          </button>
        </>
      )}

      {step === "cards" && (
        <>
          <button
            type="button"
            className="btn-ghost self-start mb-4"
            onClick={() => setStep(category === "custom" ? "custom" : "type")}
          >
            ← Back
          </button>
          <h1 className="font-display font-bold text-2xl mb-1">Card setup</h1>
          <p className="text-muted text-sm mb-6">Who adds the options?</p>
          <div className="flex flex-col gap-3 mb-6">
            <button
              type="button"
              className={`tile text-left ${hostOnly ? "ring-2 ring-syrup" : ""}`}
              onClick={() => setHostOnly(true)}
            >
              <span className="font-display font-semibold">I'll make all the cards</span>
              <span className="block text-xs text-muted mt-1">You build the full list</span>
            </button>
            <button
              type="button"
              className={`tile text-left ${!hostOnly ? "ring-2 ring-syrup" : ""}`}
              onClick={() => setHostOnly(false)}
            >
              <span className="font-display font-semibold">Let everyone add cards</span>
              <span className="block text-xs text-muted mt-1">Joiners contribute options</span>
            </button>
          </div>
          {!hostOnly && (
            <div className="mb-6">
              <p className="text-sm font-semibold mb-2">Cards per joiner</p>
              <div className="flex gap-2">
                {([1, 2, 3] as const).map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`pill flex-1 justify-center ${maxCards === n ? "bg-butter" : ""}`}
                    onClick={() => setMaxCards(n)}
                  >
                    Up to {n}
                  </button>
                ))}
              </div>
            </div>
          )}
          <button type="button" className="btn-match w-full" disabled={creating} onClick={createRoom}>
            {creating ? "Creating…" : "Create Room!"}
          </button>
        </>
      )}

      {step === "share" && (
        <>
          <h1 className="font-display font-bold text-2xl mb-1 text-center">Room ready</h1>
          <p className="text-muted text-sm mb-2 text-center">
            {online ? "Live multiplayer room" : "Local room (offline / no Supabase)"}
          </p>
          <div className="card text-center mb-4">
            <p className="room-code">{code.split("").join(" ")}</p>
            <button type="button" className="btn-ghost mt-3" onClick={copyCode}>
              Copy code
            </button>
          </div>
          <div className="flex justify-center mb-4">
            <QrCode value={joinUrl} size={160} label="Scan to join" />
          </div>
          <button type="button" className="btn-primary w-full mb-3" onClick={shareRoom}>
            Share link
          </button>
          <Link href={`/room/${code}`} className="btn-match no-underline w-full text-center">
            Enter Room
          </Link>
        </>
      )}
    </div>
  );
}
