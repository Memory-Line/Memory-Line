"""Read the calendar activity packs' PDFs into data for playing them online.

The packs (one set per calendar date: Word Searches, Guess the Word, Crosswords,
Trivia and Word Bingo) are laid out the same way for every date, so the same
reader works on all of them. For each date this reads:
  - Word Searches: the letter grid and word list from the worksheet, then finds
    every word in the grid so the website knows where each one is.
  - Guess the Word: the clue, number of tries and the answer from the answer key.
  - Crosswords: the filled grid, clue numbers and answers from the answer key,
    and the clue text from the worksheet.
  - Trivia: the questions and choices from the answer key; the right choice is
    the one printed in bold.
  - Word Bingo: the nine words on each card and the caller's 50 words.

Output: one JSON file per date (named after its pack number, e.g. 38.json) in
OUT_DIR. Every check that fails is printed, so nothing wrong goes up quietly.

Usage: python extract_pack.py UNZIPPED_ROOT OUT_DIR [PACK_NUMBER ...]
"""

import json
import os
import re
import sys
from collections import defaultdict

from pypdf import PdfReader

# Pack numbers with no activities page on the site: not read at all.
SKIP = {"20", "24", "34"}

FORMATS = {
    "Word-Search": "word-searches",
    "Guess-the-Word": "guess-the-word",
    "Crossword": "crosswords",
    "Trivia": "trivia",
    "Word-Bingo": "bingo",
}
DIRECTIONS = [(0, 1), (1, 0), (1, 1), (-1, 1), (0, -1), (-1, 0), (-1, -1), (1, -1)]
WORD = r"[A-Z][A-Z' \-]*"


def read_items(path):
    """Every piece of text on page 1: (x, y, size, font, text)."""
    items = []

    def visit(text, cm, tm, font, size):
        t = text.strip()
        if t:
            try:
                name = str(font.get("/BaseFont")) if font else ""
            except Exception:
                name = ""
            scale = abs(cm[3]) or 1
            items.append((tm[4] * cm[0] + cm[4], tm[5] * cm[3] + cm[5], (size or 0) * scale, name, t))

    PdfReader(path).pages[0].extract_text(visitor_text=visit)
    return items


# ---------------------------------------------------------------- word search
def find_word(grid, word):
    letters = re.sub(r"[ '\-]", "", word)
    size = len(grid)
    hits = []
    for r in range(size):
        for c in range(len(grid[r])):
            for dr, dc in DIRECTIONS:
                rr, cc, ok = r, c, True
                for ch in letters:
                    if not (0 <= rr < size and 0 <= cc < len(grid[rr])) or grid[rr][cc] != ch:
                        ok = False
                        break
                    rr += dr
                    cc += dc
                if ok:
                    hits.append([r, c, r + dr * (len(letters) - 1), c + dc * (len(letters) - 1)])
    return hits


def word_search(path, problems, label):
    items = read_items(path)
    rows = defaultdict(list)
    for x, y, s, f, t in items:
        if len(t) == 1 and t.isalpha() and abs(s - 16.5) < 1.5:
            rows[round(y)].append((x, t.upper()))
    grid = ["".join(t for _, t in sorted(r)) for _, r in sorted(rows.items(), reverse=True)]
    if not grid or len({len(r) for r in grid}) != 1 or len(grid) != len(grid[0]):
        problems.append(f"{label}: grid is not square ({[len(r) for r in grid]})")
    words = [
        t
        for x, y, s, f, t in sorted(items, key=lambda i: (-round(i[1]), i[0]))
        if abs(s - 10.5) < 0.3 and re.fullmatch(WORD, t)
    ]
    out = {"grid": grid, "words": []}
    for w in words:
        hits = find_word(grid, w)
        if not hits:
            problems.append(f"{label}: '{w}' not found in the grid")
        else:
            out["words"].append({"word": w, "at": hits})
    if len(words) < 8:
        problems.append(f"{label}: only {len(words)} words read")
    return out


# ------------------------------------------------------------- guess the word
def guess_the_word(path, problems, label):
    items = read_items(path)
    texts = [t for x, y, s, f, t in items]
    tries = next((int(m.group(1)) for t in texts if (m := re.fullmatch(r"(\d+) tries", t))), None)
    clue_y = next((y for x, y, s, f, t in items if t == "CLUE"), None)
    clue_lines = [(y, t) for x, y, s, f, t in items if clue_y and 12.5 <= s <= 14 and clue_y - 60 < y < clue_y]
    clue = " ".join(t for y, t in sorted(clue_lines, key=lambda i: -i[0]))
    big = [(x, y, t.upper()) for x, y, s, f, t in items if len(t) == 1 and t.isalpha() and s > 20]
    letters = sorted(big, key=lambda i: (-round(i[1]), i[0]))
    gaps = [b[0] - a[0] for a, b in zip(letters, letters[1:]) if round(a[1]) == round(b[1])]
    step = sorted(gaps)[len(gaps) // 2] if gaps else 0
    answer = letters[0][2] if letters else ""
    for a, b in zip(letters, letters[1:]):
        new_row = round(a[1]) != round(b[1])
        answer += (" " if new_row or (step and (b[0] - a[0]) > step * 1.5) else "") + b[2]
    if not (tries and clue and re.fullmatch(r"[A-Z]+( [A-Z]+)*", answer)):
        problems.append(f"{label}: odd entry tries={tries} clue={clue!r} answer={answer!r}")
    return {"clue": clue, "tries": tries or 8, "answer": answer}


# ------------------------------------------------------------------ crossword
def read_lists(items):
    out = {"across": {}, "down": {}}
    heads = {t: x for x, y, s, f, t in items if t in ("ACROSS", "DOWN")}
    body = [(x, y, t) for x, y, s, f, t in items if 9 <= s <= 10]
    for key, name in (("across", "ACROSS"), ("down", "DOWN")):
        colx = heads.get(name)
        if colx is None:
            continue
        current = None
        for x, y, t in sorted(body, key=lambda i: -i[1]):
            if abs(x - colx) > 2:
                continue
            m = re.match(r"(\d+)\.\s*(.*)", t)
            if m:
                current = int(m.group(1))
                out[key][current] = m.group(2).strip()
            elif current is not None:
                out[key][current] += " " + t.strip()
    return out


def crossword(answers_path, worksheet_path, problems, label):
    a = read_items(answers_path)
    size = max(s for x, y, s, f, t in a if len(t) == 1 and t.isalpha())
    letters = [(x, y, t.upper()) for x, y, s, f, t in a if len(t) == 1 and t.isalpha() and abs(s - size) < 0.5]
    numbers = [(x, y, int(t)) for x, y, s, f, t in a if t.isdigit() and 8 < s < size * 0.6]
    ys = sorted({round(y, 1) for _, y, _ in letters}, reverse=True)
    pitch = min(p - q for p, q in zip(ys, ys[1:]))
    top = ys[0]
    # Clue numbers sit in the top-left corner of their square, so their x
    # positions give the grid's column lines: a number is about 0.077 of a
    # square in from its square's left edge, and its baseline is about 0.43 of
    # a square above the baseline of the letters in that row.
    phase = (numbers[0][0] - 0.077 * pitch) % pitch

    def col_of(x):
        return int((x - phase) // pitch)

    first_col = min(col_of(x) for x, _, _ in letters)
    cells = {}
    for x, y, t in letters:
        cells[(round((top - y) / pitch), col_of(x) - first_col)] = t
    rows = max(r for r, _ in cells) + 1
    cols = max(c for _, c in cells) + 1
    nums = {}
    for x, y, n in numbers:
        nums[n] = (round((top - (y - 0.43 * pitch)) / pitch), col_of(x) - first_col)

    answers = read_lists(a)
    clues = read_lists(read_items(worksheet_path))
    out = {"rows": rows, "cols": cols, "across": [], "down": []}
    for key, (dr, dc) in (("across", (0, 1)), ("down", (1, 0))):
        for n, word in sorted(answers[key].items()):
            word = re.sub(r"[^A-Z]", "", word.upper())
            clue = clues[key].get(n)
            if clue is None:
                problems.append(f"{label}: {key} {n} has no clue text")
                continue
            if n not in nums:
                problems.append(f"{label}: {key} {n} number not found in the grid")
                continue
            r, c = nums[n]
            squares = [(r + dr * k, c + dc * k) for k in range(len(word))]
            if not all(sq in cells for sq in squares) or "".join(cells[sq] for sq in squares) != word:
                problems.append(f"{label}: {key} {n} '{word}' doesn't match the grid at {nums[n]}")
                continue
            out[key].append({"num": n, "row": r, "col": c, "answer": word, "clue": clue, "lengths": str(len(word))})
    covered = set()
    for key, (dr, dc) in (("across", (0, 1)), ("down", (1, 0))):
        for e in out[key]:
            covered.update((e["row"] + dr * k, e["col"] + dc * k) for k in range(len(e["answer"])))
    if set(cells) - covered:
        problems.append(f"{label}: {len(set(cells) - covered)} lettered squares not in any answer")
    out["numbers"] = [[r, c, n] for n, (r, c) in sorted(nums.items())]
    out["solution"] = ["".join(cells.get((r, c), ".") for c in range(cols)) for r in range(rows)]
    return out


# --------------------------------------------------------------------- trivia
def trivia(path, problems, label):
    items = read_items(path)
    nums = sorted(
        [(y, int(t)) for x, y, s, f, t in items if t.isdigit() and len(t) <= 2 and abs(s - 11) < 0.3 and x < 80],
        key=lambda i: -i[0],
    )
    questions = []
    for i, (qy, n) in enumerate(nums):
        below = nums[i + 1][0] if i + 1 < len(nums) else 30
        region = [it for it in items if below + 6 < it[1] < qy + 14]
        q = " ".join(
            t for x, y, s, f, t in sorted(region, key=lambda i: (-round(i[1]), i[0])) if 11.5 < s < 13.6 and x > 90
        )
        # The choice texts: 9.5-11pt, to the right of the A/B/C letters (9pt).
        opts = sorted(
            [it for it in region if 9.2 < it[2] < 11.5 and it[0] > 80 and it[1] < qy - 10 and not (len(it[4]) == 1 and it[4] in "ABC")],
            key=lambda i: i[0],
        )
        options = [(f, t) for x, y, s, f, t in opts]
        right = [k for k, (f, t) in enumerate(options) if "Bold" in f]
        questions.append({"q": q, "options": [t for _, t in options], "answer": right[0] if len(right) == 1 else None})
    for i, q in enumerate(questions, 1):
        if q["answer"] is None or len(q["options"]) != 3 or not q["q"].endswith("?"):
            problems.append(f"{label} Q{i}: {q}")
    return {"questions": questions}


# ---------------------------------------------------------------------- bingo
def bingo_card(path, problems, label):
    items = read_items(path)
    words = [(x, y, t) for x, y, s, f, t in items if s >= 15 and re.fullmatch(WORD, t)]
    rows = []
    for x, y, t in sorted(words, key=lambda i: -i[1]):
        if rows and abs(rows[-1][0] - y) < 40:
            rows[-1][1].append((x, t))
        else:
            rows.append([y, [(x, t)]])
    grid = [[t for _, t in sorted(r)] for _, r in rows]
    if len(grid) != 3 or any(len(r) != 3 for r in grid):
        problems.append(f"{label}: card is not 3x3 ({grid})")
    return {"words": grid}


def bingo_caller(path, problems, label):
    items = read_items(path)
    words = [(x, y, t) for x, y, s, f, t in items if abs(s - 12) < 0.3 and re.fullmatch(WORD, t)]
    ordered = [t for x, y, t in sorted(words, key=lambda i: (round(i[0] / 50), -i[1]))]
    if len(ordered) < 40:
        problems.append(f"{label}: only {len(ordered)} caller words")
    return ordered


# --------------------------------------------------------------------- driver
def classify(rel):
    parts = rel.replace("\\", "/").split("/")
    dated = next((p for p in parts[1:] if re.match(r"^\d{2}[ab]?-", p)), None)
    fmt = next((FORMATS[p] for p in parts if p in FORMATS), None)
    variant = next((p for p in parts if p in ("Worksheets", "Answers", "Large Print", "Caller Sheet")), None)
    if not (dated and fmt and variant):
        return None
    return dated.split("-")[0], fmt, variant


def main():
    root, out_dir = sys.argv[1], sys.argv[2]
    only = set(sys.argv[3:])
    os.makedirs(out_dir, exist_ok=True)
    # prefix -> format -> variant -> number (or file name) -> path
    files = defaultdict(lambda: defaultdict(lambda: defaultdict(dict)))
    for dp, _, names in os.walk(root):
        for name in names:
            if not name.lower().endswith(".pdf"):
                continue
            full = os.path.join(dp, name)
            c = classify(os.path.relpath(full, root))
            if not c or c[0] in SKIP or (only and c[0] not in only):
                continue
            m = re.match(r"(\d+)-", name)
            files[c[0]][c[1]][c[2]][int(m.group(1)) if m else name] = full
    problems, totals = [], defaultdict(int)
    for prefix in sorted(files):
        f = files[prefix]
        data = {"prefix": prefix}
        for n, path in sorted(f["word-searches"].get("Worksheets", {}).items()):
            data.setdefault("word-searches", []).append({"n": n, **word_search(path, problems, f"{prefix} word search {n}")})
        for n, path in sorted(f["guess-the-word"].get("Answers", {}).items()):
            data.setdefault("guess-the-word", []).append({"n": n, **guess_the_word(path, problems, f"{prefix} guess the word {n}")})
        for n, path in sorted(f["crosswords"].get("Answers", {}).items()):
            ws = f["crosswords"].get("Worksheets", {}).get(n)
            if not ws:
                problems.append(f"{prefix} crossword {n}: no worksheet for the clues")
                continue
            data.setdefault("crosswords", []).append({"n": n, **crossword(path, ws, problems, f"{prefix} crossword {n}")})
        for n, path in sorted(f["trivia"].get("Answers", {}).items()):
            data.setdefault("trivia", []).append({"n": n, **trivia(path, problems, f"{prefix} trivia {n}")})
        cards = [
            {"n": n, **bingo_card(p, problems, f"{prefix} bingo card {n}")}
            for n, p in sorted(f["bingo"].get("Worksheets", {}).items())
        ]
        caller = next(
            (p for k, p in f["bingo"].get("Caller Sheet", {}).items() if "large" not in os.path.basename(p).lower()),
            None,
        )
        if cards:
            data["bingo"] = {"cards": cards, "caller": bingo_caller(caller, problems, f"{prefix} caller") if caller else []}
        for k in ("word-searches", "guess-the-word", "crosswords", "trivia"):
            totals[k] += len(data.get(k, []))
        totals["bingo"] += len(cards)
        with open(os.path.join(out_dir, f"{prefix}.json"), "w", encoding="utf-8") as fh:
            json.dump(data, fh, separators=(",", ":"), ensure_ascii=False)
        print(prefix, {k: (len(v["cards"]) if k == "bingo" else len(v)) for k, v in data.items() if k != "prefix"}, flush=True)
    print("TOTALS", dict(totals))
    print(f"{len(problems)} problems")
    for p in problems[:200]:
        print("  ", p)


if __name__ == "__main__":
    main()
