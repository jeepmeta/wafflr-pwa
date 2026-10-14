# Wafflr

> **Stop waffling. Start living.**

Mobile-first Progressive Web App. Swipe-tournament decision engine for groups.

## Stack

- Next.js 15 (App Router) · React 19 · TypeScript
- Tailwind CSS v4 — single theme tokens in `src/app/App.css`
- Local room storage (2h lifetime · purge +1h)

## Product direction

See `docs/`:

| File | Purpose |
|------|---------|
| `docs/AGENTS.md` | Grok / contributor instructions |
| `docs/wafflr-spec.md` | Full product + screen spec |
| `docs/design-tokens.md` | Color, type, motion tokens |
| `docs/wafflr-flow.html` | Decision-engine flowchart |
| `public/characters/` | Cast sprites + checklist |

### Canonical characters

Butters the Waffle · Barron Bacon · Strawberry Sue · Hugh Blueberry · Eggin Targarian · O.J.

## Screens (v0.2)

- **Home** — Butters hero, Create / Join
- **Create** — Type → Custom? → Cards setup → Code & share
- **Join** — 6-char code (Barron on miss)
- **Your Rooms** — list + expiry countdown
- **Room** — shell (swipe engine next)

## Develop

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Constraints

- `100dvh` locked viewports, no page scroll
- Single cream theme (no light/dark split)
- Tokens only — no ad-hoc hex
- Rooms expire 2 hours after creation
