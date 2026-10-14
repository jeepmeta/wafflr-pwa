/**
 * Extensible item catalog templates.
 * Start with where-to-eat and what-to-watch.
 * Shape matches sample-item-catalogs.md / room-state-schemas item_payload.
 */

export type ItemType = "place" | "movie" | "custom";

export interface CatalogItem {
  id: string;
  type: ItemType;
  title: string;
  subtitle?: string;
  image?: string;
  tags?: string[];
  meta?: Record<string, string | number | boolean>;
}

export const EAT_CATALOG: CatalogItem[] = [
  {
    id: "eat_pizza",
    type: "place",
    title: "Pizza",
    subtitle: "Slice or whole pie",
    tags: ["comfort", "shareable"],
    meta: { cuisine: "Italian" },
  },
  {
    id: "eat_sushi",
    type: "place",
    title: "Sushi",
    subtitle: "Rolls & nigiri",
    tags: ["fresh", "light"],
    meta: { cuisine: "Japanese" },
  },
  {
    id: "eat_tacos",
    type: "place",
    title: "Tacos",
    subtitle: "Street or sit-down",
    tags: ["spicy", "quick"],
    meta: { cuisine: "Mexican" },
  },
  {
    id: "eat_burger",
    type: "place",
    title: "Burgers",
    subtitle: "Classic or loaded",
    tags: ["comfort", "grill"],
    meta: { cuisine: "American" },
  },
  {
    id: "eat_thai",
    type: "place",
    title: "Thai",
    subtitle: "Curry, noodles, pad thai",
    tags: ["spicy", "aromatic"],
    meta: { cuisine: "Thai" },
  },
  {
    id: "eat_ramen",
    type: "place",
    title: "Ramen",
    subtitle: "Broth & noodles",
    tags: ["comfort", "warm"],
    meta: { cuisine: "Japanese" },
  },
  {
    id: "eat_indian",
    type: "place",
    title: "Indian",
    subtitle: "Curry, naan, tandoor",
    tags: ["spicy", "rich"],
    meta: { cuisine: "Indian" },
  },
  {
    id: "eat_salad",
    type: "place",
    title: "Salad / Healthy",
    subtitle: "Bowls & greens",
    tags: ["light", "fresh"],
    meta: { cuisine: "Healthy" },
  },
];

export const WATCH_CATALOG: CatalogItem[] = [
  {
    id: "movie_tt0111161",
    type: "movie",
    title: "The Shawshank Redemption",
    subtitle: "1994 · Drama",
    image: "https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
    tags: ["classic", "hope"],
    meta: { year: 1994, rating: 9.3 },
  },
  {
    id: "movie_tt0068646",
    type: "movie",
    title: "The Godfather",
    subtitle: "1972 · Crime · Drama",
    image: "https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
    tags: ["mafia", "family"],
    meta: { year: 1972, rating: 9.2 },
  },
  {
    id: "movie_tt0468569",
    type: "movie",
    title: "The Dark Knight",
    subtitle: "2008 · Action · Crime",
    image: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    tags: ["superhero", "chaos"],
    meta: { year: 2008, rating: 9.0 },
  },
  {
    id: "movie_tt0167260",
    type: "movie",
    title: "The Lord of the Rings: Return of the King",
    subtitle: "2003 · Adventure · Fantasy",
    image: "https://image.tmdb.org/t/p/w500/rCzpDGLbOoPwLjy3OAm5NUPHTtU.jpg",
    tags: ["epic", "fantasy"],
    meta: { year: 2003, rating: 8.9 },
  },
  {
    id: "movie_tt0109830",
    type: "movie",
    title: "Forrest Gump",
    subtitle: "1994 · Drama · Romance",
    image: "https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg",
    tags: ["heartfelt", "classic"],
    meta: { year: 1994, rating: 8.8 },
  },
  {
    id: "movie_tt0137523",
    type: "movie",
    title: "Fight Club",
    subtitle: "1999 · Drama",
    image: "https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
    tags: ["twist", "cult"],
    meta: { year: 1999, rating: 8.8 },
  },
  {
    id: "movie_tt0110912",
    type: "movie",
    title: "Pulp Fiction",
    subtitle: "1994 · Crime · Drama",
    image: "https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
    tags: ["non-linear", "iconic"],
    meta: { year: 1994, rating: 8.9 },
  },
  {
    id: "movie_tt0816692",
    type: "movie",
    title: "Interstellar",
    subtitle: "2014 · Sci-Fi · Drama",
    image: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU3MNfeM8.jpg",
    tags: ["space", "emotional"],
    meta: { year: 2014, rating: 8.6 },
  },
];

export const TEMPLATES = {
  eat: {
    id: "eat",
    label: "Where to eat",
    emoji: "🍽️",
    description: "Pick dinner without the debate",
    catalog: EAT_CATALOG,
    accent: "primary" as const,
  },
  watch: {
    id: "watch",
    label: "What to watch",
    emoji: "🎬",
    description: "Movie night, no veto wars",
    catalog: WATCH_CATALOG,
    accent: "accent" as const,
  },
} as const;

export type TemplateId = keyof typeof TEMPLATES;
