"use client";

import { useEffect, useState } from "react";
import { flushVoteQueue, isOnline, peekVoteQueue } from "@/lib/offline";
import { isSupabaseConfigured, remoteVote } from "@/lib/remote-rooms";

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  const [queued, setQueued] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    function refresh() {
      setOffline(!isOnline());
      setQueued(peekVoteQueue().length);
    }
    refresh();
    window.addEventListener("online", refresh);
    window.addEventListener("offline", refresh);
    return () => {
      window.removeEventListener("online", refresh);
      window.removeEventListener("offline", refresh);
    };
  }, []);

  useEffect(() => {
    async function onOnline() {
      setOffline(false);
      if (!isSupabaseConfigured) return;
      const pending = peekVoteQueue().length;
      if (!pending) return;
      setSyncing(true);
      try {
        const n = await flushVoteQueue(remoteVote);
        setQueued(peekVoteQueue().length);
        if (n > 0) {
          setFlash(`Synced ${n} vote${n === 1 ? "" : "s"}`);
          setTimeout(() => setFlash(null), 2500);
        }
      } finally {
        setSyncing(false);
      }
    }
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, []);

  if (!offline && !flash && !syncing) return null;

  return (
    <div className="fixed top-15 inset-x-0 z-30 flex justify-center pointer-events-none px-3">
      <div
        className={`pointer-events-auto text-xs font-semibold px-3 py-1.5 rounded-full border-2 border-obsidian shadow-sm ${
          offline ? "bg-berry text-white" : "bg-match text-white"
        }`}
      >
        {offline
          ? queued > 0
            ? `Offline · ${queued} vote${queued === 1 ? "" : "s"} queued`
            : "You're offline · shell still works"
          : syncing
            ? "Syncing votes…"
            : flash}
      </div>
    </div>
  );
}
