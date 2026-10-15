# Wafflr monorepo

```text
wafflr/
├── apps/
│   ├── web/          # Mobile website + PWA (Next today; at root until moved)
│   └── native/       # Expo → App Store / Play Store
├── packages/
│   ├── core/         # @wafflr/core — device token, room, modes (swipe|dice|wheel)
│   └── typescript-config/
├── src/              # TEMP: live Next app (migrate → apps/web)
├── turbo.json
└── package.json      # npm workspaces + turbo
```

## Product surfaces

| App | Who | Monetization |
|-----|-----|----------------|
| `@wafflr/web` | Browser, no install required; optional PWA install | Ads; optional $0.99/mo ad-free |
| `@wafflr/native` | Store installs | Ads; optional ad-free IAP |

No accounts on any surface. Device-local token only.

## @wafflr/core responsibilities

- `getDeviceId` / display name (anonymous)
- `participantIdForRoom` — stable id for dice/wheel winners later
- `WafflrRoom` + lifecycle constants
- `GameMode`: `swipe` (ship now) | `dice` | `wheel` (payload stubs)

Apps own UI, ad SDKs, and IAP only.

## Commands

```bash
npm install
npm run typecheck --workspace=@wafflr/core
npm run test --workspace=@wafflr/core

# Web (until move): from root
npx next dev
```

## Migration checklist

1. ✅ Workspace root + turbo + `@wafflr/core` mode contract
2. ⬜ Move `src/`, `public/`, Next config → `apps/web`
3. ⬜ Point web imports at `@wafflr/core` (replace local room/device duplicates)
4. ⬜ Flesh out Expo app under `apps/native`
5. ⬜ Add dice/wheel mode UIs against existing room shell
