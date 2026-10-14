# Wafflr

> **Stop waffling. Start living.**

Mobile-first Progressive Web App. Swipe-tournament decision engine for groups.

## Stack

- Next.js 15 (App Router) · React 19 · TypeScript
- Tailwind CSS v4 — single theme in `src/app/App.css`
- Supabase Realtime — shared rooms / lobby / votes across devices
- Offline shell via `public/sw.js`
- Local storage fallback when Supabase env is missing

## Setup

```bash
git clone https://github.com/jeepmeta/wafflr-pwa.git
cd wafflr-pwa
npm install
cp .env.example .env.local
```

In `.env.local` set:

```
NEXT_PUBLIC_SUPABASE_URL=https://emkdofdotchrvihilqsk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from Supabase dashboard>
```

Project: **Wafflr App** (`emkdofdotchrvihilqsk`, us-east-1).  
Uses existing tables `rooms` + `participants` (swipe_match mode).

```bash
npm run dev
```

## Screens (v0.4)

- **Home** — Butters, Create / Join
- **Create** — type → cards setup → **QR + code share** (live room on Supabase)
- **Join** — code or `?code=` / QR auto-join
- **Room** — lobby presence · add cards · swipe · results (confetti / Eggin tie-break)
- **Your Rooms** — local list + expiry

## Multiplayer flow

1. Host creates room → dual-write Supabase (`mode: swipe_match`)
2. Share code or QR (`/join?code=XXXXXX`)
3. Joiners appear in **Lobby** with ready toggles
4. Cards & votes sync via Realtime on `rooms` + `participants`
5. Without env keys, app still works **local-only** on one device

## Constraints

- `100dvh` locked viewports
- Single cream theme
- Rooms expire ~2 hours after creation
