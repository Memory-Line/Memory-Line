// Categories whose activities are split into sub-categories that people
// pick first (e.g. Sudoku → Beginner / Intermediate / Advanced). Uploads in
// these categories are tagged with the sub-category's slug
// (Template.subcategory). Communication Cards' languages work the same way
// but have their own pages (lib/languages.ts).
export type Subcategory = { slug: string; label: string; description: string };

export const SUBCATEGORIES: Record<string, Subcategory[]> = {
  Sudoku: [
    { slug: "beginner", label: "Beginner", description: "4×4 grids, numbers 1 to 4" },
    { slug: "intermediate", label: "Intermediate", description: "6×6 grids, numbers 1 to 6" },
    { slug: "advanced", label: "Advanced", description: "9×9 grids, numbers 1 to 9" },
    { slug: "expert", label: "Expert", description: "9×9 grids, fewer starting numbers" },
    { slug: "master", label: "Master", description: "9×9 grids, the toughest of the four" },
  ],
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
  for (const part of path.split("/")) {
    const name = part.toLowerCase().replace(/^\d+[-_\s]*/, "").trim();
    const match = options.find((s) => s.slug === name || s.label.toLowerCase() === name);
    if (match) return match.slug;
  }
  return null;
}
