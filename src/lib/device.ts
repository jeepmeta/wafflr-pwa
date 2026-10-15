/** Stable anonymous device id for multiplayer (localStorage). */

const KEY = "wafflr_device_id";
const NAME_KEY = "wafflr_display_name";

function safeGet(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode / quota */
  }
}

export function getDeviceId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = safeGet(KEY);
  if (!id) {
    id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `dev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    safeSet(KEY, id);
  }
  return id;
}

export function getDisplayName(): string {
  if (typeof window === "undefined") return "Player";
  const stored = safeGet(NAME_KEY);
  if (stored) return stored;
  const short = getDeviceId().slice(0, 4).toUpperCase();
  return `Player ${short}`;
}

export function setDisplayName(name: string) {
  safeSet(NAME_KEY, name.trim().slice(0, 24) || "Player");
}
