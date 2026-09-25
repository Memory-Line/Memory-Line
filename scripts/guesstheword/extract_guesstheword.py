"""Read the Guess the Word pack's answer sheets into data for playing online.

Each answer PDF has the clue, the number of tries (petals) and the answer
written in the blanks. Answers can be more than one word; a wider gap
between letters (or a new line) marks a space.

Usage: python extract_guesstheword.py ANSWERS_DIR OUT_JSON
"""

import json
import os
import re
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "crossword"))
from extract_crosswords import read_items  # noqa: E402


def build(path):
    items = read_items(path)
    texts = [t for x, y, s, t in items]
    tries = next(int(m.group(1)) for t in texts if (m := re.fullmatch(r"(\d+) tries", t)))
    # Clue: the large lines after "CLUE", until the letter blanks.
    clue_y = next(y for x, y, s, t in items if t == "CLUE")
    clue_lines = [(y, t) for x, y, s, t in items if 12.5 <= s <= 14 and y < clue_y and y > clue_y - 80]
    clue = " ".join(t for y, t in sorted(clue_lines, key=lambda i: -i[0]))
    # Answer: the big single letters in the blanks, row by row.
    size = max((s for x, y, s, t in items if len(t) == 1 and t.isalpha()), default=0)
    letters = sorted(
        [(x, y, t.upper()) for x, y, s, t in items if len(t) == 1 and t.isalpha() and abs(s - size) < 0.5],
        key=lambda i: (-round(i[1]), i[0]),
    )
    gaps = [b[0] - a[0] for a, b in zip(letters, letters[1:]) if round(a[1]) == round(b[1])]
    step = sorted(gaps)[len(gaps) // 2] if gaps else 0
    answer = letters[0][2] if letters else ""
    for a, b in zip(letters, letters[1:]):
        new_row = round(a[1]) != round(b[1])
        answer += (" " if new_row or (b[0] - a[0]) > step * 1.5 else "") + b[2]
    return {"clue": clue, "tries": tries, "answer": answer}


def main():
    src, out = sys.argv[1], sys.argv[2]
    data, problems = [], 0
    for name in sorted(os.listdir(src)):
        m = re.match(r"(\d+)-", name)
        if not m or not name.lower().endswith(".pdf"):
            continue
        entry = build(os.path.join(src, name))
        entry["n"] = int(m.group(1))
        if not entry["answer"] or not entry["clue"] or not re.fullmatch(r"[A-Z]+( [A-Z]+)*", entry["answer"]):
            print(f"{name}: odd entry {entry}")
            problems += 1
        data.append(entry)
    with open(out, "w", encoding="utf-8") as f:
        json.dump(data, f, separators=(",", ":"))
    print(f"{len(data)} puzzles, {problems} problems; tries used: {sorted({e['tries'] for e in data})}")


if __name__ == "__main__":
    main()
