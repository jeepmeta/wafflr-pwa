"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { getRoomByCode, upsertRoom } from "@/lib/rooms";
import { isSupabaseConfigured, remoteJoinRoom } from "@/lib/remote-rooms";

function JoinForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const q = search.get("code");
    if (q) setCode(q.toUpperCase().slice(0, 6));
  }, [search]);

  async function tryJoin(raw: string) {
    const c = raw.trim().toUpperCase();
    if (c.length < 6) return;
    setBusy(true);
    setError(false);
    try {
      if (isSupabaseConfigured) {
        const remote = await remoteJoinRoom(c);
        if (remote) {
          upsertRoom(remote, "joiner");
          router.push(`/room/${remote.code}`);
          return;
        }
      }
      const local = getRoomByCode(c);
      if (local && local.status !== "expired") {
        upsertRoom(local, "joiner");
        router.push(`/room/${local.code}`);
        return;
      }
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    void tryJoin(code);
  }

  useEffect(() => {
    const q = search.get("code");
    if (q && q.length >= 6) {
      void tryJoin(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 text-center">
        <div
          className="char-frame mb-4"
          style={{ backgroundImage: "url(/characters/barron-bacon/error.svg)" }}
        />
        <h1 className="font-display font-bold text-xl mb-2">Oops!</h1>
        <p className="text-muted text-sm mb-6 max-w-xs">
          That room code expired or doesn&apos;t exist.
        </p>
        <button type="button" className="btn-ghost mb-3" onClick={() => setError(false)}>
          Try again
        </button>
        <Link href="/" className="btn-primary no-underline">
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col flex-1">
      <h1 className="font-display font-bold text-2xl mb-1">Join Room</h1>
      <p className="text-muted text-sm mb-6">Enter the 6-character code or scan a QR</p>
      <input
        className="input-lg text-center room-code tracking-[0.3em] uppercase mb-6"
        value={code}
        onChange={(e) =>
          setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))
        }
        placeholder="WAFFL8"
        autoFocus
        autoCapitalize="characters"
        maxLength={6}
        inputMode="text"
      />
      <button type="submit" className="btn-primary w-full" disabled={code.length < 6 || busy}>
        {busy ? "Joining…" : "Join"}
      </button>
    </form>
  );
}

export default function JoinPage() {
  return (
    <div className="flex flex-col flex-1 screen-pad py-4">
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <JoinForm />
      </Suspense>
    </div>
  );
}
