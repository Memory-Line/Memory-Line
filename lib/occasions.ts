import { CATEGORIES } from "@/lib/data";
import { occasionsForYear } from "@/lib/ukCalendar";
import { PACK_DATES } from "@/lib/packDates";

// The calendar dates that have their own set of activities, kept separate from
// the main category library. Uploads for an occasion are tagged with its slug
// (Template.occasion); untagged uploads are the regular library. The list is
// the dates in lib/packDates.ts that have activities, matched to the calendar's
// own dates (lib/ukCalendar.ts); every other date (bank holidays and so on)
// still shows on the calendar but has no activities page. Substitute bank
// holidays link to the day they stand in for.
const WITH_ACTIVITIES = new Set(Object.values(PACK_DATES).filter((l): l is string => !!l));

export const OCCASION_LABELS = Array.from(
  new Set(
    occasionsForYear(2027)
      .filter((e) => !e.occasion)
      .map((e) => e.label)
  )
).filter((label) => WITH_ACTIVITIES.has(label));

// Dates that share another date's activities. All of December except Hanukkah and New Year is Christmas (and New Year's Eve shares New Year's Day), so these
// link to the Christmas Day activities instead of having activities of their own.
const ALIASES: Record<string, string> = {
  "Advent begins": "Christmas Day",
  "St Nicholas Day": "Christmas Day",
  "First day of winter": "Christmas Day",
  "Christmas Eve": "Christmas Day",
  "Boxing Day": "Christmas Day",
  "New Year's Eve": "New Year's Day",
};
export const occasionLabelFor = (label: string) => ALIASES[label] ?? label;

export function occasionSlug(label: string): string {
  return label
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const OCCASIONS = OCCASION_LABELS.map((label) => ({ label, slug: occasionSlug(label) }));

// Occasions the calendar used to have (up to November 2026) that it no
// longer shows: the combined Christmas Eve / Hanukkah day (they only fall
// together in some years) and the substitute Christmas bank holidays (which
// now link to the day they stand in for). Their pages still work, and the
// occasions list shows them only if something was uploaded to them, so no
// uploads are lost.
export const LEGACY_OCCASIONS = [
  "Advent begins",
  "St Nicholas Day",
  "First day of winter",
  "Boxing Day",
  "American Independence Day",
  "Battle of the Boyne (NI)",
  "Notting Hill Carnival begins",
  "Christmas Eve / Hanukkah begins at sunset",
  "Christmas bank holiday (substitute)",
  "Boxing Day bank holiday (substitute)",
].map((label) => ({ label, slug: occasionSlug(label) }));

export function occasionBySlug(slug: string) {
  return (
    OCCASIONS.find((o) => o.slug === slug) ?? LEGACY_OCCASIONS.find((o) => o.slug === slug)
  );
}

// The links from calendar dates (and the dashboard banner) to each occasion's themed activities are hidden
// until the themed content is finished. Set to true to show them again; the occasion pages themselves still work.
export const OCCASION_LINKS_VISIBLE = false;

// Occasions switched on for everyone, whatever OCCASION_LINKS_VISIBLE says. Add a slug here to open one up.
export const LIVE_OCCASIONS = ["christmas-day", "new-years-day"];
export const isOccasionLive = (label: string) => OCCASION_LINKS_VISIBLE || LIVE_OCCASIONS.includes(occasionSlug(label));

export function occasionHref(label: string): string {
  return `/dashboard/occasions/${occasionSlug(label)}`;
}

// The only categories that get themed activities for each occasion. Every other
// category is left off the occasion pages, even though it still shows up
// everywhere else (sidebar, dashboard home, etc).
const OCCASION_CATEGORY_KEYS = ["Crosswords", "Word Searches", "Guess the Word", "Colouring Pages", "Matching Pairs", "Remembrance Cards"];

export const THEMEABLE_CATEGORIES = CATEGORIES.filter((c) => OCCASION_CATEGORY_KEYS.includes(c.key));
