"""
Reads the 10 Snakes and Ladders board PDFs and works out every ladder
(bottom square -> top square) and snake (head square -> tail square),
straight from the PDF's own vector artwork rather than by eye.

How it works: each board's numbers 1-100 are individual text objects, so we
read their positions to get an exact square -> (x, y) map for that board
(this also means we don't have to assume which way the board snakes --
whatever direction each board actually uses, the numbers tell us). Ladders
are drawn as two straight rail lines plus rungs; we take the two longest
(straight) lines in a cluster as the rails, average their bottom two points
and their top two points, and match each to the nearest number. Snakes are
drawn as a single wavy curve per snake; we take the curve's two open ends
and match each to the nearest number, then call whichever end is the
higher square the head (snakes always slide down).

Run: python extract_snakesladders.py
Writes: lib/data/snakesAndLadders.json
"""

import ctypes
import json
import math
import os

import pypdfium2 as pdfium
import pypdfium2.raw as raw

HERE = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
SOURCE_DIR = (
    r"C:\Users\domin\OneDrive\Pictures\1. Activity Central"
    r"\Activity-Central-Master-Package\06-Snakes-and-Ladders\Standard"
)
OUT_PATH = os.path.join(REPO_ROOT, "lib", "data", "snakesAndLadders.json")

# Roughly the board's own grid area on the page (in PDF points), used to
# ignore the title, logo, and "how to play" box above it.
GRID = (30, 130, 565, 665)


def get_points(obj):
    n = raw.FPDFPath_CountSegments(obj.raw)
    pts = []
    for i in range(n):
        seg = raw.FPDFPath_GetPathSegment(obj.raw, i)
        x, y = ctypes.c_float(), ctypes.c_float()
        raw.FPDFPathSegment_GetPoint(seg, ctypes.byref(x), ctypes.byref(y))
        pts.append((x.value, y.value))
    return pts


def in_grid(bounds):
    cx = (bounds[0] + bounds[2]) / 2
    cy = (bounds[1] + bounds[3]) / 2
    return GRID[0] <= cx <= GRID[2] and GRID[1] <= cy <= GRID[3]


def dist(p, q):
    return math.hypot(p[0] - q[0], p[1] - q[1])


def bbox_gap(b1, b2):
    dx = max(b1[0] - b2[2], b2[0] - b1[2], 0)
    dy = max(b1[1] - b2[3], b2[1] - b1[3], 0)
    return math.hypot(dx, dy)


def extract_board(pdf_path):
    pdf = pdfium.PdfDocument(pdf_path)
    page = pdf[0]
    page_w, page_h = page.get_size()
    textpage = page.get_textpage()
    objs = list(page.get_objects())

    # Every square's number label -> its centre point on the page.
    num_center = {}
    for obj in objs:
        if obj.type != 1:  # text
            continue
        bounds = obj.get_bounds()
        if not in_grid(bounds):
            continue
        text = textpage.get_text_bounded(*bounds).strip()
        digits = "".join(ch for ch in text if ch.isdigit())
        if not digits:
            continue
        n = int(digits)
        if 1 <= n <= 100 and n not in num_center:
            num_center[n] = ((bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2)

    def nearest_square(pt):
        best_n, best_d = None, 1e18
        for n, c in num_center.items():
            d = dist(pt, c)
            if d < best_d:
                best_n, best_d = n, d
        return best_n, best_d

    # Straight lines (ladder rails + rungs) and wavy curves (snake bodies),
    # both drawn in colour, inside the grid; everything else here is either
    # cell borders (5-point rectangles) or circular head/eye dots (13-point).
    lines = []
    curves = []
    for obj in objs:
        if obj.type != 2:  # path
            continue
        bounds = obj.get_bounds()
        if not in_grid(bounds):
            continue
        pts = get_points(obj)
        if len(pts) == 2:
            lines.append((bounds, pts, dist(pts[0], pts[1])))
        elif len(pts) not in (5, 13, 17):
            curves.append(pts)

    # Group each ladder's rails + rungs together by proximity.
    parent = list(range(len(lines)))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    def union(x, y):
        rx, ry = find(x), find(y)
        if rx != ry:
            parent[rx] = ry

    THRESHOLD = 6.0
    for i in range(len(lines)):
        for j in range(i + 1, len(lines)):
            if bbox_gap(lines[i][0], lines[j][0]) <= THRESHOLD:
                union(i, j)

    clusters = {}
    for i in range(len(lines)):
        clusters.setdefault(find(i), []).append(i)

    moves = []
    distances = []

    for members in clusters.values():
        # The two longest lines in the cluster are the rails; the shorter
        # ones are rungs, which we don't need for the endpoints.
        rails = sorted(members, key=lambda i: -lines[i][2])[:2]
        four_pts = []
        for idx in rails:
            four_pts.extend(lines[idx][1])
        four_pts.sort(key=lambda p: p[1])  # by y: bottom pair, then top pair
        bottom = four_pts[:2]
        top = four_pts[2:]
        bx = sum(p[0] for p in bottom) / 2
        by = sum(p[1] for p in bottom) / 2
        tx = sum(p[0] for p in top) / 2
        ty = sum(p[1] for p in top) / 2
        n_from, d1 = nearest_square((bx, by))
        n_to, d2 = nearest_square((tx, ty))
        moves.append({"type": "ladder", "from": n_from, "to": n_to})
        distances += [d1, d2]

    for pts in curves:
        p1, p2 = pts[0], pts[-1]
        n1, d1 = nearest_square(p1)
        n2, d2 = nearest_square(p2)
        head, tail = (n1, n2) if n1 > n2 else (n2, n1)
        moves.append({"type": "snake", "from": head, "to": tail})
        distances += [d1, d2]

    missing = [n for n in range(1, 101) if n not in num_center]
    if missing:
        raise ValueError(f"{pdf_path}: missing square labels {missing}")
    if max(distances) > 30:
        raise ValueError(f"{pdf_path}: an endpoint is unexpectedly far from any square centre ({max(distances):.1f}pt)")

    # Square centres as fractions of the page, with y measured from the TOP
    # (as on a canvas), so the player can position counters without caring
    # about page size.
    squares = {
        str(n): [round(c[0] / page_w, 5), round(1 - c[1] / page_h, 5)]
        for n, c in num_center.items()
    }

    return moves, squares


def check_invariants(board_n, moves):
    seen = set()
    for m in moves:
        for key in ("from", "to"):
            sq = m[key]
            if sq in seen:
                raise ValueError(f"board {board_n}: square {sq} used more than once")
            seen.add(sq)
        if m["type"] == "ladder" and not (m["from"] < m["to"]):
            raise ValueError(f"board {board_n}: ladder does not go up: {m}")
        if m["type"] == "snake" and not (m["from"] > m["to"]):
            raise ValueError(f"board {board_n}: snake does not go down: {m}")


def main():
    boards = []
    for n in range(1, 11):
        path = os.path.join(SOURCE_DIR, f"{n:03d}-Snakes-and-Ladders-Board.pdf")
        moves, squares = extract_board(path)
        moves.sort(key=lambda m: -m["from"])
        check_invariants(n, moves)
        boards.append({"n": n, "moves": moves, "squares": squares})
        print(f"board {n}: {len(moves)} ladders/snakes OK")

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(boards, f, indent=2)
        f.write("\n")
    print(f"wrote {OUT_PATH}")


if __name__ == "__main__":
    main()
