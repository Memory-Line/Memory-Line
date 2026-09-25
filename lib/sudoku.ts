import puzzles from "@/lib/data/sudokuPuzzles.json";

// The numbers behind each Sudoku PDF, for playing online. Made by
// scripts/sudoku/generate_sudoku.py --json from the same seeds as the PDFs,
// so puzzle n of a level here is the one in "000n-<Level>-Sudoku-n.pdf".
export const SUDOKU_LEVELS = {
  beginner: { size: 4, boxRows: 2, boxCols: 2 },
  intermediate: { size: 6, boxRows: 2, boxCols: 3 },
  advanced: { size: 9, boxRows: 3, boxCols: 3 },
} as const;

export type SudokuLevel = keyof typeof SUDOKU_LEVELS;

export function isSudokuLevel(level: unknown): level is SudokuLevel {
  return typeof level === "string" && level in SUDOKU_LEVELS;
}

// Puzzle and solution as digit strings ("0" = empty), row by row.
export function sudokuPuzzle(level: SudokuLevel, n: number) {
  const entry = (puzzles as Record<string, { n: number; puzzle: string; solution: string }[]>)[level]?.[n - 1];
  return entry && entry.n === n ? { puzzle: entry.puzzle, solution: entry.solution } : null;
}
