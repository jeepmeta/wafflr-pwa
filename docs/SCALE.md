# Phase 8 — Broadcast scale

Zero accounts. Device token only. Designed for influencer-scale rooms (many joiners, few cards).

## Problem

Storing every vote in `rooms.state.votes[]` and loading all `participants` breaks at high join rates.

## Solution

| Concern | Mechanism |
|---------|-----------|
| **Deduped votes** | `device_votes (room_id, device_id, card_id)` unique |
| **Aggregate scores** | `rooms.vote_tallies` jsonb `{ cardId: { yum, nah } }` |
| **Atomic cast** | RPC `wafflr_cast_vote` |
| **Fast join** | RPC `wafflr_join_broadcast` bumps `viewer_count` |
| **Lean read** | RPC `wafflr_room_snapshot` — no full participant list |
| **Flag** | `rooms.is_broadcast` |

## Client rules

- **Small rooms** (`is_broadcast = false`): existing Realtime + participant lobby.
- **Broadcast rooms**: join via RPC; vote via RPC; poll/subscribe room row for tallies + viewer_count; skip lobby list UI.
- Completion for broadcast is **host-driven** (or timer), not “everyone finished” — millions never all finish together.

## Host flow

1. Create with **Broadcast room** toggle (host-only cards recommended).
2. Share code widely.
3. Start swiping when cards ready.
4. Host taps **Reveal results** when ready (does not wait for all devices).

## Indexes

- `device_votes (room_id, device_id, card_id)` unique
- `rooms (is_broadcast) where true`

## Next (ops)

- Edge rate limits on RPC
- Optional Redis counter cache in front of `viewer_count`
- Partition `device_votes` by room age if retention grows
