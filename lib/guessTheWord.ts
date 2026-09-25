import puzzles from "@/lib/data/guessTheWord.json";

// The clue and answer behind each Guess the Word PDF, for playing online.
// Read out of the answer sheets by scripts/guesstheword/extract_guesstheword.py;
// entry n is the sheet whose file name starts with n.
export type GuessTheWord = { n: number; clue: string; tries: number; answer: string };

export function guessTheWord(n: number): GuessTheWord | null {
  const entry = (puzzles as GuessTheWord[])[n - 1];
  return entry && entry.n === n ? entry : null;
}
