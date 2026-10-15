/**
 * Multiplayer over Wafflr Supabase schema.
 * Phase 2–3: device membership + votes.
 * Phase 8: broadcast rooms use aggregate tallies + RPCs.
 */

import type { RealtimeChannel } from "@supabase/supabase-js";
import { getDeviceId, getDisplayName } from "./device";
import { getSupabase, isSupabaseConfigured } from "./supabase";
import type { Room, RoomCard, RoomCategory, RoomStatus } from "./rooms";
import { generateCode, pickSkin, ROOM_LIFETIME_MS } from "./rooms";
import {
  applyTalliesToCards,
  fetchMyVotedCardIds,
  rpcCastVote,
  rpcJoinBroadcast,
  rpcRoomSnapshot,
  type VoteTallies,
} from "./broadcast";

export type Participant = {
  id: string;
  room_id: string;
  device_id: string;
  display_name: string;
  ready: boolean;
  is_host: boolean;
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
    tie_broken?: boolean;
  };
  created_at: string;
  expires_at: string | null;
  is_broadcast?: boolean;
  viewer_count?: number;
  vote_tallies?: VoteTallies;
};

type DbParticipant = {
  id: string;
  room_id: string;
  display_name: string;
  is_host: boolean;
  is_ready: boolean;
  joined_at: string;
  user_id: string | null;
  device_id: string | null;
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
  if (s === "drafting") return "lobby";
  if (s === "submitting") return "revealing";
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
  const isBroadcast = Boolean(r.is_broadcast);
  const tallies = r.vote_tallies || {};
  const raw = Array.isArray(r.item_payload) ? r.item_payload : [];
  const votes = r.state?.votes || [];
  const cards = isBroadcast
    ? applyTalliesToCards(raw, tallies)
    : tallyCards(raw, votes);
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
    isBroadcast,
    viewerCount: r.viewer_count ?? 0,
  };
}

function toParticipant(p: DbParticipant): Participant {
  return {
    id: p.id,
    room_id: p.room_id,
    device_id: p.device_id || "",
    display_name: p.display_name,
    ready: p.is_ready,
    is_host: p.is_host,
    joined_at: p.joined_at,
  };
}

export function votedCardIdsForDevice(
  votes: RemoteVote[],
  deviceId?: string
): Set<string> {
  const id = deviceId || getDeviceId();
  return new Set(
    votes
      .filter((v) => v.device_id === id && !v.device_id.startsWith("tiebreak:"))
      .map((v) => v.card_id)
  );
}

export function devicesFinishedSwiping(
  votes: RemoteVote[],
  cardIds: string[],
  deviceIds: string[]
): { finished: string[]; pending: string[] } {
  const realVotes = votes.filter((v) => !v.device_id.startsWith("tiebreak:"));
  const finished: string[] = [];
  const pending: string[] = [];
  for (const d of deviceIds) {
    if (!d) continue;
    const voted = new Set(realVotes.filter((v) => v.device_id === d).map((v) => v.card_id));
    if (cardIds.length > 0 && cardIds.every((id) => voted.has(id))) finished.push(d);
    else pending.push(d);
  }
  return { finished, pending };
}

export async function remoteCreateRoom(input: {
  category: RoomCategory;
  title: string;
  hostOnlyCards: boolean;
  maxCardsPerJoiner: 1 | 2 | 3;
  isBroadcast?: boolean;
}): Promise<Room | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const deviceId = getDeviceId();
  const code = generateCode();
  const expires = new Date(Date.now() + ROOM_LIFETIME_MS).toISOString();
  const isBroadcast = Boolean(input.isBroadcast);
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
      mode: isBroadcast ? "broadcast_swipe" : "swipe_match",
      status: "lobby",
      is_broadcast: isBroadcast,
      viewer_count: 1,
      vote_tallies: {},
      settings: {
        host_only_cards: isBroadcast ? true : input.hostOnlyCards,
        max_cards_per_joiner: input.maxCardsPerJoiner,
        allow_anonymous: true,
        require_all_ready: false,
        broadcast: isBroadcast,
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
    device_id: deviceId,
    display_name: getDisplayName(),
    is_host: true,
    is_ready: false,
  });

  return toRoom(data as DbRoom);
}

export async function remoteGetByCode(code: string): Promise<{
  room: Room;
  participants: Participant[];
  votes: RemoteVote[];
  myVotedCardIds: string[];
} | null> {
  const sb = getSupabase();
  if (!sb) return null;

  // Prefer snapshot RPC (works for broadcast + small rooms)
  const snap = await rpcRoomSnapshot(code);
  if (snap) {
    let myVoted: string[] = [];
    if (snap.isBroadcast) {
      myVoted = await fetchMyVotedCardIds(snap.room.id);
    }
    let participants: Participant[] = [];
    if (!snap.isBroadcast) {
      const { data: parts } = await sb
        .from("participants")
        .select("*")
        .eq("room_id", snap.room.id)
        .limit(100);
      participants = ((parts || []) as DbParticipant[]).map(toParticipant);
      const { data: roomRow } = await sb
        .from("rooms")
        .select("state")
        .eq("id", snap.room.id)
        .maybeSingle();
      const votes = ((roomRow?.state as DbRoom["state"])?.votes || []) as RemoteVote[];
      myVoted = [...votedCardIdsForDevice(votes)];
      return {
        room: snap.room,
        participants,
        votes,
        myVotedCardIds: myVoted,
      };
    }
    return {
      room: snap.room,
      participants: [],
      votes: [],
      myVotedCardIds: myVoted,
    };
  }

  const { data: room, error } = await sb
    .from("rooms")
    .select("*")
    .eq("code", code.toUpperCase())
    .neq("status", "expired")
    .maybeSingle();
  if (error || !room) return null;

  const db = room as DbRoom;
  const { data: participants } = await sb
    .from("participants")
    .select("*")
    .eq("room_id", room.id)
    .limit(db.is_broadcast ? 20 : 100);

  const votes = db.state?.votes || [];
  let myVoted = [...votedCardIdsForDevice(votes)];
  if (db.is_broadcast) {
    myVoted = await fetchMyVotedCardIds(db.id);
  }

  return {
    room: toRoom(db),
    participants: ((participants || []) as DbParticipant[]).map(toParticipant),
    votes,
    myVotedCardIds: myVoted,
  };
}

export async function remoteJoinRoom(code: string): Promise<Room | null> {
  const sb = getSupabase();
  if (!sb) return null;

  // Fast path for any room via broadcast join RPC (bumps viewer when new)
  const joined = await rpcJoinBroadcast(code);
  if (joined?.ok) {
    const packed = await remoteGetByCode(code);
    return packed?.room ?? null;
  }

  const packed = await remoteGetByCode(code);
  if (!packed) return null;
  const deviceId = getDeviceId();
  const existing = packed.participants.find((p) => p.device_id === deviceId);

  if (existing) {
    await sb
      .from("participants")
      .update({
        display_name: getDisplayName(),
        last_seen_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else if (!packed.room.isBroadcast) {
    await sb.from("participants").insert({
      room_id: packed.room.id,
      device_id: deviceId,
      display_name: getDisplayName(),
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
  const tallies = { ...(db.vote_tallies || {}), [card.id]: { yum: 0, nah: 0 } };
  const { error: upErr } = await sb
    .from("rooms")
    .update({
      item_payload: payload,
      vote_tallies: tallies,
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

  // Prefer atomic RPC (broadcast + scales for small rooms too)
  const viaRpc = await rpcCastVote(roomId, cardId, vote);
  if (viaRpc) return;

  // Fallback: legacy state.votes array
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

export async function remoteCompleteIfReady(
  roomId: string,
  votes: RemoteVote[],
  cardIds: string[],
  participantDeviceIds: string[]
): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { data } = await sb
    .from("rooms")
    .select("is_broadcast")
    .eq("id", roomId)
    .maybeSingle();
  // Broadcast rooms: host reveals manually — never auto-complete on one device
  if (data?.is_broadcast) return false;

  const ids = participantDeviceIds.filter(Boolean);
  if (ids.length === 0) {
    await remoteSetStatus(roomId, "completed");
    return true;
  }
  const { pending } = devicesFinishedSwiping(votes, cardIds, ids);
  if (pending.length > 0) return false;
  await remoteSetStatus(roomId, "completed");
  return true;
}

export async function remoteBreakTie(roomId: string, winnerCardId: string) {
  const sb = getSupabase();
  if (!sb) return;
  await rpcCastVote(roomId, winnerCardId, "yum");
  await sb
    .from("rooms")
    .update({
      status: "completed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", roomId);
}

export async function remoteSetReady(roomId: string, ready: boolean) {
  const sb = getSupabase();
  if (!sb) return;
  const deviceId = getDeviceId();
  await sb
    .from("participants")
    .update({ is_ready: ready, last_seen_at: new Date().toISOString() })
    .eq("room_id", roomId)
    .eq("device_id", deviceId);
}

export function isHostDevice(participants: Participant[], hostDeviceId?: string): boolean {
  const me = getDeviceId();
  if (hostDeviceId) return hostDeviceId === me;
  return participants.some((p) => p.device_id === me && p.is_host);
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
