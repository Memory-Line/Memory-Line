"use client";

import { useEffect, useState } from "react";

// The BSL cards a person has ticked to print. Kept in this browser (so the ticks survive moving between groups) and shared
// between the page's buttons and the print bar through a small event.
const KEY = "bslPrintPicks";
const EVENT = "bsl-print-picks";

function read(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function write(list: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // storage blocked: the ticks just last until the page changes
  }
  window.dispatchEvent(new Event(EVENT));
}

export function useBslPicks() {
  const [picks, setPicks] = useState<string[]>([]);
  useEffect(() => {
    const sync = () => setPicks(read());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return {
    picks,
    toggle: (slug: string) => {
      const cur = read();
      write(cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug]);
    },
    clear: () => write([]),
  };
}
