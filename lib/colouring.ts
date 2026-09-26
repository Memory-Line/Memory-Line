import colouringPages from "@/lib/data/colouringPages.json";

// The picture frame on each Colouring Page PDF, for playing online. Read out
// of the PDFs by scripts/colouring/extract_colouring.py; entry n is the sheet
// whose file name starts with n ("001-garden-bench-...-colouring-page.pdf").
// The frame is the box the line drawing sits in, as fractions of the page
// (US-letter landscape, 792x612) measured from the top-left, matching how a
// <canvas> is drawn.
export type ColouringFrame = { x: number; y: number; w: number; h: number };
export type ColouringPage = { n: number; frame: ColouringFrame };

export function colouringPage(n: number): ColouringPage | null {
  const entry = (colouringPages as ColouringPage[]).find((e) => e.n === n);
  return entry ?? null;
}
