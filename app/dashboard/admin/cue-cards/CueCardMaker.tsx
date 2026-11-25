"use client";

import { useState } from "react";
import { Printer, Trash2 } from "lucide-react";
import { CUE_WORDS, findCueWord } from "@/lib/cueCards";

type Card = { id: number; label: string; src: string | null };

export default function CueCardMaker() {
  const [text, setText] = useState("");
  const [cards, setCards] = useState<Card[]>([]);
  const [next, setNext] = useState(1);

  function addMany(raw: string) {
    const parts = raw.split(",").map((p) => p.trim()).filter(Boolean);
    if (!parts.length) return;
    let id = next;
    const made: Card[] = parts.map((p) => {
      const hit = findCueWord(p);
      return { id: id++, label: hit ? hit.word : p, src: hit ? hit.src : null };
    });
    setNext(id);
    setCards((c) => [...c, ...made]);
    setText("");
  }

  return (
    <div className="mt-5">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .cue-print, .cue-print * { visibility: visible !important; }
          .cue-print { position: absolute; left: 0; top: 0; width: 100%; }
          .cue-nosym { display: none !important; }
          @page { size: A4 portrait; margin: 8mm; }
        }
        .cue-sheet { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
        .cue-card { border: 1.5px dashed #b9b2a4; background: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 14px; break-inside: avoid; min-height: 280px; }
        .cue-card img { width: 100%; max-width: 230px; height: auto; aspect-ratio: 1; }
        .cue-word { font-family: Arial, Helvetica, sans-serif; font-weight: 800; color: #1a1a1a; text-align: center; line-height: 1.05; margin-top: 12px; font-size: 40px; }
        @media print { .cue-card { min-height: 136mm; } .cue-card img { max-width: 70mm; } .cue-word { font-size: 40pt; } }
      `}</style>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          addMany(text);
        }}
        className="flex flex-wrap gap-2"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a word, e.g. tea (separate several with commas)"
          className="flex-1 min-w-[220px] rounded-lg border border-line bg-white px-3 py-2 text-base"
          aria-label="Word for the card"
        />
        <button type="submit" className="rounded-lg px-4 py-2 font-semibold text-white" style={{ background: "#6D8C6A" }}>
          Add
        </button>
      </form>

      <p className="text-xs text-clay mt-3 mb-1 font-semibold">Words with a symbol in this test</p>
      <div className="flex flex-wrap gap-1.5">
        {CUE_WORDS.map((w) => (
          <button key={w.word} type="button" onClick={() => addMany(w.word)} className="rounded-full border border-line bg-white px-3 py-1 text-sm">
            {w.word}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 mt-6 mb-3">
        <button
          type="button"
          onClick={() => window.print()}
          disabled={!cards.length}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 font-semibold text-white disabled:opacity-40"
          style={{ background: "#6D8C6A" }}
        >
          <Printer size={16} /> Print cards (4 to a page)
        </button>
        {cards.length > 0 && (
          <button type="button" onClick={() => setCards([])} className="inline-flex items-center gap-1.5 text-sm text-clay underline">
            <Trash2 size={14} /> Clear all
          </button>
        )}
        <span className="text-sm text-clay">{cards.length ? `${cards.length} card${cards.length === 1 ? "" : "s"}` : "No cards yet"}</span>
      </div>

      <div className="cue-print">
        <div className="cue-sheet">
          {cards.map((c) => (
            <div key={c.id} className="cue-card relative">
              {c.src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.src} alt="" />
              ) : (
                <p className="cue-nosym text-sm text-clay text-center mb-2">No symbol for this word yet. The card will print the word only.</p>
              )}
              <p className="cue-word">{c.label}</p>
              <button
                type="button"
                onClick={() => setCards((all) => all.filter((x) => x.id !== c.id))}
                className="cue-nosym absolute top-2 right-2 rounded-md border border-line bg-white px-2 py-0.5 text-xs"
                aria-label={`Remove the ${c.label} card`}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
