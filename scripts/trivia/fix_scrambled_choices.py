"""Fix the two Trivia sheets whose wrong choices were printed as scrambled
single letters (#94 Horses Q7, #150 Old Cookery Books Q8).

Only the broken row of choice "pills" is replaced: it's covered (repainting
the card and page where the letters ran past the card's edge) and three
proper pills are drawn in the sheet's own style (Helvetica-Bold 9pt,
rounded cream pills, the right answer in the question's accent colour with
a drawn tick on the answer sheet). Everything else on the page is untouched.
Works for Standard (A4), Answers (A4) and Large Print (A3, same layout
scaled up). The choices match lib/data/trivia.json's OVERRIDES.

Usage: python fix_scrambled_choices.py TRIVIA_DIR OUT_DIR
"""

import io
import os
import sys

import pypdfium2 as pdfium
import pypdfium2.raw as raw
from pypdf import PdfReader, PdfWriter
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas

INK = "#3f3237"
PILL = "#f1eee4"
PAGE = "#f5f0e4"
CARD_STROKE = "#eae4d6"

FIXES = {
    "094": {"name": "Horses", "options": ["Paint Them", "Groom Them", "Race Them"], "answer": 1, "accent": "#f2d6da"},
    "150": {"name": "Old-Cookery-Books", "options": ["Its Shiny Cover", "Being Passed Down Through the Family", "Being Brand New"], "answer": 1, "accent": "#d8e7cb"},
}


def broken_row(path):
    """The broken row's pills (bottom, left, height) and its card's box."""
    page = pdfium.PdfDocument(path)[0]
    pills, cards = [], []
    for obj in page.get_objects():
        if obj.type != raw.FPDF_PAGEOBJ_PATH:
            continue
        left, bottom, right, top = obj.get_bounds()
        if 10 < top - bottom < 45 and right - left < 250:
            pills.append((round(bottom, 1), left, top - bottom))
        if right - left > 400 and 40 < top - bottom < 200:
            cards.append((left, bottom, right, top))
    rows = {}
    for b, left, h in pills:
        rows.setdefault(b, []).append((left, h))
    y, row = next((y, r) for y, r in rows.items() if len(r) > 3)
    card = next(c for c in cards if c[1] <= y and c[3] >= y + row[0][1])
    return y, min(l for l, _ in row), row[0][1], card, page.get_size()


def card_edge_x(path, cr, y, s):
    """Where the card's right edge line actually is, measured on the
    original page just above the broken row (its bounds include the stroke,
    so it isn't simply the right-hand bound)."""
    page = pdfium.PdfDocument(path)[0]
    scale = 8
    img = page.render(scale=scale).to_pil().convert("RGB")
    row = int((page.get_height() - y) * scale)
    xs = range(int((cr - 4 * s) * scale), int(cr * scale) + 1)
    # The line is a couple of pixels wide: take the centre of its darkness.
    darkness = {x: max(0, 765 - sum(img.getpixel((x, row))) - 30) for x in xs}
    peak = max(xs, key=lambda x: darkness[x])
    near = [x for x in xs if abs(x - peak) <= 6]
    total = sum(darkness[x] for x in near)
    return (sum((x + 0.5) * darkness[x] for x in near) / total) / scale


def overlay(path, fix, with_tick):
    y, x0, h, (cl, cb, cr, ct), (w, hpage) = broken_row(path)
    s = h / 20  # 1 for A4, ~1.42 for the A3 large print
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=(w, hpage))
    band = (y - 3 * s, h + 6 * s)
    edge = card_edge_x(path, cr, y + h + 8 * s, s)
    # Cover the broken pills inside the card...
    c.setFillColor("#ffffff")
    c.rect(x0 - 3 * s, band[0], edge - (x0 - 3 * s), band[1], stroke=0, fill=1)
    # ...and where they ran past it: repaint the page and the card's edge.
    c.setFillColor(PAGE)
    c.rect(edge, band[0], w - edge, band[1], stroke=0, fill=1)
    c.setStrokeColor(CARD_STROKE)
    c.setLineWidth(1 * s)
    c.line(edge, band[0], edge, band[0] + band[1])
    # Three proper pills.
    size, pad, gap = 9 * s, 11 * s, 8 * s
    tick_w = 7 * s
    x = x0
    for k, text in enumerate(fix["options"]):
        tick = with_tick and k == fix["answer"]
        tw = stringWidth(text, "Helvetica-Bold", size)
        extra = stringWidth(" ", "Helvetica-Bold", size) + tick_w if tick else 0
        pw = tw + extra + 2 * pad
        c.setFillColor(fix["accent"] if tick else PILL)
        c.roundRect(x, y, pw, h, h / 2, stroke=0, fill=1)
        c.setFillColor(INK)
        c.setFont("Helvetica-Bold", size)
        c.drawString(x + pad, y + 6.4 * s, text)
        if tick:
            # A drawn tick, the size of the sheet's own.
            tx = x + pad + tw + stringWidth(" ", "Helvetica-Bold", size)
            ty = y + 6.4 * s
            c.setStrokeColor(INK)
            c.setLineWidth(1.3 * s)
            c.setLineCap(1)
            c.setLineJoin(1)
            path = c.beginPath()
            path.moveTo(tx, ty + 3.2 * s)
            path.lineTo(tx + 2.4 * s, ty + 0.6 * s)
            path.lineTo(tx + tick_w, ty + 6.8 * s)
            c.drawPath(path, stroke=1, fill=0)
        x += pw + gap
    assert x - gap <= edge - 10 * s, f"{path}: new choices don't fit the card"
    c.save()
    buf.seek(0)
    return PdfReader(buf).pages[0]


def main():
    src, out = sys.argv[1], sys.argv[2]
    for num, fix in FIXES.items():
        for folder, out_folder, name, with_tick in (
            ("Standard", "Standard", f"{num}-{fix['name']}.pdf", False),
            ("Large Print", "A3 Large Print", f"{num}-Large Print-{fix['name']}.pdf", False),
            ("Answers", "Answers", f"{num}-Answers-{fix['name']}.pdf", True),
        ):
            path = os.path.join(src, folder, name)
            reader = PdfReader(path)
            page = reader.pages[0]
            page.merge_page(overlay(path, fix, with_tick))
            writer = PdfWriter()
            writer.add_page(page)
            writer.add_metadata(reader.metadata or {})
            os.makedirs(os.path.join(out, out_folder), exist_ok=True)
            with open(os.path.join(out, out_folder, name), "wb") as f:
                writer.write(f)
            print("fixed", os.path.join(out_folder, name))


if __name__ == "__main__":
    main()
