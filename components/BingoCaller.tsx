"use client";

import { useEffect, useRef, useState } from "react";
import { Maximize2, Megaphone, RotateCcw, Search, Undo2, Volume2, VolumeX, X } from "lucide-react";
import { BINGO_CALLS, BINGO_CARDS, bingoLetter } from "@/lib/bingo";

const INK = "#3f3237";
const CALLED = "#2f7a63";
const LETTER_COLOURS = ["#cfe3f2", "#c9e6dd", "#f1d2be", "#dfd5ec", "#f2e2b8"];
const STORAGE_KEY = "bingo:caller";

// Runs a game of Bingo for a room playing on the printed cards: calls random
// numbers (with an optional traditional call, read aloud if wanted), shows a
// board of everything called, can go full screen on a TV, and checks a
// winning card by its number. The game is kept on this device, so a refresh
// doesn't lose it.
export default function BingoCaller() {
  const [called, setCalled] = useState<number[]>([]);
  const [showCalls, setShowCalls] = useState(true);
  const [speak, setSpeak] = useState(false);
  const [autoSeconds, setAutoSeconds] = useState(0);
  const [bigScreen, setBigScreen] = useState(false);
  const [cardInput, setCardInput] = useState("");
  const [checked, setChecked] = useState<number | null>(null);
  const [confirmNew, setConfirmNew] = useState(false);
  const bigRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null");
      if (saved && Array.isArray(saved.called)) {
        setCalled(saved.called);
        setShowCalls(saved.showCalls ?? true);
        setSpeak(!!saved.speak);
      }
    } catch {
      // nothing saved, or storage unavailable
    }
  }, []);

  function persist(next: { called?: number[]; showCalls?: boolean; speak?: boolean }) {
    const state = { called, showCalls, speak, ...next };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // storage unavailable: the game just isn't kept
    }
  }

  function say(n: number) {
    if (!speak || typeof window === "undefined" || !window.speechSynthesis) return;
    const words = `${bingoLetter(n)}. ${n}.${showCalls && BINGO_CALLS[n] ? ` ${BINGO_CALLS[n]}.` : ""}`;
    const u = new SpeechSynthesisUtterance(words);
    u.lang = "en-GB";
    u.rate = 0.85;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }

  function callNext() {
    const left = Array.from({ length: 75 }, (_, k) => k + 1).filter((n) => !called.includes(n));
    if (left.length === 0) return;
    const pick = new Uint32Array(1);
    crypto.getRandomValues(pick);
    const n = left[pick[0] % left.length];
    const next = [...called, n];
    setCalled(next);
    persist({ called: next });
    say(n);
  }

  function undo() {
    const next = called.slice(0, -1);
    setCalled(next);
    persist({ called: next });
  }

  function newGame() {
    setCalled([]);
    persist({ called: [] });
    setChecked(null);
    setConfirmNew(false);
    setAutoSeconds(0);
  }

  // Auto-call every few seconds, if chosen.
  useEffect(() => {
    if (!autoSeconds || called.length >= 75) return;
    const t = setTimeout(callNext, autoSeconds * 1000);
    return () => clearTimeout(t);
  });

  async function openBigScreen() {
    setBigScreen(true);
    try {
      await bigRef.current?.requestFullscreen?.();
    } catch {
      // full screen not allowed; the overlay still fills the window
    }
  }
  function closeBigScreen() {
    setBigScreen(false);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }

  const current = called[called.length - 1];
  const calledSet = new Set(called);

  // Checking a card: which lines are complete (FREE counts as marked).
  const card = checked ? BINGO_CARDS.find((c) => c.n === checked) : undefined;
  let result: { text: string; win: boolean } | null = null;
  if (card) {
    const marked = (r: number, c: number) => card.grid[r][c] === 0 || calledSet.has(card.grid[r][c]);
    const lines: string[] = [];
    for (let r = 0; r < 5; r++) if ([0, 1, 2, 3, 4].every((c) => marked(r, c))) lines.push(`row ${r + 1}`);
    for (let c = 0; c < 5; c++) if ([0, 1, 2, 3, 4].every((r) => marked(r, c))) lines.push(`the ${"BINGO"[c]} column`);
    if ([0, 1, 2, 3, 4].every((k) => marked(k, k))) lines.push("a diagonal");
    if ([0, 1, 2, 3, 4].every((k) => marked(k, 4 - k))) lines.push("a diagonal");
    const corners = marked(0, 0) && marked(0, 4) && marked(4, 0) && marked(4, 4);
    const full = card.grid.every((row, r) => row.every((_, c) => marked(r, c)));
    const count = card.grid.flat().filter((v) => v && calledSet.has(v)).length;
    if (full) result = { text: `Card ${card.n}: FULL HOUSE!`, win: true };
    else if (lines.length) result = { text: `Card ${card.n}: a line — ${lines.join(", ")}!${corners ? " And four corners!" : ""}`, win: true };
    else if (corners) result = { text: `Card ${card.n}: four corners!`, win: true };
    else result = { text: `Card ${card.n}: not yet — ${count} of 24 numbers called so far.`, win: false };
  }

  const board = (big: boolean) => (
    <div className="grid gap-1" style={{ gridTemplateColumns: `auto repeat(15, minmax(0, 1fr))` }}>
      {[0, 1, 2, 3, 4].map((row) => (
        <div key={row} className="contents">
          <div
            className="flex items-center justify-center rounded-md font-bold"
            style={{ background: LETTER_COLOURS[row], color: INK, fontSize: big ? "3vh" : 14, padding: big ? "0 1.2vh" : "0 6px" }}
          >
            {"BINGO"[row]}
          </div>
          {Array.from({ length: 15 }, (_, k) => row * 15 + k + 1).map((n) => {
            const on = calledSet.has(n);
            const latest = n === current;
            return (
              <div
                key={n}
                className="flex items-center justify-center rounded-md font-bold"
                style={{
                  aspectRatio: "1",
                  fontSize: big ? "2.4vh" : "clamp(9px, 1.6vw, 13px)",
                  background: latest ? "#b5714a" : on ? CALLED : "#f7f3ea",
                  color: on ? "#fff" : "#b9ad9c",
                }}
              >
                {n}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );

  return (
    <section className="rounded-xl bg-card border border-line p-4 sm:p-5 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h2 className="font-serif text-xl flex items-center gap-2">
          <Megaphone size={18} /> Bingo caller
        </h2>
        <p className="text-xs text-inkSoft">For playing on the printed cards below</p>
      </div>

      <div className="flex flex-wrap gap-5 items-start mb-4">
        {/* The latest number, big. */}
        <div className="rounded-xl bg-white border border-line px-6 py-4 text-center min-w-[180px]">
          {current ? (
            <>
              <p className="font-bold leading-none" style={{ fontSize: 56, color: INK }}>
                <span style={{ color: "#b5714a" }}>{bingoLetter(current)}</span> {current}
              </p>
              {showCalls && BINGO_CALLS[current] && <p className="mt-2 text-sm font-semibold text-inkSoft">{BINGO_CALLS[current]}</p>}
            </>
          ) : (
            <p className="text-inkSoft text-sm py-4">Press “Call next number” to start</p>
          )}
          <p className="mt-2 text-xs text-inkSoft">{called.length} of 75 called</p>
        </div>

        <div className="flex-1 min-w-[240px]">
          <div className="flex flex-wrap gap-2 mb-3">
            <button
              onClick={callNext}
              disabled={called.length >= 75}
              className="rounded-lg px-5 py-3 text-base font-bold text-white disabled:opacity-50"
              style={{ background: CALLED }}
            >
              Call next number
            </button>
            <button onClick={undo} disabled={!called.length} className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold bg-cardTint disabled:opacity-50">
              <Undo2 size={14} /> Undo
            </button>
            <button onClick={openBigScreen} className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold bg-cardTint">
              <Maximize2 size={14} /> Big screen
            </button>
            {confirmNew ? (
              <span className="flex items-center gap-2 text-sm">
                Start a new game?
                <button onClick={newGame} className="rounded-lg px-3 py-2 font-semibold text-white" style={{ background: "#b5714a" }}>
                  Yes
                </button>
                <button onClick={() => setConfirmNew(false)} className="rounded-lg px-3 py-2 font-semibold bg-cardTint">
                  No
                </button>
              </span>
            ) : (
              <button onClick={() => setConfirmNew(true)} className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold bg-cardTint">
                <RotateCcw size={14} /> New game
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={showCalls} onChange={(e) => { setShowCalls(e.target.checked); persist({ showCalls: e.target.checked }); }} />
              Traditional calls
            </label>
            <button
              onClick={() => { setSpeak(!speak); persist({ speak: !speak }); }}
              className="flex items-center gap-1.5"
            >
              {speak ? <Volume2 size={15} /> : <VolumeX size={15} />} Read aloud {speak ? "on" : "off"}
            </button>
            <label className="flex items-center gap-2">
              Auto-call
              <select value={autoSeconds} onChange={(e) => setAutoSeconds(Number(e.target.value))} className="rounded-md border border-line px-2 py-1 bg-white">
                <option value={0}>Off</option>
                <option value={10}>Every 10 seconds</option>
                <option value={20}>Every 20 seconds</option>
                <option value={30}>Every 30 seconds</option>
                <option value={45}>Every 45 seconds</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      {board(false)}

      {/* Check a winning card by its number. */}
      <div className="mt-5 pt-4 border-t border-line">
        <p className="text-sm font-semibold mb-2">Someone shouted Bingo? Check their card:</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const n = parseInt(cardInput, 10);
            setChecked(BINGO_CARDS.some((c) => c.n === n) ? n : -1);
          }}
          className="flex flex-wrap gap-2 mb-3"
        >
          <input
            inputMode="numeric"
            value={cardInput}
            onChange={(e) => setCardInput(e.target.value.replace(/\D/g, "").slice(0, 3))}
            placeholder="Card number, e.g. 37"
            className="rounded-lg border border-line px-3 py-2 text-sm w-48 bg-white"
          />
          <button type="submit" className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ background: INK }}>
            <Search size={14} /> Check card
          </button>
        </form>
        {checked === -1 && <p className="text-sm text-inkSoft">There's no card with that number — cards are numbered 1 to {BINGO_CARDS.length}.</p>}
        {card && result && (
          <div className="flex flex-wrap gap-4 items-start">
            <div className="grid grid-cols-5 gap-1" style={{ width: 230 }}>
              {"BINGO".split("").map((l, c) => (
                <div key={l} className="text-center font-bold rounded-md py-1" style={{ background: LETTER_COLOURS[c], color: INK }}>
                  {l}
                </div>
              ))}
              {card.grid.flatMap((row, r) =>
                row.map((v, c) => {
                  const on = v === 0 || calledSet.has(v);
                  return (
                    <div
                      key={`${r}-${c}`}
                      className="flex items-center justify-center rounded-md font-bold"
                      style={{ height: 40, background: on ? CALLED : "#fff", color: on ? "#fff" : INK, border: "1px solid #eae4d6", fontSize: v ? 16 : 10 }}
                    >
                      {v || "FREE"}
                    </div>
                  );
                })
              )}
            </div>
            <p
              className="rounded-lg px-3 py-2 text-base font-bold"
              style={{ background: result.win ? "#e4eee2" : "#f7f3ea", color: result.win ? CALLED : INK }}
            >
              {result.text}
            </p>
          </div>
        )}
      </div>

      {/* Big screen for a TV. */}
      <div
        ref={bigRef}
        className={bigScreen ? "fixed inset-0 z-50 flex flex-col p-[3vh] gap-[2vh]" : "hidden"}
        style={{ background: "#f5f0e4" }}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="font-bold leading-none" style={{ fontSize: "18vh", color: INK }}>
              {current ? (
                <>
                  <span style={{ color: "#b5714a" }}>{bingoLetter(current)}</span> {current}
                </>
              ) : (
                "—"
              )}
            </p>
            {current && showCalls && BINGO_CALLS[current] && (
              <p className="font-semibold text-inkSoft" style={{ fontSize: "4vh" }}>
                {BINGO_CALLS[current]}
              </p>
            )}
            <p className="text-inkSoft" style={{ fontSize: "2.2vh" }}>
              {called.length} of 75 called
              {called.length > 1 && ` · before that: ${called.slice(-6, -1).reverse().map((n) => `${bingoLetter(n)} ${n}`).join(", ")}`}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={callNext} disabled={called.length >= 75} className="rounded-lg px-5 py-3 font-bold text-white" style={{ background: CALLED, fontSize: "2.2vh" }}>
              Call next number
            </button>
            <button onClick={closeBigScreen} className="flex items-center gap-1.5 rounded-lg px-4 py-3 font-semibold bg-white" aria-label="Close big screen">
              <X size={18} /> Close
            </button>
          </div>
        </div>
        <div className="flex-1 flex items-end">{board(true)}</div>
      </div>
    </section>
  );
}
