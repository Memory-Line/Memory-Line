import boardsData from "@/lib/data/snakesAndLadders.json";

// The ladders, snakes and square positions behind each Snakes and Ladders
// board PDF, for playing online. Read out of the boards' own artwork by
// scripts/snakesandladders/extract_snakesladders.py; entry n is the sheet
// whose file name starts with n ("001-Snakes-and-Ladders-Board.pdf").
// `squares` gives each square 1-100's centre as a fraction of the page
// (x, y from the top-left), so the player can place counters on the board
// image without knowing the PDF's page size.
export type SnakesAndLaddersMove = { type: "ladder" | "snake"; from: number; to: number };
export type SnakesAndLaddersBoard = {
  n: number;
  moves: SnakesAndLaddersMove[];
  squares: Record<string, [number, number]>;
};

export function snakesAndLaddersBoard(n: number): SnakesAndLaddersBoard | null {
  const entry = (boardsData as SnakesAndLaddersBoard[])[n - 1];
  return entry && entry.n === n ? entry : null;
}
