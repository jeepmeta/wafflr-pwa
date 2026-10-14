"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { getRoomByCode } from "@/lib/rooms";

function JoinForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    const q = search.get("code");
    if (q) setCode(q.toUpperCase().slice(0, 6));
  }, [search]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const room = getRoomByCode(code.trim());
    if (!room) {
      setError(true);
      return;
    }
    setError(false);
    router.push(`/room/${room.code}`);
  }

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
      <p className="text-muted text-sm mb-6">Enter the 6-character code</p>
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
      <button type="submit" className="btn-primary w-full" disabled={code.length < 6}>
        Join
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
