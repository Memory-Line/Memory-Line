"use client";

import { createContext, useContext, useEffect, useState } from "react";

// "Easy to see" view for the games people play on screen: black on white, bigger, thicker
// outlines, one yellow action colour. It is remembered on this device. The games read it
// with useEasyView() where they need a different layout; everything else is restyled by the
// .easy-view rules in app/globals.css.
const EasyContext = createContext(false);
export const useEasyView = () => useContext(EasyContext);

const KEY = "play-easy-view";

export default function EasyView({ children }: { children: React.ReactNode }) {
  const [easy, setEasy] = useState(false);

  useEffect(() => {
    try {
      setEasy(window.localStorage.getItem(KEY) === "1");
    } catch {
      // storage unavailable: starts off
    }
  }, []);

  function toggle() {
    const next = !easy;
    setEasy(next);
    try {
      window.localStorage.setItem(KEY, next ? "1" : "0");
    } catch {
      // not remembered
    }
  }

  return (
    <EasyContext.Provider value={easy}>
      <div className="flex justify-center mb-4">
        <button
          type="button"
          onClick={toggle}
          aria-pressed={easy}
          className="easy-toggle flex items-center gap-3 rounded-full border-2 px-4 py-2 text-sm font-semibold bg-card"
          style={{ borderColor: easy ? "#1a1a1a" : undefined }}
        >
          <span>Easy to see view</span>
          <span
            aria-hidden
            className="relative inline-block rounded-full"
            style={{ width: 44, height: 24, background: easy ? "#1a1a1a" : "#c9bfae" }}
          >
            <span
              className="absolute rounded-full"
              style={{ top: 3, left: easy ? 23 : 3, width: 18, height: 18, background: easy ? "#ffd23f" : "#fff", transition: "left 0.15s" }}
            />
          </span>
          <span className="w-6 text-left">{easy ? "On" : "Off"}</span>
        </button>
      </div>
      <div className={easy ? "easy-view" : undefined}>{children}</div>
    </EasyContext.Provider>
  );
}
