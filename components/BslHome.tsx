"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import BslList, { type BslItem } from "@/components/BslList";

// The top of BSL Tools: the groups, and a Favourites tab with every sign the person has starred (from any group),
// the same way the talking boards and the activity categories have one.
export default function BslHome({
  groups,
  favourites,
  favouriteIds,
}: {
  groups: React.ReactNode;
  favourites: BslItem[];
  favouriteIds: string[];
}) {
  const [view, setView] = useState<"groups" | "favs">("groups");
  const tab = (on: boolean) =>
    `flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold border-2 ${on ? "bg-sage text-white border-sage" : "bg-white text-sageDeep border-line"}`;
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="Show">
        <button type="button" onClick={() => setView("groups")} aria-pressed={view === "groups"} className={tab(view === "groups")}>
          Groups
        </button>
        <button type="button" onClick={() => setView("favs")} aria-pressed={view === "favs"} className={tab(view === "favs")}>
          <Star size={15} fill={view === "favs" ? "#fff" : "none"} aria-hidden="true" /> Favourites ({favourites.length})
        </button>
      </div>
      {view === "groups" ? (
        groups
      ) : favourites.length === 0 ? (
        <p className="text-sm text-inkSoft rounded-xl p-4 bg-card border border-line">
          Nothing here yet. Tap the star on a sign to add it to your favourites, and it will be easy to find here.
        </p>
      ) : (
        <BslList items={favourites} favouriteIds={favouriteIds} locked={false} showGroup searchable={false} onlyStarred />
      )}
    </div>
  );
}
