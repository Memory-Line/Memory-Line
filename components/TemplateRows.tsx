"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Download, Lock, Play, Search, Star, X } from "lucide-react";
import CompleteButton from "@/components/CompleteButton";

export type TemplateRow = {
  id: string;
  title: string;
  fileName: string;
  search: string; // lower-case words the search box matches against
  locked: boolean; // Premium-only category on a Standard account
  hasLargePrint: boolean;
  hasAnswers: boolean;
  video: string | null;
  completed: boolean;
  starred: boolean;
};

const FIRST = 40; // rows drawn at first; "Show more" adds the next batch
const BATCH = 60;

function Upgrade() {
  return (
    <Link href="/pricing" className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: "#FCEFE7", color: "#B5714A" }}>
      <Lock size={14} /> Upgrade to Premium
    </Link>
  );
}

// The rows of a long list of activities, with the search box, theme buttons and Favourites tab.
// The server (components/TemplateList.tsx) sends just the facts about each activity; only the
// first few dozen rows are drawn, so a 200-activity category opens quickly even on a slow computer.
export default function TemplateRows({
  rows,
  themes,
  filterable,
  loggedIn,
  showComplete,
  playable,
  isPremium,
}: {
  rows: TemplateRow[];
  themes: string[];
  filterable: boolean;
  loggedIn: boolean;
  showComplete: boolean;
  playable: boolean;
  isPremium: boolean;
}) {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"all" | "favs">("all");
  const [starred, setStarred] = useState<Set<string>>(() => new Set(rows.filter((r) => r.starred).map((r) => r.id)));
  const [limit, setLimit] = useState(FIRST);

  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const active = query.trim().toLowerCase();
  const matches = useMemo(
    () => rows.filter((r) => words.every((w) => r.search.includes(w)) && (view === "all" || starred.has(r.id))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows, query, view, starred]
  );
  const shown = matches.slice(0, limit);

  async function toggleStar(id: string) {
    const next = !starred.has(id);
    const apply = (on: boolean) =>
      setStarred((s) => {
        const n = new Set(s);
        if (on) n.add(id);
        else n.delete(id);
        return n;
      });
    apply(next);
    const res = await fetch("/api/favourites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateId: id, favourite: next }),
    }).catch(() => null);
    if (!res || !res.ok) apply(!next); // could not save: put it back
  }

  const tab = (on: boolean) =>
    `flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold border-2 ${on ? "bg-sage text-white border-sage" : "bg-white text-sageDeep border-line"}`;

  return (
    <div>
      {loggedIn && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Show">
            <button type="button" onClick={() => { setView("all"); setLimit(FIRST); }} aria-pressed={view === "all"} className={tab(view === "all")}>
              All
            </button>
            <button type="button" onClick={() => { setView("favs"); setLimit(FIRST); }} aria-pressed={view === "favs"} className={tab(view === "favs")}>
              <Star size={15} fill={view === "favs" ? "#fff" : "none"} aria-hidden="true" /> Favourites ({starred.size})
            </button>
          </div>
          {view === "favs" && starred.size === 0 && (
            <p className="mt-3 text-sm text-inkSoft rounded-xl p-4 bg-card border border-line">
              Nothing here yet. Tap the star next to an activity to add it to your favourites, and it will be easy to find here.
            </p>
          )}
        </div>
      )}

      {filterable && (
        <div className="mb-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-inkSoft" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setLimit(FIRST); }}
              placeholder="Search these activities, e.g. birds"
              aria-label="Search these activities"
              className="w-full rounded-xl border border-line bg-white pl-9 pr-9 py-2.5 text-sm outline-none focus:border-sage"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-inkSoft">
                <X size={16} />
              </button>
            )}
          </div>
          {themes.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
              <span className="text-xs font-semibold text-inkSoft mr-1">Themes:</span>
              {themes.map((t) => {
                const on = active === t.toLowerCase();
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setQuery(on ? "" : t); setLimit(FIRST); }}
                    aria-pressed={on}
                    className={`rounded-full px-3 py-1 text-xs font-semibold border transition-colors ${
                      on ? "bg-sage text-white border-sage" : "bg-white text-sageDeep border-line hover:bg-cardTint"
                    }`}
                  >
                    {t[0].toUpperCase() + t.slice(1)}
                  </button>
                );
              })}
            </div>
          )}
          {active && (
            <p className="text-xs text-inkSoft mt-2" aria-live="polite">
              {matches.length === 0 ? "Nothing matches that. Try a different word, or clear the search." : `Showing ${matches.length} of ${rows.length}`}
            </p>
          )}
        </div>
      )}

      <div className="space-y-3">
        {shown.map((t) => (
          <div key={t.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl p-4 bg-card border border-line [content-visibility:auto] [contain-intrinsic-size:auto_96px]">
            <div className="flex items-start gap-2 min-w-0">
              {loggedIn && (
                <button
                  type="button"
                  onClick={() => toggleStar(t.id)}
                  aria-pressed={starred.has(t.id)}
                  aria-label={starred.has(t.id) ? "Remove from favourites" : "Add to favourites"}
                  title={starred.has(t.id) ? "Remove from favourites" : "Add to favourites"}
                  className="shrink-0 rounded-full p-1.5 hover:bg-cardTint"
                >
                  <Star size={22} fill={starred.has(t.id) ? "#E0A82E" : "none"} color={starred.has(t.id) ? "#B8862A" : "#8A8371"} strokeWidth={2} />
                </button>
              )}
              <div className="min-w-0">
                <p className="text-[15px] font-bold">{t.title}</p>
                <p className="text-[11px] text-inkSoft mt-0.5 break-all">{t.fileName}</p>
              </div>
            </div>
            <div className="flex flex-wrap sm:justify-end gap-2 shrink-0 sm:max-w-[65%]">
              {t.locked ? (
                <Upgrade />
              ) : (
                <>
                  {playable && (
                    <Link href={`/dashboard/play/${t.id}`} prefetch={false} className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: "#2F7A63", color: "#fff" }}>
                      <Play size={14} />
                      Play online
                    </Link>
                  )}
                  <a href={`/api/download/${t.id}?file=standard`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: "#E4EEE2", color: "#6D8C6A" }}>
                    <Download size={14} />
                    Standard
                  </a>
                  {t.hasLargePrint &&
                    (isPremium ? (
                      <a href={`/api/download/${t.id}?file=large-print`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: "#FCEFE7", color: "#B5714A" }}>
                        Large Print
                      </a>
                    ) : (
                      <Upgrade />
                    ))}
                  {t.hasAnswers && (
                    <a href={`/api/download/${t.id}?file=answers`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: "#E7ECFA", color: "#4C5FA8" }}>
                      Answers
                    </a>
                  )}
                  {t.video && (
                    <a href={t.video} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: "#F3DAD8", color: "#B5453D" }}>
                      {/youtube\.com|youtu\.be/.test(t.video) ? "Watch on YouTube" : "Watch sign video"}
                    </a>
                  )}
                </>
              )}
              {showComplete && <CompleteButton templateId={t.id} initiallyCompleted={t.completed} />}
            </div>
          </div>
        ))}
      </div>

      {matches.length > shown.length && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => setLimit(limit + BATCH)} className="rounded-lg bg-sage text-white px-5 py-2.5 text-sm font-semibold hover:bg-sageDeep">
            Show {Math.min(BATCH, matches.length - shown.length)} more
          </button>
          <button type="button" onClick={() => setLimit(matches.length)} className="rounded-lg bg-cardTint px-5 py-2.5 text-sm font-semibold">
            Show all {matches.length}
          </button>
          <span className="text-xs text-inkSoft">Showing {shown.length} of {matches.length}</span>
        </div>
      )}
    </div>
  );
}
