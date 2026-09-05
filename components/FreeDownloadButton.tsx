"use client";

import { useState } from "react";
import { Download, Check } from "lucide-react";

// Unlike components/DownloadButton.tsx, this one is used on the public
// landing page and does NOT require a signed-in session — it's meant for
// the free preview samples anyone can grab before creating an account.
export default function FreeDownloadButton({ templateId }: { templateId: string }) {
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");

  async function handleClick() {
    if (state === "done") return;
    setState("loading");
    try {
      await fetch("/api/free-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId }),
      });
      setState("done");
    } catch {
      setState("idle");
    }
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold shrink-0 transition-colors"
      style={{
        background: state === "done" ? "#DCE8DA" : "#E4EEE2",
        color: "#6D8C6A",
      }}
    >
      {state === "done" ? <Check size={14} /> : <Download size={14} />}
      {state === "loading" ? "Downloading..." : state === "done" ? "Downloaded" : "Download free sample"}
    </button>
  );
}
