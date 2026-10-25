"use client";

import { Check, Printer } from "lucide-react";
import { useBslPicks } from "@/lib/bslPrintStore";

// A tick for one BSL sign: add it to the cards to print, or take it off again.
export default function PrintPick({ slug, title, variant = "icon" }: { slug: string; title: string; variant?: "icon" | "button" }) {
  const { picks, toggle } = useBslPicks();
  const on = picks.includes(slug);
  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={() => toggle(slug)}
        aria-pressed={on}
        className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold"
        style={{ background: on ? "#6D8C6A" : "#E4EEE2", color: on ? "#fff" : "#6D8C6A" }}
      >
        {on ? <Check size={16} /> : <Printer size={16} />} {on ? "Added to print" : "Add to print"}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={() => toggle(slug)}
      aria-pressed={on}
      aria-label={on ? `Take ${title} off the print list` : `Add ${title} to the print list`}
      title={on ? "On the print list" : "Add to print"}
      className="absolute right-3 bottom-3 flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold border"
      style={{ background: on ? "#6D8C6A" : "#fff", color: on ? "#fff" : "#6D8C6A", borderColor: "#6D8C6A" }}
    >
      {on ? <Check size={14} /> : <Printer size={14} />} {on ? "Added" : "Print"}
    </button>
  );
}
