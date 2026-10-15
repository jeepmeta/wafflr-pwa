# Postgres / Supabase notes

Aligned with supabase-postgres-best-practices (indexes, RLS-ready, lean payloads).

## Hot paths

- `rooms.code` — unique lookup on join (index required)
- `participants (room_id, device_id)` — unique partial index (Phase 2)
- Votes live in `rooms.state` JSON — fine for small rooms; Phase 8 aggregate counters for broadcast scale

## RLS direction (when locking down)

Today: anon key + short-lived rooms (product is account-less).
When tightening:

```sql
-- Example direction only; apply deliberately
alter table rooms enable row level security;
-- read by code for joiners; writes constrained by host_device_id in state
```

Prefer **edge RPCs** for high-join broadcast rooms (Phase 8) over fat client updates of entire `state.votes` arrays.

## Connection

Browser uses anon key; pooler recommended for any server-side Next routes later.
