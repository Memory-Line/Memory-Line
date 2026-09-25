"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Eye, Lightbulb, Printer, RotateCcw } from "lucide-react";
import type { CrosswordClue } from "@/lib/crossword";

// Colours from the printed sheets.
const INK = "#3f3237";
const ANSWER = "#2f7a63";
const WRONG_INK = "#c0392b";
const WORD_TINT = "#fcefe7";
const SELECTED = "#f1d2be";
const BLOCK = "#3f3237";

type Direction = "across" | "down";

// A Crossword to solve on screen: tap a square (tap it again to switch
// between across and down), then type. Wrong letters show in red straight
// away. Progress is kept on this device.
export default function CrosswordPlayer({
  templateId,
  rows,
  cols,
  solution,
  numbers,
  across,
  down,
  tracking,
  initiallyCompleted,
  hasLargePrint,
}: {
  templateId: string;
  rows: number;
  cols: number;
  solution: string[];
  numbers: [number, number, number][];
  across: CrosswordClue[];
  down: CrosswordClue[];
  tracking: boolean;
  initiallyCompleted: boolean;
  hasLargePrint: boolean;
}) {
  const storageKey = `crossword:${templateId}`;
  const empty = () => solution.map((row) => row.replace(/[^.]/g, " "));
  const [letters, setLetters] = useState<string[]>(empty);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [direction, setDirection] = useState<Direction>("across");
  const [revealed, setRevealed] = useState(false);
  const [message, setMessage] = useState("");
  const [completed, setCompleted] = useState(initiallyCompleted);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(storageKey) ?? "null");
      if (Array.isArray(saved) && saved.length === rows) setLetters(saved);
    } catch {
      // nothing saved, or storage unavailable
    }
  }, [storageKey, rows]);

  const isCell = (r: number, c: number) => r >= 0 && r < rows && c >= 0 && c < cols && solution[r][c] !== ".";
  const numberAt = new Map(numbers.map(([r, c, n]) => [`${r},${c}`, n]));
  const clues = { across, down };

  // The clue whose answer covers this square in this direction.
  function clueAt(r: number, c: number, dir: Direction) {
    return clues[dir].find((e) =>
      dir === "across"
        ? e.row === r && c >= e.col && c < e.col + e.answer.length
        : e.col === c && r >= e.row && r < e.row + e.answer.length
    );
  }
  function cellsOf(e: CrosswordClue, dir: Direction): [number, number][] {
    return Array.from({ length: e.answer.length }, (_, k) =>
      dir === "across" ? [e.row, e.col + k] : [e.row + k, e.col]
    );
  }
  const solved = (e: CrosswordClue, dir: Direction) =>
    cellsOf(e, dir).every(([r, c]) => letters[r][c] === solution[r][c]);

  function save(next: string[]) {
    setLetters(next);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // storage unavailable: progress just isn't kept
    }
    if (next.every((row, r) => row === solution[r])) {
      setMessage("Well done — the crossword is complete!");
      markCompleted();
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

  function select(r: number, c: number) {
    if (!isCell(r, c)) return;
    if (selected && selected[0] === r && selected[1] === c) {
      const other: Direction = direction === "across" ? "down" : "across";
      if (clueAt(r, c, other)) setDirection(other);
    } else {
      setSelected([r, c]);
      if (!clueAt(r, c, direction)) setDirection(direction === "across" ? "down" : "across");
    }
    setMessage("");
    input.current?.focus();
  }

  function selectClue(e: CrosswordClue, dir: Direction) {
    setDirection(dir);
    setSelected([e.row, e.col]);
    setMessage("");
    input.current?.focus();
  }

  function setLetter(r: number, c: number, ch: string, next: string[]) {
    next[r] = next[r].slice(0, c) + ch + next[r].slice(c + 1);
  }

  function type(ch: string) {
    if (!selected) return;
    const [r, c] = selected;
    const next = [...letters];
    setLetter(r, c, ch.toUpperCase(), next);
    save(next);
    // Move on to the next square of the word.
    const [dr, dc] = direction === "across" ? [0, 1] : [1, 0];
    if (isCell(r + dr, c + dc)) setSelected([r + dr, c + dc]);
  }

  function erase() {
    if (!selected) return;
    const [r, c] = selected;
    const next = [...letters];
    if (letters[r][c] === " ") {
      // Already empty: step back and clear that one instead.
      const [dr, dc] = direction === "across" ? [0, -1] : [-1, 0];
      if (!isCell(r + dr, c + dc)) return;
      setLetter(r + dr, c + dc, " ", next);
      setSelected([r + dr, c + dc]);
    } else {
      setLetter(r, c, " ", next);
    }
    save(next);
  }

  function revealWord() {
    const e = selected && clueAt(selected[0], selected[1], direction);
    if (!e) return;
    const next = [...letters];
    for (const [r, c] of cellsOf(e, direction)) setLetter(r, c, solution[r][c], next);
    save(next);
  }

  function startAgain() {
    save(empty());
    setSelected(null);
    setRevealed(false);
    setMessage("");
  }

  const current = selected ? clueAt(selected[0], selected[1], direction) : undefined;
  const inCurrent = new Set(current ? cellsOf(current, direction).map(([r, c]) => `${r},${c}`) : []);
  const cell = `min(40px, calc((100vw - 72px) / ${cols}))`;

  return (
    <div className="flex flex-wrap gap-6 sm:gap-8 items-start">
      <div>
        <p className="mb-3 rounded-lg px-3 py-2 text-sm min-h-[40px]" style={{ background: WORD_TINT, color: INK }}>
          {current ? (
            <>
              <span className="font-bold">
                {current.num} {direction}:
              </span>{" "}
              {current.clue} ({current.lengths})
            </>
          ) : (
            "Tap a square to start."
          )}
        </p>
        <div className="rounded-xl bg-white p-3 border border-line" style={{ display: "inline-block" }}>
          {/* Hidden box that brings up the keyboard on phones and tablets. */}
          <input
            ref={input}
            aria-label="Type a letter"
            autoCapitalize="characters"
            autoComplete="off"
            className="absolute opacity-0 w-px h-px"
            value=""
            onChange={(e) => {
              const ch = e.target.value.slice(-1);
              if (/[a-z]/i.test(ch)) type(ch);
            }}
            onKeyDown={(e) => {
              if (e.key === "Backspace" || e.key === "Delete") {
                erase();
                e.preventDefault();
              } else if (e.key.startsWith("Arrow") && selected) {
                const [dr, dc] = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[
                  e.key as "ArrowUp"
                ] ?? [0, 0];
                let [r, c] = [selected[0] + dr, selected[1] + dc];
                while (r >= 0 && r < rows && c >= 0 && c < cols && !isCell(r, c)) [r, c] = [r + dr, c + dc];
                if (isCell(r, c)) setSelected([r, c]);
                e.preventDefault();
              }
            }}
          />
          <div role="grid" aria-label="Crossword grid" style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, ${cell})`, gap: 2 }}>
            {solution.flatMap((row, r) =>
              row.split("").map((sol, c) => {
                if (sol === ".") return <div key={`${r}-${c}`} style={{ width: cell, height: cell, background: "transparent" }} />;
                const typed = letters[r][c] !== " " ? letters[r][c] : "";
                const shown = typed || (revealed ? sol : "");
                const wrong = !!typed && typed !== sol;
                const isSel = selected && selected[0] === r && selected[1] === c;
                const num = numberAt.get(`${r},${c}`);
                return (
                  <button
                    key={`${r}-${c}`}
                    role="gridcell"
                    aria-label={`${num ? `${num}, ` : ""}row ${r + 1}, column ${c + 1}${typed ? `, ${typed}${wrong ? ", wrong" : ""}` : ", empty"}`}
                    onClick={() => select(r, c)}
                    className="relative"
                    style={{
                      width: cell,
                      height: cell,
                      border: `1.5px solid ${BLOCK}`,
                      background: isSel ? SELECTED : inCurrent.has(`${r},${c}`) ? WORD_TINT : "#fff",
                      fontSize: `calc(${cell} * 0.5)`,
                      fontWeight: 700,
                      color: wrong ? WRONG_INK : typed ? ANSWER : "#b9ad9c",
                      fontFamily: "Helvetica, Arial, sans-serif",
                    }}
                  >
                    {num && (
                      <span className="absolute left-0.5 top-0 leading-none" style={{ fontSize: `calc(${cell} * 0.26)`, color: INK, fontWeight: 600 }}>
                        {num}
                      </span>
                    )}
                    {shown}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="max-w-[360px] flex-1 min-w-[260px]">
        <p className="text-sm text-inkSoft mb-3">
          Tap a square and type. Tap the same square again to switch between across and down.
          Wrong letters show in red.
        </p>
        {(["across", "down"] as Direction[]).map((dir) => (
          <div key={dir} className="mb-4">
            <p className="font-serif text-lg capitalize mb-1">{dir}</p>
            <ul className="space-y-1">
              {clues[dir].map((e) => {
                const isCurrent = current === e && direction === dir;
                const done = solved(e, dir);
                return (
                  <li key={e.num}>
                    <button
                      onClick={() => selectClue(e, dir)}
                      className="text-left text-sm rounded-md px-2 py-1 w-full"
                      style={{
                        background: isCurrent ? WORD_TINT : "transparent",
                        color: done ? "#8a7a6b" : INK,
                        textDecoration: done ? "line-through" : "none",
                      }}
                    >
                      <span className="font-bold">{e.num}.</span> {done && "✓ "}
                      {e.clue} ({e.lengths})
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        <div className="flex flex-wrap gap-2">
          <button onClick={revealWord} disabled={!current} className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold bg-cardTint disabled:opacity-50">
            <Lightbulb size={14} /> Reveal this word
          </button>
          <button onClick={() => setRevealed((v) => !v)} className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold bg-cardTint">
            <Eye size={14} /> {revealed ? "Hide answers" : "Show answers"}
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
          <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold" style={{ color: ANSWER }}>
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
