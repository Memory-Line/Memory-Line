import crosswords from "@/lib/data/crosswords.json";
import redone from "@/lib/data/redone/crosswords.json";

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

// The redone Crosswords are numbered 1-50 within each topic, so they are found by topic and number.
const REDONE = new Map((redone as unknown as (Crossword & { t: string })[]).map((e) => [`${e.t}/${e.n}`, e]));

export function crossword(n: number, topic?: string | null): Crossword | null {
  if (topic) return REDONE.get(`${topic}/${n}`) ?? null;
  const entry = (crosswords as Crossword[])[n - 1];
  return entry && entry.n === n ? entry : null;
}
