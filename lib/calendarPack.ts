import { OCCASIONS, occasionSlug } from "@/lib/occasions";
import { PACK_DATES } from "@/lib/packDates";

// The calendar activity packs (Word Searches, Guess the Word, Crosswords, Trivia
// and Word Bingo for each date) are built one zip per date, and every file's
// folder path says where it belongs:
//   <number>-<date>/<Format>/<Worksheets | Answers | Large Print | Caller Sheet>/<file>.pdf
// This turns that path into the site's occasion and category.


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
  occasion: string | null; // the site's occasion slug, or null if that date has no activities page
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

  return { path, prefix, occasion: occasionForPrefix(prefix), category, kind };
}

// The site's occasion slug for a pack's date number ("38" -> bonfire night), or
// null if that date has no activities page.
export function occasionForPrefix(prefix: string): string | null {
  const label = prefix in PACK_DATES ? PACK_DATES[prefix] : null;
  const slug = label ? occasionSlug(label) : null;
  return slug && OCCASIONS.some((o) => o.slug === slug) ? slug : null;
}
