"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import BoardList, { type BoardItem } from "./boards/[area]/BoardList";

// The talking boards on a language page: the topics, and a Favourites tab with the boards the
// person has starred (in any topic) for this language.
export default function BoardsHome({
  topics,
  favourites,
  lang,
  back,
}: {
  topics: React.ReactNode;
  favourites: BoardItem[];
  lang: string;
  back: string;
}) {
  const [view, setView] = useState<"topics" | "favs">("topics");
  const tab = (on: boolean) =>
    `flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold border-2 ${on ? "bg-sage text-white border-sage" : "bg-white text-sageDeep border-line"}`;
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3" role="group" aria-label="Show">
        <button type="button" onClick={() => setView("topics")} aria-pressed={view === "topics"} className={tab(view === "topics")}>
          Topics
        </button>
        <button type="button" onClick={() => setView("favs")} aria-pressed={view === "favs"} className={tab(view === "favs")}>
          <Star size={15} fill={view === "favs" ? "#fff" : "none"} aria-hidden="true" /> Favourites ({favourites.length})
        </button>
      </div>
      {view === "topics" ? (
        topics
      ) : (
        <BoardList items={favourites} lang={lang} back={back} favouriteIds={favourites.map((f) => f.id)} tabs={false} onlyStarred />
      )}
    </div>
  );
}
