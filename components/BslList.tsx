"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import PrintPick from "@/components/PrintPick";

export type BslItem = { slug: string; title: string; group: string; groupLabel: string; templateId: string | null };

// A list of BSL signs with a search box and a star on each. Stars are saved to the signed-in account
// (/api/favourites, keyed by the sign's printable card). Premium only: Standard accounts see the words, not the videos.
export default function BslList({
  items,
  favouriteIds,
  locked,
  showGroup = false,
  onlyStarred = false,
  searchable = true,
}: {
  items: BslItem[];
  favouriteIds: string[];
  locked: boolean;
  showGroup?: boolean;
  onlyStarred?: boolean;
  searchable?: boolean;
}) {
  const [q, setQ] = useState("");
  const [favs, setFavs] = useState<Set<string>>(new Set(favouriteIds));
  const router = useRouter();

  async function toggle(id: string) {
    const next = !favs.has(id);
    const copy = new Set(favs);
    if (next) copy.add(id);
    else copy.delete(id);
    setFavs(copy);
    const res = await fetch("/api/favourites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateId: id, favourite: next }),
    }).catch(() => null);
    if (!res || !res.ok) setFavs(favs);
    // The browser keeps pages it has already shown for a moment; refresh so the Favourites tab and the stars show the change.
    else router.refresh();
  }

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((i) => (!onlyStarred || (i.templateId && favs.has(i.templateId))) && (!needle || i.title.toLowerCase().includes(needle)));
  }, [items, q, onlyStarred, favs]);

  return (
    <div>
      {searchable && (
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search these signs"
          aria-label="Search these signs"
          className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm mb-4"
        />
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {shown.map((s) => {
          const on = !!s.templateId && favs.has(s.templateId);
          return (
            <div key={`${s.group}/${s.slug}`} className="relative">
              <Link
                href={`/dashboard/bsl-tools/${s.group}/${s.slug}`}
                className="ac-tile ac-row rounded-xl p-4 pr-14 bg-card border border-line block"
              >
                {showGroup && <span className="text-[11px] font-bold text-clay">{s.groupLabel}</span>}
                <div className="font-serif text-[22px] leading-snug">{s.title}</div>
                <div className="text-sm text-inkSoft mt-1 flex items-center gap-1.5">
                  {locked ? "Part of the Premium plan" : "Watch the sign"}
                </div>
              </Link>
              {!locked && <PrintPick slug={s.slug} title={s.title} />}
              {s.templateId && !locked && (
                <>
                  <button
                    type="button"
                    onClick={() => toggle(s.templateId!)}
                    aria-pressed={on}
                    aria-label={on ? "Remove from favourites" : "Add to favourites"}
                    title={on ? "Remove from favourites" : "Add to favourites"}
                    className="ac-star absolute right-3 top-3 rounded-full p-1.5 hover:bg-cardTint"
                  >
                    <Star size={24} fill={on ? "#E0A82E" : "none"} color={on ? "#B8862A" : "#8A8371"} strokeWidth={2} />
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>
      {shown.length === 0 && (
        <p className="text-sm text-inkSoft mt-2">{onlyStarred ? "Nothing here yet. Tap the star on a sign to add it to your favourites." : "No signs match."}</p>
      )}
    </div>
  );
}
