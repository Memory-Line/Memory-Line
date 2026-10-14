// The notes under a calendar month are kept as text, one line per row. A line can carry its own
// font colour: a hidden marker "⟦#RRGGBB⟧" at the start of the line. Lines without a marker (notes
// saved before multi-colour notes) use the note's single colour.
const TAG = /^⟦(#[0-9A-Fa-f]{6})⟧/;

export type NoteLine = { text: string; colour: string };

export function parseNoteLines(raw: string, fallback: string): NoteLine[] {
  return raw.split("\n").map((l) => {
    const m = l.match(TAG);
    return m ? { text: l.slice(m[0].length), colour: m[1] } : { text: l, colour: fallback };
  });
}

export function serialiseNoteLines(lines: NoteLine[]): string {
  return lines.map((l) => `⟦${l.colour}⟧${l.text}`).join("\n");
}

// True when there is no real writing (only markers, spaces or empty bullets).
export function noteIsEmpty(raw: string): boolean {
  return parseNoteLines(raw, "#000000").every((l) => l.text.replace(/^•\s*/, "").trim() === "");
}
