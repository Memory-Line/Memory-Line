import quizzes from "@/lib/data/trivia.json";
import redone from "@/lib/data/redone/trivia.json";

// The questions behind each Trivia PDF, for playing online. Read out of the
// answer sheets by scripts/trivia/extract_trivia.py; entry n is the sheet
// whose file name starts with n. `answer` is the index of the right choice.
export type TriviaQuestion = { q: string; options: string[]; answer: number };
export type TriviaQuiz = { n: number; questions: TriviaQuestion[] };

// The redone quizzes are numbered 1-50 within each topic, so they are found by topic and number.
const REDONE = new Map((redone as unknown as (TriviaQuiz & { t: string })[]).map((e) => [`${e.t}/${e.n}`, e]));

export function triviaQuiz(n: number, topic?: string | null): TriviaQuiz | null {
  if (topic) return REDONE.get(`${topic}/${n}`) ?? null;
  const entry = (quizzes as TriviaQuiz[])[n - 1];
  return entry && entry.n === n ? entry : null;
}
