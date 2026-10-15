/**
 * Game mode contract — swipe ships first; dice & wheel plug in later
 * without forking room create/join/expiry/identity.
 */

export const GAME_MODES = ["swipe", "dice", "wheel"] as const;
export type GameMode = (typeof GAME_MODES)[number];

export function isGameMode(v: unknown): v is GameMode {
  return typeof v === "string" && (GAME_MODES as readonly string[]).includes(v);
}

/** Swipe tournament option card */
export type SwipeCard = {
  id: string;
  name: string;
  detail?: string;
  skin?: string;
  yum: number;
  nah: number;
  authorDeviceId?: string;
};

export type SwipeModePayload = {
  mode: "swipe";
  cards: SwipeCard[];
  hostOnlyCards: boolean;
  maxCardsPerJoiner: 1 | 2 | 3;
};

/** Dice — placeholder shape; implement when mode ships */
export type DiceModePayload = {
  mode: "dice";
  sides: 6 | 20;
  rounds: number;
  /** participantId → rolls */
  rolls: Record<string, number[]>;
  winnerParticipantId?: string;
};

/** Wheel — placeholder shape; implement when mode ships */
export type WheelModePayload = {
  mode: "wheel";
  slices: { id: string; label: string }[];
  resultSliceId?: string;
  spunByParticipantId?: string;
};

export type ModePayload = SwipeModePayload | DiceModePayload | WheelModePayload;

export function emptySwipePayload(
  partial?: Partial<Omit<SwipeModePayload, "mode">>
): SwipeModePayload {
  return {
    mode: "swipe",
    cards: [],
    hostOnlyCards: partial?.hostOnlyCards ?? true,
    maxCardsPerJoiner: partial?.maxCardsPerJoiner ?? 2,
    ...partial,
    mode: "swipe",
  };
}

export function emptyDicePayload(): DiceModePayload {
  return { mode: "dice", sides: 6, rounds: 1, rolls: {} };
}

export function emptyWheelPayload(): WheelModePayload {
  return { mode: "wheel", slices: [] };
}

export function createModePayload(mode: GameMode): ModePayload {
  if (mode === "dice") return emptyDicePayload();
  if (mode === "wheel") return emptyWheelPayload();
  return emptySwipePayload();
}
