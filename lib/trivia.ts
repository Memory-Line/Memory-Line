import quizzes from "@/lib/data/trivia.json";

// The questions behind each Trivia PDF, for playing online. Read out of the
// answer sheets by scripts/trivia/extract_trivia.py; entry n is the sheet
// whose file name starts with n. `answer` is the index of the right choice.
export type TriviaQuestion = { q: string; options: string[]; answer: number };
export type TriviaQuiz = { n: number; questions: TriviaQuestion[] };

export function triviaQuiz(n: number): TriviaQuiz | null {
  const entry = (quizzes as TriviaQuiz[])[n - 1];
  return entry && entry.n === n ? entry : null;
}
