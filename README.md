# Wafflr

**Stop waffling. Start living.**

Anonymous group decisions — swipe tournament first; dice & wheel later.

## Monorepo

| Package | Role |
|---------|------|
| `@wafflr/web` | Mobile web + PWA (no login required) |
| `@wafflr/native` | Expo → App Store / Play Store |
| `@wafflr/core` | Device token, rooms, game modes |

See [docs/MONOREPO.md](./docs/MONOREPO.md).

## Quick start (web — current)

The Next.js app still runs from the **repo root** while we migrate into `apps/web`:

```bash
npm install
cp .env.example .env.local   # add Supabase keys
npx next dev
```

Core package:

```bash
npm run test --workspace=@wafflr/core
```

## Product rules

- No accounts — local device token only
- Rooms expire (2h live + 1h purge)
- Swipe ships first; modes are pluggable in `@wafflr/core`
- Ads on free path; optional ad-free subscription later
