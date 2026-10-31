// Categories whose activities are split into sub-categories that people
// pick first (e.g. Sudoku → Beginner / Intermediate / Advanced). Uploads in
// these categories are tagged with the sub-category's slug
// (Template.subcategory). Communication Cards' languages work the same way
// but have their own pages (lib/languages.ts).
export type Subcategory = { slug: string; label: string; description: string };

// The ten topics every redone category is sorted into (Newsletters, Crosswords, ...).
const TOPICS: Subcategory[] = [
  { slug: "animals-and-birds", label: "Animals & Birds", description: "Pets, farm animals, wildlife and the birds of Britain" },
  { slug: "flowers-and-gardening", label: "Flowers & Gardening", description: "Gardens, flowers, shows and growing things" },
  { slug: "seasons-and-nature", label: "Seasons & Nature", description: "The changing year, weather and the countryside" },
  { slug: "food-and-drink", label: "Food & Drink", description: "Favourite foods, drinks and kitchen memories" },
  { slug: "home-and-everyday-life", label: "Home & Everyday Life", description: "Life at home, school days, shopping and household things" },
  { slug: "work-and-occupations", label: "Work & Occupations", description: "Jobs, trades and the working lives of the past" },
  { slug: "places-and-travel", label: "Places & Travel", description: "Journeys, railways, ships and famous places" },
  { slug: "hobbies-and-leisure", label: "Hobbies & Leisure", description: "Sport, games, crafts and pastimes" },
  { slug: "music-and-entertainment", label: "Music & Entertainment", description: "Songs, shows, radio, television and the cinema" },
  { slug: "celebrations-and-special-occasions", label: "Celebrations & Special Occasions", description: "Festivals, holidays, weddings and traditions" },
];

// Categories sorted into the ten topics (add a category here when its redone activities are ready).
export const TOPIC_CATEGORIES = [
  "Word Searches",
  "Crosswords",
  "Guess the Word",
  "Trivia",
  "Colouring Pages",
  "Conversation Starters",
  "Matching Pairs",
  "Remembrance Cards",
  "Spot the Difference",
];

function topicsWith(descriptions: Record<string, string>): Subcategory[] {
  return TOPICS.map((t) => ({ ...t, description: descriptions[t.slug] ?? t.description }));
}

export function usesTopics(categoryKey: string): boolean {
  return categoryKey === "Newsletters" || TOPIC_CATEGORIES.includes(categoryKey);
}

// Activities uploaded before a category was sorted into topics have no sub-category. They stay
// reachable under this tile (shown only while there are any), so nothing disappears.
export const EARLIER: Subcategory = {
  slug: "other",
  label: "Earlier activities",
  description: "Activities not yet sorted into a topic",
};

export const SUBCATEGORIES: Record<string, Subcategory[]> = {
  Sudoku: [
    { slug: "beginner", label: "Beginner", description: "4×4 grids, numbers 1 to 4" },
    { slug: "intermediate", label: "Intermediate", description: "6×6 grids, numbers 1 to 6" },
    { slug: "advanced", label: "Advanced", description: "9×9 grids, numbers 1 to 9" },
    { slug: "expert", label: "Expert", description: "9×9 grids, fewer starting numbers" },
    { slug: "master", label: "Master", description: "9×9 grids, the toughest of the five" },
  ],
  Newsletters: topicsWith({
    "animals-and-birds": "Pets, wildlife, famous animals and the birds of Britain",
    "flowers-and-gardening": "Gardens, flowers, shows and the people who grow them",
    "seasons-and-nature": "Weather, countryside, national parks and the changing year",
    "food-and-drink": "Favourite foods, drinks, shops and kitchen memories",
    "home-and-everyday-life": "Life at home, school days, shopping and household inventions",
    "work-and-occupations": "Jobs, trades, factories and the working lives of the past",
    "places-and-travel": "Journeys, bridges, railways, ships and famous places",
    "hobbies-and-leisure": "Sport, games, crafts and pastimes",
    "music-and-entertainment": "Songs, shows, radio, television and the cinema",
    "celebrations-and-special-occasions": "Festivals, holidays, weddings and traditions through the year",
  }),
  // The same ten topics for every redone category.
  ...Object.fromEntries(TOPIC_CATEGORIES.map((k) => [k, topicsWith({})])),
};

export function subcategoriesFor(categoryKey: string): Subcategory[] | undefined {
  return SUBCATEGORIES[categoryKey];
}

export function subcategoryBySlug(categoryKey: string, slug: string): Subcategory | undefined {
  return SUBCATEGORIES[categoryKey]?.find((s) => s.slug === slug);
}

// Finds the sub-category from a folder path like
// "Activity Central Sudoku/Beginner/Answers/0001-….pdf" (a folder named
// after it). Returns null if no folder names one.
export function subcategoryFromPath(categoryKey: string, path: string): string | null {
  const options = SUBCATEGORIES[categoryKey];
  if (!options) return null;
  // "01-Animals-Birds" and "Animals & Birds" both mean animals-and-birds: compare the words, ignoring "and".
  const words = (v: string) => v.toLowerCase().replace(/^\d+[-_\s]*/, "").replace(/&/g, " ").split(/[^a-z]+/).filter((w) => w && w !== "and").join(" ");
  for (const part of path.split("/")) {
    const name = part.toLowerCase().replace(/^\d+[-_\s]*/, "").trim();
    const match = options.find(
      (s) => s.slug === name || s.label.toLowerCase() === name || s.label.toLowerCase().replace(/&/g, "and") === name || words(s.label) === words(part)
    );
    if (match) return match.slug;
  }
  return null;
}
