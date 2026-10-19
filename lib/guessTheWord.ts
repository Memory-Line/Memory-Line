import puzzles from "@/lib/data/guessTheWord.json";
import redone from "@/lib/data/redone/guessTheWord.json";

// The clue and answer behind each Guess the Word PDF, for playing online.
// Read out of the answer sheets by scripts/guesstheword/extract_guesstheword.py;
// entry n is the sheet whose file name starts with n.
export type GuessTheWord = { n: number; clue: string; tries: number; answer: string };

// The redone puzzles are numbered 1-50 within each topic, so they are found by topic and number.
const REDONE = new Map((redone as (GuessTheWord & { t: string })[]).map((e) => [`${e.t}/${e.n}`, e]));

export function guessTheWord(n: number, topic?: string | null): GuessTheWord | null {
  if (topic) return REDONE.get(`${topic}/${n}`) ?? null;
  const entry = (puzzles as GuessTheWord[])[n - 1];
  return entry && entry.n === n ? entry : null;
}
