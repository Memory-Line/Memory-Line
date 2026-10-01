"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  Dice1,
  Dice2,
  Dice3,
  Dice4,
  Dice5,
  Dice6,
  Dices,
  Printer,
  RotateCcw,
} from "lucide-react";
import type { SnakesAndLaddersMove } from "@/lib/snakesAndLadders";

// Colours for up to 4 counters (rust, blue, green, purple — echoing the
// ladders and snakes drawn on the sheets themselves).
const PLAYER_COLORS = ["#b5714a", "#3f6fae", "#4a9d6e", "#8a5fa8"];
const INK = "#3f3237";
const DICE_ICONS = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];

const STEP_MS = 260; // time per square while walking
const SLIDE_MS = 700; // time for the ladder/snake animation

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// A dynamic import that's opaque to both webpack (so it isn't bundled —
// this is loaded straight from the CDN at runtime) and to TypeScript (so it
// doesn't try, and fail, to resolve types for a URL).
const importFromCdn = new Function("url", "return import(url)") as (url: string) => Promise<any>;

type SavedState = {
  playerCount: number;
  names: string[];
  positions: number[];
  turn: number;
  winner: number | null;
  rolls: number;
};

function defaultState(): SavedState {
  return {
    playerCount: 2,
    names: ["Player 1", "Player 2", "Player 3", "Player 4"],
    positions: [0, 0, 0, 0],
    turn: 0,
    winner: null,
    rolls: 0,
  };
}

// Snakes and Ladders on screen: the board page drawn from the sheet's own
// PDF, 1-4 players with named, coloured counters, and a big dice button.
// Landing on a ladder or snake's starting square climbs or slides the
// counter with a friendly message. Progress is kept on this device.
export default function SnakesAndLaddersPlayer({
  templateId,
  moves,
  squares,
  tracking,
  initiallyCompleted,
  hasLargePrint,
  isPremium,
}: {
  templateId: string;
  moves: SnakesAndLaddersMove[];
  squares: Record<string, [number, number]>;
  tracking: boolean;
  initiallyCompleted: boolean;
  hasLargePrint: boolean;
  isPremium: boolean;
}) {
  const storageKey = `snakesladders:${templateId}`;
  const [state, setState] = useState<SavedState>(defaultState);
  const [message, setMessage] = useState("Roll the dice to begin!");
  const [dice, setDice] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [completed, setCompleted] = useState(initiallyCompleted);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [boardReady, setBoardReady] = useState(false);
  const [boardError, setBoardError] = useState(false);
  const [aspect, setAspect] = useState(842 / 595); // A4 portrait fallback

  // Restore progress kept on this device.
  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(storageKey) ?? "null");
      if (saved && Array.isArray(saved.positions)) {
        setState({ ...defaultState(), ...saved });
        if (saved.winner !== null && saved.winner !== undefined) {
          setMessage(`${saved.names[saved.winner]} won — well done!`);
        } else if (saved.rolls > 0) {
          setMessage("Pick up where you left off — roll the dice.");
        }
      }
    } catch {
      // nothing saved, or storage unavailable
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  function save(next: SavedState) {
    setState(next);
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

  // Draw the board's own Standard PDF, page 1, into a canvas with pdf.js
  // loaded straight from the CDN (no picture is copied anywhere new).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const pdfjs = await importFromCdn("https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.min.mjs");
        pdfjs.GlobalWorkerOptions.workerSrc =
          "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs";
        const doc = await pdfjs.getDocument(`/api/download/${templateId}?file=standard`).promise;
        const page = await doc.getPage(1);
        const base = page.getViewport({ scale: 1 });
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const targetWidth = 900 * dpr;
        const scale = targetWidth / base.width;
        const viewport = page.getViewport({ scale });
        if (cancelled) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        await page.render({ canvasContext: ctx, viewport }).promise;
        if (cancelled) return;
        setAspect(viewport.height / viewport.width);
        setBoardReady(true);
      } catch {
        if (!cancelled) setBoardError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [templateId]);

  const { playerCount, names, positions, turn, winner, rolls } = state;
  const started = rolls > 0;

  function setPlayerCount(n: number) {
    if (started) return;
    save({ ...state, playerCount: n });
  }

  function setName(i: number, value: string) {
    const nextNames = [...names];
    nextNames[i] = value;
    save({ ...state, names: nextNames });
  }

  function startAgain() {
    save(defaultState());
    setDice(null);
    setMessage("Roll the dice to begin!");
  }

  async function rollDice() {
    if (busy || winner !== null) return;
    setBusy(true);

    // A little cycling animation before the roll settles.
    for (let i = 0; i < 6; i++) {
      setDice(1 + Math.floor(Math.random() * 6));
      await sleep(70);
    }
    const roll = 1 + Math.floor(Math.random() * 6);
    setDice(roll);

    const from = positions[turn];
    let raw = from + roll;
    let target = raw > 100 ? 100 - (raw - 100) : raw;

    setMessage(`${names[turn]} rolled ${roll}.`);
    await sleep(300);

    // Walk square by square.
    let pos = from;
    const dir = target > from ? 1 : -1;
    while (pos !== target) {
      pos += dir;
      const stepped = [...positions];
      stepped[turn] = pos;
      setState((s) => ({ ...s, positions: stepped }));
      await sleep(STEP_MS);
    }

    let finalSquare = target;
    const move = moves.find((m) => m.from === target);
    if (move) {
      await sleep(350);
      finalSquare = move.to;
      setMessage(
        move.type === "ladder"
          ? `Up the ladder to ${move.to}!`
          : `Down we slide to ${move.to} — never mind!`
      );
      const afterSlide = [...positions];
      afterSlide[turn] = finalSquare;
      await sleep(SLIDE_MS);
      setState((s) => ({ ...s, positions: afterSlide }));
      await sleep(300);
    }

    const finalPositions = [...positions];
    finalPositions[turn] = finalSquare;

    if (finalSquare === 100) {
      setMessage(`${names[turn]} reached 100 — well done!`);
      save({ ...state, positions: finalPositions, winner: turn, rolls: rolls + 1 });
      markCompleted();
      setBusy(false);
      return;
    }

    if (!move) {
      setMessage(`${names[turn]} is now on ${finalSquare}.`);
    }

    const nextTurn = (turn + 1) % playerCount;
    save({ ...state, positions: finalPositions, turn: nextTurn, rolls: rolls + 1 });
    setBusy(false);
  }

  const DiceIcon = dice ? DICE_ICONS[dice - 1] : Dices;

  return (
    <div className="flex flex-wrap gap-6 sm:gap-8 items-start">
      <div
        className="relative rounded-xl bg-white border border-line overflow-hidden"
        style={{ width: "min(92vw, 420px)", aspectRatio: `1 / ${aspect}` }}
      >
        <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
        {!boardReady && !boardError && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-inkSoft">
            Loading the board…
          </div>
        )}
        {boardError && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-inkSoft p-4 text-center">
            The board picture couldn't be loaded — but you can still play, or print it below.
          </div>
        )}
        {Array.from({ length: playerCount }).map((_, i) => {
          const sq = positions[i];
          if (sq < 1) return null;
          const at = squares[String(sq)];
          if (!at) return null;
          return (
            <div
              key={i}
              aria-label={`${names[i]} on square ${sq}`}
              style={{
                position: "absolute",
                left: `${at[0] * 100}%`,
                top: `${at[1] * 100}%`,
                transform: `translate(-50%, -50%) translate(${(i % 2) * 10 - 5}px, ${
                  (Math.floor(i / 2) * 10) - 5
                }px)`,
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: PLAYER_COLORS[i],
                border: "2px solid white",
                boxShadow: "0 1px 3px rgba(0,0,0,0.35)",
                transition: `left ${STEP_MS}ms linear, top ${STEP_MS}ms linear`,
                zIndex: 2,
              }}
            />
          );
        })}
      </div>

      <div className="max-w-[340px]">
        <div className="mb-4">
          <p className="text-xs font-semibold text-inkSoft mb-2">Players</p>
          <div className="flex gap-2 mb-3">
            {[1, 2, 3, 4].map((n) => (
              <button
                key={n}
                onClick={() => setPlayerCount(n)}
                disabled={started}
                className="rounded-lg px-3 py-1.5 text-sm font-semibold disabled:opacity-40"
                style={{
                  background: playerCount === n ? "#b5714a" : "#f7f3ea",
                  color: playerCount === n ? "#fff" : INK,
                }}
              >
                {n}
              </button>
            ))}
          </div>
          {Array.from({ length: playerCount }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 mb-2">
              <span
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: PLAYER_COLORS[i],
                  flexShrink: 0,
                }}
              />
              <input
                value={names[i]}
                onChange={(e) => setName(i, e.target.value)}
                className="w-full rounded-lg border border-line px-2.5 py-1.5 text-sm"
                maxLength={20}
              />
              {winner === i && <Check size={16} color="#2f7a63" />}
            </div>
          ))}
        </div>

        <button
          onClick={rollDice}
          disabled={busy || winner !== null}
          className="w-full flex items-center justify-center gap-2 rounded-xl px-5 py-4 text-lg font-bold text-white disabled:opacity-50"
          style={{ background: "#b5714a" }}
        >
          <DiceIcon size={26} />
          {winner !== null ? "Game over" : `Roll the dice (${names[turn]})`}
        </button>

        {message && (
          <p className="mt-4 rounded-lg px-3 py-2 text-sm font-semibold" style={{ background: "#e4eee2", color: "#2f7a63" }}>
            {message}
          </p>
        )}

        <div className="flex flex-wrap gap-2 mt-4">
          <button onClick={startAgain} className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold bg-cardTint">
            <RotateCcw size={14} /> Start again
          </button>
        </div>

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
