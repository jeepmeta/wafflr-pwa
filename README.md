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

## Screens (v0.3)

- **Home** — Butters hero, Create / Join
- **Create** — Type → Custom? → Cards setup → Code & share
- **Join** — 6-char code (Barron on miss)
- **Your Rooms** — list + expiry countdown
- **Room** — full loop:
  - **Cards** — add options (auto skins), Sue assist
  - **Swipe** — drag Yum/Nah + buttons, progress bar, haptics
  - **Results** — confetti, rankings, Eggin sudden-death on ties

## Develop

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Try: Create Room → add ≥2 cards → Start swiping → see winner.

## Constraints

- `100dvh` locked viewports, no page scroll
- Single cream theme (no light/dark split)
- Tokens only — no ad-hoc hex
- Rooms expire 2 hours after creation

## Next

Realtime multiplayer lobby · QR join · polished multi-frame sprite animation · PWA offline
