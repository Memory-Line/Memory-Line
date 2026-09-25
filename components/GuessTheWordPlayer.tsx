"use client";

import { useEffect, useState } from "react";
import { Check, Lightbulb, Printer, RotateCcw } from "lucide-react";

// Colours from the printed sheet.
const INK = "#3f3237";
const ANSWER = "#2f7a63";
const GOLD = "#b8862a";
const PETALS = ["#c9e6dd", "#dfd5ec", "#f1d2be", "#e8b98f", "#d8e7cb", "#f2d6da", "#cfe3f2", "#f2e2b8"];
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

// Guess the Word on screen: read the clue, tap letters. A right letter fills
// its blanks; a wrong one takes a petal off the flower. Hints are fine, and
// running out of petals just shows the word — no pressure. Progress is kept
// on this device.
export default function GuessTheWordPlayer({
  templateId,
  clue,
  answer,
  tries,
  tracking,
  initiallyCompleted,
  hasLargePrint,
}: {
  templateId: string;
  clue: string;
  answer: string;
  tries: number;
  tracking: boolean;
  initiallyCompleted: boolean;
  hasLargePrint: boolean;
}) {
  const storageKey = `guesstheword:${templateId}`;
  const [guessed, setGuessed] = useState<string[]>([]);
  const [hinted, setHinted] = useState<string[]>([]);
  const [completed, setCompleted] = useState(initiallyCompleted);

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(storageKey) ?? "null");
      if (saved && Array.isArray(saved.guessed)) {
        setGuessed(saved.guessed);
        setHinted(Array.isArray(saved.hinted) ? saved.hinted : []);
      }
    } catch {
      // nothing saved, or storage unavailable
    }
  }, [storageKey]);

  const letters = new Set(answer.replace(/ /g, "").split(""));
  const known = new Set([...guessed, ...hinted]);
  const wrong = guessed.filter((g) => !letters.has(g));
  const petalsLeft = Math.max(0, tries - wrong.length);
  const won = [...letters].every((l) => known.has(l));
  const lost = !won && petalsLeft === 0;

  function save(nextGuessed: string[], nextHinted: string[]) {
    setGuessed(nextGuessed);
    setHinted(nextHinted);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({ guessed: nextGuessed, hinted: nextHinted }));
    } catch {
      // storage unavailable: progress just isn't kept
    }
    const nextKnown = new Set([...nextGuessed, ...nextHinted]);
    if ([...letters].every((l) => nextKnown.has(l))) markCompleted();
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

  function guess(letter: string) {
    if (won || lost || known.has(letter)) return;
    save([...guessed, letter], hinted);
  }

  // Reveal the first letter of the word that isn't showing yet.
  function hint() {
    const next = answer.replace(/ /g, "").split("").find((l) => !known.has(l));
    if (next && !won && !lost) save(guessed, [...hinted, next]);
  }

  // Keyboard: type letters to guess.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (/^[a-z]$/i.test(e.key)) guess(e.key.toUpperCase());
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="max-w-[640px]">
      {/* The flower: one petal per try left. */}
      <div className="rounded-xl bg-white border border-line p-4 mb-4 text-center">
        <p className="text-sm font-semibold mb-2" style={{ color: "#4f6f8f" }}>
          Each wrong guess removes a petal — try to finish before they're all gone
        </p>
        <svg viewBox="0 0 200 200" width="180" height="180" role="img" aria-label={`${petalsLeft} tries left`} className="mx-auto">
          {PETALS.slice(0, tries).map((colour, i) => {
            const angle = (i / tries) * Math.PI * 2 - Math.PI / 2;
            const gone = i >= petalsLeft;
            return (
              <circle
                key={i}
                cx={100 + Math.cos(angle) * 48}
                cy={100 + Math.sin(angle) * 48}
                r={34}
                fill={colour}
                style={{
                  opacity: gone ? 0 : 1,
                  transform: gone ? "translateY(30px)" : "none",
                  transition: "opacity 0.6s, transform 0.6s",
                }}
              />
            );
          })}
          <circle cx={100} cy={100} r={34} fill={GOLD} />
          <text x={100} y={105} textAnchor="middle" fontSize={15} fontWeight={700} fill="#fff" fontFamily="Helvetica, Arial, sans-serif">
            {petalsLeft} {petalsLeft === 1 ? "try" : "tries"}
          </text>
        </svg>
      </div>

      <div className="rounded-xl bg-white border border-line p-4 mb-4 text-center">
        <p className="text-xs font-bold tracking-wide mb-1" style={{ color: ANSWER }}>
          CLUE
        </p>
        <p className="text-lg font-semibold" style={{ color: INK }}>
          {clue}
        </p>
      </div>

      {/* The blanks. */}
      <div className="rounded-xl bg-white border border-line p-4 mb-4 flex flex-wrap justify-center gap-x-2 gap-y-3" aria-live="polite">
        {answer.split("").map((ch, i) =>
          ch === " " ? (
            <span key={i} className="w-4" />
          ) : (
            <span
              key={i}
              className="w-8 text-center text-2xl font-bold border-b-4"
              style={{
                borderColor: "#8aa38a",
                color: known.has(ch) ? (hinted.includes(ch) && !guessed.includes(ch) ? "#b5714a" : INK) : lost ? "#b9ad9c" : "transparent",
                minHeight: 38,
              }}
            >
              {known.has(ch) || lost ? ch : "_"}
            </span>
          )
        )}
      </div>

      {won && (
        <p className="mb-4 rounded-lg px-3 py-2 text-sm font-semibold" style={{ background: "#e4eee2", color: ANSWER }}>
          Well done — the word is {answer}!
        </p>
      )}
      {lost && (
        <p className="mb-4 rounded-lg px-3 py-2 text-sm font-semibold" style={{ background: "#fcefe7", color: "#8a5a3a" }}>
          The word was {answer} — well played. Have another go whenever you like.
        </p>
      )}

      {/* The letters. */}
      <div className="rounded-xl bg-white border border-line p-4 mb-4">
        <p className="text-xs font-bold tracking-wide text-center mb-3" style={{ color: "#b5714a" }}>
          TAP A LETTER TO GUESS IT
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {ALPHABET.map((l) => {
            const used = known.has(l);
            const right = used && letters.has(l);
            return (
              <button
                key={l}
                onClick={() => guess(l)}
                disabled={used || won || lost}
                aria-label={used ? `${l}, ${right ? "in the word" : "not in the word"}` : l}
                className="relative rounded-full text-base font-bold"
                style={{
                  width: 42,
                  height: 42,
                  border: `2px solid ${right ? ANSWER : "#d9cfc1"}`,
                  background: right ? "#e4eee2" : "#fff",
                  color: used && !right ? "#b9ad9c" : INK,
                }}
              >
                {l}
                {used && !right && (
                  <span aria-hidden className="absolute left-1.5 right-1.5 top-1/2" style={{ height: 2, background: "#b9ad9c", transform: "rotate(-35deg)" }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={hint} disabled={won || lost} className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold bg-cardTint disabled:opacity-50">
          <Lightbulb size={14} /> Give me a letter
        </button>
        <button onClick={() => save([], [])} className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold bg-cardTint">
          <RotateCcw size={14} /> {lost ? "Try again" : "Start again"}
        </button>
      </div>

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
  );
}
