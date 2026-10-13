"use client";

import { createContext, useContext, useState } from "react";

// "Dementia friendly" mode for the whole dashboard: black on white, a little larger, thick outlines,
// yellow highlights. The choice belongs to the account (User.dementiaFriendly), so it follows the
// person to any device. The provider puts the .dementia-friendly class on the page wrapper (see
// app/globals.css); the games read the same switch with useEasyView() where they need their own
// layout, and sit in a GameFrame.
const Ctx = createContext<{ on: boolean; set: (v: boolean) => void }>({ on: false, set: () => {} });

export const useEasyView = () => useContext(Ctx).on;

export function DementiaProvider({ initial, className, children }: { initial: boolean; className?: string; children: React.ReactNode }) {
  const [on, setOn] = useState(initial);

  function set(v: boolean) {
    setOn(v);
    fetch("/api/preferences/dementia-friendly", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ on: v }),
    }).catch(() => {});
  }

  return (
    <Ctx.Provider value={{ on, set }}>
      <div className={`${className ?? ""}${on ? " dementia-friendly" : ""}`}>{children}</div>
    </Ctx.Provider>
  );
}

// The switch. "bar" sits in the top bar; "page" is the same switch on a game page.
export function DementiaToggle({ variant = "bar" }: { variant?: "bar" | "page" }) {
  const { on, set } = useContext(Ctx);
  const bar = variant === "bar";
  return (
    <button
      type="button"
      onClick={() => set(!on)}
      aria-pressed={on}
      className={
        bar
          ? "flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold"
          : "flex items-center gap-3 rounded-full border-2 px-4 py-2 text-sm font-semibold bg-card"
      }
      style={bar ? { background: on ? "#FFD23F" : "#3a372f", color: on ? "#1a1a1a" : "#D8D3C4" } : { borderColor: on ? "#1a1a1a" : undefined }}
    >
      <span>Dementia friendly</span>
      <span
        aria-hidden
        className="relative inline-block rounded-full"
        style={{ width: bar ? 28 : 44, height: bar ? 15 : 24, background: on ? "#1a1a1a" : bar ? "#7a7567" : "#c9bfae" }}
      >
        <span
          className="absolute rounded-full"
          style={{
            top: bar ? 2 : 3,
            left: on ? (bar ? 15 : 23) : bar ? 2 : 3,
            width: bar ? 11 : 18,
            height: bar ? 11 : 18,
            background: on ? "#FFD23F" : "#fff",
            transition: "left 0.15s",
          }}
        />
      </span>
      <span className="w-6 text-left">{on ? "On" : "Off"}</span>
    </button>
  );
}

// Wraps a game: in Dementia friendly mode it sits in a white card with a thick black outline.
export function GameFrame({ children }: { children: React.ReactNode }) {
  const on = useEasyView();
  return <div className={on ? "easy-game" : undefined}>{children}</div>;
}
