# Wafflr Design Tokens

Single theme. No light/dark split. Prefer Tailwind v4 `@theme` + utility classes. Never invent hex outside this file.

---

## Palette

| Role | Token | Hex | Tailwind |
|------|-------|-----|----------|
| Primary / CTA / chance | `syrup` | `#F59E0B` | `bg-syrup` `text-syrup` |
| Highlight / butter | `butter` | `#FCD34D` | `bg-butter` |
| Danger / nah / error | `berry` | `#EF4444` | `bg-berry` |
| Canvas / cream | `cream` | `#FFFBEB` | `bg-cream` |
| Ink / slate | `obsidian` | `#0F172A` | `bg-obsidian` `text-obsidian` |
| Success / yum | `match` | `#10B981` | `bg-match` |
| Soft surface | `surface` | `#FEF3C7` | `bg-surface` |
| Muted text | `muted` | `#64748B` | `text-muted` |

```css
@theme {
  --color-syrup: #F59E0B;
  --color-butter: #FCD34D;
  --color-berry: #EF4444;
  --color-cream: #FFFBEB;
  --color-obsidian: #0F172A;
  --color-match: #10B981;
  --color-surface: #FEF3C7;
  --color-muted: #64748B;
}
```

## Typography

| Role | Family | Weight | Use |
|------|--------|--------|-----|
| Display / wordmark | Fredoka | 600–700 | Titles, CTAs, room codes |
| Body / UI | Inter | 400–600 | Labels, copy, forms |

## Spacing (4pt)

`0 · 1 · 2 · 3 · 4 · 5 · 6 · 8 · 10 · 12 · 16 · 20 · 24`  
Aliases: `screen-pad = 4` (16px), `card-pad = 4`, `section-gap = 6` (24px)

## Radius

| Token | Value | Use |
|-------|-------|-----|
| `sm` | 8px | Chips, inputs |
| `md` | 12px | Cards small |
| `lg` | 16px | Cards, tiles |
| `xl` | 24px | Hero cards, modals |
| `full` | 9999px | Pills, CTAs |

Heavy borders: `border-2` or `border-[3px]` on interactive tiles.

## Rules

1. Use only tokens above. No ad-hoc hex.
2. Prefer Tailwind utilities mapped to `@theme`.
3. Every interactive surface has a clear pressed state.
4. Screens are `100dvh`, no page scroll.
