export const CATEGORIES = [
  {
    id: "eat" as const,
    label: "Where to eat",
    emoji: "🍽️",
    description: "Dinner without the debate",
  },
  {
    id: "watch" as const,
    label: "What to watch",
    emoji: "🎬",
    description: "Movie night, no veto wars",
  },
  {
    id: "do" as const,
    label: "What to do",
    emoji: "🎯",
    description: "Plans, games, adventures",
  },
  {
    id: "custom" as const,
    label: "Custom",
    emoji: "✨",
    description: "Your own question",
  },
] as const;
