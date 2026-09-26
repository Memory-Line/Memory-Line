"""Work out the 7 differences between Picture A and Picture B on each Spot
the Difference sheet, for playing online.

There are no answer sheets for this pack, so the differences are found by
image comparison: each Standard PDF has two large embedded pictures side by
side (Picture A, Picture B) of the same scene. We render the page, crop out
each picture, and compare them.

Because the two pictures are independently painted/rendered (not one image
copy-pasted with edits), a plain pixel subtraction is far too noisy: fine
texture (bark, leaves, gravel) never lines up exactly, even where the scene
is "the same". To see through that noise we compare the *median* colour of
small blocks of each picture rather than individual pixels (a median shrugs
off the odd stray texture pixel, but still shifts when a whole area's colour
really changes), and we do this at several block sizes at once (small
objects like a bird house roof need fine blocks; big objects like a missing
watering can need coarse blocks so they dominate their block). A candidate
difference that shows up at several block sizes in roughly the same place is
scored higher (it "votes" for itself); isolated, low-scoring, oddly-shaped or
edge-hugging candidates are treated as noise and dropped.

For each sheet we take the best 7 candidates. If there isn't a confident,
clearly-separated set of 7 (a big score gap after the 7th), the sheet is left
out of online play rather than guessed — printed at the end, and also
returned by check_sample() for a human to look at.

Usage:
  python extract_spotdifference.py STANDARD_DIR OUT_JSON [--samples N --sample-dir DIR]
"""

import argparse
import json
import os
import re
import sys

import numpy as np
import pypdfium2 as pdfium
from PIL import Image, ImageDraw

SCALE = 5  # render resolution multiplier (points -> pixels)
INSET = 0.015  # trim this fraction off each picture's edge (frame safety margin)
BLOCK_SCALES = [22, 30, 40, 52, 66]  # number of grid columns tried, coarse to fine
MAX_DIM_FRAC = 0.34  # a real difference shouldn't span more of the grid than this...
MAX_AREA_FRAC = 0.13  # ...or cover this much of the picture's area
MERGE_IOU = 0.12  # candidates overlapping this much across scales are the same thing
TARGET = 7
MIN_BOX_FRAC = 0.015  # reject degenerate slivers
GAP_RATIO = 2.2
MIN_VOTES_FOR_7TH = 1


def get_pictures(path):
    """Return ([Picture A image, Picture B image], [pic-A page-fraction rect, pic-B rect]) or None."""
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
    big.sort(key=lambda o: o.get_bounds()[0])  # left picture (A) first
    bitmap = page.render(scale=SCALE)
    img = bitmap.to_pil()

    def to_px(bounds):
        l, b, r, t = bounds
        return (l * SCALE, (h_pt - t) * SCALE, r * SCALE, (h_pt - b) * SCALE)

    crops, pic_frac = [], []
    for o in big:
        x0, y0, x1, y1 = to_px(o.get_bounds())
        w, h = x1 - x0, y1 - y0
        ix0, iy0 = x0 + w * INSET, y0 + h * INSET
        ix1, iy1 = x1 - w * INSET, y1 - h * INSET
        crops.append(img.crop((ix0, iy0, ix1, iy1)))
        pic_frac.append(
            (
                (ix0 / SCALE) / w_pt,
                (iy0 / SCALE) / h_pt,
                (ix1 - ix0) / SCALE / w_pt,
                (iy1 - iy0) / SCALE / h_pt,
            )
        )
    return crops, pic_frac


def median_block_diff(a, b, bw):
    """Per-block channel-wise median colour difference between two same-size images."""
    if a.size != b.size:
        b = b.resize(a.size)
    W, H = a.size
    bh = max(1, round(H * bw / W))
    cw = max(1, W // bw)
    ch = max(1, H // bh)
    W2, H2 = cw * bw, ch * bh
    A = np.asarray(a.crop((0, 0, W2, H2))).astype(np.int16)
    B = np.asarray(b.crop((0, 0, W2, H2))).astype(np.int16)
    A2 = A.reshape(bh, ch, bw, cw, 3)
    B2 = B.reshape(bh, ch, bw, cw, 3)
    Amed = np.median(A2, axis=(1, 3))
    Bmed = np.median(B2, axis=(1, 3))
    return np.abs(Amed - Bmed).sum(axis=2)


def clusters_from_diff(diff, top_frac=0.12, merge_dist=2, target=TARGET):
    """Join nearby high-diff blocks into candidate regions (blurring is implicit in
    the block-median step above; this is the threshold + connected-blob join)."""
    h, w = diff.shape
    flat = diff.flatten()
    n_top = max(target * 4, int(len(flat) * top_frac))
    idx = np.argsort(flat)[::-1][:n_top]
    cells = [(i // w, i % w, flat[i]) for i in idx if flat[i] > 0]
    cellset = {(y, x): s for y, x, s in cells}
    assigned = {}
    clusters = []
    for (y, x, s) in sorted(cells, key=lambda c: -c[2]):
        if (y, x) in assigned:
            continue
        stack, members = [(y, x)], [(y, x)]
        assigned[(y, x)] = True
        while stack:
            cy, cx = stack.pop()
            for (hy, hx) in list(cellset.keys()):
                if (hy, hx) in assigned:
                    continue
                if max(abs(hy - cy), abs(hx - cx)) <= merge_dist:
                    assigned[(hy, hx)] = True
                    members.append((hy, hx))
                    stack.append((hy, hx))
        mass = sum(cellset[m] for m in members)
        ys, xs = [m[0] for m in members], [m[1] for m in members]
        clusters.append({"mass": mass, "bbox": (min(ys), min(xs), max(ys), max(xs)), "grid": (h, w)})

    clean = []
    for c in clusters:
        y0, x0, y1, x1 = c["bbox"]
        if (y1 - y0 + 1) / h > MAX_DIM_FRAC or (x1 - x0 + 1) / w > MAX_DIM_FRAC:
            continue
        if ((y1 - y0 + 1) * (x1 - x0 + 1)) / (h * w) > MAX_AREA_FRAC:
            continue
        clean.append(c)
    clean.sort(key=lambda c: -c["mass"])
    return clean


def bbox_to_frac(bbox, grid):
    h, w = grid
    y0, x0, y1, x1 = bbox
    fx0, fy0 = x0 / w, y0 / h
    fx1, fy1 = (x1 + 1) / w, (y1 + 1) / h
    return (fx0, fy0, fx1 - fx0, fy1 - fy0)


def iou(b1, b2):
    ax0, ay0, aw, ah = b1
    bx0, by0, bw_, bh_ = b2
    ix0, iy0 = max(ax0, bx0), max(ay0, by0)
    ix1, iy1 = min(ax0 + aw, bx0 + bw_), min(ay0 + ah, by0 + bh_)
    iw, ih = max(0, ix1 - ix0), max(0, iy1 - iy0)
    inter = iw * ih
    if inter <= 0:
        return 0.0
    union = aw * ah + bw_ * bh_ - inter
    return inter / union if union > 0 else 0.0


def find_candidates(a, b, scales=BLOCK_SCALES, target=TARGET):
    candidates = []
    for bw in scales:
        diff = median_block_diff(a, b, bw)
        clusters = clusters_from_diff(diff, target=target)
        if not clusters:
            continue
        masses = [c["mass"] for c in clusters]
        baseline = max(np.median(masses[-max(3, len(masses) // 2):]) if len(masses) >= 4 else masses[-1], 1)
        for c in clusters[:12]:
            candidates.append({"frac": bbox_to_frac(c["bbox"], c["grid"]), "rel": c["mass"] / baseline, "scale": bw})

    groups = []
    for cand in sorted(candidates, key=lambda c: -c["rel"]):
        placed = False
        for g in groups:
            if any(iou(cand["frac"], m["frac"]) > MERGE_IOU for m in g["members"]):
                g["members"].append(cand)
                placed = True
                break
        if not placed:
            groups.append({"members": [cand]})

    finalized = []
    for g in groups:
        members = g["members"]
        finest = max(members, key=lambda m: m["scale"])
        x, y, w_, h_ = finest["frac"]
        pad_x, pad_y = w_ * 0.05 + 0.006, h_ * 0.05 + 0.006
        box = (max(0.0, x - pad_x), max(0.0, y - pad_y), min(1.0, w_ + 2 * pad_x), min(1.0, h_ + 2 * pad_y))
        finalized.append({"box": box, "score": sum(m["rel"] for m in members), "votes": len(set(m["scale"] for m in members))})
    finalized.sort(key=lambda f: (-f["votes"], -f["score"]))
    return finalized


def pick_seven(candidates):
    """Return (regions, ok, reason)."""
    if len(candidates) < TARGET:
        return None, False, f"only {len(candidates)} candidate regions found"
    top7 = candidates[:TARGET]
    eighth = candidates[TARGET] if len(candidates) > TARGET else None

    for i, c in enumerate(top7):
        _, _, w_, h_ = c["box"]
        if w_ < MIN_BOX_FRAC or h_ < MIN_BOX_FRAC:
            return None, False, f"region {i+1} is a sliver ({w_:.4f}x{h_:.4f})"
    for i in range(len(top7)):
        for j in range(i + 1, len(top7)):
            if iou(top7[i]["box"], top7[j]["box"]) > 0.05:
                return None, False, f"regions {i+1} and {j+1} overlap"
    if top7[-1]["votes"] < MIN_VOTES_FOR_7TH:
        return None, False, "7th region has no cross-scale support"
    if eighth is not None:
        if eighth["votes"] > top7[-1]["votes"]:
            return None, False, "no clean cutoff after 7 (8th candidate as strong)"
        if eighth["votes"] == top7[-1]["votes"] and eighth["score"] > 0:
            ratio = top7[-1]["score"] / max(eighth["score"], 0.001)
            if ratio < GAP_RATIO:
                return None, False, f"no clean cutoff after 7 (gap ratio {ratio:.2f})"
    return top7, True, "ok"


def process_sheet(path):
    result = get_pictures(path)
    if result is None:
        return None, False, "couldn't find two picture objects"
    (a, b), pic_frac = result
    if a.size != b.size:
        b = b.resize(a.size)
    candidates = find_candidates(a, b)
    regions, ok, reason = pick_seven(candidates)
    if not ok:
        return {"pic_frac": pic_frac}, False, reason
    return {
        "pic_frac": pic_frac,
        "regions": [{"x": round(c["box"][0], 4), "y": round(c["box"][1], 4), "w": round(c["box"][2], 4), "h": round(c["box"][3], 4)} for c in regions],
    }, True, "ok"


def render_sample(path, out_path, entry):
    result = get_pictures(path)
    if result is None:
        return
    (a, b), _ = result
    if a.size != b.size:
        b = b.resize(a.size)
    W, H = a.size
    ac, bc = a.copy(), b.copy()
    da, db = ImageDraw.Draw(ac), ImageDraw.Draw(bc)
    for r in entry.get("regions", []):
        box = (r["x"] * W, r["y"] * H, (r["x"] + r["w"]) * W, (r["y"] + r["h"]) * H)
        da.rectangle(box, outline=(220, 30, 30), width=5)
        db.rectangle(box, outline=(220, 30, 30), width=5)
    combo = Image.new("RGB", (W * 2 + 20, H), (255, 255, 255))
    combo.paste(ac, (0, 0))
    combo.paste(bc, (W + 20, 0))
    combo.save(out_path)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("out")
    ap.add_argument("--samples", type=int, default=0, help="render this many sample sheets with boxes drawn")
    ap.add_argument("--sample-dir", default=None)
    ap.add_argument("--only", default=None, help="comma list of sheet numbers to run (for quick testing)")
    args = ap.parse_args()

    names = sorted(f for f in os.listdir(args.src) if f.lower().endswith(".pdf"))
    only = set(int(x) for x in args.only.split(",")) if args.only else None

    data = [None] * 200
    included, excluded = [], []
    for name in names:
        m = re.match(r"(\d+)-", name)
        if not m:
            continue
        n = int(m.group(1))
        if only and n not in only:
            continue
        if n == 188:
            # known-defective sheet, already left out of the live site — skip
            # without touching the numbering.
            excluded.append((n, "known-defective sheet (pre-existing, left out of the live site)"))
            print(f"{n:03d} LEFT OUT: known-defective sheet, skipped as instructed")
            continue
        path = os.path.join(args.src, name)
        entry, ok, reason = process_sheet(path)
        if ok:
            data[n - 1] = {"n": n, "pictureA": {"x": entry["pic_frac"][0][0], "y": entry["pic_frac"][0][1], "w": entry["pic_frac"][0][2], "h": entry["pic_frac"][0][3]},
                           "pictureB": {"x": entry["pic_frac"][1][0], "y": entry["pic_frac"][1][1], "w": entry["pic_frac"][1][2], "h": entry["pic_frac"][1][3]},
                           "regions": entry["regions"]}
            included.append(n)
            print(f"{n:03d} OK")
        else:
            excluded.append((n, reason))
            print(f"{n:03d} LEFT OUT: {reason}")

    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(data, f)

    print(f"\nIncluded: {len(included)}  Excluded: {len(excluded)}")
    for n, reason in excluded:
        print(f"  {n}: {reason}")

    if args.samples:
        sample_dir = args.sample_dir or os.path.join(os.path.dirname(args.out), "samples")
        os.makedirs(sample_dir, exist_ok=True)
        step = max(1, len(included) // args.samples)
        for n in included[::step][: args.samples]:
            name = next(nm for nm in names if nm.startswith(f"{n:03d}-"))
            render_sample(os.path.join(args.src, name), os.path.join(sample_dir, f"{n:03d}.png"), data[n - 1])
        print(f"Wrote samples to {sample_dir}")


if __name__ == "__main__":
    main()
