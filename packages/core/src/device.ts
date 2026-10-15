/**
 * Anonymous device identity — no accounts.
 * Used for Your Rooms persistence and room-scoped participant identity.
 */

export const DEVICE_ID_KEY = "wafflr_device_id";
export const DISPLAY_NAME_KEY = "wafflr_display_name";

export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

function memoryStorage(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => {
      map.set(k, v);
    },
  };
}

/** Resolve a storage backend (browser localStorage or in-memory for SSR/tests). */
export function getStorage(explicit?: StorageLike): StorageLike {
  if (explicit) return explicit;
  if (typeof globalThis !== "undefined" && "localStorage" in globalThis) {
    try {
      const ls = (globalThis as unknown as { localStorage: StorageLike }).localStorage;
      const probe = "__wafflr_probe__";
      ls.setItem(probe, "1");
      ls.getItem(probe);
      return ls;
    } catch {
      /* private mode */
    }
  }
  return memoryStorage();
}

export function createDeviceId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `dev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getDeviceId(storage?: StorageLike): string {
  const s = getStorage(storage);
  let id = s.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = createDeviceId();
    try {
      s.setItem(DEVICE_ID_KEY, id);
    } catch {
      /* ignore */
    }
  }
  return id;
}

export function getDisplayName(storage?: StorageLike): string {
  const s = getStorage(storage);
  const stored = s.getItem(DISPLAY_NAME_KEY);
  if (stored) return stored;
  return `Player ${getDeviceId(s).slice(0, 4).toUpperCase()}`;
}

export function setDisplayName(name: string, storage?: StorageLike): void {
  const s = getStorage(storage);
  try {
    s.setItem(DISPLAY_NAME_KEY, name.trim().slice(0, 24) || "Player");
  } catch {
    /* ignore */
  }
}

/**
 * Room-scoped anonymous participant handle.
 * Same device keeps the same participantId in a room; no login required.
 * Dice/wheel use this to attribute a win without accounts.
 */
export function participantIdForRoom(roomId: string, storage?: StorageLike): string {
  return `${getDeviceId(storage)}:${roomId}`;
}
