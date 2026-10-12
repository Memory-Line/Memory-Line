"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Item = { id: string; code: string; priority: number; signOff: boolean; en: string; other: string };

const SECTIONS: [number, string][] = [[1, "Everyday boards"], [2, "Also useful"], [3, "Extras"]];

export default function BoardList({ items, lang, back }: { items: Item[]; lang: string; back: string }) {
  const [q, setQ] = useState("");
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return needle ? items.filter((i) => (i.en + " " + i.other).toLowerCase().includes(needle)) : items;
  }, [items, q]);

  return (
    <div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search these cards"
        aria-label="Search these cards"
        className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm mb-5"
      />
      {SECTIONS.map(([p, title]) => {
        const list = shown.filter((i) => i.priority === p);
        if (list.length === 0) return null;
        return (
          <section key={p} className="mb-6">
            <h2 className="font-serif text-[18px] mb-2">{title} <span className="text-xs text-inkSoft">{list.length}</span></h2>
            <div className="grid gap-3">
              {list.map((b) => (
                <Link key={b.id} href={`/boards/${b.id}?lang=${lang}&back=${encodeURIComponent(back)}`} className="rounded-xl p-4 bg-card border border-line block">
                  <span className="text-[11px] font-bold text-clay">{b.code}{b.signOff ? " · checked by your team" : ""}</span>
                  <div className="font-serif text-[20px]">{b.en}</div>
                  {b.other && <div className="text-sm text-inkSoft" dir={lang === "ur" ? "rtl" : "ltr"}>{b.other}</div>}
                </Link>
              ))}
            </div>
          </section>
        );
      })}
      {shown.length === 0 && <p className="text-sm text-inkSoft">No cards match.</p>}
    </div>
  );
}
