"""Work out where Picture A and Picture B sit on each Spot the Difference
sheet, for playing online.

Earlier this tried to also guess the 7 exact difference regions by image
comparison, and only offered online play on the sheets where it felt
confident — but the guesses were often wrong even where it *did* feel
confident, so that idea was dropped. Now the online game just lets the
person circle whatever they spot themselves (no automatic checking, no
"right answer") — the sheet's own instructions still say "find seven", but
nothing on screen validates that. That means we only need the position of
Picture A and Picture B themselves (which was always reliable), not the
differences within them.

Usage:
  python extract_pictures_only.py STANDARD_DIR OUT_JSON
"""

import json
import os
import re
import sys

import pypdfium2 as pdfium

SCALE = 3
INSET = 0.015


def get_pictures(path):
    doc = pdfium.PdfDocument(path)
    page = doc[0]
    w_pt, h_pt = page.get_size()
    objs = list(page.get_objects())
    imgs = [o for o in objs if o.type == 3]

    def area(o):
        l, b, r, t = o.get_bounds()
        return (r - l) * (t - b)

    big = [o for o in imgs if area(o) > 20000]
    if len(big) != 2:
        return None
    big.sort(key=lambda o: o.get_bounds()[0])

    def to_px(bounds):
        l, b, r, t = bounds
        return (l * SCALE, (h_pt - t) * SCALE, r * SCALE, (h_pt - b) * SCALE)

    pic_frac = []
    for o in big:
        x0, y0, x1, y1 = to_px(o.get_bounds())
        w, h = x1 - x0, y1 - y0
        ix0, iy0 = x0 + w * INSET, y0 + h * INSET
        ix1, iy1 = x1 - w * INSET, y1 - h * INSET
        pic_frac.append(
            (
                (ix0 / SCALE) / w_pt,
                (iy0 / SCALE) / h_pt,
                (ix1 - ix0) / SCALE / w_pt,
                (iy1 - iy0) / SCALE / h_pt,
            )
        )
    return pic_frac


def main():
    standard_dir, out_json = sys.argv[1], sys.argv[2]
    files = sorted(os.listdir(standard_dir))
    data = [None] * 200
    failed = []
    for fn in files:
        m = re.match(r"^(\d+)-", fn)
        if not m:
            continue
        n = int(m.group(1))
        if n == 188:
            continue  # known-defective source file, left out on purpose
        path = os.path.join(standard_dir, fn)
        pic_frac = get_pictures(path)
        if pic_frac is None:
            failed.append(n)
            continue
        (ax, ay, aw, ah), (bx, by, bw, bh) = pic_frac
        data[n - 1] = {
            "n": n,
            "pictureA": {"x": ax, "y": ay, "w": aw, "h": ah},
            "pictureB": {"x": bx, "y": by, "w": bw, "h": bh},
        }

    with open(out_json, "w") as f:
        json.dump(data, f)

    included = sum(1 for e in data if e is not None)
    print(f"Included: {included} of 200 (excluded: #188 known-defective" + (f", and {failed} where two pictures weren't found" if failed else "") + ")")


if __name__ == "__main__":
    main()
