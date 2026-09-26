import sets from "@/lib/data/matchingPairs.json";

// The eight picture positions behind each Matching Pairs Standard PDF, for
// playing online. Read out of the PDFs by
// scripts/matchingpairs/extract_matchingpairs.py; entry n is the sheet whose
// file name starts with n. Each picture's box is a fraction of the page
// (0,0 top-left to 1,1 bottom-right, the way a browser canvas works) so the
// player can crop it out of the PDF it loads itself.
export type MatchingPairsPicture = { left: number; top: number; right: number; bottom: number };
export type MatchingPairsSet = { n: number; theme: string; pictures: MatchingPairsPicture[] };

export function matchingPairsSet(n: number): MatchingPairsSet | null {
  const entry = (sets as MatchingPairsSet[]).find((s) => s.n === n);
  return entry ?? null;
}
