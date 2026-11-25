"use client";

import { useState } from "react";
import * as Lucide from "lucide-react";
import { Printer, Trash2 } from "lucide-react";
import { CUE_GROUPS, CUE_WORDS, findCueWord, type CueGroupKey } from "@/lib/cueCards";

type Card = { id: number; label: string; src: string | null; icon: string | null; tabler: string | null; phosphor: string | null; emoji: string | null; colour: string; category: string; num: string };

type IconCmp = React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
const LUCIDE = Lucide as unknown as Record<string, IconCmp>;

const NEUTRAL = "#7A7468";

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
      const g = hit ? CUE_GROUPS[hit.group] : null;
      const index = hit ? CUE_WORDS.indexOf(hit) + 1 : 0;
      return {
        id: id++,
        label: hit ? hit.word : p,
        src: hit?.src ?? null,
        icon: hit?.icon ?? null,
        tabler: hit?.tabler ?? null,
        emoji: hit?.emoji ?? null,
        phosphor: hit?.phosphor ?? null,
        colour: g ? g.colour : NEUTRAL,
        category: g ? g.label : "Cue card",
        num: hit ? String(index).padStart(3, "0") : "",
      };
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

      <p className="text-xs text-clay mt-3 mb-1 font-semibold">{CUE_WORDS.length} words with a picture in this test. Click one to add its card.</p>
      <div className="space-y-2">
        {(Object.keys(CUE_GROUPS) as CueGroupKey[]).map((g) => (
          <details key={g} className="rounded-lg border border-line bg-white px-3 py-2">
            <summary className="cursor-pointer text-sm font-semibold" style={{ color: CUE_GROUPS[g].colour }}>
              {CUE_GROUPS[g].label} ({CUE_WORDS.filter((w) => w.group === g).length})
            </summary>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {CUE_WORDS.filter((w) => w.group === g).map((w) => (
                <button key={w.word} type="button" onClick={() => addMany(w.word)} className="rounded-full border border-line bg-white px-3 py-1 text-sm">
                  {w.word}
                </button>
              ))}
            </div>
          </details>
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
                ) : c.icon ? (
                  <div className="cue-circle">
                    {(() => {
                      const Cmp = LUCIDE[c.icon] ?? Lucide.Circle;
                      return <Cmp size={140} color={c.colour} strokeWidth={1.8} />;
                    })()}
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
