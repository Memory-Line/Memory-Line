"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { Check, Download, Eraser, Printer, RotateCcw, Undo2 } from "lucide-react";
import type { ColouringFrame } from "@/lib/colouring";

// A soft-and-bright palette, in the spirit of the printed sheets.
const PALETTE = [
  "#e74c3c", // red
  "#e67e22", // orange
  "#f1c40f", // yellow
  "#8bc34a", // leaf green
  "#2ecc71", // green
  "#1abc9c", // teal
  "#3498db", // blue
  "#5c6bc0", // indigo
  "#9b59b6", // purple
  "#e84393", // pink
  "#f7cac9", // soft pink
  "#f1d2be", // soft peach
  "#cfe3f2", // soft blue
  "#dfd5ec", // soft lilac
  "#8d6e63", // brown
  "#4a4a4a", // charcoal
];

const PDFJS_URL = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.min.mjs";
const PDFJS_WORKER_URL = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs";

// How large the picture is rendered at, relative to the PDF's own points
// (792x612). Kept high so tapping is precise and the "Save my picture" PNG
// looks crisp.
const RENDER_SCALE = 2.5;
// How far a pixel's colour can be from the tapped pixel and still be
// counted as "the same area" (allows for the grey anti-aliased edge around
// each line, without crossing a dark line itself).
const FLOOD_TOLERANCE = 70;
// A tapped pixel darker than this is treated as "on a line", so a stray tap
// on the ink doesn't do anything odd.
const LINE_LUMINANCE_THRESHOLD = 90;
// Anything at least this faint counts as part of the outline for working out
// where the fill should stop — looser than LINE_LUMINANCE_THRESHOLD so it
// catches the soft grey anti-aliased edge around a line too, not just its
// solid dark centre.
const WALL_LUMINANCE_THRESHOLD = 235;
// The outline mask above is then thickened by this many pixels (at
// RENDER_SCALE) before it's used to stop a fill, closing the small gaps some
// sheets have where two strokes don't quite meet — without which a fill can
// leak straight through and cover half the picture (e.g. the sky spilling
// into a building).
const WALL_CLOSE_RADIUS = 3;
// If a single tap would fill more than this fraction of the picture, treat
// it as a leak and don't apply it at all, rather than colouring most of the
// page.
const MAX_FILL_FRACTION = 0.35;
const MAX_UNDO = 30;

function hexToRgba(hex: string): [number, number, number, number] {
  const v = hex.replace("#", "");
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16), 255];
}

// Builds a closed outline mask (1 = "wall", the fill must not cross this)
// from the picture's own darkness, so the fill stops at the drawn lines even
// where the tolerance-to-seed-colour check below wouldn't catch it (e.g. a
// small gap between two strokes). A separable box dilation grows the raw
// outline by `radius` pixels first, closing those small gaps.
function buildWallMask(src: Uint8ClampedArray, w: number, h: number, radius: number): Uint8Array {
  const raw = new Uint8Array(w * h);
  for (let i = 0, p = 0; i < src.length; i += 4, p++) {
    const lum = 0.299 * src[i] + 0.587 * src[i + 1] + 0.114 * src[i + 2];
    raw[p] = lum < WALL_LUMINANCE_THRESHOLD ? 1 : 0;
  }
  if (radius <= 0) return raw;

  // Horizontal pass into `tmp`, then vertical pass into `out` — equivalent
  // to a full 2D dilation but O(w*h*radius) instead of O(w*h*radius^2).
  const tmp = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    const row = y * w;
    for (let x = 0; x < w; x++) {
      let hit = 0;
      const lo = Math.max(0, x - radius);
      const hi = Math.min(w - 1, x + radius);
      for (let xx = lo; xx <= hi && !hit; xx++) hit = raw[row + xx];
      tmp[row + x] = hit;
    }
  }
  const out = new Uint8Array(w * h);
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      let hit = 0;
      const lo = Math.max(0, y - radius);
      const hi = Math.min(h - 1, y + radius);
      for (let yy = lo; yy <= hi && !hit; yy++) hit = tmp[yy * w + x];
      out[y * w + x] = hit;
    }
  }
  return out;
}

// A standard flood fill from (sx, sy): every 4-connected pixel whose colour
// in `src` is within `tolerance` of the tapped pixel's colour, and isn't
// past a wall in `walls`, is added to the mask. Returns the number of pixels
// filled. Uses typed-array buffers passed in so no allocation happens per tap.
function floodFillMask(
  src: Uint8ClampedArray,
  walls: Uint8Array,
  w: number,
  h: number,
  sx: number,
  sy: number,
  tolerance: number,
  mask: Uint8Array,
  stack: Int32Array
): number {
  mask.fill(0);
  const startIdx = (sy * w + sx) * 4;
  const r0 = src[startIdx];
  const g0 = src[startIdx + 1];
  const b0 = src[startIdx + 2];
  const tol2 = tolerance * tolerance;
  let sp = 0;
  let count = 1;
  mask[sy * w + sx] = 1;
  stack[sp++] = sy * w + sx;

  const tryPush = (nx: number, ny: number) => {
    const np = ny * w + nx;
    if (mask[np] || walls[np]) return;
    const idx = np * 4;
    const dr = src[idx] - r0;
    const dg = src[idx + 1] - g0;
    const db = src[idx + 2] - b0;
    if (dr * dr + dg * dg + db * db <= tol2) {
      mask[np] = 1;
      count++;
      stack[sp++] = np;
    }
  };

  while (sp > 0) {
    const p = stack[--sp];
    const x = p % w;
    const y = (p / w) | 0;
    if (x + 1 < w) tryPush(x + 1, y);
    if (x > 0) tryPush(x - 1, y);
    if (y + 1 < h) tryPush(x, y + 1);
    if (y > 0) tryPush(x, y - 1);
  }
  return count;
}

function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // storage unavailable or full: colouring just isn't saved on this device
  }
}

// A colouring page on screen: the line drawing is drawn into a canvas at
// high resolution, and tapping an area floods it with the selected colour
// (tolerant of the grey anti-aliased edge, stopping at the dark lines). The
// colouring itself stays only on this device — nothing is uploaded.
export default function ColouringPlayer({
  templateId,
  frame,
  tracking,
  initiallyCompleted,
  hasLargePrint,
}: {
  templateId: string;
  frame: ColouringFrame;
  tracking: boolean;
  initiallyCompleted: boolean;
  hasLargePrint: boolean;
}) {
  const storageKey = `colouring:${templateId}`;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const originalDataRef = useRef<Uint8ClampedArray | null>(null);
  const wallMaskRef = useRef<Uint8Array | null>(null);
  const inkCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fillCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fillCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const fillImageDataRef = useRef<ImageData | null>(null);
  const maskRef = useRef<Uint8Array | null>(null);
  const stackRef = useRef<Int32Array | null>(null);
  const historyRef = useRef<Uint8ClampedArray[]>([]);
  const dimsRef = useRef({ w: 0, h: 0 });

  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [colour, setColour] = useState<string>(PALETTE[0]);
  const [tool, setTool] = useState<"colour" | "eraser">("colour");
  const [canUndo, setCanUndo] = useState(false);
  const [completed, setCompleted] = useState(initiallyCompleted);
  const [finished, setFinished] = useState(initiallyCompleted);
  const [fillNotice, setFillNotice] = useState(false);
  const fillNoticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function redraw() {
    const canvas = canvasRef.current;
    const fillCanvas = fillCanvasRef.current;
    const inkCanvas = inkCanvasRef.current;
    if (!canvas || !fillCanvas || !inkCanvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(fillCanvas, 0, 0);
    ctx.drawImage(inkCanvas, 0, 0);
  }

  function persist() {
    const fillCanvas = fillCanvasRef.current;
    if (!fillCanvas) return;
    try {
      safeSet(storageKey, fillCanvas.toDataURL("image/png"));
    } catch {
      // canvas can't be exported (unlikely, same-origin data URL); skip saving
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // Loaded from the CDN as a genuine ES module dynamic import — written
        // this way (rather than a plain import()) so the bundler doesn't try
        // to resolve or bundle a remote URL at build time.
        const importModule = new Function("specifier", "return import(specifier)") as (
          specifier: string
        ) => Promise<any>;
        const pdfjsLib = await importModule(PDFJS_URL);
        pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;

        const doc = await pdfjsLib.getDocument(`/api/download/${templateId}?file=standard`).promise;
        const page = await doc.getPage(1);
        const viewport = page.getViewport({ scale: RENDER_SCALE });

        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = Math.ceil(viewport.width);
        pageCanvas.height = Math.ceil(viewport.height);
        const pageCtx = pageCanvas.getContext("2d");
        if (!pageCtx) throw new Error("no 2d context");
        await page.render({ canvasContext: pageCtx, viewport }).promise;
        if (cancelled) return;

        const cropX = Math.round(frame.x * pageCanvas.width);
        const cropY = Math.round(frame.y * pageCanvas.height);
        const cropW = Math.max(1, Math.round(frame.w * pageCanvas.width));
        const cropH = Math.max(1, Math.round(frame.h * pageCanvas.height));
        const original = pageCtx.getImageData(cropX, cropY, cropW, cropH);

        // The ink-only overlay: black, with alpha set by how dark the pixel
        // was, so the paper's white becomes transparent and the colour
        // underneath shows through, while the drawn lines stay on top.
        const ink = new ImageData(cropW, cropH);
        for (let i = 0; i < original.data.length; i += 4) {
          const r = original.data[i];
          const g = original.data[i + 1];
          const b = original.data[i + 2];
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          ink.data[i] = 0;
          ink.data[i + 1] = 0;
          ink.data[i + 2] = 0;
          ink.data[i + 3] = Math.max(0, Math.min(255, 255 - lum));
        }
        const inkCanvas = document.createElement("canvas");
        inkCanvas.width = cropW;
        inkCanvas.height = cropH;
        inkCanvas.getContext("2d")!.putImageData(ink, 0, 0);

        const fillCanvas = document.createElement("canvas");
        fillCanvas.width = cropW;
        fillCanvas.height = cropH;
        const fillCtx = fillCanvas.getContext("2d");
        if (!fillCtx) throw new Error("no 2d context");
        let fillImageData = fillCtx.createImageData(cropW, cropH);

        // Restore any colouring already saved on this device.
        const saved = safeGet(storageKey);
        if (saved) {
          await new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => {
              fillCtx.drawImage(img, 0, 0, cropW, cropH);
              fillImageData = fillCtx.getImageData(0, 0, cropW, cropH);
              resolve();
            };
            img.onerror = () => resolve();
            img.src = saved;
          });
        }
        if (cancelled) return;

        originalDataRef.current = original.data;
        wallMaskRef.current = buildWallMask(original.data, cropW, cropH, WALL_CLOSE_RADIUS);
        inkCanvasRef.current = inkCanvas;
        fillCanvasRef.current = fillCanvas;
        fillCtxRef.current = fillCtx;
        fillImageDataRef.current = fillImageData;
        dimsRef.current = { w: cropW, h: cropH };
        maskRef.current = new Uint8Array(cropW * cropH);
        stackRef.current = new Int32Array(cropW * cropH);

        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = cropW;
          canvas.height = cropH;
        }
        setStatus("ready");
        requestAnimationFrame(redraw);
      } catch (err) {
        console.error("Colouring page failed to load:", err);
        if (!cancelled) setStatus("error");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId]);

  useEffect(
    () => () => {
      if (fillNoticeTimer.current) clearTimeout(fillNoticeTimer.current);
    },
    []
  );

  function pointerToPixel(e: PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);
    const { w, h } = dimsRef.current;
    if (x < 0 || y < 0 || x >= w || y >= h) return null;
    return { x, y };
  }

  function handleTap(e: PointerEvent<HTMLCanvasElement>) {
    const original = originalDataRef.current;
    const walls = wallMaskRef.current;
    const mask = maskRef.current;
    const stack = stackRef.current;
    const fillCtx = fillCtxRef.current;
    const fillImageData = fillImageDataRef.current;
    const { w, h } = dimsRef.current;
    if (!original || !walls || !mask || !stack || !fillCtx || !fillImageData) return;
    const pt = pointerToPixel(e);
    if (!pt) return;

    const startIdx = (pt.y * w + pt.x) * 4;
    const lum = 0.299 * original[startIdx] + 0.587 * original[startIdx + 1] + 0.114 * original[startIdx + 2];
    if (lum < LINE_LUMINANCE_THRESHOLD) return; // tapped on a line itself: do nothing

    const filled = floodFillMask(original, walls, w, h, pt.x, pt.y, FLOOD_TOLERANCE, mask, stack);
    if (filled > w * h * MAX_FILL_FRACTION) {
      // The area came out far bigger than any real shape on these sheets —
      // a leak slipped past the walls somewhere, so don't colour it in.
      setFillNotice(true);
      if (fillNoticeTimer.current) clearTimeout(fillNoticeTimer.current);
      fillNoticeTimer.current = setTimeout(() => setFillNotice(false), 4000);
      return;
    }

    // Save the current picture for Undo before changing it.
    historyRef.current.push(fillImageData.data.slice());
    if (historyRef.current.length > MAX_UNDO) historyRef.current.shift();
    setCanUndo(true);

    const [r, g, b, a] = tool === "eraser" ? [0, 0, 0, 0] : hexToRgba(colour);
    const data = fillImageData.data;
    for (let i = 0; i < mask.length; i++) {
      if (!mask[i]) continue;
      const idx = i * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = a;
    }
    fillCtx.putImageData(fillImageData, 0, 0);
    redraw();
    persist();
  }

  function undo() {
    const prev = historyRef.current.pop();
    const fillCtx = fillCtxRef.current;
    const fillImageData = fillImageDataRef.current;
    if (!prev || !fillCtx || !fillImageData) return;
    fillImageData.data.set(prev);
    fillCtx.putImageData(fillImageData, 0, 0);
    setCanUndo(historyRef.current.length > 0);
    redraw();
    persist();
  }

  function startAgain() {
    const fillCtx = fillCtxRef.current;
    const fillImageData = fillImageDataRef.current;
    if (!fillCtx || !fillImageData) return;
    fillImageData.data.fill(0);
    fillCtx.putImageData(fillImageData, 0, 0);
    historyRef.current = [];
    setCanUndo(false);
    redraw();
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // storage unavailable
    }
  }

  function savePicture() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "my-colouring-picture.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  async function markCompleted() {
    setFinished(true);
    if (!tracking || completed) return;
    try {
      const res = await fetch("/api/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId, completed: true }),
      });
      if (res.ok) setCompleted(true);
    } catch {
      // not marked; they can still use the Completed button on the list
    }
  }

  return (
    <div className="max-w-[760px]">
      <p className="text-sm text-inkSoft mb-3">
        Choose a colour, then tap inside a shape to colour it in. Tap the eraser and tap an area to
        clear it again.
      </p>

      {/* Palette: 2 columns wide on narrow phones so the swatches stay big
          and easy to tap; wraps to more columns as the screen gets wider. */}
      <div className="grid grid-cols-2 sm:grid-cols-8 gap-2 mb-3" role="group" aria-label="Colour palette">
        {PALETTE.map((hex) => (
          <button
            key={hex}
            onClick={() => {
              setColour(hex);
              setTool("colour");
            }}
            aria-label={`Colour ${hex}`}
            aria-pressed={tool === "colour" && colour === hex}
            className="rounded-xl"
            style={{
              height: 44,
              background: hex,
              border: tool === "colour" && colour === hex ? "3px solid #3f3237" : "3px solid transparent",
              boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.12)",
            }}
          />
        ))}
        <button
          onClick={() => setTool("eraser")}
          aria-pressed={tool === "eraser"}
          className="flex items-center justify-center gap-1.5 rounded-xl text-sm font-semibold col-span-2 sm:col-span-8"
          style={{
            height: 44,
            background: tool === "eraser" ? "#3f3237" : "#f3ede2",
            color: tool === "eraser" ? "#fff" : "#3f3237",
          }}
        >
          <Eraser size={16} /> Eraser
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={undo}
          disabled={!canUndo}
          className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold bg-cardTint disabled:opacity-40"
        >
          <Undo2 size={14} /> Undo
        </button>
        <button onClick={startAgain} className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold bg-cardTint">
          <RotateCcw size={14} /> Start again
        </button>
        <button
          onClick={savePicture}
          disabled={status !== "ready"}
          className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold bg-cardTint disabled:opacity-40"
        >
          <Download size={14} /> Save my picture
        </button>
      </div>

      <div className="rounded-xl bg-white p-3 border border-line" style={{ display: "inline-block", touchAction: "none" }}>
        {status === "loading" && <p className="text-sm text-inkSoft p-6">Loading your picture…</p>}
        {status === "error" && (
          <p className="text-sm text-inkSoft p-6 max-w-[420px]">
            This picture couldn't be loaded to colour in right now, but you can still print it below.
          </p>
        )}
        <canvas
          ref={canvasRef}
          onPointerDown={handleTap}
          style={{
            display: status === "ready" ? "block" : "none",
            width: "100%",
            maxWidth: 700,
            height: "auto",
            touchAction: "none",
            cursor: "pointer",
          }}
        />
      </div>

      {fillNotice && (
        <p className="mt-3 text-sm text-inkSoft rounded-lg px-3 py-2 bg-cardTint inline-block">
          That area's a bit too open to colour in on its own — try tapping a smaller part of it.
        </p>
      )}

      {finished && (
        <div className="mt-4 rounded-lg px-3 py-2 text-sm font-semibold inline-flex items-center gap-1.5" style={{ background: "#e4eee2", color: "#2f7a63" }}>
          <Check size={14} /> Lovely — all done for now.
          {tracking && completed && <span>Marked as completed.</span>}
        </div>
      )}

      <div className="mt-4">
        <button
          onClick={markCompleted}
          disabled={status !== "ready"}
          className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
          style={{ background: "#2f7a63" }}
        >
          <Check size={14} /> I've finished
        </button>
      </div>

      <div className="mt-6 pt-4 border-t border-line">
        <p className="text-xs font-semibold text-inkSoft mb-2">Prefer paper?</p>
        <div className="flex flex-wrap gap-2">
          <a
            href={`/api/download/${templateId}?file=standard`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold"
            style={{ background: "#E4EEE2", color: "#6D8C6A" }}
          >
            <Printer size={14} /> Print
          </a>
          {hasLargePrint && (
            <a
              href={`/api/download/${templateId}?file=large-print`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold"
              style={{ background: "#FCEFE7", color: "#B5714A" }}
            >
              <Printer size={14} /> Print Large (A3)
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
