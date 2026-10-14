/**
 * Device-local registry of rooms this phone created or joined.
 * No accounts — identity is getDeviceId() only.
 * Entries live until expiresAt + PURGE_AFTER_MS, then drop.
 */

import type { Room, RoomStatus } from "./rooms";
import { PURGE_AFTER_MS } from "./rooms";

export type RoomRole = "host" | "joiner";

export interface JoinedEntry {
  code: string;
  roomId: string;
  role: RoomRole;
  title: string;
  status: RoomStatus;
  expiresAt: number;
  joinedAt: number;
  lastSeenAt: number;
}

const KEY = "wafflr_joined_v1";

function read(): JoinedEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as JoinedEntry[];
  } catch {
    return [];
  }
}

function write(entries: JoinedEntry[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(entries));
}

/** Drop entries past purge window. */
export function purgeJoined(): JoinedEntry[] {
  const now = Date.now();
  const kept = read().filter((e) => now < e.expiresAt + PURGE_AFTER_MS);
  write(kept);
  return kept;
}

export function loadJoined(): JoinedEntry[] {
  return purgeJoined().sort((a, b) => b.lastSeenAt - a.lastSeenAt);
}

/** Remember a room this device hosted or joined. */
export function rememberRoom(room: Room, role: RoomRole) {
  const now = Date.now();
  const entries = purgeJoined().filter(
    (e) => e.code.toUpperCase() !== room.code.toUpperCase()
  );
  entries.unshift({
    code: room.code.toUpperCase(),
    roomId: room.id,
    role,
    title: room.title,
    status: room.status,
    expiresAt: room.expiresAt,
    joinedAt: now,
    lastSeenAt: now,
  });
  write(entries);
}

/** Patch status/title/expiry after a live fetch or local update. */
export function touchJoined(
  code: string,
  patch: Partial<Pick<JoinedEntry, "title" | "status" | "expiresAt" | "roomId">>
) {
  const upper = code.toUpperCase();
  const entries = purgeJoined().map((e) =>
    e.code === upper
      ? { ...e, ...patch, lastSeenAt: Date.now() }
      : e
  );
  write(entries);
}

export function getJoinedEntry(code: string): JoinedEntry | undefined {
  return loadJoined().find((e) => e.code === code.toUpperCase());
}

export function joinedCountActive(): number {
  const now = Date.now();
  return loadJoined().filter((e) => now < e.expiresAt && e.status !== "expired").length;
}
