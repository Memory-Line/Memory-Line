"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Printer, RotateCcw } from "lucide-react";
import type { MatchingPairsPicture } from "@/lib/matchingPairs";

// Colours from the printed sheets, used for the card backs.
const INK = "#3f3237";
const BACKS = ["#cfe3f2", "#c9e6dd", "#f1d2be", "#dfd5ec", "#f2e2b8", "#d3e6f5", "#f2d6da", "#d8e7cb"];
const MATCH_HIGHLIGHT = "#e4eee2";
const MATCH_BORDER = "#2f7a63";

const PDFJS_URL = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.min.mjs";
const PDFJS_WORKER_URL = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs";
const RENDER_SCALE = 2.5; // resolution the page is rendered at before cropping

// A card in the memory game: which picture it shows (0..N-1), and its
// position in the shuffled deck.
type Card = { picture: number; matched: boolean };

function shuffledDeck(pictureCount: number): Card[] {
  const cards: Card[] = [];
  for (let i = 0; i < pictureCount; i++) {
    cards.push({ picture: i, matched: false });
    cards.push({ picture: i, matched: false });
  }
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

// Matching Pairs on screen: the sheet's own eight pictures, loaded straight
// out of its Standard PDF (pdf.js, in the browser) and cropped into cards.
// Turn two cards over; a pair stays face up, otherwise both flip back after
// a moment. Progress and the Easier setting are kept on this device.
export default function MatchingPairsPlayer({
  templateId,
  theme,
  pictures,
  tracking,
  initiallyCompleted,
  hasLargePrint,
  isPremium,
}: {
  templateId: string;
  theme: string;
  pictures: MatchingPairsPicture[];
  tracking: boolean;
  initiallyCompleted: boolean;
  hasLargePrint: boolean;
  isPremium: boolean;
}) {
  const storageKey = `matchingpairs:${templateId}`;
  const [images, setImages] = useState<string[] | null>(null); // one cropped image per picture, once the PDF has loaded
  const [loadError, setLoadError] = useState(false);
  const [easier, setEasier] = useState(false);
  const [deck, setDeck] = useState<Card[]>(() => shuffledDeck(pictures.length));
  const [faceUp, setFaceUp] = useState<number[]>([]); // indices into deck, currently turned but not yet resolved
  const [busy, setBusy] = useState(false); // waiting for a non-matching pair to flip back
  const [completed, setCompleted] = useState(initiallyCompleted);
  const restoredRef = useRef(false);

  // Load the sheet's own PDF once, crop out its pictures.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const pdfjsLib: any = await import(/* webpackIgnore: true */ PDFJS_URL);
        pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
        const doc = await pdfjsLib.getDocument(`/api/download/${templateId}?file=standard`).promise;
        const page = await doc.getPage(1);
        const viewport = page.getViewport({ scale: RENDER_SCALE });
        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = viewport.width;
        pageCanvas.height = viewport.height;
        const pageCtx = pageCanvas.getContext("2d")!;
        await page.render({ canvasContext: pageCtx, viewport }).promise;

        const crops = pictures.map((box) => {
          const sx = box.left * pageCanvas.width;
          const sy = box.top * pageCanvas.height;
          const sw = (box.right - box.left) * pageCanvas.width;
          const sh = (box.bottom - box.top) * pageCanvas.height;
          const crop = document.createElement("canvas");
          crop.width = sw;
          crop.height = sh;
          const cropCtx = crop.getContext("2d")!;
          cropCtx.drawImage(pageCanvas, sx, sy, sw, sh, 0, 0, sw, sh);
          return crop.toDataURL("image/png");
        });
        if (!cancelled) setImages(crops);
      } catch {
        if (!cancelled) setLoadError(true);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [templateId, pictures]);

  // Restore saved progress once (mode, deck order and which pairs are matched).
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    try {
      const saved = JSON.parse(window.localStorage.getItem(storageKey) ?? "null");
      if (saved && Array.isArray(saved.deck) && saved.deck.length > 0) {
        setEasier(!!saved.easier);
        setDeck(saved.deck);
      }
    } catch {
      // nothing saved, or storage unavailable
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function save(nextDeck: Card[], nextEasier: boolean) {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({ deck: nextDeck, easier: nextEasier }));
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

  function startAgain(nextEasier = easier) {
    const nextDeck = shuffledDeck(easierPictureCount(nextEasier));
    setDeck(nextDeck);
    setFaceUp([]);
    setBusy(false);
    save(nextDeck, nextEasier);
  }

  function easierPictureCount(nextEasier: boolean) {
    return nextEasier ? Math.min(4, pictures.length) : pictures.length;
  }

  function chooseEasier(nextEasier: boolean) {
    if (nextEasier === easier) return;
    setEasier(nextEasier);
    startAgain(nextEasier);
  }

  function tap(index: number) {
    if (busy || images === null) return;
    const card = deck[index];
    if (!card || card.matched || faceUp.includes(index)) return;

    const next = [...faceUp, index];
    setFaceUp(next);

    if (next.length === 2) {
      const [a, b] = next;
      if (deck[a].picture === deck[b].picture) {
        const nextDeck = deck.map((c, i) => (i === a || i === b ? { ...c, matched: true } : c));
        setDeck(nextDeck);
        setFaceUp([]);
        save(nextDeck, easier);
        if (nextDeck.every((c) => c.matched)) markCompleted();
      } else {
        setBusy(true);
        setTimeout(() => {
          setFaceUp([]);
          setBusy(false);
        }, 1500);
      }
    }
  }

  const foundPairs = deck.filter((c) => c.matched).length / 2;
  const totalPairs = deck.length / 2;
  const allFound = deck.length > 0 && foundPairs === totalPairs;

  return (
    <div className="max-w-[560px]">
      <p className="text-sm text-inkSoft mb-3">
        Turn two cards over. If they match, they stay face up. If not, they'll flip back — take your
        time.
      </p>

      {loadError && (
        <p className="mb-4 rounded-lg px-3 py-2 text-sm font-semibold" style={{ background: "#fcefe7", color: INK }}>
          The picture cards couldn't be loaded. Please try again in a moment.
        </p>
      )}

      {!loadError && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <p className="text-sm font-semibold">
              {allFound ? `All ${totalPairs} pairs found!` : `${foundPairs} of ${totalPairs} pairs found`}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => chooseEasier(false)}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold"
                style={{ background: !easier ? "#b5714a" : "#f7f3ea", color: !easier ? "#fff" : INK }}
              >
                8 pairs
              </button>
              <button
                onClick={() => chooseEasier(true)}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold"
                style={{ background: easier ? "#b5714a" : "#f7f3ea", color: easier ? "#fff" : INK }}
              >
                Easier (4 pairs)
              </button>
            </div>
          </div>

          {images === null ? (
            <p className="text-sm text-inkSoft">Getting the picture cards ready…</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
              {deck.map((card, i) => {
                const isFaceUp = card.matched || faceUp.includes(i);
                return (
                  <button
                    key={i}
                    onClick={() => tap(i)}
                    disabled={card.matched}
                    aria-label={isFaceUp ? "Picture card, face up" : "Picture card, face down"}
                    className="relative aspect-square rounded-xl overflow-hidden"
                    style={{
                      background: isFaceUp ? "#fff" : BACKS[card.picture % BACKS.length],
                      border: card.matched ? `3px solid ${MATCH_BORDER}` : "1px solid #d9cfc1",
                      boxShadow: card.matched ? `0 0 0 3px ${MATCH_HIGHLIGHT} inset` : undefined,
                    }}
                  >
                    {isFaceUp ? (
                      <img
                        src={images[card.picture]}
                        alt=""
                        className="w-full h-full object-contain p-1.5"
                        draggable={false}
                      />
                    ) : (
                      <span className="absolute inset-2 rounded-lg" style={{ border: "2px solid rgba(63,50,55,0.15)" }} />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {allFound && (
            <p className="mt-4 rounded-lg px-3 py-2 text-sm font-semibold" style={{ background: MATCH_HIGHLIGHT, color: MATCH_BORDER }}>
              Well done — you found every pair in {theme}!
            </p>
          )}
          {tracking && completed && (
            <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold" style={{ color: MATCH_BORDER }}>
              <Check size={14} /> Marked as completed
            </p>
          )}

          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={() => startAgain()}
              className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold bg-cardTint"
            >
              <RotateCcw size={14} /> Start again
            </button>
          </div>
        </>
      )}

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
          {hasLargePrint && isPremium && (
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
