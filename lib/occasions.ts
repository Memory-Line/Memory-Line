import { CATEGORIES } from "@/lib/data";
import { occasionsForYear } from "@/lib/ukCalendar";

// Every pre-loaded calendar event gets its own set of activities, kept
// separate from the main category library. Uploads for an occasion are
// tagged with its slug (Template.occasion); untagged uploads are the
// regular library. The list comes from the calendar's own occasions
// (lib/ukCalendar.ts), so the two always match; substitute bank holidays
// are left out, since they link to the day they stand in for.
export const OCCASION_LABELS = Array.from(
  new Set(
    occasionsForYear(2027)
      .filter((e) => !e.occasion)
      .map((e) => e.label)
  )
);

export function occasionSlug(label: string): string {
  return label
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const OCCASIONS = OCCASION_LABELS.map((label) => ({ label, slug: occasionSlug(label) }));

// Occasions the calendar used to have (up to September 2026) that it no
// longer shows: the combined Christmas Eve / Hanukkah day (they only fall
// together in some years) and the substitute Christmas bank holidays (which
// now link to the day they stand in for). Their pages still work, and the
// occasions list shows them only if something was uploaded to them, so no
// uploads are lost.
export const LEGACY_OCCASIONS = [
  "Christmas Eve / Hanukkah begins at sunset",
  "Christmas bank holiday (substitute)",
  "Boxing Day bank holiday (substitute)",
].map((label) => ({ label, slug: occasionSlug(label) }));

export function occasionBySlug(slug: string) {
  return (
    OCCASIONS.find((o) => o.slug === slug) ?? LEGACY_OCCASIONS.find((o) => o.slug === slug)
  );
}

export function occasionHref(label: string): string {
  return `/dashboard/occasions/${occasionSlug(label)}`;
}

// The only categories that get themed activities for each occasion. Every other
// category is left off the occasion pages, even though it still shows up
// everywhere else (sidebar, dashboard home, etc).
const OCCASION_CATEGORY_KEYS = ["Crosswords", "Word Searches", "Guess the Word", "Trivia", "Bingo"];

export const THEMEABLE_CATEGORIES = CATEGORIES.filter((c) => OCCASION_CATEGORY_KEYS.includes(c.key));
