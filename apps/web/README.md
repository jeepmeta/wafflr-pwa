# @wafflr/web

Mobile-first website + installable PWA.

- **No login / no install required** to play
- Ads on free path; optional **$0.99/mo** ad-free (PWA / store)
- Consumes `@wafflr/core` for rooms, device token, modes

## Migration status

The live Next.js App Router tree still lives at the **repo root** (`src/`, `next.config.ts`, `public/`) so production does not break mid-move.

**Target layout (next migration step):**

```text
apps/web/
  src/          ← move from root src/
  public/       ← move from root public/
  next.config.ts
  package.json  ← full Next deps
```

Until then: develop with root `npm install && npx next dev` (or keep using root scripts).
