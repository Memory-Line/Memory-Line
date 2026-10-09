"use client";

import { useEffect, useRef, useState } from "react";
import { Printer, RotateCcw, Volume2 } from "lucide-react";

// Colours from the printed sheets.
const INK = "#3f3237";
const GREEN = "#2f7a63";
const TINTS = ["#cfe3f2", "#c9e6dd", "#f1d2be", "#dfd5ec", "#f2e2b8"];

// Word Bingo on screen: the card's nine words in a 3 x 3 grid, and a caller who
// reads out the pack's words one at a time (in a fresh random order each game).
// Tap a word on the card to cover it. Called words get a ring so they are easy
// to spot; a full line is "Line!" and all nine is "Bingo!". Nothing is kept
// after the game: it's a quick, friendly session.
export default function WordBingoPlayer({
  templateId,
  words,
  caller,
  tracking,
  initiallyCompleted,
  hasLargePrint,
  isPremium,
}: {
  templateId: string;
  words: string[][];
  caller: string[];
  tracking: boolean;
  initiallyCompleted: boolean;
  hasLargePrint: boolean;
  isPremium: boolean;
}) {
  const shuffle = () => {
    const a = [...caller];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  // The calling order is made after the page loads (random order can't be made on the server).
  const [order, setOrder] = useState<string[]>([]);
  const [called, setCalled] = useState<string[]>([]);
  const [covered, setCovered] = useState<boolean[][]>(() => words.map((r) => r.map(() => false)));
  const [auto, setAuto] = useState(false);
  const [seconds, setSeconds] = useState(8);
  const [aloud, setAloud] = useState(false);
  const [completed, setCompleted] = useState(initiallyCompleted);
  const calledRef = useRef(called);
  calledRef.current = called;

  useEffect(() => setOrder(shuffle()), []); // eslint-disable-line react-hooks/exhaustive-deps

  const speak = (text: string) => {
    if (!aloud || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.toLowerCase());
    u.lang = "en-GB";
    u.rate = 0.85;
    window.speechSynthesis.speak(u);
  };

  function callNext() {
    const next = order[calledRef.current.length];
    if (!next) {
      setAuto(false);
      return;
    }
    setCalled((c) => [...c, next]);
    speak(next);
  }

  useEffect(() => {
    if (!auto) return;
    const id = window.setInterval(callNext, seconds * 1000);
    return () => window.clearInterval(id);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  function toggle(r: number, c: number) {
    setCovered((prev) => prev.map((row, i) => (i === r ? row.map((v, j) => (j === c ? !v : v)) : row)));
  }

  function newGame() {
    setOrder(shuffle());
    setCalled([]);
    setCovered(words.map((r) => r.map(() => false)));
    setAuto(false);
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }

  const n = words.length;
  const full = covered.every((r) => r.every(Boolean));
  const line =
    covered.some((r) => r.every(Boolean)) ||
    [0, 1, 2].some((c) => covered.every((r) => r[c])) ||
    covered.every((r, i) => r[i]) ||
    covered.every((r, i) => r[n - 1 - i]);
  const current = called[called.length - 1];
  const calledSet = new Set(called);

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
      // they can still use the Completed button on the list
    }
  }

  useEffect(() => {
    if (full) markCompleted();
  }, [full]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="max-w-2xl">
      <div className="rounded-2xl border border-line bg-card p-4 mb-5 text-center">
        <p className="text-xs font-semibold text-inkSoft mb-1">The caller</p>
        <p className="font-serif text-4xl min-h-[3rem]" style={{ color: current ? GREEN : INK }}>
          {current ?? (order.length ? "Press Call a word" : "")}
        </p>
        <p className="text-xs text-inkSoft mt-1">
          {called.length} of {order.length} words called
        </p>
        <div className="flex flex-wrap justify-center items-center gap-2 mt-3">
          <button
            onClick={callNext}
            disabled={called.length >= order.length}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
            style={{ background: GREEN }}
          >
            Call a word
          </button>
          <label className="flex items-center gap-1.5 text-sm cursor-pointer">
            <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} /> Auto-call every
          </label>
          <select value={seconds} onChange={(e) => setSeconds(Number(e.target.value))} className="rounded-lg border border-line px-2 py-1 text-sm bg-white">
            {[5, 8, 12, 20].map((s) => (
              <option key={s} value={s}>{s} seconds</option>
            ))}
          </select>
          <label className="flex items-center gap-1.5 text-sm cursor-pointer">
            <input type="checkbox" checked={aloud} onChange={(e) => setAloud(e.target.checked)} />
            <Volume2 size={14} /> Read aloud
          </label>
        </div>
      </div>

      <div className="grid gap-2 mb-3" style={{ gridTemplateColumns: `repeat(${words[0]?.length ?? 3}, minmax(0, 1fr))` }}>
        {words.map((row, r) =>
          row.map((word, c) => {
            const isCovered = covered[r][c];
            const wasCalled = calledSet.has(word);
            return (
              <button
                key={`${r}-${c}`}
                onClick={() => toggle(r, c)}
                aria-pressed={isCovered}
                className="rounded-xl px-2 py-6 sm:py-9 font-serif text-lg sm:text-2xl font-semibold leading-tight break-words"
                style={{
                  background: isCovered ? GREEN : TINTS[(r * 3 + c) % TINTS.length],
                  color: isCovered ? "#fff" : INK,
                  outline: wasCalled && !isCovered ? `4px solid ${GREEN}` : "none",
                  outlineOffset: -4,
                }}
              >
                {word}
              </button>
            );
          })
        )}
      </div>

      <div className="min-h-[2.5rem] text-center mb-3">
        {full ? (
          <p className="font-serif text-3xl" style={{ color: GREEN }}>Bingo! Every word covered.</p>
        ) : line ? (
          <p className="font-serif text-2xl" style={{ color: GREEN }}>Line! Keep going for the full card.</p>
        ) : (
          <p className="text-xs text-inkSoft">Tap a word on the card to cover it when it's called. A ring shows a word that has been called.</p>
        )}
      </div>

      {called.length > 0 && (
        <p className="text-xs text-inkSoft mb-4">
          <span className="font-semibold">Called so far:</span> {called.join(", ")}
        </p>
      )}

      <button onClick={newGame} className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold bg-cardTint">
        <RotateCcw size={14} /> New game
      </button>

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
  );
}
