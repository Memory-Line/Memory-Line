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

export function occasionBySlug(slug: string) {
  return OCCASIONS.find((o) => o.slug === slug);
}

export function occasionHref(label: string): string {
  return `/dashboard/occasions/${occasionSlug(label)}`;
}

// Categories that don't get themed/seasonal variants — routine or
// reference-style content rather than one-off occasion packs — so they're
// left out of the occasion pages, even though they still show up
// everywhere else (sidebar, dashboard home, etc).
const EXCLUDED_CATEGORIES = new Set([
  "Physical & Exercise",
  "Sing-Alongs",
  "Communication Cards",
  "BSL Tools",
]);

export const THEMEABLE_CATEGORIES = CATEGORIES.filter((c) => !EXCLUDED_CATEGORIES.has(c.key));
