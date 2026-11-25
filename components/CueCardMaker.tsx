"use client";

import { useState } from "react";
import { Printer, Search, Trash2 } from "lucide-react";
import { CUE_GROUPS, CUE_WORDS, findCueWord, searchCueWords, type CueWord } from "@/lib/cueCards";

type Card = { id: number; label: string; src: string | null; icon: string | null; tabler: string | null; phosphor: string | null; emoji: string | null; colour: string; category: string; num: string };

const NEUTRAL = "#7A7468";

export default function CueCardMaker() {
  const [text, setText] = useState("");
  const [cards, setCards] = useState<Card[]>([]);
  const [next, setNext] = useState(1);

  function makeCard(id: number, hit: CueWord | null, typed: string): Card {
    const g = hit ? CUE_GROUPS[hit.group] : null;
    const index = hit ? CUE_WORDS.indexOf(hit) + 1 : 0;
    return {
      id,
      label: hit ? hit.word : typed,
      src: hit?.src ?? null,
      icon: hit?.icon ?? null,
      tabler: hit?.tabler ?? null,
      emoji: hit?.emoji ?? null,
      phosphor: hit?.phosphor ?? null,
      colour: g ? g.colour : NEUTRAL,
      category: g ? g.label : "Cue card",
      num: hit ? String(index).padStart(3, "0") : "",
    };
  }

  function addCards(items: { hit: CueWord | null; typed: string }[]) {
    if (!items.length) return;
    let id = next;
    const made = items.map((i) => makeCard(id++, i.hit, i.typed));
    setNext(id);
    setCards((c) => [...c, ...made]);
    setText("");
  }

  function addMany(raw: string) {
    const parts = raw.split(",").map((p) => p.trim()).filter(Boolean);
    addCards(parts.map((p) => ({ hit: findCueWord(p), typed: p })));
  }

  const suggestions = text.includes(",") ? [] : searchCueWords(text, 12);

  return (
    <div className="mt-1">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .cue-print, .cue-print * { visibility: visible !important; }
          .cue-print { position: absolute; left: 0; top: 0; width: 100%; }
          .cue-nosym { display: none !important; }
          @page { size: A4 portrait; margin: 8mm; }
        }
        .cue-sheet { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .cue-card { position: relative; border: 3px solid var(--tint); border-radius: 22px; background: #fff; overflow: hidden; display: flex; flex-direction: column; break-inside: avoid; min-height: 430px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .cue-head { background: var(--c); color: #fff; display: flex; align-items: center; gap: 10px; padding: 10px 14px; }
        .cue-head img { width: 38px; height: 38px; border-radius: 9px; background: #fff; padding: 3px; }
        .cue-brand { font-family: Georgia, "Times New Roman", serif; font-weight: 700; font-size: 18px; line-height: 1.1; }
        .cue-cat { font-family: Arial, Helvetica, sans-serif; font-size: 11px; letter-spacing: .05em; text-transform: uppercase; opacity: .92; }
        .cue-num { margin-left: auto; font-family: Arial, Helvetica, sans-serif; font-weight: 700; font-size: 14px; opacity: .85; }
        .cue-body { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 14px 14px 6px; }
        .cue-circle { width: 78%; max-width: 250px; aspect-ratio: 1; border-radius: 50%; background: var(--bg); display: flex; align-items: center; justify-content: center; }
        .cue-circle img { width: 74%; height: 74%; }
        .cue-ico { display: block; width: 62%; height: 62%; -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat; -webkit-mask-position: center; mask-position: center; -webkit-mask-size: contain; mask-size: contain; }
        .cue-word { font-family: Georgia, "Times New Roman", serif; font-weight: 700; font-size: 44px; line-height: 1.05; text-align: center; margin-top: 14px; color: #2a2a24; }
        .cue-foot { text-align: center; font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #8a8478; padding: 0 0 12px; }
        @media print {
          .cue-sheet { gap: 6mm; }
          .cue-card { min-height: 133mm; }
          .cue-circle { max-width: 64mm; }
          .cue-word { font-size: 38pt; margin-top: 4mm; }
        }
      `}</style>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (text.includes(",")) addMany(text);
          else if (suggestions.length) addCards([{ hit: suggestions[0], typed: suggestions[0].word }]);
          else addMany(text);
        }}
        className="relative"
      >
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-clay" aria-hidden="true" />
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Search for a word, e.g. tea, bed, garden"
              className="w-full rounded-xl border-2 border-line bg-white pl-10 pr-3 py-3 text-base"
              aria-label="Search for a word to make a cue card"
              autoComplete="off"
            />
          </div>
          <button type="submit" className="rounded-xl px-5 py-3 font-semibold text-white" style={{ background: "#6D8C6A" }}>
            Add
          </button>
        </div>
        {text.trim() && (
          <div className="mt-2 rounded-xl border border-line bg-white p-2">
            {suggestions.length ? (
              <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {suggestions.map((w) => (
                  <li key={w.word}>
                    <button
                      type="button"
                      onClick={() => addCards([{ hit: w, typed: w.word }])}
                      className="w-full flex items-center gap-2 rounded-lg border border-line bg-white px-2 py-1.5 text-left hover:bg-card"
                    >
                      {w.src ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={w.src} alt="" className="w-9 h-9 shrink-0" />
                      ) : (
                        <span className="w-9 h-9 shrink-0" />
                      )}
                      <span className="text-sm font-semibold" style={{ color: CUE_GROUPS[w.group].colour }}>
                        {w.word}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-clay px-1 py-1">No picture for that word yet. Press Add to print a word-only card.</p>
            )}
          </div>
        )}
      </form>

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
            <div key={c.id} className="cue-card" style={{ ["--c" as string]: c.colour, ["--tint" as string]: c.colour + "66", ["--bg" as string]: c.colour + "1F" }}>
              <div className="cue-head">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icon.png" alt="" />
                <div>
                  <div className="cue-brand">Activity Central</div>
                  <div className="cue-cat">{c.category}</div>
                </div>
                <div className="cue-num">{c.num}</div>
              </div>
              <div className="cue-body">
                {c.src ? (
                  <div className="cue-circle">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.src} alt="" />
                  </div>
                ) : c.emoji ? (
                  <div className="cue-circle">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/cue-symbols/e/${c.emoji}.svg`} alt="" style={{ width: "66%", height: "66%" }} />
                  </div>
                ) : c.tabler || c.phosphor ? (
                  <div className="cue-circle">
                    <span
                      className="cue-ico"
                      style={{
                        background: c.colour,
                        WebkitMaskImage: `url(${c.tabler ? `/cue-symbols/t/${c.tabler}.svg` : `/cue-symbols/p/${c.phosphor}.svg`})`,
                        maskImage: `url(${c.tabler ? `/cue-symbols/t/${c.tabler}.svg` : `/cue-symbols/p/${c.phosphor}.svg`})`,
                      }}
                    />
                  </div>
                ) : (
                  <p className="cue-nosym text-sm text-clay text-center mb-2">No symbol for this word yet. The card will print the word only.</p>
                )}
                <p className="cue-word">{c.label}</p>
              </div>
              <div className="cue-foot">Bringing Moments to Life</div>
              <button
                type="button"
                onClick={() => setCards((all) => all.filter((x) => x.id !== c.id))}
                className="cue-nosym absolute top-14 right-2 rounded-md border border-line bg-white px-2 py-0.5 text-xs"
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
