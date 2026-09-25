"""Read the Crossword pack's answer sheets into data for playing online.

Each answer PDF has the filled-in grid, the clue numbers and the Across /
Down clues. This rebuilds the grid (letters, blocked squares, numbers) and
each clue's answer and position, and checks every answer against the
clue's letter count, e.g. "(8)".

Usage: python extract_crosswords.py ANSWERS_DIR OUT_JSON
"""

import json
import os
import re
import sys

from pypdf import PdfReader


def read_items(path):
    items = []

    def visit(text, cm, tm, font, size):
        t = text.strip()
        if t:
            scale = abs(cm[3]) or 1
            items.append((tm[4] * cm[0] + cm[4], tm[5] * cm[3] + cm[5], (size or 0) * scale, t))

    PdfReader(path).pages[0].extract_text(visitor_text=visit)
    return items


def build(path):
    items = read_items(path)
    # Grid letters are the large single capitals; squares are a different
    # size in different crosswords (bigger grids have smaller squares), so
    # everything below is measured in squares ("pitch"), not points.
    size = max(s for x, y, s, t in items if len(t) == 1 and t.isalpha())
    letters = [(x, y, t) for x, y, s, t in items if len(t) == 1 and t.isalpha() and abs(s - size) < 0.5]
    numbers = [(x, y, int(t)) for x, y, s, t in items if t.isdigit() and s < size * 0.6]
    ys = sorted({round(y, 1) for _, y, _ in letters}, reverse=True)
    pitch = min(a - b for a, b in zip(ys, ys[1:]))
    top = ys[0]
    left = min(x for x, _, _ in letters) - 0.25 * pitch
    cells = {}
    for x, y, t in letters:
        cells[(round((top - y) / pitch), int((x - left) // pitch))] = t.upper()
    rows = max(r for r, _ in cells) + 1
    cols = max(c for _, c in cells) + 1
    nums = {}
    for x, y, n in numbers:
        # A clue number sits in the top-left corner of its square, about
        # half a square above the letter's baseline.
        r = round((top - (y - 0.48 * pitch)) / pitch)
        c = int((x + 0.15 * pitch - left) // pitch)
        nums[n] = (r, c)

    # Clues: two columns (ACROSS left, DOWN right), each clue "N. text (len)"
    # possibly wrapped onto following lines.
    texts = [(x, y, t) for x, y, s, t in items if 9 <= s <= 10]
    clues = {"across": {}, "down": {}}
    across_x = min(x for x, y, s, t in items if t == "ACROSS")
    down_x = min(x for x, y, s, t in items if t == "DOWN")
    for key, colx in (("across", across_x), ("down", down_x)):
        lines = [t for x, y, t in sorted(texts, key=lambda i: -i[1]) if abs(x - colx) < 2]
        current = None
        for line in lines:
            m = re.match(r"(\d+)\.\s*(.*)", line)
            if m:
                current = int(m.group(1))
                clues[key][current] = m.group(2)
            elif current is not None:
                clues[key][current] += " " + line
    problems = []
    out = {"rows": rows, "cols": cols, "across": [], "down": []}
    for key, (dr, dc) in (("across", (0, 1)), ("down", (1, 0))):
        for n, text in sorted(clues[key].items()):
            m = re.match(r"(.*)\((\d+(?:[,-]\d+)*)\)\s*$", text.strip())
            if not m:
                problems.append(f"{key} {n}: clue has no letter count")
                continue
            clue, lengths = m.group(1).strip(), m.group(2)
            length = sum(int(p) for p in re.split(r"[,-]", lengths))
            if n not in nums:
                problems.append(f"{key} {n}: number not found in the grid")
                continue
            r, c = nums[n]
            squares = [(r + dr * k, c + dc * k) for k in range(length)]
            if not all(sq in cells for sq in squares):
                problems.append(f"{key} {n}: ({lengths}) doesn't fit the grid")
                continue
            answer = "".join(cells[sq] for sq in squares)
            out[key].append({"num": n, "row": r, "col": c, "answer": answer, "clue": clue, "lengths": lengths})
    # Every lettered square should belong to at least one answer.
    covered = set()
    for key, (dr, dc) in (("across", (0, 1)), ("down", (1, 0))):
        for e in out[key]:
            covered.update((e["row"] + dr * k, e["col"] + dc * k) for k in range(len(e["answer"])))
    if set(cells) - covered:
        problems.append(f"{len(set(cells) - covered)} lettered squares not in any answer")
    out["numbers"] = [[r, c, n] for n, (r, c) in sorted(nums.items())]
    out["solution"] = ["".join(cells.get((r, c), ".") for c in range(cols)) for r in range(rows)]
    return out, problems


def main():
    src, out = sys.argv[1], sys.argv[2]
    data, bad = [], 0
    for name in sorted(os.listdir(src)):
        m = re.match(r"(\d+)-", name)
        if not m or not name.lower().endswith(".pdf"):
            continue
        entry, problems = build(os.path.join(src, name))
        entry["n"] = int(m.group(1))
        data.append(entry)
        for p in problems:
            print(f"{name}: {p}")
        bad += bool(problems)
    with open(out, "w", encoding="utf-8") as f:
        json.dump(data, f, separators=(",", ":"))
    clues = sum(len(e["across"]) + len(e["down"]) for e in data)
    print(f"{len(data)} crosswords, {clues} clues, {bad} with problems")


if __name__ == "__main__":
    main()
