"""Read the Trivia pack's answer sheets into data for playing online.

Each answer PDF has numbered questions, each with its choices on the line(s)
below, and a tick drawn on the right choice. This reads every question, its
choices and which one is right, and checks each has exactly one tick.

Usage: python extract_trivia.py ANSWERS_DIR OUT_JSON
"""

import json
import os
import re
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "crossword"))
from extract_crosswords import read_items  # noqa: E402


def build(path):
    items = read_items(path)
    numbers = sorted(
        [(y, int(t)) for x, y, s, t in items if t.isdigit() and 10.5 <= s <= 12 and x < 80],
        key=lambda i: -i[0],
    )
    ticks = [(x, y) for x, y, s, t in items if t == "✓"]
    questions = []
    for i, (qy, n) in enumerate(numbers):
        below = numbers[i + 1][0] if i + 1 < len(numbers) else 100
        # From this question's first line (just above its number) down to just
        # above the next question's first line.
        region = [(x, y, s, t) for x, y, s, t in items if below + 12 < y < qy + 12 and t != "✓"]
        text = " ".join(t for x, y, s, t in sorted(region, key=lambda i: (-i[1], i[0])) if abs(s - 10.5) < 0.3)
        options = [(x, y, t) for x, y, s, t in sorted(region, key=lambda i: (-i[1], i[0])) if abs(s - 9) < 0.3]
        right = [
            k for k, (x, y, t) in enumerate(options) if any(abs(tx - x) < 1 and abs(ty - y) < 1 for tx, ty in ticks)
        ]
        questions.append({"q": text, "options": [t for _, _, t in options], "answer": right[0] if len(right) == 1 else None})
    return questions


# Two sheets were printed with their wrong choices as scrambled single
# letters (a fault in the original PDFs). Online, those questions use
# sensible wrong choices instead; the right answer is the sheet's own.
OVERRIDES = {
    (94, 7): {"options": ["Paint Them", "Groom Them", "Race Them"], "answer": 1},
    (150, 8): {"options": ["Its Shiny Cover", "Being Passed Down Through the Family", "Being Brand New"], "answer": 1},
}


def main():
    src, out = sys.argv[1], sys.argv[2]
    data, problems = [], 0
    for name in sorted(os.listdir(src)):
        m = re.match(r"(\d+)-", name)
        if not m or not name.lower().endswith(".pdf"):
            continue
        qs = build(os.path.join(src, name))
        for i, q in enumerate(qs, 1):
            fix = OVERRIDES.get((int(m.group(1)), i))
            if fix:
                assert q["options"][q["answer"]] == fix["options"][fix["answer"]], (name, i)
                q.update(fix)
        for i, q in enumerate(qs, 1):
            if q["answer"] is None or len(q["options"]) != 3 or not q["q"].endswith("?"):
                print(f"{name} Q{i}: {q}")
                problems += 1
        data.append({"n": int(m.group(1)), "questions": qs})
    with open(out, "w", encoding="utf-8") as f:
        json.dump(data, f, separators=(",", ":"), ensure_ascii=False)
    counts = sorted({len(e["questions"]) for e in data})
    opts = sorted({len(q["options"]) for e in data for q in e["questions"]})
    print(f"{len(data)} quizzes, {sum(len(e['questions']) for e in data)} questions ({counts} per quiz, {opts} choices), {problems} problems")


if __name__ == "__main__":
    main()
