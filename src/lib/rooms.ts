/** Room types aligned with wafflr-spec.md lifecycle */

import { rememberRoom, touchJoined } from "./joined";

export type RoomStatus =
  | "drafting"
  | "submitting"
  | "swiping"
  | "completed"
  | "expired";

export type RoomCategory = "eat" | "watch" | "do" | "custom";

export interface RoomCard {
  id: string;
  name: string;
  detail?: string;
  skin?: string;
  yum: number;
  nah: number;
  /** Device that submitted this card (for maxCardsPerJoiner). */
  authorDeviceId?: string;
}

export interface Room {
  id: string;
  code: string;
  title: string;
  category: RoomCategory;
  status: RoomStatus;
  createdAt: number;
  expiresAt: number;
  hostOnlyCards: boolean;
  maxCardsPerJoiner: 1 | 2 | 3;
  cards: RoomCard[];
  participantIds: string[];
  isBroadcast?: boolean;
  viewerCount?: number;
}

export const ROOM_LIFETIME_MS = 2 * 60 * 60 * 1000;
export const PURGE_AFTER_MS = 60 * 60 * 1000;

const STATUSES: RoomStatus[] = [
  "drafting",
  "submitting",
  "swiping",
  "completed",
  "expired",
];
const CATEGORIES: RoomCategory[] = ["eat", "watch", "do", "custom"];

export function generateCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

const SKINS = [
  "Neon Night",
  "Retro Diner",
  "Cinema Dark",
  "Pastel Casual",
  "Syrup Gold",
  "Berry Pop",
] as const;

export function pickSkin(name: string, detail?: string): string {
  const key = (name + (detail || "")).toLowerCase();
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h + key.charCodeAt(i) * (i + 1)) % SKINS.length;
  return SKINS[h];
}

function asStatus(v: unknown): RoomStatus {
  return STATUSES.includes(v as RoomStatus) ? (v as RoomStatus) : "drafting";
}

function asCategory(v: unknown): RoomCategory {
  return CATEGORIES.includes(v as RoomCategory) ? (v as RoomCategory) : "custom";
}

function asMaxCards(v: unknown): 1 | 2 | 3 {
  const n = Number(v);
  if (n === 1 || n === 2 || n === 3) return n;
  return 2;
}

/** Normalize unknown JSON into a Room; returns null if unusable. */
export function normalizeRoom(raw: unknown): Room | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== "string" || typeof r.code !== "string") return null;
  const cardsIn = Array.isArray(r.cards) ? r.cards : [];
  const cards: RoomCard[] = cardsIn
    .map((c) => {
      if (!c || typeof c !== "object") return null;
      const card = c as Record<string, unknown>;
      if (typeof card.id !== "string" || typeof card.name !== "string") return null;
      return {
        id: card.id,
        name: String(card.name).slice(0, 80),
        detail: typeof card.detail === "string" ? card.detail.slice(0, 120) : undefined,
        skin: typeof card.skin === "string" ? card.skin : pickSkin(String(card.name)),
        yum: Math.max(0, Number(card.yum) || 0),
        nah: Math.max(0, Number(card.nah) || 0),
        authorDeviceId:
          typeof card.authorDeviceId === "string" ? card.authorDeviceId : undefined,
      } satisfies RoomCard;
    })
    .filter(Boolean) as RoomCard[];

  const now = Date.now();
  const createdAt = Number(r.createdAt) || now;
  const expiresAt = Number(r.expiresAt) || createdAt + ROOM_LIFETIME_MS;

  return {
    id: r.id,
    code: String(r.code).toUpperCase().slice(0, 8),
    title: typeof r.title === "string" ? r.title.slice(0, 80) : "Wafflr room",
    category: asCategory(r.category),
    status: asStatus(r.status),
    createdAt,
    expiresAt,
    hostOnlyCards: Boolean(r.hostOnlyCards ?? true),
    maxCardsPerJoiner: asMaxCards(r.maxCardsPerJoiner),
    cards,
    participantIds: Array.isArray(r.participantIds)
      ? (r.participantIds as unknown[]).filter((x) => typeof x === "string") as string[]
      : [],
    isBroadcast: Boolean(r.isBroadcast),
    viewerCount: Math.max(0, Number(r.viewerCount) || 0),
  };
}

export function createRoomDraft(
  category: RoomCategory,
  title: string,
  hostOnlyCards: boolean,
  maxCardsPerJoiner: 1 | 2 | 3 = 2,
  isBroadcast = false
): Room {
  const now = Date.now();
  const code = generateCode();
  return {
    id: crypto.randomUUID(),
    code,
    title:
      title ||
      (category === "eat"
        ? "Where to eat"
        : category === "watch"
          ? "What to watch"
          : category === "do"
            ? "What to do"
            : "Custom pick"),
    category,
    status: "drafting",
    createdAt: now,
    expiresAt: now + ROOM_LIFETIME_MS,
    hostOnlyCards,
    maxCardsPerJoiner,
    cards: [],
    participantIds: [],
    isBroadcast,
    viewerCount: 1,
  };
}

const STORAGE_KEY = "wafflr_rooms_v1";

export function loadRooms(): Room[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const now = Date.now();
    return parsed
      .map(normalizeRoom)
      .filter((r): r is Room => r !== null)
      .map((r) =>
        now >= r.expiresAt && r.status !== "expired" ? { ...r, status: "expired" as const } : r
      )
      .filter((r) => now < r.expiresAt + PURGE_AFTER_MS);
  } catch {
    return [];
  }
}

export function saveRooms(rooms: Room[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
  } catch {
    /* quota / private mode */
  }
}

export function upsertRoom(room: Room, role?: "host" | "joiner") {
  const rooms = loadRooms().filter((r) => r.id !== room.id && r.code !== room.code);
  rooms.unshift(room);
  saveRooms(rooms);
  if (role) {
    rememberRoom(room, role);
  } else {
    touchJoined(room.code, {
      title: room.title,
      status: room.status,
      expiresAt: room.expiresAt,
      roomId: room.id,
    });
  }
}

export function getRoomByCode(code: string): Room | undefined {
  return loadRooms().find((r) => r.code.toUpperCase() === code.toUpperCase());
}

export function remainingMs(room: { expiresAt: number }): number {
  return Math.max(0, room.expiresAt - Date.now());
}

export function formatRemaining(ms: number): string {
  const m = Math.floor(ms / 60000);
  if (m >= 60) return `${Math.floor(m / 60)}h ${m % 60}m`;
  return `${m}m`;
}

export function addCard(
  room: Room,
  name: string,
  detail?: string,
  authorDeviceId?: string
): Room {
  if (!room.hostOnlyCards && authorDeviceId) {
    const mine = room.cards.filter((c) => c.authorDeviceId === authorDeviceId).length;
    if (mine >= room.maxCardsPerJoiner) return room;
  }
  const card: RoomCard = {
    id: crypto.randomUUID(),
    name: name.trim(),
    detail: detail?.trim() || undefined,
    skin: pickSkin(name, detail),
    yum: 0,
    nah: 0,
    authorDeviceId,
  };
  const next: Room = {
    ...room,
    status: room.status === "drafting" ? "submitting" : room.status,
    cards: [...room.cards, card],
  };
  upsertRoom(next);
  return next;
}

export function startSwiping(room: Room): Room {
  if (room.cards.length < 2) return room;
  const next: Room = { ...room, status: "swiping" };
  upsertRoom(next);
  return next;
}

export function applyVote(room: Room, cardId: string, vote: "yum" | "nah"): Room {
  const cards = room.cards.map((c) => {
    if (c.id !== cardId) return c;
    return vote === "yum" ? { ...c, yum: c.yum + 1 } : { ...c, nah: c.nah + 1 };
  });
  const next: Room = { ...room, cards };
  upsertRoom(next);
  return next;
}

export function completeRoom(room: Room): Room {
  const next: Room = { ...room, status: "completed" };
  upsertRoom(next);
  return next;
}

export function rankedCards(room: Room): RoomCard[] {
  return [...room.cards].sort((a, b) => {
    const scoreA = a.yum - a.nah;
    const scoreB = b.yum - b.nah;
    if (scoreB !== scoreA) return scoreB - scoreA;
    if (b.yum !== a.yum) return b.yum - a.yum;
    return a.name.localeCompare(b.name);
  });
}

export function isTieTop(room: Room): boolean {
  const ranked = rankedCards(room);
  if (ranked.length < 2) return false;
  const s0 = ranked[0].yum - ranked[0].nah;
  const s1 = ranked[1].yum - ranked[1].nah;
  return s0 === s1 && ranked[0].yum === ranked[1].yum;
}
