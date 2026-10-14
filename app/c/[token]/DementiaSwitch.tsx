"use client";

import { useEffect, useState } from "react";

// A visitor's "Dementia friendly" switch for the shared calendar: black on white, bold outlines,
// larger text. Remembered on this device only (visitors have no account).
export default function DementiaSwitch() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    try {
      setOn(localStorage.getItem("sc-dementia") === "yes");
    } catch {}
  }, []);
  useEffect(() => {
    document.querySelector(".sc-main")?.classList.toggle("sc-dementia", on);
  }, [on]);
  function flip() {
    const v = !on;
    setOn(v);
    try {
      localStorage.setItem("sc-dementia", v ? "yes" : "no");
    } catch {}
  }
  return (
    <button
      type="button"
      onClick={flip}
      aria-pressed={on}
      style={{ marginLeft: 8, padding: "8px 16px", borderRadius: 10, border: "2px solid #1a1a1a", background: on ? "#FFD23F" : "#fff", color: "#1a1a1a", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
    >
      Dementia friendly: {on ? "On" : "Off"}
    </button>
  );
}
