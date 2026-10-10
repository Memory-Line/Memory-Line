"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";

// A search box and theme buttons above a long list of activities. The rows
// themselves are drawn on the server (components/TemplateList.tsx), each tagged with
// its title; this just shows or hides them as the person types or taps a theme.
export default function TemplateFilter({ themes, total }: { themes: string[]; total: number }) {
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(total);

  useEffect(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    let count = 0;
    document.querySelectorAll<HTMLElement>("[data-template-row]").forEach((row) => {
      const text = row.getAttribute("data-search") ?? "";
      const match = words.every((w) => text.includes(w));
      // (not the hidden attribute: the row's own "flex" style would override it)
      row.style.display = match ? "" : "none";
      if (match) count++;
    });
    setShown(count);
  }, [query]);

  const active = query.trim().toLowerCase();
  return (
    <div className="mb-4">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-inkSoft" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
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
                onClick={() => setQuery(on ? "" : t)}
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
          {shown === 0 ? "Nothing matches that. Try a different word, or clear the search." : `Showing ${shown} of ${total}`}
        </p>
      )}
    </div>
  );
}
