import wordSearches from "@/lib/data/wordSearches.json";

// The letters and words behind each Word Search PDF, for playing online.
// Read out of the PDFs by scripts/wordsearch/extract_wordsearches.py; entry n
// is the sheet whose file name starts with n ("001-Seaside-Holidays.pdf").
// Each word lists every place it appears as [startRow, startCol, endRow,
// endCol] (short words can appear more than once).
export type WordSearchWord = { word: string; at: [number, number, number, number][] };
export type WordSearch = { n: number; grid: string[]; words: WordSearchWord[] };

export function wordSearch(n: number): WordSearch | null {
  const entry = (wordSearches as WordSearch[])[n - 1];
  return entry && entry.n === n ? entry : null;
}
