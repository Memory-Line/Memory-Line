// Picks "theme" words for a list of activity titles (Birds, Garden, Seaside...), so
// a long list can be narrowed with one tap. There is no hand-made theme list: the
// words come from the titles themselves, so they work for every category and for
// new uploads. A word is offered if it appears in at least a few titles but not
// in most of them (words like "Cards" that are in nearly every title don't help).

const STOP = new Set([
  "the", "and", "for", "with", "from", "your", "our", "you", "are", "all", "any", "set", "pack", "card", "cards",
  "activity", "activities", "sheet", "sheets", "worksheet", "worksheets", "large", "print", "answer", "answers",
  "page", "pages", "game", "games", "puzzle", "puzzles", "version", "standard", "day", "time", "about", "into",
  "this", "that", "what", "when", "where", "who", "how", "new", "part", "number",
]);

// "birds" and "bird" count as the same word.
const stem = (w: string) => (w.length > 4 && w.endsWith("ies") ? w.slice(0, -3) + "y" : w.length > 3 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w);

export function titleWords(title: string): string[] {
  return title
    .toLowerCase()
    .replace(/[^a-z\s'-]/g, " ")
    .split(/[\s-]+/)
    .map((w) => w.replace(/^'+|'+$/g, ""))
    .filter((w) => w.length >= 4 && !STOP.has(w));
}

export function themeWords(titles: string[], max = 24): string[] {
  const total = titles.length;
  if (total < 12) return [];
  const docFreq = new Map<string, { n: number; forms: Map<string, number> }>();
  for (const title of titles) {
    const seen = new Set<string>();
    for (const w of titleWords(title)) {
      const key = stem(w);
      if (seen.has(key)) continue;
      seen.add(key);
      const entry = docFreq.get(key) ?? { n: 0, forms: new Map() };
      entry.n++;
      entry.forms.set(w, (entry.forms.get(w) ?? 0) + 1);
      docFreq.set(key, entry);
    }
  }
  const minTitles = Math.max(3, Math.round(total * 0.01));
  return Array.from(docFreq.entries())
    .filter(([, e]) => e.n >= minTitles && e.n <= total * 0.4)
    .sort((a, b) => b[1].n - a[1].n || a[0].localeCompare(b[0]))
    .slice(0, max)
    .map(([, e]) => Array.from(e.forms.entries()).sort((a, b) => b[1] - a[1])[0][0])
    .sort((a, b) => a.localeCompare(b));
}
