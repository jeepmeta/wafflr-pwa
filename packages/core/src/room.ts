/**
 * Shared room model — identical across web, PWA, and native.
 */

import type { GameMode, ModePayload } from "./modes";
import { createModePayload, isGameMode } from "./modes";

export const ROOM_LIFETIME_MS = 2 * 60 * 60 * 1000;
export const PURGE_AFTER_MS = 60 * 60 * 1000;

export const ROOM_STATUSES = [
  "drafting",
  "submitting",
  "playing",
  "completed",
  "expired",
] as const;

export type RoomStatus = (typeof ROOM_STATUSES)[number];

/** @deprecated Prefer "playing"; kept for swipe UI mapping */
export type LegacySwipeStatus =
  | "drafting"
  | "submitting"
  | "swiping"
  | "completed"
  | "expired";

export type RoomCategory = "eat" | "watch" | "do" | "custom";

export type RoomParticipant = {
  /** Stable anonymous id: deviceId or deviceId:roomId */
  participantId: string;
  deviceId: string;
  displayName: string;
  isHost: boolean;
  joinedAt: number;
};

export type WafflrRoom = {
  id: string;
  code: string;
  title: string;
  category: RoomCategory;
  status: RoomStatus;
  createdAt: number;
  expiresAt: number;
  hostDeviceId: string;
  isBroadcast: boolean;
  viewerCount: number;
  /** Active game mode + mode-specific payload */
  mode: GameMode;
  payload: ModePayload;
  participants: RoomParticipant[];
};

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateRoomCode(length = 6): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

export function createRoom(input: {
  title: string;
  category?: RoomCategory;
  hostDeviceId: string;
  hostDisplayName?: string;
  mode?: GameMode;
  isBroadcast?: boolean;
}): WafflrRoom {
  const now = Date.now();
  const mode = input.mode && isGameMode(input.mode) ? input.mode : "swipe";
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `room-${now}`;
  const host: RoomParticipant = {
    participantId: `${input.hostDeviceId}:${id}`,
    deviceId: input.hostDeviceId,
    displayName: input.hostDisplayName || "Host",
    isHost: true,
    joinedAt: now,
  };
  return {
    id,
    code: generateRoomCode(),
    title: input.title || "Wafflr room",
    category: input.category || "custom",
    status: "drafting",
    createdAt: now,
    expiresAt: now + ROOM_LIFETIME_MS,
    hostDeviceId: input.hostDeviceId,
    isBroadcast: Boolean(input.isBroadcast),
    viewerCount: 1,
    mode,
    payload: createModePayload(mode),
    participants: [host],
  };
}

export function remainingMs(room: Pick<WafflrRoom, "expiresAt">): number {
  return Math.max(0, room.expiresAt - Date.now());
}

export function isExpired(room: Pick<WafflrRoom, "expiresAt" | "status">): boolean {
  return room.status === "expired" || Date.now() >= room.expiresAt;
}

/** Map legacy swipe status strings ↔ shared RoomStatus */
export function toLegacySwipeStatus(status: RoomStatus): LegacySwipeStatus {
  if (status === "playing") return "swiping";
  return status;
}

export function fromLegacySwipeStatus(status: string): RoomStatus {
  if (status === "swiping" || status === "active") return "playing";
  if (status === "lobby") return "drafting";
  if (status === "revealing") return "submitting";
  if ((ROOM_STATUSES as readonly string[]).includes(status)) {
    return status as RoomStatus;
  }
  return "drafting";
}
