"""Generate the Sudoku activity pack in the Activity Central sheet design.

Five levels, each with its own grid size:
    Beginner      4x4  (2x2 boxes, numbers 1-4)
    Intermediate  6x6  (2x3 boxes, numbers 1-6)
    Advanced      9x9  (3x3 boxes, numbers 1-9)
    Expert        9x9  (3x3 boxes, numbers 1-9, fewer givens than Advanced)
    Master        9x9  (3x3 boxes, numbers 1-9, fewer givens still)

Every puzzle has exactly one solution and no puzzle repeats within a level.
Each one is written three ways, matching the other activity packs:
    Standard/0001-Beginner-Sudoku-1.pdf                    A4
    A3 Large Print/0001-Large-Print-Beginner-Sudoku-1.pdf  A3
    Answers/0001-Answers-Beginner-Sudoku-1.pdf             A4, answer key

The whole output folder can be uploaded in one go from the admin page's
"…or a whole folder" picker (level, large print and answers are read from
the folder names).

Usage (add --json to write the puzzles as data for playing online instead):
    python generate_sudoku.py OUTPUT_DIR [--count 1000] [--levels beginner,intermediate,advanced]
Needs: reportlab, Pillow (installed with reportlab).
"""

import argparse
import io
import json
import os
import random
import sys

from PIL import Image
from reportlab.lib.pagesizes import A3, A4
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

HERE = os.path.dirname(os.path.abspath(__file__))
LOGO_PATH = os.path.join(HERE, "..", "..", "public", "activity-central-icon.png")

# Colours and fonts taken from the existing activity sheets.
PAGE_BG = "#f5f0e4"
BAND_BG = "#f7f3ea"
PANEL_BG = "#ffffff"
PANEL_STROKE = "#eae4d6"
INK = "#3f3237"
TITLE = "#657a68"
LABEL = "#b5714a"
SOFT = "#8a7a6b"
BRAND = "#766f68"
RULE = "#d9cfc1"
PILLS = ["#cfe3f2", "#c9e6dd", "#f1d2be", "#dfd5ec", "#f2e2b8", "#d3e6f5", "#f2d6da", "#d8e7cb", "#cfe3f2"]
BOX_TINT = "#f7f3ea"
CELL_LINE = "#c9bfb0"
ANSWER_INK = "#2f7a63"

LEVELS = {
    "beginner": {"label": "Beginner", "size": 4, "box": (2, 2), "givens": 9, "seed": 4101},
    "intermediate": {"label": "Intermediate", "size": 6, "box": (2, 3), "givens": 18, "seed": 6101},
    "advanced": {"label": "Advanced", "size": 9, "box": (3, 3), "givens": 32, "seed": 9101},
    "expert": {"label": "Expert", "size": 9, "box": (3, 3), "givens": 27, "seed": 9201},
    "master": {"label": "Master", "size": 9, "box": (3, 3), "givens": 23, "seed": 9301},
}


# ---------------------------------------------------------------- puzzles

def peers_of(size, box):
    br, bc = box
    peers = []
    for i in range(size * size):
        r, c = divmod(i, size)
        ps = set()
        for k in range(size):
            ps.add(r * size + k)
            ps.add(k * size + c)
        r0, c0 = (r // br) * br, (c // bc) * bc
        for rr in range(r0, r0 + br):
            for cc in range(c0, c0 + bc):
                ps.add(rr * size + cc)
        ps.discard(i)
        peers.append(tuple(ps))
    return peers


def count_solutions(grid, size, peers, limit=2, rng=None, fill=False):
    """Count solutions up to `limit` (fills `grid` with the first if fill=True)."""
    grid = list(grid)
    full = (1 << size) - 1
    found = 0
    first = None

    def candidates(i):
        used = 0
        for p in peers[i]:
            v = grid[p]
            if v:
                used |= 1 << (v - 1)
        return full & ~used

    def solve():
        nonlocal found, first
        best, best_mask, best_n = -1, 0, size + 1
        for i in range(size * size):
            if not grid[i]:
                m = candidates(i)
                n = bin(m).count("1")
                if n < best_n:
                    best, best_mask, best_n = i, m, n
                    if n <= 1:
                        break
        if best == -1:
            found += 1
            if first is None:
                first = list(grid)
            return found >= limit
        if best_n == 0:
            return False
        values = [v + 1 for v in range(size) if best_mask >> v & 1]
        if rng:
            rng.shuffle(values)
        for v in values:
            grid[best] = v
            if solve():
                return True
        grid[best] = 0
        return False

    solve()
    return found, first


def make_puzzle(level, rng, peers):
    size, givens = level["size"], level["givens"]
    _, solution = count_solutions([0] * size * size, size, peers, limit=1, rng=rng)
    puzzle = list(solution)
    cells = list(range(size * size))
    rng.shuffle(cells)
    filled = size * size
    for i in cells:
        if filled <= givens:
            break
        keep = puzzle[i]
        puzzle[i] = 0
        if count_solutions(puzzle, size, peers, limit=2)[0] != 1:
            puzzle[i] = keep
        else:
            filled -= 1
    return puzzle, solution


def make_puzzles(key, count):
    level = LEVELS[key]
    rng = random.Random(level["seed"])
    peers = peers_of(level["size"], level["box"])
    seen, puzzles = set(), []
    while len(puzzles) < count:
        puzzle, solution = make_puzzle(level, rng, peers)
        # Only keep puzzles that reached the level's number of givens.
        if sum(1 for v in puzzle if v) != level["givens"]:
            continue
        sig = "".join(map(str, puzzle))
        if sig in seen:
            continue
        seen.add(sig)
        puzzles.append((puzzle, solution))
    return puzzles


# ---------------------------------------------------------------- drawing

def small_logo():
    """The tree logo, shrunk so it prints sharply without bloating 9,000 files."""
    im = Image.open(LOGO_PATH).convert("RGBA")
    im.thumbnail((240, 280), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, "PNG", optimize=True)
    buf.seek(0)
    return ImageReader(buf)


def rounded_panel(c, x0, y0, x1, y1, radius=14):
    c.setFillColor(PANEL_BG)
    c.setStrokeColor(PANEL_STROKE)
    c.setLineWidth(1)
    c.roundRect(x0, y0, x1 - x0, y1 - y0, radius, stroke=1, fill=1)


def centred(c, text, y, font, size, colour):
    c.setFont(font, size)
    c.setFillColor(colour)
    c.drawCentredString(595 / 2, y, text)


def draw_sheet(c, logo, level, number, puzzle, solution, variant):
    """Draw one sheet in A4 coordinates (595 x 842); the caller scales for A3."""
    size = level["size"]
    br, bc = level["box"]
    W, H = 595, 842

    # Background, header and footer bands.
    c.setFillColor(PAGE_BG)
    c.rect(0, 0, W, H, stroke=0, fill=1)
    c.setFillColor(BAND_BG)
    c.rect(0, 749, W, H - 749, stroke=0, fill=1)
    c.rect(0, 0, W, 46, stroke=0, fill=1)
    c.setStrokeColor(RULE)
    c.setLineWidth(0.8)
    c.line(30, 29, 565, 29)
    centred(c, "Activity Central  |  Bringing Moments to Life", 14, "Helvetica", 8, SOFT)

    centred(c, "Activity Central", 797, "Times-Roman", 13, BRAND)
    title = f"{level['label']} Sudoku {number}"
    centred(c, title, 770, "Helvetica-Bold", 24, TITLE)
    tag = f"{level['label'].upper()}  ·  SUDOKU  ·  {size}×{size}"
    if variant == "large-print":
        tag += "  ·  LARGE PRINT"
    elif variant == "answers":
        tag += "  ·  ANSWER KEY"
    centred(c, tag, 754, "Helvetica-Bold", 9, LABEL)
    c.drawImage(logo, 493.28, 753.89, width=72, height=76.8, mask="auto")

    # Grid panel.
    rounded_panel(c, 50, 297, 545, 727)
    grid = 380 if size > 4 else 340
    cell = grid / size
    gx, gy = (W - grid) / 2, 297 + (430 - grid) / 2
    # Alternate boxes lightly tinted, so each box is easy to see.
    boxes_across = size // bc
    for r in range(0, size, br):
        for col in range(0, size, bc):
            if ((r // br) + (col // bc)) % 2 == 1:
                c.setFillColor(BOX_TINT)
                c.rect(gx + col * cell, gy + grid - (r + br) * cell, bc * cell, br * cell, stroke=0, fill=1)
    c.setStrokeColor(CELL_LINE)
    c.setLineWidth(0.8)
    for k in range(1, size):
        c.line(gx + k * cell, gy, gx + k * cell, gy + grid)
        c.line(gx, gy + k * cell, gx + grid, gy + k * cell)
    c.setStrokeColor(INK)
    c.setLineWidth(2.2)
    for k in range(0, size + 1, bc):
        c.line(gx + k * cell, gy, gx + k * cell, gy + grid)
    for k in range(0, size + 1, br):
        c.line(gx, gy + k * cell, gx + grid, gy + k * cell)
    c.setLineWidth(2.6)
    c.rect(gx, gy, grid, grid, stroke=1, fill=0)

    font_size = cell * 0.55
    for i in range(size * size):
        r, col = divmod(i, size)
        given = puzzle[i]
        value = given or (solution[i] if variant == "answers" else 0)
        if not value:
            continue
        c.setFont("Helvetica-Bold" if given else "Helvetica", font_size)
        c.setFillColor(INK if given else ANSWER_INK)
        cx = gx + (col + 0.5) * cell
        cy = gy + grid - (r + 0.5) * cell - font_size * 0.36
        c.drawCentredString(cx, cy, str(value))

    # How-to panel, in the style of the word list.
    rounded_panel(c, 50, 73, 545, 273)
    centred(c, "How to play" if variant != "answers" else "Answer key", 245, "Helvetica-Bold", 13, INK)
    lines = (
        [f"Fill every empty square so that each row, each column and each",
         f"outlined box has every number from 1 to {size} exactly once."]
        if variant != "answers"
        else ["Numbers printed in bold were given in the puzzle.",
              "Numbers in green are the ones to be filled in."]
    )
    for n, line in enumerate(lines):
        centred(c, line, 222 - n * 15, "Helvetica", 10.5, SOFT)
    # Number pills: the numbers to use.
    pill_w, pill_h, gap = 40, 26, 10
    total = size * pill_w + (size - 1) * gap
    x = (W - total) / 2
    for v in range(1, size + 1):
        c.setFillColor(PILLS[(v - 1) % len(PILLS)])
        c.roundRect(x, 118, pill_w, pill_h, 13, stroke=0, fill=1)
        c.setFillColor(INK)
        c.setFont("Helvetica-Bold", 13)
        c.drawCentredString(x + pill_w / 2, 118 + 8.5, str(v))
        x += pill_w + gap
    centred(c, "Numbers to use", 97, "Helvetica-Bold", 9, LABEL)


def write_pdf(path, logo, level, number, puzzle, solution, variant):
    pagesize = A3 if variant == "large-print" else A4
    c = canvas.Canvas(path, pagesize=pagesize)
    title = f"{level['label']} Sudoku {number}"
    c.setTitle(title + (" (Large Print)" if variant == "large-print" else " (Answers)" if variant == "answers" else ""))
    c.setAuthor("Activity Central")
    if variant == "large-print":
        s = A3[0] / A4[0]
        c.scale(s, s)
    draw_sheet(c, logo, level, number, puzzle, solution, variant)
    c.showPage()
    c.save()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("out")
    parser.add_argument("--count", type=int, default=1000)
    parser.add_argument("--levels", default="beginner,intermediate,advanced")
    parser.add_argument(
        "--json",
        action="store_true",
        help="write the puzzles as JSON to OUT (a file) instead of PDFs; used to play them online",
    )
    args = parser.parse_args()

    if args.json:
        # The same seeds give exactly the same puzzles as the PDFs.
        data = {
            key: [
                {"n": n, "puzzle": "".join(map(str, p)), "solution": "".join(map(str, s))}
                for n, (p, s) in enumerate(make_puzzles(key, args.count), start=1)
            ]
            for key in args.levels.split(",")
        }
        with open(args.out, "w", encoding="utf-8") as f:
            json.dump(data, f, separators=(",", ":"))
        print(f"wrote {sum(len(v) for v in data.values())} puzzles to {args.out}")
        return 0

    logo = small_logo()
    for key in args.levels.split(","):
        level = LEVELS[key]
        puzzles = make_puzzles(key, args.count)
        base = os.path.join(args.out, level["label"])
        folders = {
            "standard": os.path.join(base, "Standard"),
            "large-print": os.path.join(base, "A3 Large Print"),
            "answers": os.path.join(base, "Answers"),
        }
        for folder in folders.values():
            os.makedirs(folder, exist_ok=True)
        for n, (puzzle, solution) in enumerate(puzzles, start=1):
            stem = f"{level['label']}-Sudoku-{n}"
            names = {
                "standard": f"{n:04d}-{stem}.pdf",
                "large-print": f"{n:04d}-Large-Print-{stem}.pdf",
                "answers": f"{n:04d}-Answers-{stem}.pdf",
            }
            for variant, folder in folders.items():
                write_pdf(os.path.join(folder, names[variant]), logo, level, n, puzzle, solution, variant)
            if n % 100 == 0:
                print(f"{level['label']}: {n}/{len(puzzles)}", flush=True)
        print(f"{level['label']}: done ({len(puzzles)} puzzles)", flush=True)


if __name__ == "__main__":
    sys.exit(main())
