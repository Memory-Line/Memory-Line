"""Read the Colouring Pages pack into data for the online tap-to-colour game.

Each page is a US-letter landscape PDF (792x612pt) with a line drawing placed
as one large image object, plus a couple of small logo/header images. This
finds the picture frame — the largest image object on page 1 — and records it
as a box in page fractions (from the top-left, matching how a <canvas> is
drawn), so the player can crop the right area out of the sheet's own Standard
PDF at high resolution.

Usage: python extract_colouring.py STANDARD_DIR OUT_JSON
"""

import json
import os
import re
import sys

import pypdfium2 as pdfium
import pypdfium2.raw as raw

PAGE_W, PAGE_H = 792.0, 612.0


def picture_frame(path):
    pdf = pdfium.PdfDocument(path)
    page = pdf[0]
    w, h = page.get_size()
    images = []
    for obj in page.get_objects():
        if obj.type == raw.FPDF_PAGEOBJ_IMAGE:
            b = obj.get_bounds()  # (left, bottom, right, top) in PDF points, y up
            area = (b[2] - b[0]) * (b[3] - b[1])
            images.append((area, b))
    if not images:
        return None, w, h, 0
    images.sort(key=lambda t: t[0], reverse=True)
    _, b = images[0]
    left, bottom, right, top = b
    frame = {
        "x": round(left / w, 5),
        "y": round((h - top) / h, 5),
        "w": round((right - left) / w, 5),
        "h": round((top - bottom) / h, 5),
    }
    return frame, w, h, len(images)


def main():
    src, out = sys.argv[1], sys.argv[2]
    data = []
    left_out = []
    for name in sorted(os.listdir(src)):
        if not name.lower().endswith(".pdf"):
            continue
        m = re.match(r"(\d+)-", name)
        if not m:
            continue
        n = int(m.group(1))
        path = os.path.join(src, name)
        frame, w, h, n_imgs = picture_frame(path)
        problems = []
        if frame is None:
            problems.append("no image objects found")
        else:
            if abs(w - PAGE_W) > 1 or abs(h - PAGE_H) > 1:
                problems.append(f"page size {w}x{h}, expected {PAGE_W}x{PAGE_H}")
            if frame["w"] < 0.5 or frame["h"] < 0.5:
                problems.append(f"picture frame looks too small: {frame}")
        if problems:
            for p in problems:
                print(f"{name}: {p}")
            left_out.append(name)
            continue
        data.append({"n": n, "frame": frame})

    data.sort(key=lambda e: e["n"])
    with open(out, "w", encoding="utf-8") as f:
        json.dump(data, f, separators=(",", ":"))

    print(f"{len(data)} pages written, {len(left_out)} left out")
    if left_out:
        print("Left out:", ", ".join(left_out))


if __name__ == "__main__":
    main()
