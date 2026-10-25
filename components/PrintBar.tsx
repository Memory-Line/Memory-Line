"use client";

import { Printer, X } from "lucide-react";
import { useBslPicks } from "@/lib/bslPrintStore";

// Sits at the bottom of every BSL Tools page once something is ticked: how many, and the button that makes the PDF.
export default function PrintBar() {
  const { picks, clear } = useBslPicks();
  if (picks.length === 0) return null;
  const pages = Math.ceil(picks.length / 4);
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-full bg-white border border-line shadow-lg px-4 py-2 max-w-[94vw]">
      <span className="text-sm font-semibold">
        {picks.length} {picks.length === 1 ? "card" : "cards"} · {pages} {pages === 1 ? "page" : "pages"}
      </span>
      <a
        href={`/api/bsl/print?signs=${encodeURIComponent(picks.join(","))}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white"
        style={{ background: "#6D8C6A" }}
      >
        <Printer size={16} /> Print my cards
      </a>
      <button type="button" onClick={clear} aria-label="Clear the print list" title="Clear" className="rounded-full p-1.5 hover:bg-cardTint">
        <X size={16} />
      </button>
    </div>
  );
}
