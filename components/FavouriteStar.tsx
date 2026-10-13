"use client";

import { useState } from "react";
import { Star } from "lucide-react";

// The star on an activity row. The row is tagged data-fav so the Favourites tab
// (components/FavouriteTabs.tsx) can show just the starred ones straight away.
export default function FavouriteStar({ templateId, initially }: { templateId: string; initially: boolean }) {
  const [on, setOn] = useState(initially);

  async function toggle(e: React.MouseEvent<HTMLButtonElement>) {
    const row = e.currentTarget.closest("[data-template-row]");
    const next = !on;
    setOn(next);
    row?.setAttribute("data-fav", next ? "1" : "0");
    window.dispatchEvent(new Event("favourites-changed"));
    const res = await fetch("/api/favourites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateId, favourite: next }),
    }).catch(() => null);
    if (!res || !res.ok) {
      // Could not save: put it back.
      setOn(!next);
      row?.setAttribute("data-fav", !next ? "1" : "0");
      window.dispatchEvent(new Event("favourites-changed"));
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? "Remove from favourites" : "Add to favourites"}
      title={on ? "Remove from favourites" : "Add to favourites"}
      className="shrink-0 rounded-full p-1.5 hover:bg-cardTint"
    >
      <Star size={22} fill={on ? "#E0A82E" : "none"} color={on ? "#B8862A" : "#8A8371"} strokeWidth={2} />
    </button>
  );
}
