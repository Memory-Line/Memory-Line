"use client";

import { useEffect, useRef, useState } from "react";
import { Star } from "lucide-react";

// "All" and "Favourites" tabs above a list of activities. The list is drawn on the server; this
// switches it with a flag the CSS in app/globals.css reads (data-fav-view), so it is instant.
export default function FavouriteTabs() {
  const ref = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<"all" | "favs">("all");
  const [count, setCount] = useState(0);

  useEffect(() => {
    const scope = ref.current?.closest<HTMLElement>("[data-fav-scope]");
    if (!scope) return;
    const recount = () => setCount(scope.querySelectorAll('[data-fav="1"]').length);
    recount();
    window.addEventListener("favourites-changed", recount);
    return () => window.removeEventListener("favourites-changed", recount);
  }, []);

  useEffect(() => {
    ref.current?.closest<HTMLElement>("[data-fav-scope]")?.setAttribute("data-fav-view", view);
  }, [view]);

  const tab = (on: boolean) =>
    `flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold border-2 ${on ? "bg-sage text-white border-sage" : "bg-white text-sageDeep border-line"}`;

  return (
    <div ref={ref} className="mb-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Show">
        <button type="button" onClick={() => setView("all")} aria-pressed={view === "all"} className={tab(view === "all")}>
          All
        </button>
        <button type="button" onClick={() => setView("favs")} aria-pressed={view === "favs"} className={tab(view === "favs")}>
          <Star size={15} fill={view === "favs" ? "#fff" : "none"} aria-hidden="true" /> Favourites ({count})
        </button>
      </div>
      {view === "favs" && count === 0 && (
        <p className="mt-3 text-sm text-inkSoft rounded-xl p-4 bg-card border border-line">
          Nothing here yet. Tap the star next to an activity to add it to your favourites, and it will be easy to find here.
        </p>
      )}
    </div>
  );
}
