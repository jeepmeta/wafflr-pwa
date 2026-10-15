# Wafflr design tokens (single theme)

Pastel, mobile-first. Source of truth: `src/app/App.css` `@theme`.

## Palette (psychology)

| Token | Hex | Role |
|-------|-----|------|
| cream | `#FFF7F2` | Calm canvas |
| surface | `#FFE8DC` | Peach wash panels |
| syrup | `#FFB86C` | Primary CTA (soft energy) |
| butter | `#FFE6A8` | Highlights / focus glow |
| berry | `#FF9EB5` | Join / secondary energy |
| match | `#7ECEC3` | Yes / success / host advance |
| lavender | `#C9B8F5` | Social / focus rings |
| sky | `#A8D8FF` | Info accents |
| obsidian | `#2D3748` | Ink (softer than pure slate) |
| muted | `#8B9BB0` | Secondary text |

Warm pastels lower decision anxiety; mint validates "yum"; soft rose fuels join without alarm-red aggression.

## Type

- Display: Fredoka (`--font-display`)
- Body: Inter (`--font-body`)

## Radius / motion

- sm 8 · md 12 · lg 16 · xl 24 · full pill
- Press: `scale(0.96)` + 150ms ease-out
- Shell: `100dvh`, no page scroll, `touch-action: manipulation`

## Layout

- `.app-shell` max-width 32rem centered — phone column on all breakpoints
- Safe-area padding on `.screen-pad`
