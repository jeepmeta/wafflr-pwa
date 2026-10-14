# Wafflr — Build Roadmap

No accounts. Device token only. Wheel/dice deferred.

## Phase 1 — Device memory ✅
- Stable `device_id` on each phone
- **Joined-room registry**: every create/join is remembered until purge
- **Your Rooms** lists hosted *and* joined rooms; rehydrates from local cache + Supabase
- Survive refresh / signal drop without login

## Phase 2 — Device-bound multiplayer ✅
- Participants + votes keyed by `device_id` (not display name)
- Rejoin restores ready state and prior votes for this device
- Host can advance phase; joiners see live status
- Skip already-voted cards on re-enter swipe stack

## Phase 3 — Core loop hardened ✅
- Create → share (code/QR) → cards → swipe → results end-to-end on 2+ devices
- Wait screens (Butters) when others still submitting/swiping
- Multi-device completion gate (room completes when all devices finish)
- Tie-breaker + confetti stable on live rooms
- Empty/error states with cast characters

## Phase 4 — Soft monetization ✅
- Post-results interstitial only (never mid-swipe)
- Optional rewarded “rematch / extra slot”
- Feature flag for future ad-free SKU (`NEXT_PUBLIC_WAFFLR_*` + `isAdFree`)
- Max one interstitial per browser session

## Phase 5 — Share & growth
- Results share card (image + code)
- Native share sheet polish
- Install prompt / PWA install UX

## Phase 6 — Offline & PWA shell
- SW caches shell + last room snapshot
- Offline banner; queue votes when back online

## Phase 7 — Store shells (later)
- Capacitor/Tauri or TWA wrappers for App Store / Play
- Same web core; store-specific IAP for ad-free

## Phase 8 — Scale path (far)
- Broadcast rooms: aggregate vote counters, viewer count
- Edge RPCs for high join rate
- No change to zero-signup rule

**Out of scope for now:** wheel, dice, accounts, social feed, permanent archives.
