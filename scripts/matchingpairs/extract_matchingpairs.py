"""Read the Matching Pairs pack's Standard PDFs into data for playing online.

Each Standard PDF is two A4-landscape pages: page 1 has Set A (eight picture
cards) and a small logo mark; page 2 has the matching Set B. For the online
game we only need page 1 — the player crops the same eight pictures out of
the PDF twice (once for each card in a pair).

For each set this reads the eight picture image objects on page 1 with
pypdfium2's get_bounds(), and stores each picture's box as a fraction of the
page (left, top, right, bottom, with top-left as [0,0], the way a browser
canvas works) so the player can crop them out of the PDF it loads itself.
The theme name for each set comes from audit.csv (already written when the
pack was made) rather than guessing it from the file name.

A ninth, much smaller image on every page is the corner logo — not a
picture card — and is excluded by an area threshold (about 6,160 sq pt vs.
at least 8,500 sq pt for every real picture, checked across all 100 sets).

Any set that doesn't yield exactly eight picture-sized images is left out of
online play and printed as a warning, rather than guessed.

Usage: python extract_matchingpairs.py STANDARD_DIR AUDIT_CSV OUT_JSON
"""

import csv
import json
import os
import re
import sys

import pypdfium2 as pdfium

LOGO_AREA_MAX = 7000  # the corner logo is ~6,161 sq pt; every real picture is well above this


def picture_boxes(path):
    pdf = pdfium.PdfDocument(path)
    page = pdf[0]
    page_w, page_h = page.get_size()
    boxes = []
    for obj in page.get_objects():
        if obj.type != pdfium.raw.FPDF_PAGEOBJ_IMAGE:
            continue
        left, bottom, right, top = obj.get_bounds()
        area = (right - left) * (top - bottom)
        if area < LOGO_AREA_MAX:
            continue  # the corner logo, not a picture card
        boxes.append((left, bottom, right, top))
    # Reading order: top row first (higher on the page), left to right.
    boxes.sort(key=lambda b: (-round(b[3], 0), round(b[0], 0)))
    fractions = []
    for left, bottom, right, top in boxes:
        fractions.append(
            {
                "left": round(left / page_w, 5),
                "top": round((page_h - top) / page_h, 5),
                "right": round(right / page_w, 5),
                "bottom": round((page_h - bottom) / page_h, 5),
            }
        )
    return fractions


def main():
    src, audit_path, out = sys.argv[1], sys.argv[2], sys.argv[3]

    themes = {}
    with open(audit_path, encoding="utf-8-sig") as f:
        for row in csv.DictReader(f):
            themes[int(row["number"])] = {"theme": row["theme"], "standard_pdf": row["standard_pdf"]}

    data = []
    left_out = []
    for name in sorted(os.listdir(src)):
        m = re.match(r"(\d+)-", name)
        if not m or not name.lower().endswith(".pdf"):
            continue
        n = int(m.group(1))
        info = themes.get(n)
        if not info:
            left_out.append((n, name, "not listed in audit.csv"))
            continue
        boxes = picture_boxes(os.path.join(src, name))
        if len(boxes) != 8:
            left_out.append((n, name, f"found {len(boxes)} pictures, expected 8"))
            continue
        data.append({"n": n, "theme": info["theme"], "pictures": boxes})

    data.sort(key=lambda e: e["n"])
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, "w", encoding="utf-8") as f:
        json.dump(data, f, separators=(",", ":"), ensure_ascii=False)

    print(f"{len(data)} sets written to {out}")
    if left_out:
        print(f"{len(left_out)} set(s) left out of online play:")
        for n, name, reason in left_out:
            print(f"  {n:03d} {name}: {reason}")


if __name__ == "__main__":
    main()
