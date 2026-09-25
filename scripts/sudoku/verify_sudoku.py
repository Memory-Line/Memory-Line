"""Check a generated Sudoku pack by reading the numbers back out of the PDFs.

For every puzzle it checks that:
  - all three files exist (Standard, A3 Large Print, Answers);
  - the answer sheet is a correctly completed grid;
  - it agrees with every number given in the puzzle (and the large print);
  - the puzzle has exactly one solution;
  - no puzzle repeats within a level.

Usage: python verify_sudoku.py PACK_DIR
"""

import os
import sys

from pypdf import PdfReader

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from generate_sudoku import LEVELS, count_solutions, peers_of  # noqa: E402


def grid_from_pdf(path, size, cells):
    """The grid's numbers, read from their positions on the page (0 = empty)."""
    page = PdfReader(path).pages[0]
    width = float(page.mediabox.width)
    s = width / 595  # large print is drawn at A4 scale then enlarged
    grid_pt = 380 if size > 4 else 340
    cell = grid_pt / size
    gx, gy = (595 - grid_pt) / 2, 297 + (430 - grid_pt) / 2
    found = [0] * cells

    def visit(text, cm, tm, font, fontsize):
        t = text.strip()
        if not t.isdigit() or len(t) != 1:
            return
        x = (tm[4] * cm[0] + cm[4]) / s
        y = (tm[5] * cm[3] + cm[5]) / s
        if not (gx <= x <= gx + grid_pt and gy <= y <= gy + grid_pt):
            return
        col = int((x - gx) // cell)
        row = int((gy + grid_pt - y) // cell)
        if 0 <= row < size and 0 <= col < size:
            found[row * size + col] = int(t)

    page.extract_text(visitor_text=visit)
    return found


def valid_solution(grid, size, peers):
    return all(v and all(grid[p] != v for p in peers[i]) for i, v in enumerate(grid))


def main():
    pack = sys.argv[1]
    problems = 0
    for key, level in LEVELS.items():
        size, cells = level["size"], level["size"] ** 2
        peers = peers_of(size, level["box"])
        base = os.path.join(pack, level["label"])
        standard = sorted(os.listdir(os.path.join(base, "Standard")))
        seen = set()
        for name in standard:
            n = int(name.split("-")[0])
            stem = f"{level['label']}-Sudoku-{n}"
            paths = {
                "standard": os.path.join(base, "Standard", name),
                "large": os.path.join(base, "A3 Large Print", f"{n:04d}-Large-Print-{stem}.pdf"),
                "answers": os.path.join(base, "Answers", f"{n:04d}-Answers-{stem}.pdf"),
            }
            missing = [k for k, p in paths.items() if not os.path.exists(p)]
            if missing:
                print(f"{level['label']} {n}: missing {missing}")
                problems += 1
                continue
            puzzle = grid_from_pdf(paths["standard"], size, cells)
            large = grid_from_pdf(paths["large"], size, cells)
            answer = grid_from_pdf(paths["answers"], size, cells)
            issues = []
            if large != puzzle:
                issues.append("large print differs from standard")
            if not valid_solution(answer, size, peers):
                issues.append("answer sheet is not a valid solution")
            if any(v and answer[i] != v for i, v in enumerate(puzzle)):
                issues.append("answer disagrees with the puzzle")
            if sum(1 for v in puzzle if v) != level["givens"]:
                issues.append(f"{sum(1 for v in puzzle if v)} givens")
            if count_solutions(puzzle, size, peers, limit=2)[0] != 1:
                issues.append("not exactly one solution")
            sig = "".join(map(str, puzzle))
            if sig in seen:
                issues.append("duplicate puzzle")
            seen.add(sig)
            if issues:
                problems += 1
                print(f"{level['label']} {n}: {'; '.join(issues)}")
        print(f"{level['label']}: checked {len(standard)} puzzles", flush=True)
    print("ALL GOOD" if problems == 0 else f"{problems} PROBLEMS")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
