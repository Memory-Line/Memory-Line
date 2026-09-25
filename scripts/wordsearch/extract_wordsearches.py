"""Read the Word Search pack's PDFs into data for playing them online.

For each Standard PDF it reads the letter grid and the word list, then finds
every word in the grid (any of the 8 directions) so the website knows where
each one is. Short words can appear more than once (e.g. "RED" inside another
word); every place is kept, so any real find counts. Checks each word is found.

Usage: python extract_wordsearches.py STANDARD_DIR OUT_JSON
"""

import json
import os
import re
import sys
from collections import defaultdict

from pypdf import PdfReader

DIRECTIONS = [(0, 1), (1, 0), (1, 1), (-1, 1), (0, -1), (-1, 0), (-1, -1), (1, -1)]


def read_sheet(path):
    items = []

    def visit(text, cm, tm, font, size):
        t = text.strip()
        if t:
            items.append((tm[4] * cm[0] + cm[4], tm[5] * cm[3] + cm[5], t))

    PdfReader(path).pages[0].extract_text(visitor_text=visit)
    rows = defaultdict(list)
    for x, y, t in items:
        if len(t) == 1 and t.isalpha():
            rows[round(y)].append((x, t.upper()))
    grid = ["".join(t for _, t in sorted(r)) for _, r in sorted(rows.items(), reverse=True)]
    texts = [t for _, _, t in items]
    start = texts.index("Word list") + 1
    words = []
    for t in texts[start:]:
        if not re.fullmatch(r"[A-Z][A-Z' -]*", t):
            break
        words.append(t)
    return grid, words


def find(grid, word):
    letters = word.replace(" ", "").replace("-", "").replace("'", "")
    size = len(grid)
    hits = []
    for r in range(size):
        for c in range(len(grid[r])):
            for dr, dc in DIRECTIONS:
                rr, cc = r, c
                ok = True
                for ch in letters:
                    if not (0 <= rr < size and 0 <= cc < len(grid[rr])) or grid[rr][cc] != ch:
                        ok = False
                        break
                    rr += dr
                    cc += dc
                if ok:
                    hits.append([r, c, r + dr * (len(letters) - 1), c + dc * (len(letters) - 1)])
    return hits


def main():
    src, out = sys.argv[1], sys.argv[2]
    data, problems = [], 0
    for name in sorted(os.listdir(src)):
        m = re.match(r"(\d+)-", name)
        if not m or not name.lower().endswith(".pdf"):
            continue
        n = int(m.group(1))
        grid, words = read_sheet(os.path.join(src, name))
        entry = {"n": n, "grid": grid, "words": []}
        if len({len(r) for r in grid}) != 1 or len(grid) != len(grid[0]):
            print(f"{name}: grid is not square ({[len(r) for r in grid]})")
            problems += 1
        for w in words:
            hits = find(grid, w)
            if not hits:
                print(f"{name}: '{w}' not found in the grid")
                problems += 1
            else:
                entry["words"].append({"word": w, "at": hits})
        data.append(entry)
    with open(out, "w", encoding="utf-8") as f:
        json.dump(data, f, separators=(",", ":"))
    print(f"{len(data)} word searches, {sum(len(e['words']) for e in data)} words, {problems} problems")


if __name__ == "__main__":
    main()
