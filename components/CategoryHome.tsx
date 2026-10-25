"use client";

import { useState } from "react";
import { Star } from "lucide-react";

// The page of topic (or level) tiles in a category, with a Favourites tab beside it listing everything the person has
// starred in that category, from any topic. The list is drawn on the server and passed in, like the talking boards' tab.
export default function CategoryHome({
  tilesLabel,
  count,
  tiles,
  favourites,
}: {
  tilesLabel: string;
  count: number;
  tiles: React.ReactNode;
  favourites: React.ReactNode;
}) {
  const [view, setView] = useState<"tiles" | "favs">("tiles");
  const tab = (on: boolean) =>
    `flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold border-2 ${on ? "bg-sage text-white border-sage" : "bg-white text-sageDeep border-line"}`;
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="Show">
        <button type="button" onClick={() => setView("tiles")} aria-pressed={view === "tiles"} className={tab(view === "tiles")}>
          {tilesLabel}
        </button>
        <button type="button" onClick={() => setView("favs")} aria-pressed={view === "favs"} className={tab(view === "favs")}>
          <Star size={15} fill={view === "favs" ? "#fff" : "none"} aria-hidden="true" /> Favourites ({count})
        </button>
      </div>
      {view === "tiles" ? tiles : favourites}
    </div>
  );
}
