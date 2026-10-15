/**
 * Phase 8 — broadcast / mass-vote path.
 * Uses Postgres RPCs for high join rate + aggregate tallies.
 * Still zero accounts: device_id only.
 */

import { getDeviceId, getDisplayName } from "./device";
import { getSupabase } from "./supabase";
import type { Room, RoomCard, RoomCategory, RoomStatus } from "./rooms";
import { ROOM_LIFETIME_MS } from "./rooms";

export type VoteTallies = Record<string, { yum: number; nah: number }>;

function mapStatus(s: string): RoomStatus {
  if (s === "lobby") return "drafting";
  if (s === "active") return "swiping";
  if (s === "revealing") return "submitting";
  if (s === "completed") return "completed";
  if (s === "expired") return "expired";
  return "drafting";
}

export function applyTalliesToCards(
  cards: RoomCard[],
  tallies: VoteTallies
): RoomCard[] {
  return cards.map((c) => ({
    ...c,
    yum: tallies[c.id]?.yum ?? c.yum ?? 0,
    nah: tallies[c.id]?.nah ?? c.nah ?? 0,
  }));
}

export async function rpcRoomSnapshot(code: string): Promise<{
  room: Room;
  isBroadcast: boolean;
  viewerCount: number;
  tallies: VoteTallies;
} | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.rpc("wafflr_room_snapshot", {
    p_code: code.toUpperCase(),
  });
  if (error || !data || !(data as { ok?: boolean }).ok) return null;
  const d = data as {
    id: string;
    code: string;
    status: string;
    is_broadcast: boolean;
    viewer_count: number;
    vote_tallies: VoteTallies;
    item_payload: RoomCard[];
    state: {
      title?: string;
      category?: RoomCategory;
      host_device_id?: string;
    };
    settings: Record<string, unknown>;
    expires_at: string | null;
    created_at: string;
  };
  const tallies = d.vote_tallies || {};
  const rawCards = Array.isArray(d.item_payload) ? d.item_payload : [];
  const settings = d.settings || {};
  const room: Room = {
    id: d.id,
    code: d.code,
    title: d.state?.title || "Wafflr room",
    category: d.state?.category || "custom",
    status: mapStatus(d.status),
    createdAt: new Date(d.created_at).getTime(),
    expiresAt: d.expires_at
      ? new Date(d.expires_at).getTime()
      : Date.now() + ROOM_LIFETIME_MS,
    hostOnlyCards: Boolean(settings.host_only_cards ?? true),
    maxCardsPerJoiner: (Number(settings.max_cards_per_joiner) || 2) as 1 | 2 | 3,
    cards: applyTalliesToCards(rawCards, tallies),
    participantIds: [],
    isBroadcast: Boolean(d.is_broadcast),
    viewerCount: d.viewer_count ?? 0,
  };
  return {
    room,
    isBroadcast: room.isBroadcast || false,
    viewerCount: room.viewerCount || 0,
    tallies,
  };
}

export async function rpcJoinBroadcast(code: string): Promise<{
  ok: boolean;
  viewerCount?: number;
  roomId?: string;
  isBroadcast?: boolean;
} | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.rpc("wafflr_join_broadcast", {
    p_code: code.toUpperCase(),
    p_device_id: getDeviceId(),
    p_display_name: getDisplayName(),
  });
  if (error || !data) return null;
  const d = data as {
    ok: boolean;
    viewer_count?: number;
    room_id?: string;
    is_broadcast?: boolean;
  };
  return {
    ok: d.ok,
    viewerCount: d.viewer_count,
    roomId: d.room_id,
    isBroadcast: d.is_broadcast,
  };
}

export async function rpcCastVote(
  roomId: string,
  cardId: string,
  vote: "yum" | "nah"
): Promise<{ yum: number; nah: number } | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.rpc("wafflr_cast_vote", {
    p_room_id: roomId,
    p_device_id: getDeviceId(),
    p_card_id: cardId,
    p_vote: vote,
  });
  if (error || !data) {
    console.error("wafflr_cast_vote", error);
    return null;
  }
  const d = data as { yum: number; nah: number };
  return { yum: d.yum, nah: d.nah };
}

/** Card ids this device already voted (from device_votes table). */
export async function fetchMyVotedCardIds(roomId: string): Promise<string[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("device_votes")
    .select("card_id")
    .eq("room_id", roomId)
    .eq("device_id", getDeviceId());
  if (error || !data) return [];
  return data.map((r: { card_id: string }) => r.card_id);
}
