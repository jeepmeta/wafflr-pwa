/**
 * Offline helpers — connectivity, last room snapshot, vote queue.
 * Votes queue while offline and flush when back online.
 */

import type { Room } from "./rooms";

const SNAPSHOT_KEY = "wafflr_last_room_snapshot_v1";
const VOTE_QUEUE_KEY = "wafflr_vote_queue_v1";

export type QueuedVote = {
  roomId: string;
  cardId: string;
  vote: "yum" | "nah";
  queuedAt: number;
};

export function isOnline(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}

export function saveRoomSnapshot(room: Room) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      SNAPSHOT_KEY,
      JSON.stringify({ room, savedAt: Date.now() })
    );
  } catch {
    /* quota */
  }
}

export function loadRoomSnapshot(): { room: Room; savedAt: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { room: Room; savedAt: number };
  } catch {
    return null;
  }
}

export function getRoomSnapshotByCode(code: string): Room | null {
  const snap = loadRoomSnapshot();
  if (!snap) return null;
  if (snap.room.code.toUpperCase() !== code.toUpperCase()) return null;
  return snap.room;
}

function readQueue(): QueuedVote[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(VOTE_QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as QueuedVote[];
  } catch {
    return [];
  }
}

function writeQueue(q: QueuedVote[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(VOTE_QUEUE_KEY, JSON.stringify(q));
  } catch {
    /* ignore */
  }
}

export function enqueueVote(roomId: string, cardId: string, vote: "yum" | "nah") {
  const q = readQueue().filter(
    (v) => !(v.roomId === roomId && v.cardId === cardId)
  );
  q.push({ roomId, cardId, vote, queuedAt: Date.now() });
  writeQueue(q);
}

export function peekVoteQueue(): QueuedVote[] {
  return readQueue();
}

export function clearVoteQueue() {
  writeQueue([]);
}

/**
 * Attempt remote vote; on failure / offline, queue locally.
 * `remoteVoteFn` injected to avoid circular imports.
 */
export async function voteWithOfflineQueue(
  roomId: string,
  cardId: string,
  vote: "yum" | "nah",
  remoteVoteFn: (roomId: string, cardId: string, vote: "yum" | "nah") => Promise<void>
): Promise<{ queued: boolean }> {
  if (!isOnline()) {
    enqueueVote(roomId, cardId, vote);
    return { queued: true };
  }
  try {
    await remoteVoteFn(roomId, cardId, vote);
    return { queued: false };
  } catch {
    enqueueVote(roomId, cardId, vote);
    return { queued: true };
  }
}

/** Flush queued votes when connectivity returns. */
export async function flushVoteQueue(
  remoteVoteFn: (roomId: string, cardId: string, vote: "yum" | "nah") => Promise<void>
): Promise<number> {
  const q = readQueue();
  if (!q.length || !isOnline()) return 0;
  const remaining: QueuedVote[] = [];
  let sent = 0;
  for (const item of q) {
    try {
      await remoteVoteFn(item.roomId, item.cardId, item.vote);
      sent++;
    } catch {
      remaining.push(item);
    }
  }
  writeQueue(remaining);
  return sent;
}
