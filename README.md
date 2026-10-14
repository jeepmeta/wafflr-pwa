# Wafflr PWA

Sleek, gamified decision-making platform. Mobile-first Progressive Web App.

**Decide faster.** Fair, fun, and done in under a minute.

## Stack

- **Next.js 15** (App Router) + React 19
- **Tailwind CSS v4** via single `src/app/App.css` (all design tokens live here)
- **PWA** ready (manifest, icons)
- Official Wafflr mark, Fredoka + Inter fonts, design tokens from branding kit

## Templates (extensible)

| Route   | Template      | Catalog        |
|---------|---------------|----------------|
| `/eat`  | Where to eat  | Food categories |
| `/watch`| What to watch | Movies         |

Add a new template by:
1. Extending `src/lib/catalogs.ts`
2. Adding a `ModeCard` on the home page
3. Creating a route that reuses `<Wheel items={...} />`

## Design system

All colors, spacing, radius, and motion live in **`src/app/App.css`**.  
Do not hard-code hex or px values in components. Use CSS variables / utility classes defined there.

- Dark mode default (`data-theme="dark"`)
- Brand: Amber `#F59E0B`, Emerald `#10B981`, Pink `#EC4899`, Slate canvas `#0F172A`
- Fonts: Fredoka (bubble / wordmark), Inter (UI)

## Develop

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Product constraints

- Fairness via randomness + consensus
- Sessions complete in ≤60 seconds
- Zero-friction, mobile-first
- Modular micro-game interfaces (Wheel first; swipe / bracket later)

See the main Wafflr Expo repo and `design-tokens.md` / `branding-kit.html` for full product vision.
