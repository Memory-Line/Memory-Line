"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Eye, Heart, Printer, RotateCcw } from "lucide-react";
import type { WordSearchWord } from "@/lib/wordSearch";
import { useEasyView } from "@/components/EasyView";

// Colours from the printed sheets (the answer-key highlights and word pills).
const INK = "#3f3237";
const SELECTED = "#b5714a";
const WRONG_INK = "#c0392b";
const HIGHLIGHTS = ["#cfe3f2", "#c9e6dd", "#f1d2be", "#dfd5ec", "#f2e2b8", "#d3e6f5", "#f2d6da", "#d8e7cb"];
const MAX_LIVES = 3;

type Cell = [number, number];

// The cells on the straight line from a to b, or null if it isn't straight
// (across, down or diagonal).
function lineCells(a: Cell, b: Cell): Cell[] | null {
  const dr = Math.sign(b[0] - a[0]);
  const dc = Math.sign(b[1] - a[1]);
  const len = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]));
  if ((b[0] - a[0]) !== dr * len || (b[1] - a[1]) !== dc * len) return null;
  return Array.from({ length: len + 1 }, (_, k) => [a[0] + dr * k, a[1] + dc * k] as Cell);
}

// While dragging, the end of the line is snapped to the nearest straight direction (across, down or
// diagonal) from where the drag began, so a slightly wobbly drag still selects a straight word.
const DIRS: Cell[] = [[0, 1], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0], [-1, 1]];
function snapEnd(from: Cell, to: Cell, size: number): Cell {
  const dr = to[0] - from[0];
  const dc = to[1] - from[1];
  if (dr === 0 && dc === 0) return from;
  const dir = DIRS[((Math.round(Math.atan2(dr, dc) / (Math.PI / 4)) % 8) + 8) % 8];
  let len = Math.round((dr * dir[0] + dc * dir[1]) / (dir[0] * dir[0] + dir[1] * dir[1]));
  while (len > 0 && (from[0] + dir[0] * len < 0 || from[0] + dir[0] * len >= size || from[1] + dir[1] * len < 0 || from[1] + dir[1] * len >= size)) len--;
  return len <= 0 ? from : [from[0] + dir[0] * len, from[1] + dir[1] * len];
}

// A Word Search to solve on screen: drag from the first letter of a word to its last letter (or tap the
// first letter, then the last). Words from the list light up in colour and are crossed off.
// Progress is kept on this device.
export default function WordSearchPlayer({
  templateId,
  grid,
  words,
  tracking,
  initiallyCompleted,
  hasLargePrint,
  isPremium,
}: {
  templateId: string;
  grid: string[];
  words: WordSearchWord[];
  tracking: boolean;
  initiallyCompleted: boolean;
  hasLargePrint: boolean;
  isPremium: boolean;
}) {
  const size = grid.length;
  const storageKey = `wordsearch:${templateId}`;
  // For each found word (by index), the place it was found.
  const [found, setFound] = useState<Record<number, [number, number, number, number]>>({});
  const [start, setStart] = useState<Cell | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [message, setMessage] = useState("");
  const [completed, setCompleted] = useState(initiallyCompleted);
  const [lives, setLives] = useState(MAX_LIVES);

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(storageKey) ?? "null");
      if (saved && typeof saved === "object") setFound(saved);
    } catch {
      // nothing saved, or storage unavailable
    }
  }, [storageKey]);

  function save(next: typeof found) {
    setFound(next);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // storage unavailable: progress just isn't kept
    }
  }

  async function markCompleted() {
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

  // A wrong selection costs a life; running out starts the sheet fresh
  // rather than letting mistakes pile up. Returns true if it reset (so the
  // caller can stop, having already shown its own message).
  function loseLife(): boolean {
    const remaining = lives - 1;
    if (remaining <= 0) {
      save({});
      setRevealed(false);
      setLives(MAX_LIVES);
      setMessage("No trouble — let's start this word search fresh.");
      return true;
    }
    setLives(remaining);
    return false;
  }

  function tap(cell: Cell) {
    if (!start) {
      setStart(cell);
      setMessage("");
      return;
    }
    if (start[0] === cell[0] && start[1] === cell[1]) {
      setStart(null); // tapping the same letter again cancels
      return;
    }
    const from = start;
    setStart(null);
    check(from, cell);
  }

  // Does the line from `from` to `cell` spell a word from the list?
  function check(from: Cell, cell: Cell) {
    const line = lineCells(from, cell);
    if (!line) {
      if (loseLife()) return;
      setMessage("Words run in a straight line — across, down or diagonally. Try again.");
      return;
    }
    // Does this line spell a word from the list (either way round)?
    const match = words.findIndex(
      (w, i) =>
        found[i] === undefined &&
        w.at.some(
          ([r1, c1, r2, c2]) =>
            (r1 === from[0] && c1 === from[1] && r2 === cell[0] && c2 === cell[1]) ||
            (r2 === from[0] && c2 === from[1] && r1 === cell[0] && c1 === cell[1])
        )
    );
    if (match === -1) {
      if (loseLife()) return;
      const letters = line.map(([r, c]) => grid[r][c]).join("");
      setMessage(`"${letters}" isn't one of the words. Try again.`);
      return;
    }
    const at = words[match].at.find(
      ([r1, c1, r2, c2]) =>
        (r1 === from[0] && c1 === from[1] && r2 === cell[0] && c2 === cell[1]) ||
        (r2 === from[0] && c2 === from[1] && r1 === cell[0] && c1 === cell[1])
    )!;
    const next = { ...found, [match]: at };
    save(next);
    if (Object.keys(next).length === words.length) {
      setMessage("Well done — you found every word!");
      markCompleted();
    } else {
      setMessage(`Found ${words[match].word}!`);
    }
  }

  function startAgain() {
    save({});
    setStart(null);
    setRevealed(false);
    setMessage("");
    setLives(MAX_LIVES);
  }

  // Colour for each cell: the first word covering it, in that word's own colour (the same one as its pill in the
  // list, whether it was found or is only being shown as an answer).
  const cellColour = new Map<string, string>();
  const shownOnly = new Set<string>(); // cells coloured only because the answers are being shown
  words.forEach((w, i) => {
    const at = found[i] ?? (revealed ? w.at[0] : undefined);
    if (!at) return;
    const cells = lineCells([at[0], at[1]], [at[2], at[3]]) ?? [];
    for (const [r, c] of cells) {
      const key = `${r},${c}`;
      if (!cellColour.has(key)) {
        cellColour.set(key, HIGHLIGHTS[i % HIGHLIGHTS.length]);
        if (!found[i]) shownOnly.add(key);
      }
    }
  });

  // Dragging along a word (mouse or finger). A quick press and release on one letter is just a tap.
  const [drag, setDrag] = useState<{ from: Cell; to: Cell } | null>(null);
  const dragRef = useRef<{ from: Cell; to: Cell } | null>(null);
  function setDragBoth(d: { from: Cell; to: Cell } | null) {
    dragRef.current = d;
    setDrag(d);
  }
  function cellAt(x: number, y: number): Cell | null {
    const el = (document.elementFromPoint(x, y) as HTMLElement | null)?.closest?.("[data-rc]") as HTMLElement | null;
    if (!el?.dataset.rc) return null;
    const [r, c] = el.dataset.rc.split(",").map(Number);
    return [r, c];
  }
  function onDown(e: React.PointerEvent) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const at = cellAt(e.clientX, e.clientY);
    if (!at) return;
    try {
      // Keep receiving the drag even if the finger or mouse slides off the grid before letting go.
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // not available: the drag simply ends when it leaves the grid
    }
    setDragBoth({ from: at, to: at });
  }
  function onMove(e: React.PointerEvent) {
    const d = dragRef.current;
    if (!d) return;
    const at = cellAt(e.clientX, e.clientY);
    if (!at) return;
    const to = snapEnd(d.from, at, size);
    if (to[0] !== d.to[0] || to[1] !== d.to[1]) setDragBoth({ from: d.from, to });
  }
  function onUp() {
    const d = dragRef.current;
    setDragBoth(null);
    if (!d) return;
    if (d.from[0] === d.to[0] && d.from[1] === d.to[1]) {
      tap(d.from);
    } else {
      setStart(null);
      setMessage("");
      check(d.from, d.to);
    }
  }
  const dragLine = drag ? lineCells(drag.from, drag.to) ?? [] : [];
  const dragSet = new Set(dragLine.map(([r, c]) => `${r},${c}`));

  const ev = useEasyView();
  const foundCount = Object.keys(found).length;
  const cell = `min(${ev ? 32 : 34}px, calc((100vw - 72px) / ${size}))`;

  return (
    <div className="flex flex-wrap justify-center gap-6 sm:gap-8 items-start">
      <div className="rounded-xl bg-white p-3 border border-line" style={{ display: "inline-block" }}>
        <div
          role="grid"
          aria-label="Word search grid"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={() => setDragBoth(null)}
          style={{ display: "grid", gridTemplateColumns: `repeat(${size}, ${cell})`, touchAction: "none", userSelect: "none", WebkitUserSelect: "none" }}
        >
          {grid.map((row, r) =>
            row.split("").map((letter, c) => {
              const isStart = (start && start[0] === r && start[1] === c) || dragSet.has(`${r},${c}`);
              const bg = cellColour.get(`${r},${c}`);
              return (
                <button
                  key={`${r}-${c}`}
                  role="gridcell"
                  aria-label={`Row ${r + 1}, column ${c + 1}, ${letter}`}
                  data-rc={`${r},${c}`}
                  // Mouse and touch are handled by the grid (drag, or a quick tap); this is for the keyboard.
                  onClick={(e) => { if (e.detail === 0) tap([r, c]); }}
                  style={{
                    width: cell,
                    height: cell,
                    fontSize: `calc(${cell} * 0.55)`,
                    fontWeight: 700,
                    color: ev ? "#1a1a1a" : INK,
                    background: ev ? (isStart ? "#FFF4C2" : bg ? (shownOnly.has(`${r},${c}`) ? "#ECECEC" : "#FFD23F") : "transparent") : isStart ? "#fcefe7" : bg ?? "transparent",
                    outline: isStart ? (ev ? "4px solid #1a1a1a" : `3px solid ${SELECTED}`) : "none",
                    outlineOffset: -3,
                    borderRadius: ev ? 4 : 6,
                    border: ev ? "1px solid #bbb" : undefined,
                    fontFamily: "Helvetica, Arial, sans-serif",
                  }}
                >
                  {letter}
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className={ev ? "max-w-[300px]" : "max-w-[340px]"}>
        {ev ? (
          <>
            <div className="rounded-2xl text-center mb-3" style={{ background: "#FFF4C2", padding: "10px 12px" }}>
              <p className="text-sm font-bold mb-1" style={{ color: "#444" }}>FIND THE WORDS</p>
              <p className="font-bold" style={{ fontSize: 20, lineHeight: 1.25, color: "#1a1a1a" }}>
                Drag from the first letter of a word to its last letter, or tap the first letter, then the last. Words go across, down or diagonally, and can be backwards.
              </p>
            </div>
            <p className="font-bold mb-2" style={{ fontSize: 20, color: "#1a1a1a" }}>
              Lives left: <span style={{ fontSize: 30 }}>{lives}</span>
            </p>
            <p className="font-bold mb-2" style={{ fontSize: 22, color: "#1a1a1a" }}>
              Found <span style={{ fontSize: 30 }}>{foundCount}</span> of {words.length}
            </p>
          </>
        ) : (
          <>
            <p className="text-sm text-inkSoft mb-3">
              Drag from the first letter of a word to its last letter, or tap the first letter, then the
              last. Words go across, down or diagonally, and can be backwards.
            </p>
            <div className="flex items-center gap-1 mb-3" aria-label={`${lives} of ${MAX_LIVES} lives left`}>
              {Array.from({ length: MAX_LIVES }, (_, i) => (
                <Heart key={i} size={20} color={WRONG_INK} fill={i < lives ? WRONG_INK : "none"} strokeWidth={2} />
              ))}
            </div>
            <p className="text-sm font-semibold mb-2">
              {foundCount} of {words.length} found
            </p>
          </>
        )}
        <div className="flex flex-wrap gap-2 mb-4">
          {words.map((w, i) => {
            const done = found[i] !== undefined;
            return (
              <span
                key={w.word}
                className={ev ? "rounded-xl px-4 py-2 font-bold" : "rounded-full px-3 py-1.5 text-sm font-semibold"}
                style={
                  ev
                    ? {
                        background: done ? "#FFD23F" : "#fff",
                        border: "3px solid #1a1a1a",
                        color: "#1a1a1a",
                        fontSize: 20,
                        textDecoration: done ? "line-through" : "none",
                        textDecorationThickness: 3,
                      }
                    : {
                        background: HIGHLIGHTS[i % HIGHLIGHTS.length],
                        color: INK,
                        textDecoration: done ? "line-through" : "none",
                        textDecorationThickness: 2,
                        opacity: done ? 0.55 : 1,
                      }
                }
              >
                {done && "✓ "}
                {w.word}
              </span>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setRevealed((v) => !v)}
            className={ev ? "flex items-center gap-2 rounded-xl px-5 py-3 text-lg font-bold bg-white border-[3px] border-black" : "flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold bg-cardTint"}
          >
            <Eye size={14} /> {revealed ? "Hide answers" : "Show answers"}
          </button>
          <button onClick={startAgain} className={ev ? "flex items-center gap-2 rounded-xl px-5 py-3 text-lg font-bold" : "flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold bg-cardTint"} style={ev ? { background: "#FFD23F", color: "#1a1a1a" } : undefined}>
            <RotateCcw size={14} /> Start again
          </button>
        </div>

        {message && (
          <p className="mt-4 rounded-lg px-3 py-2 text-sm font-semibold" style={ev ? { background: "#FFF4C2", color: "#1a1a1a", fontSize: 20, fontWeight: 700 } : { background: "#e4eee2", color: "#2f7a63" }}>
            {message}
          </p>
        )}
        {tracking && completed && (
          <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold" style={{ color: "#2f7a63" }}>
            <Check size={14} /> Marked as completed
          </p>
        )}

        <div className="mt-6 pt-4 border-t border-line">
          <p className="text-xs font-semibold text-inkSoft mb-2">Prefer paper?</p>
          <div className="flex flex-wrap gap-2">
            <a href={`/api/download/${templateId}?file=standard`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: "#E4EEE2", color: "#6D8C6A" }}>
              <Printer size={14} /> Print
            </a>
            {hasLargePrint && isPremium && (
              <a href={`/api/download/${templateId}?file=large-print`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: "#FCEFE7", color: "#B5714A" }}>
                <Printer size={14} /> Print Large (A3)
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
