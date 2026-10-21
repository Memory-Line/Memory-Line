import words from "@/lib/data/bingoNumberWords.json";
import { BINGO_CALLS, bingoLetter } from "@/lib/bingo";
import { BINGO_LANGS } from "@/lib/bingoLangs";

// What the Bingo caller says for each number in the other languages: the number written out in words (for
// example "dwadzieścia trzy"), not the digits, so every voice says it in its own language. The words are in
// lib/data/bingoNumberWords.json (numbers 1 to 75, in order); a native speaker has been asked to check the
// ones written by hand. If a language has no words the digits are used.
const WORDS = words as Record<string, string[]>;

export function bingoWord(code: string, n: number): string {
  return WORDS[code]?.[n - 1] ?? String(n);
}

// Every recording the caller can ask for: English "B. 7." and the traditional calls, then each other
// language's number words. Used by the admin page that prepares them all in advance.
export function bingoVoiceJobs(): { lang: string; voice: "female" | "male"; text: string }[] {
  const jobs: { lang: string; voice: "female" | "male"; text: string }[] = [];
  for (const voice of ["female", "male"] as const) {
    for (let n = 1; n <= 75; n++) {
      jobs.push({ lang: "en", voice, text: `${bingoLetter(n)}. ${n}.` });
      if (BINGO_CALLS[n]) jobs.push({ lang: "en", voice, text: `${BINGO_CALLS[n]}.` });
    }
    for (const l of BINGO_LANGS) for (let n = 1; n <= 75; n++) jobs.push({ lang: l.code, voice, text: bingoWord(l.code, n) });
  }
  return jobs;
}
