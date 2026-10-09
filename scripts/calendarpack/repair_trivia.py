"""Put back the full text of trivia choices that were cut short on the printed sheets.

The Trivia PDFs were made with a rule that cut any choice too long for its
column off at 26 characters (so "Gold, frankincense and myrrh" printed as "Gold,
frankincense and myr"). The questions behind the PDFs (the tv*.py question
banks in the build system) still have the full wording, so this reads the banks,
finds each cut-off choice by its question, and writes the full text into the
play data. It also lists every cut-off choice, because the printed PDFs still
have them and need re-making.

Usage: python repair_trivia.py BANKS_DIR PLAYDATA_DIR
  BANKS_DIR   the folder with tv1.py ... tv9.py (build system, "new" folder)
  PLAYDATA_DIR  the folder of .json files made by extract_pack.py (changed in place)
"""

import glob
import importlib.util
import json
import os
import sys

CUT = 26  # the length the printed choices were cut to


def load_banks(banks_dir):
    """question text -> its choices (the right one first), from every bank."""
    questions = {}
    for path in sorted(glob.glob(os.path.join(banks_dir, "tv*.py"))):
        if os.path.basename(path) == "tv_clean.py":
            continue
        spec = importlib.util.spec_from_file_location(os.path.basename(path)[:-3], path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        for text in getattr(module, "D", {}).values():
            for line in text.strip().splitlines():
                parts = line.split("|")
                if len(parts) == 4:
                    questions.setdefault(parts[0].strip(), parts[1:])
    return questions


def main():
    banks_dir, play_dir = sys.argv[1], sys.argv[2]
    questions = load_banks(banks_dir)
    print(f"{len(questions)} questions in the banks")
    fixed, cut_but_unmatched, listed = 0, [], []
    for path in sorted(glob.glob(os.path.join(play_dir, "*.json"))):
        with open(path, encoding="utf-8") as fh:
            data = json.load(fh)
        changed = False
        for quiz in data.get("trivia", []):
            for i, q in enumerate(quiz["questions"], 1):
                full = questions.get(q["q"].strip())
                for k, option in enumerate(q["options"]):
                    if len(option) != CUT:
                        continue
                    where = f"date {data['prefix']}, quiz {quiz['n']}, question {i}"
                    match = [f for f in (full or []) if len(f) > CUT and f.startswith(option)]
                    if len(match) == 1:
                        q["options"][k] = match[0]
                        fixed += 1
                        changed = True
                        listed.append(f"{where}: {option!r} -> {match[0]!r}")
                    elif not any(f == option for f in (full or [])):
                        cut_but_unmatched.append(f"{where}: {option!r}")
        if changed:
            with open(path, "w", encoding="utf-8") as fh:
                json.dump(data, fh, separators=(",", ":"), ensure_ascii=False)
    print(f"{fixed} cut-off choices restored")
    for line in listed:
        print("  ", line)
    print(f"{len(cut_but_unmatched)} cut-off choices NOT found in the banks")
    for line in cut_but_unmatched:
        print("  ", line)


if __name__ == "__main__":
    main()
