# Wafflr — Build Roadmap

No accounts. Device token only. Wheel/dice deferred.

## Phase 1 — Device memory ✅
## Phase 2 — Device-bound multiplayer ✅
## Phase 3 — Core loop hardened ✅
## Phase 4 — Soft monetization ✅
## Phase 5 — Share & growth ✅
## Phase 6 — Offline & PWA shell ✅

## Phase 7 — Store shells ✅
- Capacitor config (`app.wafflr.decision`) + npm scripts
- TWA / Bubblewrap manifest seed (`twa.manifest.json`)
- IAP bridge + ad-free entitlement (`iap.ts` ↔ `setAdFree`)
- `AdFreePaywall` + `StoreProvider` restore on launch
- Guide: `docs/STORE_SHELLS.md`

## Phase 8 — Scale path (far)
- Broadcast rooms: aggregate vote counters, viewer count
- Edge RPCs for high join rate
- No change to zero-signup rule

**Out of scope for now:** wheel, dice, accounts, social feed, permanent archives.
