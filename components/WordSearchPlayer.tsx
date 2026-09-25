"use client";

import { useEffect, useState } from "react";
import { Check, Eye, Printer, RotateCcw } from "lucide-react";
import type { WordSearchWord } from "@/lib/wordSearch";

// Colours from the printed sheets (the answer-key highlights and word pills).
const INK = "#3f3237";
const SELECTED = "#b5714a";
const HIGHLIGHTS = ["#cfe3f2", "#c9e6dd", "#f1d2be", "#dfd5ec", "#f2e2b8", "#d3e6f5", "#f2d6da", "#d8e7cb"];
const REVEALED = "#e6e0d4";

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

// A Word Search to solve on screen: tap the first letter of a word, then its
// last letter. Words from the list light up in colour and are crossed off.
// Progress is kept on this device.
export default function WordSearchPlayer({
  templateId,
  grid,
  words,
  tracking,
  initiallyCompleted,
  hasLargePrint,
}: {
  templateId: string;
  grid: string[];
  words: WordSearchWord[];
  tracking: boolean;
  initiallyCompleted: boolean;
  hasLargePrint: boolean;
}) {
  const size = grid.length;
  const storageKey = `wordsearch:${templateId}`;
  // For each found word (by index), the place it was found.
  const [found, setFound] = useState<Record<number, [number, number, number, number]>>({});
  const [start, setStart] = useState<Cell | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [message, setMessage] = useState("");
  const [completed, setCompleted] = useState(initiallyCompleted);

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
    const line = lineCells(start, cell);
    setStart(null);
    if (!line) {
      setMessage("Words run in a straight line — across, down or diagonally. Try again.");
      return;
    }
    // Does this line spell a word from the list (either way round)?
    const match = words.findIndex(
      (w, i) =>
        found[i] === undefined &&
        w.at.some(
          ([r1, c1, r2, c2]) =>
            (r1 === start[0] && c1 === start[1] && r2 === cell[0] && c2 === cell[1]) ||
            (r2 === start[0] && c2 === start[1] && r1 === cell[0] && c1 === cell[1])
        )
    );
    if (match === -1) {
      const letters = line.map(([r, c]) => grid[r][c]).join("");
      setMessage(`"${letters}" isn't one of the words. Try again.`);
      return;
    }
    const at = words[match].at.find(
      ([r1, c1, r2, c2]) =>
        (r1 === start[0] && c1 === start[1] && r2 === cell[0] && c2 === cell[1]) ||
        (r2 === start[0] && c2 === start[1] && r1 === cell[0] && c1 === cell[1])
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
  }

  // Colour for each cell: the first found word covering it, or the reveal colour.
  const cellColour = new Map<string, string>();
  words.forEach((w, i) => {
    const at = found[i] ?? (revealed ? w.at[0] : undefined);
    if (!at) return;
    const cells = lineCells([at[0], at[1]], [at[2], at[3]]) ?? [];
    for (const [r, c] of cells) {
      const key = `${r},${c}`;
      if (!cellColour.has(key)) cellColour.set(key, found[i] ? HIGHLIGHTS[i % HIGHLIGHTS.length] : REVEALED);
    }
  });

  const foundCount = Object.keys(found).length;
  const cell = `min(34px, calc((100vw - 72px) / ${size}))`;

  return (
    <div className="flex flex-wrap gap-6 sm:gap-8 items-start">
      <div className="rounded-xl bg-white p-3 border border-line" style={{ display: "inline-block" }}>
        <div role="grid" aria-label="Word search grid" style={{ display: "grid", gridTemplateColumns: `repeat(${size}, ${cell})` }}>
          {grid.map((row, r) =>
            row.split("").map((letter, c) => {
              const isStart = start && start[0] === r && start[1] === c;
              const bg = cellColour.get(`${r},${c}`);
              return (
                <button
                  key={`${r}-${c}`}
                  role="gridcell"
                  aria-label={`Row ${r + 1}, column ${c + 1}, ${letter}`}
                  onClick={() => tap([r, c])}
                  style={{
                    width: cell,
                    height: cell,
                    fontSize: `calc(${cell} * 0.55)`,
                    fontWeight: 700,
                    color: INK,
                    background: isStart ? "#fcefe7" : bg ?? "transparent",
                    outline: isStart ? `3px solid ${SELECTED}` : "none",
                    outlineOffset: -3,
                    borderRadius: 6,
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

      <div className="max-w-[340px]">
        <p className="text-sm text-inkSoft mb-3">
          Tap the first letter of a word, then its last letter. Words go across, down or
          diagonally, and can be backwards.
        </p>
        <p className="text-sm font-semibold mb-2">
          {foundCount} of {words.length} found
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {words.map((w, i) => {
            const done = found[i] !== undefined;
            return (
              <span
                key={w.word}
                className="rounded-full px-3 py-1.5 text-sm font-semibold"
                style={{
                  background: HIGHLIGHTS[i % HIGHLIGHTS.length],
                  color: INK,
                  textDecoration: done ? "line-through" : "none",
                  textDecorationThickness: 2,
                  opacity: done ? 0.55 : 1,
                }}
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
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold bg-cardTint"
          >
            <Eye size={14} /> {revealed ? "Hide answers" : "Show answers"}
          </button>
          <button onClick={startAgain} className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold bg-cardTint">
            <RotateCcw size={14} /> Start again
          </button>
        </div>

        {message && (
          <p className="mt-4 rounded-lg px-3 py-2 text-sm font-semibold" style={{ background: "#e4eee2", color: "#2f7a63" }}>
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
            {hasLargePrint && (
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
