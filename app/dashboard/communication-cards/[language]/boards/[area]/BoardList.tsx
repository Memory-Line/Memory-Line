"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";

export type BoardItem = { id: string; code: string; priority: number; signOff: boolean; en: string; other: string };

const SECTIONS: [number, string][] = [[1, "Everyday boards"], [2, "Also useful"], [3, "Extras"]];

// A list of talking boards with a search box, a star on each board and (optionally) All / Favourites
// tabs. Stars are saved to the signed-in account (/api/favourites).
export default function BoardList({
  items,
  lang,
  back,
  favouriteIds = [],
  tabs = true,
  onlyStarred = false,
}: {
  items: BoardItem[];
  lang: string;
  back: string;
  favouriteIds?: string[];
  tabs?: boolean;
  // Show only the starred boards (the Favourites view on the language page); un-starring one removes it from view.
  onlyStarred?: boolean;
}) {
  const [q, setQ] = useState("");
  const [favs, setFavs] = useState<Set<string>>(new Set(favouriteIds));
  const [view, setView] = useState<"all" | "favs">("all");

  async function toggle(id: string) {
    const next = !favs.has(id);
    const copy = new Set(favs);
    if (next) copy.add(id);
    else copy.delete(id);
    setFavs(copy);
    const res = await fetch("/api/favourites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ boardId: id, favourite: next }),
    }).catch(() => null);
    if (!res || !res.ok) setFavs(favs); // could not save: put it back
  }

  const favsOnly = onlyStarred || view === "favs";
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((i) => (!favsOnly || favs.has(i.id)) && (!needle || (i.en + " " + i.other).toLowerCase().includes(needle)));
  }, [items, q, favsOnly, favs]);

  const tab = (on: boolean) =>
    `flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold border-2 ${on ? "bg-sage text-white border-sage" : "bg-white text-sageDeep border-line"}`;

  return (
    <div>
      {tabs && !onlyStarred && (
        <div className="flex flex-wrap gap-2 mb-3" role="group" aria-label="Show">
          <button type="button" onClick={() => setView("all")} aria-pressed={view === "all"} className={tab(view === "all")}>
            All
          </button>
          <button type="button" onClick={() => setView("favs")} aria-pressed={view === "favs"} className={tab(view === "favs")}>
            <Star size={15} fill={view === "favs" ? "#fff" : "none"} aria-hidden="true" /> Favourites ({items.filter((i) => favs.has(i.id)).length})
          </button>
        </div>
      )}
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
              {list.map((b) => {
                const on = favs.has(b.id);
                return (
                  <div key={b.id} className="relative">
                    <Link href={`/boards/${b.id}?lang=${lang}&back=${encodeURIComponent(back)}`} className="rounded-xl p-4 pr-14 bg-card border border-line block">
                      <span className="text-[11px] font-bold text-clay">{b.code}{b.signOff ? " · checked by your team" : ""}</span>
                      <div className="font-serif text-[20px]">{b.en}</div>
                      {b.other && <div className="text-sm text-inkSoft" dir={lang === "ur" || lang === "ar" || lang === "fa" ? "rtl" : "ltr"}>{b.other}</div>}
                    </Link>
                    <button
                      type="button"
                      onClick={() => toggle(b.id)}
                      aria-pressed={on}
                      aria-label={on ? "Remove from favourites" : "Add to favourites"}
                      title={on ? "Remove from favourites" : "Add to favourites"}
                      className="absolute right-3 top-3 rounded-full p-1.5 hover:bg-cardTint"
                    >
                      <Star size={24} fill={on ? "#E0A82E" : "none"} color={on ? "#B8862A" : "#8A8371"} strokeWidth={2} />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
      {shown.length === 0 && (
        <p className="text-sm text-inkSoft">
          {favsOnly ? "Nothing here yet. Tap the star on a board to add it to your favourites." : "No cards match."}
        </p>
      )}
    </div>
  );
}
