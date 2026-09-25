"""Read the Bingo pack's cards into data for the online card checker.

Each card is B-I-N-G-O: 5 columns x 5 rows, a FREE middle square and 24
numbers (B 1-15, I 16-30, N 31-45, G 46-60, O 61-75). This rebuilds each
card's grid from the numbers' positions under the B, I, N, G, O headings
and checks every column's numbers are in its range.

Usage: python extract_bingo.py STANDARD_DIR OUT_JSON
"""

import json
import os
import re
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "crossword"))
from extract_crosswords import read_items  # noqa: E402

RANGES = [(1, 15), (16, 30), (31, 45), (46, 60), (61, 75)]


def build(path):
    items = read_items(path)
    heads = {t: x for x, y, s, t in items if t in "BINGO" and len(t) == 1}
    cols_x = [heads[h] for h in "BINGO"]
    nums = [(x, y, int(t)) for x, y, s, t in items if t.isdigit() and s > 20]
    # Rows come from the numbers (FREE sits a few points higher than the
    # numbers in its row).
    ys = sorted({round(y) for _, y, _ in nums}, reverse=True)
    grid = [[0] * 5 for _ in range(5)]
    for x, y, n in nums:
        col = min(range(5), key=lambda k: abs(cols_x[k] - x))
        row = min(range(len(ys)), key=lambda k: abs(ys[k] - y))
        grid[row][col] = n
    problems = []
    if len(ys) != 5 or len(nums) != 24:
        problems.append(f"{len(ys)} rows, {len(nums)} numbers")
    if grid[2][2] != 0:
        problems.append("middle square isn't FREE")
    for c, (lo, hi) in enumerate(RANGES):
        for r in range(5):
            v = grid[r][c]
            if (r, c) != (2, 2) and not lo <= v <= hi:
                problems.append(f"{'BINGO'[c]} column has {v}")
    if len({v for row in grid for v in row if v}) != 24:
        problems.append("repeated number")
    return grid, problems


def main():
    src, out = sys.argv[1], sys.argv[2]
    data, bad = [], 0
    for name in sorted(os.listdir(src)):
        m = re.match(r"(\d+)-", name)
        if not m or not name.lower().endswith(".pdf"):
            continue
        grid, problems = build(os.path.join(src, name))
        for p in problems:
            print(f"{name}: {p}")
        bad += bool(problems)
        data.append({"n": int(m.group(1)), "grid": grid})
    with open(out, "w", encoding="utf-8") as f:
        json.dump(data, f, separators=(",", ":"))
    distinct = len({json.dumps(e["grid"]) for e in data})
    print(f"{len(data)} cards ({distinct} different), {bad} with problems")


if __name__ == "__main__":
    main()
