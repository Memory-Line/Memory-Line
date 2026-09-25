// Titles are generated from file names when activities are uploaded, which
// leaves a couple of stray bits on some packs:
//  - a numbered range, "001-008-cottage-kitchen-…" → "008 Cottage Kitchen …"
//    (Conversation Starters hold 8 prompts per file);
//  - a paper size, "…-matching-pairs-a4.pdf" → "… Matching Pairs A4".
// These tidy them for display, and new uploads get clean titles from the
// start.

const NUMBER_RANGE = /^\d+[-_]\d+[-_]/;
const PAPER_SIZE = /[-_\s]a\d$/i;

// The title to show for an activity already uploaded.
export function displayTitle(t: { title: string; fileName: string }): string {
  const name = (t.fileName.split(/[\/]/).pop() || t.fileName).replace(/\.[^/.]+$/, "");
  let title = t.title;
  if (NUMBER_RANGE.test(name)) title = title.replace(/^\d+\s+/, "");
  if (PAPER_SIZE.test(name)) title = title.replace(/\s+A\d$/i, "");
  return title;
}

// The title for a newly uploaded file: drops the leading number (or
// number range) and any paper size, and capitalises each word.
export function titleFromFilename(name: string): string {
  const withoutExt = name.replace(/\.[^/.]+$/, "");
  const withoutLeadingNumber = withoutExt.replace(/^\d+(?:[-_]\d+)?[-_.\s]*/, "");
  const withoutPaperSize = withoutLeadingNumber.replace(PAPER_SIZE, "");
  const spaced = withoutPaperSize.replace(/[-_]+/g, " ").trim();
  return spaced
    .split(" ")
    .map((word) => (word.length > 0 ? word[0].toUpperCase() + word.slice(1) : word))
    .join(" ");
}
