"use client";

import { useEffect, useState } from "react";
import { Check, Eraser, Printer, RotateCcw } from "lucide-react";

// Colours from the printed sheets, so on screen matches paper.
const INK = "#3f3237";
const ANSWER = "#2f7a63";
const BOX_TINT = "#f7f3ea";
const LINE = "#c9bfb0";
const SELECTED = "#fcefe7";
const WRONG = "#f2d6da";
const WRONG_INK = "#c0392b";
const PILLS = ["#cfe3f2", "#c9e6dd", "#f1d2be", "#dfd5ec", "#f2e2b8", "#d3e6f5", "#f2d6da", "#d8e7cb", "#cfe3f2"];

// A Sudoku to solve on screen: tap a square, then a number. Large squares
// and buttons, no timer, and mistakes are only shown when asked for.
// Progress is kept on this device, so leaving part way doesn't lose it.
export default function SudokuPlayer({
  templateId,
  puzzle,
  solution,
  size,
  boxRows,
  boxCols,
  tracking,
  initiallyCompleted,
  hasLargePrint,
}: {
  templateId: string;
  puzzle: string;
  solution: string;
  size: number;
  boxRows: number;
  boxCols: number;
  tracking: boolean;
  initiallyCompleted: boolean;
  hasLargePrint: boolean;
}) {
  const given = puzzle.split("").map(Number);
  const storageKey = `sudoku:${templateId}`;
  const [values, setValues] = useState<number[]>(given);
  const [selected, setSelected] = useState<number | null>(null);
  const [wrong, setWrong] = useState<Set<number>>(new Set());
  const [message, setMessage] = useState("");
  const [completed, setCompleted] = useState(initiallyCompleted);

  // Pick up where this device left off.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved && saved.length === puzzle.length) {
        setValues(saved.split("").map((d, i) => (given[i] ? given[i] : Number(d))));
      }
    } catch {
      // storage unavailable: start fresh
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  function save(next: number[]) {
    setValues(next);
    try {
      window.localStorage.setItem(storageKey, next.join(""));
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

  function place(value: number) {
    if (selected === null || given[selected]) return;
    const next = [...values];
    next[selected] = value;
    save(next);
    setWrong((w) => {
      const copy = new Set(w);
      copy.delete(selected);
      return copy;
    });
    setMessage("");
    if (next.every((v, i) => v === Number(solution[i]))) {
      setMessage("Well done — the puzzle is complete!");
      markCompleted();
    }
  }

  function check() {
    const mistakes = new Set<number>();
    let empty = 0;
    values.forEach((v, i) => {
      if (!v) empty++;
      else if (v !== Number(solution[i])) mistakes.add(i);
    });
    setWrong(mistakes);
    if (mistakes.size === 0 && empty === 0) {
      setMessage("Well done — the puzzle is complete!");
      markCompleted();
    } else if (mistakes.size === 0) {
      setMessage(`All correct so far — ${empty} ${empty === 1 ? "square" : "squares"} left to fill.`);
    } else {
      setMessage(
        `${mistakes.size} ${mistakes.size === 1 ? "square needs" : "squares need"} another look (shaded pink).`
      );
    }
  }

  function startAgain() {
    save(given);
    setWrong(new Set());
    setSelected(null);
    setMessage("");
  }

  // Keyboard: numbers to fill, Backspace/Delete/0 to clear, arrows to move.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (selected === null) return;
      const n = Number(e.key);
      if (n >= 1 && n <= size) place(n);
      else if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") place(0);
      else if (e.key.startsWith("Arrow")) {
        const r = Math.floor(selected / size);
        const c = selected % size;
        const [dr, dc] = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[
          e.key as "ArrowUp"
        ] ?? [0, 0];
        const nr = Math.min(size - 1, Math.max(0, r + dr));
        const nc = Math.min(size - 1, Math.max(0, c + dc));
        setSelected(nr * size + nc);
        e.preventDefault();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const cellPx = size === 4 ? 96 : size === 6 ? 72 : 52;
  // On a phone the squares shrink so the whole grid fits the screen.
  const cell = `min(${cellPx}px, calc((100vw - 72px) / ${size}))`;
  const selectedValue = selected !== null ? values[selected] : 0;
  // A number is "all in" once every one of it is in its right square; its
  // button below is then crossed out. Wrong entries never count.
  const allIn = new Set(
    Array.from({ length: size }, (_, k) => k + 1).filter(
      (n) => values.filter((v, i) => v === n && v === Number(solution[i])).length === size
    )
  );

  return (
    <div className="flex flex-wrap gap-6 sm:gap-8 items-start">
      <div
        role="grid"
        aria-label="Sudoku grid"
        className="rounded-xl bg-white p-3 border border-line"
        style={{ display: "inline-block" }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${size}, ${cell})`,
            border: `3px solid ${INK}`,
          }}
        >
          {values.map((v, i) => {
            const r = Math.floor(i / size);
            const c = i % size;
            const tinted = (Math.floor(r / boxRows) + Math.floor(c / boxCols)) % 2 === 1;
            const isGiven = !!given[i];
            // A number that doesn't belong in this square shows in red straight away.
            const isWrong = !isGiven && !!v && v !== Number(solution[i]);
            const background = wrong.has(i)
              ? WRONG
              : selected === i
              ? SELECTED
              : v && selectedValue && v === selectedValue
              ? "#eef4ec"
              : tinted
              ? BOX_TINT
              : "#fff";
            return (
              <button
                key={i}
                role="gridcell"
                aria-label={`Row ${r + 1}, column ${c + 1}${v ? `, ${v}${isWrong ? ", wrong" : ""}` : ", empty"}`}
                onClick={() => setSelected(i)}
                style={{
                  width: cell,
                  height: cell,
                  background,
                  borderRight: c === size - 1 ? "none" : `${(c + 1) % boxCols === 0 ? 2.5 : 1}px solid ${(c + 1) % boxCols === 0 ? INK : LINE}`,
                  borderBottom: r === size - 1 ? "none" : `${(r + 1) % boxRows === 0 ? 2.5 : 1}px solid ${(r + 1) % boxRows === 0 ? INK : LINE}`,
                  outline: selected === i ? `3px solid #b5714a` : "none",
                  outlineOffset: -3,
                  fontSize: `calc(${cell} * 0.55)`,
                  fontWeight: isGiven || isWrong ? 700 : 500,
                  color: isGiven ? INK : isWrong ? WRONG_INK : ANSWER,
                  cursor: isGiven ? "default" : "pointer",
                  fontFamily: "Helvetica, Arial, sans-serif",
                }}
              >
                {v || ""}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-[320px]">
        <p className="text-sm text-inkSoft mb-3">
          Tap an empty square, then a number. Every row, column and outlined box needs the
          numbers 1 to {size} once each. A wrong number shows in red, and a number is crossed
          out below once all of it is in place.
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {Array.from({ length: size }, (_, k) => k + 1).map((n) => {
            const done = allIn.has(n);
            return (
              <button
                key={n}
                onClick={() => place(n)}
                disabled={done}
                aria-label={done ? `${n}, all placed` : String(n)}
                title={done ? `All the ${n}s are in` : undefined}
                className="relative rounded-full text-lg font-bold"
                style={{ width: 56, height: 48, background: PILLS[n - 1], color: INK, opacity: done ? 0.45 : 1 }}
              >
                {n}
                {done && (
                  <span
                    aria-hidden
                    className="absolute left-2 right-2 top-1/2"
                    style={{ height: 3, background: INK, borderRadius: 2, transform: "rotate(-35deg)" }}
                  />
                )}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => place(0)} className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold bg-cardTint">
            <Eraser size={14} /> Clear square
          </button>
          <button onClick={check} className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ background: ANSWER }}>
            <Check size={14} /> Check my answers
          </button>
          <button onClick={startAgain} className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold bg-cardTint">
            <RotateCcw size={14} /> Start again
          </button>
        </div>

        {message && (
          <p className="mt-4 rounded-lg px-3 py-2 text-sm font-semibold" style={{ background: "#e4eee2", color: ANSWER }}>
            {message}
          </p>
        )}
        {tracking && completed && (
          <p className="mt-3 text-sm font-semibold" style={{ color: ANSWER }}>
            ✓ Marked as completed
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
