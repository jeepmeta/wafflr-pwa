# Wafflr — Store shells (Phase 7)

Same **web core** (Next.js PWA). Native shells only for App Store / Play distribution and IAP.

## Paths

| Path | Best for | Notes |
|------|----------|--------|
| **Capacitor** | iOS + Android | WebView loads deployed URL or `out/` |
| **TWA (Bubblewrap)** | Play only | Chrome Custom Tabs / Trusted Web Activity |
| **PWA install** | All browsers | Already shipped (Phase 5–6) |

## Capacitor (recommended for dual store)

```bash
npm i @capacitor/core @capacitor/ios @capacitor/android
npm i -D @capacitor/cli
npx cap add ios
npx cap add android
```

1. Deploy the Next app (Vercel/etc.) **or** enable static export for offline-only shell.
2. Edit `capacitor.config.ts`:
   - Prod: set `server.url` to `https://your-domain` (keeps SSR/API), **or** build static into `out/` and leave `webDir: "out"`.
   - Dev: `server.url: "http://localhost:3000"` (+ `cleartext: true` on Android).
3. `npx cap sync` && open Xcode / Android Studio:
   - `npx cap open ios`
   - `npx cap open android`

**App ID:** `app.wafflr.decision` (change before first store submit if needed).

### Static export (optional)

If you want a fully offline binary without a live server, add to `next.config.ts`:

```ts
const nextConfig = { output: "export" as const };
```

Dynamic `/room/[code]` still works client-side; Supabase calls need network.

## TWA — Play Store

1. Host PWA with Digital Asset Links (`/.well-known/assetlinks.json`).
2. Use [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap):

```bash
npx @bubblewrap/cli init --manifest https://wafflr.app/manifest.json
# or seed from twa.manifest.json in this repo
npx @bubblewrap/cli build
```

3. Sign and upload the generated AAB to Play Console.

## Ad-free IAP

| Layer | File |
|-------|------|
| Entitlement storage | `src/lib/monetization.ts` → `setAdFree` / `isAdFree` |
| Purchase API | `src/lib/iap.ts` → `purchaseAdFree` / `restorePurchases` |
| UI | `src/components/store/AdFreePaywall.tsx` |
| Boot restore | `StoreProvider` in layout |

**Product id:** `wafflr_ad_free` (override with `NEXT_PUBLIC_WAFFLR_AD_FREE_PRODUCT_ID`).

**Test without stores:** `NEXT_PUBLIC_WAFFLR_IAP_SIMULATE=1` + `NEXT_PUBLIC_WAFFLR_AD_FREE_SKU=1`.

Wire a real plugin later:

```bash
npm i @capacitor-community/in-app-purchases
# or RevenueCat Capacitor SDK
```

Then replace the stub in `purchaseAdFree()` / `restorePurchases()`.

## Checklist before submit

- [ ] Privacy policy URL
- [ ] Screenshots (6.7" / 6.5" / tablet as required)
- [ ] Age rating (likely 4+)
- [ ] No account required (matches product rule)
- [ ] IAP reviewed if ad-free is sold
- [ ] Asset links / associated domains for TWA / universal links

## Out of scope here

Tauri is better for **desktop** shells; mobile stores stay Capacitor/TWA.
