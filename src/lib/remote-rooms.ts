/**
 * Multiplayer over existing Wafflr Supabase schema:
 * - public.rooms (code, mode, status, settings, item_payload, state, expires_at)
 * - public.participants (room_id, display_name, is_host, is_ready, …)
 *
 * Cards live in rooms.item_payload (json array).
 * Votes live in rooms.state.votes (json map).
 */

import type { RealtimeChannel } from "@supabase/supabase-js";
import { getDeviceId, getDisplayName } from "./device";
import { getSupabase, isSupabaseConfigured } from "./supabase";
import type { Room, RoomCard, RoomCategory, RoomStatus } from "./rooms";
import { generateCode, pickSkin, ROOM_LIFETIME_MS } from "./rooms";

export type Participant = {
  id: string;
  room_id: string;
  device_id: string;
  display_name: string;
  ready: boolean;
  joined_at: string;
};

export type RemoteVote = {
  card_id: string;
  device_id: string;
  vote: "yum" | "nah";
};

type DbRoom = {
  id: string;
  code: string;
  mode: string;
  status: string;
  settings: Record<string, unknown>;
  item_payload: RoomCard[];
  state: {
    title?: string;
    category?: RoomCategory;
    host_device_id?: string;
    votes?: RemoteVote[];
  };
  created_at: string;
  expires_at: string | null;
};

type DbParticipant = {
  id: string;
  room_id: string;
  display_name: string;
  is_host: boolean;
  is_ready: boolean;
  joined_at: string;
  user_id: string | null;
};

function mapStatus(s: string): RoomStatus {
  if (s === "lobby") return "drafting";
  if (s === "active") return "swiping";
  if (s === "revealing") return "submitting";
  if (s === "completed") return "completed";
  if (s === "expired") return "expired";
  return "drafting";
}

function toDbStatus(s: RoomStatus): string {
  if (s === "drafting" || s === "submitting") return s === "submitting" ? "revealing" : "lobby";
  if (s === "swiping") return "active";
  if (s === "completed") return "completed";
  return "expired";
}

function tallyCards(cards: RoomCard[], votes: RemoteVote[]): RoomCard[] {
  return cards.map((c) => ({
    ...c,
    yum: votes.filter((v) => v.card_id === c.id && v.vote === "yum").length,
    nah: votes.filter((v) => v.card_id === c.id && v.vote === "nah").length,
  }));
}

function toRoom(r: DbRoom): Room {
  const votes = r.state?.votes || [];
  const cards = tallyCards(Array.isArray(r.item_payload) ? r.item_payload : [], votes);
  const settings = r.settings || {};
  return {
    id: r.id,
    code: r.code,
    title: r.state?.title || "Wafflr room",
    category: r.state?.category || "custom",
    status: mapStatus(r.status),
    createdAt: new Date(r.created_at).getTime(),
    expiresAt: r.expires_at
      ? new Date(r.expires_at).getTime()
      : Date.now() + ROOM_LIFETIME_MS,
    hostOnlyCards: Boolean(settings.host_only_cards ?? true),
    maxCardsPerJoiner: (Number(settings.max_cards_per_joiner) || 2) as 1 | 2 | 3,
    cards,
    participantIds: [],
  };
}

function toParticipant(p: DbParticipant, hostDevice?: string): Participant {
  return {
    id: p.id,
    room_id: p.room_id,
    device_id: p.user_id || p.id,
    display_name: p.display_name,
    ready: p.is_ready,
    joined_at: p.joined_at,
  };
}

export async function remoteCreateRoom(input: {
  category: RoomCategory;
  title: string;
  hostOnlyCards: boolean;
  maxCardsPerJoiner: 1 | 2 | 3;
}): Promise<Room | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const deviceId = getDeviceId();
  const code = generateCode();
  const expires = new Date(Date.now() + ROOM_LIFETIME_MS).toISOString();
  const title =
    input.title ||
    (input.category === "eat"
      ? "Where to eat"
      : input.category === "watch"
        ? "What to watch"
        : input.category === "do"
          ? "What to do"
          : "Custom pick");

  const { data, error } = await sb
    .from("rooms")
    .insert({
      code,
      mode: "swipe_match",
      status: "lobby",
      settings: {
        host_only_cards: input.hostOnlyCards,
        max_cards_per_joiner: input.maxCardsPerJoiner,
        allow_anonymous: true,
        require_all_ready: false,
      },
      item_payload: [],
      state: {
        title,
        category: input.category,
        host_device_id: deviceId,
        votes: [],
      },
      expires_at: expires,
    })
    .select()
    .single();

  if (error || !data) {
    console.error("remoteCreateRoom", error);
    return null;
  }

  await sb.from("participants").insert({
    room_id: data.id,
    display_name: getDisplayName(),
    is_host: true,
    is_ready: false,
    user_id: null,
  });

  // Store device binding on participant via display suffix is weak;
  // put device id in state for host lookup.
  return toRoom(data as DbRoom);
}

export async function remoteGetByCode(code: string): Promise<{
  room: Room;
  participants: Participant[];
  votes: RemoteVote[];
} | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data: room, error } = await sb
    .from("rooms")
    .select("*")
    .eq("code", code.toUpperCase())
    .neq("status", "expired")
    .maybeSingle();
  if (error || !room) return null;

  const { data: participants } = await sb
    .from("participants")
    .select("*")
    .eq("room_id", room.id);

  const db = room as DbRoom;
  const votes = db.state?.votes || [];
  return {
    room: toRoom(db),
    participants: ((participants || []) as DbParticipant[]).map((p) =>
      toParticipant(p, db.state?.host_device_id)
    ),
    votes,
  };
}

export async function remoteJoinRoom(code: string): Promise<Room | null> {
  const packed = await remoteGetByCode(code);
  if (!packed) return null;
  const sb = getSupabase()!;
  const name = getDisplayName();
  // Avoid duplicate names: if same display already in room, skip insert
  const exists = packed.participants.some((p) => p.display_name === name);
  if (!exists) {
    await sb.from("participants").insert({
      room_id: packed.room.id,
      display_name: name,
      is_host: false,
      is_ready: false,
    });
  }
  return packed.room;
}

export async function remoteAddCard(
  roomId: string,
  name: string,
  detail?: string
): Promise<RoomCard | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data: room, error } = await sb.from("rooms").select("*").eq("id", roomId).single();
  if (error || !room) return null;
  const db = room as DbRoom;
  const card: RoomCard = {
    id: crypto.randomUUID(),
    name: name.trim(),
    detail: detail?.trim() || undefined,
    skin: pickSkin(name, detail),
    yum: 0,
    nah: 0,
  };
  const payload = Array.isArray(db.item_payload) ? [...db.item_payload, card] : [card];
  const { error: upErr } = await sb
    .from("rooms")
    .update({
      item_payload: payload,
      status: db.status === "lobby" ? "revealing" : db.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", roomId);
  if (upErr) {
    console.error("remoteAddCard", upErr);
    return null;
  }
  return card;
}

export async function remoteSetStatus(roomId: string, status: RoomStatus) {
  const sb = getSupabase();
  if (!sb) return;
  await sb
    .from("rooms")
    .update({ status: toDbStatus(status), updated_at: new Date().toISOString() })
    .eq("id", roomId);
}

export async function remoteVote(
  roomId: string,
  cardId: string,
  vote: "yum" | "nah"
) {
  const sb = getSupabase();
  if (!sb) return;
  const { data: room } = await sb.from("rooms").select("state").eq("id", roomId).single();
  if (!room) return;
  const state = (room.state || {}) as DbRoom["state"];
  const deviceId = getDeviceId();
  const votes = (state.votes || []).filter(
    (v) => !(v.card_id === cardId && v.device_id === deviceId)
  );
  votes.push({ card_id: cardId, device_id: deviceId, vote });
  await sb
    .from("rooms")
    .update({
      state: { ...state, votes },
      updated_at: new Date().toISOString(),
    })
    .eq("id", roomId);
}

export async function remoteSetReady(roomId: string, ready: boolean) {
  const sb = getSupabase();
  if (!sb) return;
  const name = getDisplayName();
  await sb
    .from("participants")
    .update({ is_ready: ready, last_seen_at: new Date().toISOString() })
    .eq("room_id", roomId)
    .eq("display_name", name);
}

export function subscribeRoom(roomId: string, onChange: () => void): () => void {
  const sb = getSupabase();
  if (!sb) return () => {};

  const channel: RealtimeChannel = sb
    .channel(`room:${roomId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "rooms", filter: `id=eq.${roomId}` },
      () => onChange()
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "participants", filter: `room_id=eq.${roomId}` },
      () => onChange()
    )
    .subscribe();

  return () => {
    sb.removeChannel(channel);
  };
}

export { isSupabaseConfigured };
