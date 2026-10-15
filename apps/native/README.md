# @wafflr/native

Expo / React Native shell for App Store + Play Store.

- Always free to play with ads
- Optional subscription for ad-free (IAP)
- Same anonymous device token + room model as web (`@wafflr/core`)

Bootstrap when ready:

```bash
# from repo root
npx create-expo-app@latest apps/native-tmp -t tabs
# merge into apps/native, keep package name @wafflr/native
```

Do not reimplement room lifecycle here — import from `@wafflr/core`.
