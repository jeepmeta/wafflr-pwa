/** Stable anonymous device id for multiplayer (localStorage). */

const KEY = "wafflr_device_id";

export function getDeviceId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}

export function getDisplayName(): string {
  if (typeof window === "undefined") return "Player";
  const stored = localStorage.getItem("wafflr_display_name");
  if (stored) return stored;
  const short = getDeviceId().slice(0, 4).toUpperCase();
  return `Player ${short}`;
}

export function setDisplayName(name: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("wafflr_display_name", name.trim().slice(0, 24) || "Player");
}
