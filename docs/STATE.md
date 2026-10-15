# State management (extensible)

Keep the stack light until complexity forces a store.

| Kind | Where today | Next step |
|------|-------------|-----------|
| **Local UI** | `useState` (swipe offset, wink, modals) | stay local |
| **Device identity** | `lib/device.ts` localStorage | unchanged |
| **Joined rooms** | `lib/joined.ts` | optional Zustand persist if many subscribers |
| **Room server state** | Supabase + `remote-rooms.ts` + Realtime | React Query only if cache invalidation hurts |
| **Offline queue** | `lib/offline.ts` | keep module-level; flush on `online` |
| **URL** | `/room/[code]` | source of truth for active room |

**Rule:** prefer props + loaders over global client stores. Introduce **Zustand** when ≥3 distant trees need the same mutable client state.

**React perf:** memo heavy lists later; swipe stack already isolates gesture state.
