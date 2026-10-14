/** Room types aligned with wafflr-spec.md lifecycle */

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
}

export const ROOM_LIFETIME_MS = 2 * 60 * 60 * 1000;
export const PURGE_AFTER_MS = 60 * 60 * 1000;

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

export function createRoomDraft(
  category: RoomCategory,
  title: string,
  hostOnlyCards: boolean,
  maxCardsPerJoiner: 1 | 2 | 3 = 2
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
  };
}

const STORAGE_KEY = "wafflr_rooms_v1";

export function loadRooms(): Room[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const rooms = JSON.parse(raw) as Room[];
    const now = Date.now();
    return rooms
      .map((r) => {
        if (now >= r.expiresAt && r.status !== "expired") {
          return { ...r, status: "expired" as const };
        }
        return r;
      })
      .filter((r) => now < r.expiresAt + PURGE_AFTER_MS);
  } catch {
    return [];
  }
}

export function saveRooms(rooms: Room[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
}

export function upsertRoom(room: Room) {
  const rooms = loadRooms().filter((r) => r.id !== room.id);
  rooms.unshift(room);
  saveRooms(rooms);
}

export function getRoomByCode(code: string): Room | undefined {
  return loadRooms().find(
    (r) => r.code.toUpperCase() === code.toUpperCase() && r.status !== "expired"
  );
}

export function remainingMs(room: Room): number {
  return Math.max(0, room.expiresAt - Date.now());
}

export function formatRemaining(ms: number): string {
  const m = Math.floor(ms / 60000);
  if (m >= 60) return `${Math.floor(m / 60)}h ${m % 60}m`;
  return `${m}m`;
}

export function addCard(room: Room, name: string, detail?: string): Room {
  const card: RoomCard = {
    id: crypto.randomUUID(),
    name: name.trim(),
    detail: detail?.trim() || undefined,
    skin: pickSkin(name, detail),
    yum: 0,
    nah: 0,
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
