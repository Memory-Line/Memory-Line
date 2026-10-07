import { OCCASIONS, occasionSlug } from "@/lib/occasions";

// The calendar activity packs (Word Searches, Guess the Word, Crosswords, Trivia
// and Word Bingo for each date) are built one zip per date, and every file's
// folder path says where it belongs:
//   <number>-<date>/<Format>/<Worksheets | Answers | Large Print | Caller Sheet>/<file>.pdf
// This turns that path into the site's occasion and category.

// The pack's date number -> the calendar date it belongs to on the site (by its
// label in lib/ukCalendar.ts). null = a date the site's calendar doesn't have
// (yet), so there's nowhere to put it.
const PACK_DATES: Record<string, string | null> = {
  "00a": "Christmas Day",
  "00b": "Halloween",
  "01": "New Year's Day",
  "02": "Twelfth Night",
  "03": "Burns Night",
  "04": "Chinese / Lunar New Year",
  "05": "Pancake Day (Shrove Tuesday)",
  "06": "Ash Wednesday",
  "07": "Valentine's Day",
  "08": "St David's Day",
  "09": "Mother's Day (Mothering Sunday)",
  "10": "International Women's Day",
  "11": "St Patrick's Day",
  "12": "First day of spring",
  "13": "Palm Sunday",
  "14": "Easter Sunday",
  "15": "April Fool's Day",
  "16": "St George's Day",
  "17": "May Day",
  "18": "VE Day",
  "19": "International Nurses Day",
  "20": "Chelsea Flower Show begins",
  "21": "D-Day anniversary",
  "22": "Father's Day",
  "23": "First day of summer",
  "24": "Wimbledon begins",
  "25": "American Independence Day",
  "26": "World Chocolate Day",
  "27": "Yorkshire Day",
  "28": "International Cat Day",
  "29": "VJ Day",
  "30": "Notting Hill Carnival begins",
  "31": "Battle of Britain Day",
  "32": "World Alzheimer's Day",
  "33": "First day of autumn",
  "34": null, // Harvest Festival: not on the calendar
  "35": "International Day of Older Persons",
  "36": "World Mental Health Day",
  "37": "All Saints' Day",
  "38": "Bonfire Night (Guy Fawkes Night)",
  "39": "Armistice Day",
  "40": "Remembrance Sunday",
  "41": "Advent begins",
  "42": "St Andrew's Day",
  "43": "St Nicholas Day",
  "44": "First day of winter",
  "45": "Hanukkah begins at sunset",
  "46": "Boxing Day",
  "47": "New Year's Eve",
};

// The format folder -> the site's category.
const FORMATS: Record<string, string> = {
  "Word-Search": "Word Searches",
  "Guess-the-Word": "Guess the Word",
  Crossword: "Crosswords",
  Trivia: "Trivia",
  "Word-Bingo": "Bingo",
};

export type PackKind = "worksheet" | "answers" | "largePrint";

export type PackFile = {
  path: string;
  prefix: string; // "24", "00a" ...
  occasion: string | null; // the site's occasion slug, or null if that date isn't on the calendar
  category: string;
  kind: PackKind;
};

// Works out where a file belongs from its path. Returns null if the path isn't
// part of a calendar pack (no date number, format or variant folder).
export function parsePackPath(path: string): PackFile | null {
  const parts = path.split("/");
  const dated = parts.find((p) => /^\d{2}[ab]?-/.test(p));
  if (!dated) return null;
  const prefix = dated.split("-")[0];
  const category = parts.map((p) => FORMATS[p]).find(Boolean);
  if (!category) return null;
  const variant = parts.find((p) => ["Worksheets", "Answers", "Large Print", "Caller Sheet"].includes(p));
  if (!variant) return null;
  const name = parts[parts.length - 1];
  const kind: PackKind =
    variant === "Answers" ? "answers" : variant === "Large Print" || /large[-_\s]?print/i.test(name) ? "largePrint" : "worksheet";

  const label = prefix in PACK_DATES ? PACK_DATES[prefix] : null;
  const slug = label ? occasionSlug(label) : null;
  const occasion = slug && OCCASIONS.some((o) => o.slug === slug) ? slug : null;
  return { path, prefix, occasion, category, kind };
}
