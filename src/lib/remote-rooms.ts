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
  id: string;
  room_id: string;
  card_id: string;
  device_id: string;
  vote: "yum" | "nah";
};

type DbRoom = {
  id: string;
  code: string;
  title: string;
  category: RoomCategory;
  status: RoomStatus;
  host_device_id: string;
  host_only_cards: boolean;
  max_cards_per_joiner: 1 | 2 | 3;
  created_at: string;
  expires_at: string;
};

type DbCard = {
  id: string;
  room_id: string;
  name: string;
  detail: string | null;
  skin: string | null;
  created_by: string;
};

function toRoom(r: DbRoom, cards: RoomCard[] = []): Room {
  return {
    id: r.id,
    code: r.code,
    title: r.title,
    category: r.category,
    status: r.status,
    createdAt: new Date(r.created_at).getTime(),
    expiresAt: new Date(r.expires_at).getTime(),
    hostOnlyCards: r.host_only_cards,
    maxCardsPerJoiner: r.max_cards_per_joiner,
    cards,
    participantIds: [],
  };
}

function toCard(c: DbCard, yum = 0, nah = 0): RoomCard {
  return {
    id: c.id,
    name: c.name,
    detail: c.detail || undefined,
    skin: c.skin || undefined,
    yum,
    nah,
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
      title,
      category: input.category,
      status: "drafting",
      host_device_id: deviceId,
      host_only_cards: input.hostOnlyCards,
      max_cards_per_joiner: input.maxCardsPerJoiner,
      expires_at: expires,
    })
    .select()
    .single();

  if (error || !data) {
    console.error("remoteCreateRoom", error);
    return null;
  }

  await sb.from("room_participants").insert({
    room_id: data.id,
    device_id: deviceId,
    display_name: getDisplayName(),
    ready: false,
  });

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

  const [{ data: cards }, { data: votes }, { data: participants }] = await Promise.all([
    sb.from("room_cards").select("*").eq("room_id", room.id),
    sb.from("room_votes").select("*").eq("room_id", room.id),
    sb.from("room_participants").select("*").eq("room_id", room.id),
  ]);

  const voteList = (votes || []) as RemoteVote[];
  const mappedCards = ((cards || []) as DbCard[]).map((c) => {
    const cv = voteList.filter((v) => v.card_id === c.id);
    return toCard(
      c,
      cv.filter((v) => v.vote === "yum").length,
      cv.filter((v) => v.vote === "nah").length
    );
  });

  return {
    room: toRoom(room as DbRoom, mappedCards),
    participants: (participants || []) as Participant[],
    votes: voteList,
  };
}

export async function remoteJoinRoom(code: string): Promise<Room | null> {
  const packed = await remoteGetByCode(code);
  if (!packed) return null;
  const sb = getSupabase()!;
  const deviceId = getDeviceId();
  await sb.from("room_participants").upsert(
    {
      room_id: packed.room.id,
      device_id: deviceId,
      display_name: getDisplayName(),
      ready: false,
    },
    { onConflict: "room_id,device_id" }
  );
  return packed.room;
}

export async function remoteAddCard(
  roomId: string,
  name: string,
  detail?: string
): Promise<RoomCard | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from("room_cards")
    .insert({
      room_id: roomId,
      name: name.trim(),
      detail: detail?.trim() || null,
      skin: pickSkin(name, detail),
      created_by: getDeviceId(),
    })
    .select()
    .single();
  if (error || !data) {
    console.error("remoteAddCard", error);
    return null;
  }
  await sb.from("rooms").update({ status: "submitting" }).eq("id", roomId).eq("status", "drafting");
  return toCard(data as DbCard);
}

export async function remoteSetStatus(roomId: string, status: RoomStatus) {
  const sb = getSupabase();
  if (!sb) return;
  await sb.from("rooms").update({ status }).eq("id", roomId);
}

export async function remoteVote(
  roomId: string,
  cardId: string,
  vote: "yum" | "nah"
) {
  const sb = getSupabase();
  if (!sb) return;
  await sb.from("room_votes").upsert(
    {
      room_id: roomId,
      card_id: cardId,
      device_id: getDeviceId(),
      vote,
    },
    { onConflict: "room_id,card_id,device_id" }
  );
}

export async function remoteSetReady(roomId: string, ready: boolean) {
  const sb = getSupabase();
  if (!sb) return;
  await sb
    .from("room_participants")
    .update({ ready })
    .eq("room_id", roomId)
    .eq("device_id", getDeviceId());
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
      { event: "*", schema: "public", table: "room_cards", filter: `room_id=eq.${roomId}` },
      () => onChange()
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "room_votes", filter: `room_id=eq.${roomId}` },
      () => onChange()
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "room_participants", filter: `room_id=eq.${roomId}` },
      () => onChange()
    )
    .subscribe();

  return () => {
    sb.removeChannel(channel);
  };
}

export { isSupabaseConfigured };
