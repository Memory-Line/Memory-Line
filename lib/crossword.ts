import crosswords from "@/lib/data/crosswords.json";

// The grid and clues behind each Crossword PDF, for playing online. Read out
// of the answer sheets by scripts/crossword/extract_crosswords.py; entry n is
// the sheet whose file name starts with n ("001-Seaside-Holidays.pdf").
export type CrosswordClue = {
  num: number;
  row: number;
  col: number;
  answer: string;
  clue: string;
  lengths: string;
};
export type Crossword = {
  n: number;
  rows: number;
  cols: number;
  // One string per row; "." is a blocked square.
  solution: string[];
  numbers: [number, number, number][];
  across: CrosswordClue[];
  down: CrosswordClue[];
};

export function crossword(n: number): Crossword | null {
  const entry = (crosswords as Crossword[])[n - 1];
  return entry && entry.n === n ? entry : null;
}
