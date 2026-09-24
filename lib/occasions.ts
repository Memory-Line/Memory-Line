import { CATEGORIES } from "@/lib/data";

// Every pre-loaded calendar event gets its own set of activities, kept
// separate from the main category library. Uploads for an occasion are
// tagged with its slug (Template.occasion); untagged uploads are the
// regular library. Keep this list in step with the calendar's events.
export const OCCASION_LABELS = [
  "New Year's Day",
  "Bank holiday (Scotland)",
  "Twelfth Night",
  "Burns Night",
  "Chinese / Lunar New Year",
  "Pancake Day (Shrove Tuesday)",
  "Ash Wednesday",
  "Valentine's Day",
  "St David's Day",
  "Mother's Day (Mothering Sunday)",
  "International Women's Day",
  "St Patrick's Day",
  "First day of spring",
  "Palm Sunday",
  "Good Friday",
  "Easter Sunday",
  "Easter Monday",
  "April Fool's Day",
  "St George's Day",
  "May Day",
  "Early May bank holiday",
  "VE Day",
  "International Nurses Day",
  "Chelsea Flower Show begins",
  "Chelsea Flower Show ends",
  "Spring bank holiday",
  "D-Day anniversary",
  "Father's Day",
  "First day of summer",
  "Wimbledon begins",
  "American Independence Day",
  "World Chocolate Day",
  "Wimbledon ends",
  "Battle of the Boyne (NI)",
  "Yorkshire Day",
  "Summer bank holiday (Scotland)",
  "International Cat Day",
  "VJ Day",
  "Notting Hill Carnival begins",
  "Summer bank holiday",
  "Battle of Britain Day",
  "World Alzheimer's Day",
  "First day of autumn",
  "International Day of Older Persons",
  "World Mental Health Day",
  "Halloween",
  "All Saints' Day",
  "Bonfire Night (Guy Fawkes Night)",
  "Armistice Day",
  "Remembrance Sunday",
  "Advent begins",
  "St Andrew's Day",
  "St Nicholas Day",
  "First day of winter",
  "Christmas Eve / Hanukkah begins at sunset",
  "Christmas Day",
  "Boxing Day",
  "Christmas bank holiday (substitute)",
  "Boxing Day bank holiday (substitute)",
  "New Year's Eve",
];

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
